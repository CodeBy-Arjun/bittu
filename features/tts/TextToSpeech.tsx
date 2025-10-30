
import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause } from 'lucide-react';
import SectionWrapper from '../../components/SectionWrapper';
import Loader from '../../components/Loader';
import { generateSpeech } from '../../services/geminiService';

const TextToSpeech: React.FC = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);

    useEffect(() => {
        return () => {
            audioContextRef.current?.close();
            audioSourceRef.current?.disconnect();
        };
    }, []);

    const handleGenerateAndPlay = async () => {
        if (!text.trim()) {
            setError('Please enter some text to synthesize.');
            return;
        }

        setIsLoading(true);
        setError(null);
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
            audioSourceRef.current.disconnect();
            audioSourceRef.current = null;
        }
        setIsPlaying(false);

        try {
            const buffer = await generateSpeech(text);
            audioBufferRef.current = buffer;
            playAudio(buffer);
        } catch (err) {
            console.error(err);
            setError('Failed to generate speech. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const playAudio = (buffer: AudioBuffer) => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        }
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
            setIsPlaying(false);
            audioSourceRef.current = null;
        };
        source.start(0);
        audioSourceRef.current = source;
        setIsPlaying(true);
    };

    const handlePlayPause = () => {
        if (isPlaying) {
             if (audioContextRef.current?.state === 'running') {
                audioContextRef.current.suspend();
                setIsPlaying(false);
            }
        } else {
            if (audioContextRef.current?.state === 'suspended') {
                 audioContextRef.current.resume();
                 setIsPlaying(true);
            } else if (audioBufferRef.current) {
                playAudio(audioBufferRef.current);
            }
        }
    };


    return (
        <SectionWrapper
            title="Text-to-Speech"
            description="Convert written text into natural-sounding speech with Gemini."
        >
            <div className="max-w-2xl mx-auto flex flex-col h-full">
                <div className="flex-1">
                    <label htmlFor="tts-text" className="block text-sm font-medium text-gray-300 mb-1">
                        Text to Synthesize
                    </label>
                    <textarea
                        id="tts-text"
                        rows={8}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Type or paste your text here..."
                    />
                </div>

                <div className="mt-4">
                     {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
                    {isLoading ? (
                        <div className="flex justify-center">
                            <Loader text="Synthesizing speech..." />
                        </div>
                    ) : (
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={handleGenerateAndPlay}
                                disabled={isLoading}
                                className="flex-1 flex items-center justify-center p-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:bg-gray-500 transition-colors"
                            >
                                <Volume2 className="h-5 w-5 mr-2" />
                                Generate & Play
                            </button>
                             <button
                                onClick={handlePlayPause}
                                disabled={!audioBufferRef.current || isLoading}
                                className="p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500"
                            >
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </SectionWrapper>
    );
};

export default TextToSpeech;

