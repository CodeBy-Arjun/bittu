
import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, Map, BrainCircuit } from 'lucide-react';
import SectionWrapper from '../../components/SectionWrapper';
import Loader from '../../components/Loader';
import { getChatResponse, getComplexResponse } from '../../services/geminiService';
import { ChatMessage, GroundingChunk } from '../../types';
import useGeolocation from '../../hooks/useGeolocation';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const [useThinking, setUseThinking] = useState(false);

  const { location, error: geoError, requestLocation } = useGeolocation();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  useEffect(() => {
      if (useMaps) {
          requestLocation();
      }
  }, [useMaps, requestLocation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const newUserMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: userInput }],
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      let response;
      if (useThinking) {
        const responseText = await getComplexResponse(userInput);
        response = { text: responseText };
      } else {
        const history = messages.map(msg => ({ role: msg.role, parts: msg.parts }));
        response = await getChatResponse(history, userInput, useSearch, useMaps, location);
      }

      const newModelMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: response.text }],
        grounding: response.grounding,
      };
      setMessages((prev) => [...prev, newModelMessage]);
    } catch (error) {
      console.error('Error fetching response:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        parts: [{ text: 'Sorry, I encountered an error. Please try again.' }],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const GroundingPill: React.FC<{ chunk: GroundingChunk }> = ({ chunk }) => {
      const source = chunk.web || chunk.maps;
      if (!source?.uri) return null;
      return (
          <a
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full hover:bg-gray-500 transition-colors mr-2 mb-1"
          >
              {source.title || 'Source'}
          </a>
      );
  };

  return (
    <SectionWrapper
      title="AI Chatbot"
      description="Ask questions, get information, or brainstorm ideas. Enhance with grounding and thinking modes."
    >
      <div className="flex flex-col h-full bg-gray-800/50 rounded-lg border border-cyan-500/20">
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xl p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                <p className="whitespace-pre-wrap">{msg.parts[0].text}</p>
                {msg.grounding && msg.grounding.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-600">
                        {msg.grounding.map((chunk, i) => <GroundingPill key={i} chunk={chunk} />)}
                    </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xl p-3 rounded-lg bg-gray-700 text-gray-200">
                <Loader text={useThinking ? "Thinking deeply..." : "Getting response..."} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="p-4 border-t border-cyan-500/20">
          <div className="flex items-center space-x-2 mb-2">
            <button onClick={() => setUseSearch(!useSearch)} className={`flex items-center text-xs px-3 py-1 rounded-full ${useSearch ? 'bg-cyan-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
              <Search className="h-4 w-4 mr-1"/> Google Search
            </button>
            <button onClick={() => setUseMaps(!useMaps)} className={`flex items-center text-xs px-3 py-1 rounded-full ${useMaps ? 'bg-cyan-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
              <Map className="h-4 w-4 mr-1"/> Google Maps
            </button>
            <button onClick={() => setUseThinking(!useThinking)} className={`flex items-center text-xs px-3 py-1 rounded-full ${useThinking ? 'bg-purple-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
              <BrainCircuit className="h-4 w-4 mr-1"/> Thinking Mode
            </button>
            {useMaps && geoError && <span className="text-xs text-red-400">{geoError}</span>}
          </div>
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              disabled={isLoading}
            />
            <button type="submit" className="p-2 bg-cyan-500 rounded-lg hover:bg-cyan-600 disabled:bg-gray-500" disabled={isLoading || !userInput.trim()}>
              <Send className="h-6 w-6 text-white" />
            </button>
          </form>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default Chatbot;
