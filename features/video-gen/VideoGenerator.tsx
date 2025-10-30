
import React, { useState, useEffect } from 'react';
import { Film, UploadCloud } from 'lucide-react';
import SectionWrapper from '../../components/SectionWrapper';
import Loader from '../../components/Loader';
import { generateVideo } from '../../services/geminiService';
import { VideoAspectRatio } from '../../types';

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isKeySelected, setIsKeySelected] = useState(false);

  useEffect(() => {
    const checkApiKey = async () => {
        if(window.aistudio) {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsKeySelected(hasKey);
        } else {
            // Assume key is available via env if aistudio is not present
            setIsKeySelected(true);
        }
    };
    checkApiKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success and optimistically update UI
      setIsKeySelected(true);
    }
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 4 * 1024 * 1024) {
        setError("File is too large. Please upload an image under 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) {
      setError('Please enter a prompt or upload an image.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedVideo(null);
    setLoadingMessage("Initializing...");

    try {
      const videoUrl = await generateVideo(prompt, aspectRatio, uploadedImage, setLoadingMessage);
      setGeneratedVideo(videoUrl);
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Failed to generate video. Please try again.';
      if (err.message?.includes('Requested entity was not found')) {
        errorMessage = 'API Key not found or invalid. Please select a valid key.';
        setIsKeySelected(false);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isKeySelected) {
    return (
        <SectionWrapper title="Video Generation" description="Generate stunning videos from text or images with Veo.">
            <div className="flex flex-col items-center justify-center h-full text-center bg-gray-800/50 rounded-lg border border-cyan-500/20 p-8">
                <h3 className="text-xl font-bold mb-2 text-white">API Key Required</h3>
                <p className="text-gray-400 mb-4 max-w-md">Video generation with Veo requires a project with billing enabled. Please select your API key to continue.</p>
                <p className="text-sm text-gray-500 mb-6">For more information, visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Gemini API billing documentation</a>.</p>
                <button onClick={handleSelectKey} className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 transition-colors">
                    Select API Key
                </button>
            </div>
        </SectionWrapper>
    );
  }

  return (
    <SectionWrapper
      title="Video Generation"
      description="Generate stunning videos from text or images with Veo."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col space-y-4">
          <div>
            <label htmlFor="prompt-video" className="block text-sm font-medium text-gray-300 mb-1">
              Prompt
            </label>
            <textarea
              id="prompt-video"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., A neon hologram of a cat driving at top speed"
            />
          </div>
          <div>
            <label htmlFor="aspectRatio-video" className="block text-sm font-medium text-gray-300 mb-1">
              Aspect Ratio
            </label>
            <select
              id="aspectRatio-video"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)}
              className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="16:9">16:9 (Landscape)</option>
              <option value="9:16">9:16 (Portrait)</option>
            </select>
          </div>
          <div>
            <label htmlFor="image-upload-video" className="block text-sm font-medium text-gray-300 mb-1">Starting Image (Optional)</label>
             <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500">
                <input id="image-upload-video" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                {uploadedImage ? (
                    <img src={uploadedImage} alt="Uploaded for video" className="max-h-24 mx-auto rounded-lg" />
                ) : (
                    <div className="text-gray-400">
                        <UploadCloud className="h-8 w-8 mx-auto mb-1" />
                        <p className="text-sm">Click to upload</p>
                    </div>
                )}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex items-center justify-center w-full p-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:bg-gray-500 transition-colors"
          >
            <Film className="h-5 w-5 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Video'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex items-center justify-center bg-gray-800/50 rounded-lg border border-cyan-500/20 p-4">
          {isLoading ? (
            <Loader text={loadingMessage} />
          ) : generatedVideo ? (
            <video src={generatedVideo} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg" />
          ) : (
            <div className="text-center text-gray-500">
              <Film className="h-16 w-16 mx-auto mb-2" />
              <p>Your generated video will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default VideoGenerator;
