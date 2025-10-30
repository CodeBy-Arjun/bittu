
import React from 'react';

interface LoaderProps {
  text?: string;
}

const Loader: React.FC<LoaderProps> = ({ text = 'Processing...' }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      {text && <p className="text-cyan-300 text-sm">{text}</p>}
    </div>
  );
};

export default Loader;
