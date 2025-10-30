
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, AlertCircle } from 'lucide-react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import SectionWrapper from '../../components/SectionWrapper';
import BittuAvatar from '../../components/BittuAvatar';
import VoiceVisualizer from '../../components/VoiceVisualizer';
import { decode, encode, decodeAudioData } from '../../services/geminiService';

interface TranscriptionEntry {
  speaker: 'user' | 'model';
  text: string;
}

const LiveAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Idle. Press Start to talk.');
  const [transcription, setTranscription] = useState<TranscriptionEntry[]>([]);
  
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');
  
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  const cleanup = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }

    inputAudioContextRef.current?.close();
    inputAudioContextRef.current = null;
    
    // Do not close output context to allow final sounds to play out
    // outputAudioContextRef.current?.close();
    // outputAudioContextRef.current = null;

    analyserNodeRef.current = null;

    setIsListening(false);
  }, []);

  const startConversation = async () => {
    setError(null);
    setIsListening(true);
    setStatus('Initializing...');
    setTranscription([]);
    currentInputTranscriptionRef.current = '';
    currentOutputTranscriptionRef.current = '';

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStatus('Connecting to Gemini...');

      inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
      analyserNodeRef.current = inputAudioContextRef.current.createAnalyser();

      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('Connected! You can start talking now.');
            mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current!);
            scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000',
              };
              if (sessionPromiseRef.current) {
                  sessionPromiseRef.current.then((session) => {
                      session.sendRealtimeInput({ media: pcmBlob });
                  });
              }
            };
            
            mediaStreamSourceRef.current.connect(analyserNodeRef.current);
            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
              if (message.serverContent?.inputTranscription) {
                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
              }
              if (message.serverContent?.outputTranscription) {
                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
              }
              if (message.serverContent?.turnComplete) {
                const fullInput = currentInputTranscriptionRef.current.trim();
                const fullOutput = currentOutputTranscriptionRef.current.trim();
                
                setTranscription(prev => [
                    ...prev,
                    ...(fullInput ? [{ speaker: 'user', text: fullInput }] : []),
                    ...(fullOutput ? [{ speaker: 'model', text: fullOutput }] : []),
                ]);
                
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
              }

              const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
              if (base64Audio && outputAudioContextRef.current) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                const source = outputAudioContextRef.current.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outputAudioContextRef.current.destination);
                source.addEventListener('ended', () => { audioSourcesRef.current.delete(source); });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                audioSourcesRef.current.add(source);
              }

              if (message.serverContent?.interrupted) {
                for (const source of audioSourcesRef.current.values()) {
                  source.stop();
                }
                audioSourcesRef.current.clear();
                nextStartTimeRef.current = 0;
              }
          },
          onerror: (e: ErrorEvent) => {
            setError(`An error occurred: ${e.message}`);
            setStatus('Error. Please try again.');
            cleanup();
          },
          onclose: (e: CloseEvent) => {
            setStatus('Connection closed. Press Start to talk again.');
            cleanup();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are Bittu, a friendly and helpful AI assistant.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      });
    } catch (err: any) {
      setError(`Failed to start: ${err.message}`);
      setStatus('Error. Please check permissions and try again.');
      cleanup();
    }
  };

  const stopConversation = () => {
    setStatus('Stopping...');
    cleanup();
  };
  
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return (
    <SectionWrapper
      title="Live AI Assistant"
      description="Speak directly with Bittu in a real-time, natural conversation."
    >
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <BittuAvatar isListening={isListening} />
        <div className="w-full max-w-md h-24">
            <VoiceVisualizer analyserNode={analyserNodeRef.current} isListening={isListening} />
        </div>
        <p className="text-lg text-cyan-300 min-h-[28px]">{status}</p>
        
        {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
            </div>
        )}
        
        <div className="w-full max-w-2xl h-48 bg-gray-800/50 rounded-lg p-4 overflow-y-auto border border-cyan-500/20">
            {transcription.length === 0 && <p className="text-gray-500">Conversation will appear here...</p>}
            {transcription.map((entry, index) => (
                <div key={index} className={`mb-2 ${entry.speaker === 'user' ? 'text-right' : 'text-left'}`}>
                    <span className={`px-3 py-1 rounded-full text-sm ${entry.speaker === 'user' ? 'bg-blue-500/30 text-blue-200' : 'bg-cyan-500/30 text-cyan-200'}`}>
                        <strong>{entry.speaker === 'user' ? 'You' : 'Bittu'}:</strong> {entry.text}
                    </span>
                </div>
            ))}
        </div>

        {!isListening ? (
          <button
            onClick={startConversation}
            className="flex items-center justify-center px-8 py-4 bg-cyan-500 text-white font-bold rounded-full shadow-lg hover:bg-cyan-600 transition-all duration-300 transform hover:scale-105"
          >
            <Mic className="h-6 w-6 mr-2" />
            Start Conversation
          </button>
        ) : (
          <button
            onClick={stopConversation}
            className="flex items-center justify-center px-8 py-4 bg-red-500 text-white font-bold rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 transform hover:scale-105"
          >
            <MicOff className="h-6 w-6 mr-2" />
            Stop Conversation
          </button>
        )}
      </div>
    </SectionWrapper>
  );
};

export default LiveAssistant;
