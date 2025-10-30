
import React, { ReactNode } from 'react';

interface SectionWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({ title, description, children }) => {
  return (
    <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto bg-gray-900">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-gray-400 mt-1">{description}</p>
      </header>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default SectionWrapper;
