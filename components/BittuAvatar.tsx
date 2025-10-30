
import React from 'react';

interface BittuAvatarProps {
  isListening: boolean;
}

const BittuAvatar: React.FC<BittuAvatarProps> = ({ isListening }) => {
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      <div
        className={`absolute inset-0 rounded-full bg-cyan-500/10 transition-transform duration-1000 ${
          isListening ? 'animate-pulse scale-105' : ''
        }`}
      ></div>
      <div
        className={`absolute inset-4 rounded-full bg-cyan-500/20 transition-transform duration-700 ${
          isListening ? 'animate-pulse' : ''
        }`}
        style={{ animationDelay: '200ms' }}
      ></div>
      <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full bg-gray-800 shadow-2xl flex items-center justify-center">
        <svg
          className="w-20 h-20 md:w-28 md:h-28 text-cyan-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
    </div>
  );
};

export default BittuAvatar;
