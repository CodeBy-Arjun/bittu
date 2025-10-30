
import React, { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import SectionWrapper from '../../components/SectionWrapper';
import Loader from '../../components/Loader';
import { generateImage } from '../../services/geminiService';
import { AspectRatio } from '../../types';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectRatios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const imageBytes = await generateImage(prompt, aspectRatio);
      setGeneratedImage(`data:image/jpeg;base64,${imageBytes}`);
    } catch (err) {
      console.error(err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionWrapper
      title="Image Generation"
      description="Create stunning visuals from text descriptions using the powerful Imagen 4 model."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
              Prompt
            </label>
            <textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., A cinematic shot of a robot holding a red skateboard in a futuristic city"
            />
          </div>
          <div>
            <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-1">
              Aspect Ratio
            </label>
            <select
              id="aspectRatio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {aspectRatios.map((ratio) => (
                <option key={ratio} value={ratio}>
                  {ratio}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center w-full p-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:bg-gray-500 transition-colors"
          >
            <ImageIcon className="h-5 w-5 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex items-center justify-center bg-gray-800/50 rounded-lg border border-cyan-500/20 p-4">
          {isLoading ? (
            <Loader text="Creating your image..." />
          ) : generatedImage ? (
            <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg" />
          ) : (
            <div className="text-center text-gray-500">
              <ImageIcon className="h-16 w-16 mx-auto mb-2" />
              <p>Your generated image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default ImageGenerator;
