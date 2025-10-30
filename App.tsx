
import React, { useState } from 'react';
import { Bot, MessageSquare, Image as ImageIcon, Video, Mic, Map, Search, BrainCircuit, Speech } from 'lucide-react';
import LiveAssistant from './features/live-assistant/LiveAssistant';
import Chatbot from './features/chatbot/Chatbot';
import ImageGenerator from './features/image-gen/ImageGenerator';
import ImageEditor from './features/image-edit/ImageEditor';
import VideoGenerator from './features/video-gen/VideoGenerator';
import ContentAnalyzer from './features/content-analysis/ContentAnalyzer';
import TextToSpeech from './features/tts/TextToSpeech';

type Feature = 'ASSISTANT' | 'CHAT' | 'IMAGE_GEN' | 'IMAGE_EDIT' | 'VIDEO_GEN' | 'ANALYZE' | 'TTS';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('ASSISTANT');

  const navItems = [
    { id: 'ASSISTANT', label: 'Live Assistant', icon: Mic },
    { id: 'CHAT', label: 'Chatbot', icon: MessageSquare },
    { id: 'IMAGE_GEN', label: 'Image Generation', icon: ImageIcon },
    { id: 'IMAGE_EDIT', label: 'Image Editor', icon: ImageIcon },
    { id: 'VIDEO_GEN', label: 'Video Generation', icon: Video },
    { id: 'ANALYZE', label: 'Content Analyzer', icon: BrainCircuit },
    { id: 'TTS', label: 'Text-to-Speech', icon: Speech },
  ];

  const renderFeature = () => {
    switch (activeFeature) {
      case 'ASSISTANT':
        return <LiveAssistant />;
      case 'CHAT':
        return <Chatbot />;
      case 'IMAGE_GEN':
        return <ImageGenerator />;
      case 'IMAGE_EDIT':
        return <ImageEditor />;
      case 'VIDEO_GEN':
        return <VideoGenerator />;
      case 'ANALYZE':
        return <ContentAnalyzer />;
      case 'TTS':
        return <TextToSpeech />;
      default:
        return <LiveAssistant />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-gray-900 text-gray-100 font-sans">
      <nav className="w-64 bg-gray-900/50 border-r border-cyan-500/20 p-4 flex flex-col">
        <div className="flex items-center mb-8">
          <Bot className="h-10 w-10 text-cyan-400 mr-3" />
          <h1 className="text-2xl font-bold text-white tracking-wider">Bittu AI</h1>
        </div>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveFeature(item.id as Feature)}
                className={`w-full flex items-center p-3 rounded-lg text-left text-sm font-medium transition-all duration-200 ease-in-out
                  ${activeFeature === item.id 
                    ? 'bg-cyan-500/20 text-cyan-300 shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                  }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderFeature()}
      </main>
    </div>
  );
};

export default App;
