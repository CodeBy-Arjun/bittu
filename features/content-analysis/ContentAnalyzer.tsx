
import React, { useState } from 'react';
import { UploadCloud, Eye, HelpCircle } from 'lucide-react';
import SectionWrapper from '../../components/SectionWrapper';
import Loader from '../../components/Loader';
import { analyzeImage } from '../../services/geminiService';

const ContentAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{name: string, type: string} | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 4 * 1024 * 1024) {
        setError("File is too large. Please upload an image under 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setFileInfo({ name: file.name, type: file.type });
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image || !fileInfo) {
      setError("Please upload an image to analyze.");
      return;
    }
    if (!prompt.trim()) {
      setError("Please enter a question or prompt for analysis.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const base64Data = image.split(',')[1];
      const result = await analyzeImage(prompt, base64Data, fileInfo.type);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze content. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SectionWrapper
      title="Content Analyzer"
      description="Upload an image and ask Gemini questions about it."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col space-y-4">
          <div className="flex-1">
            <label htmlFor="image-upload-analyzer" className="block text-sm font-medium text-gray-300 mb-1">Image for Analysis</label>
             <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500 h-full flex items-center justify-center">
                <input id="image-upload-analyzer" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                {image ? (
                    <img src={image} alt="For analysis" className="max-h-full max-w-full mx-auto rounded-lg" />
                ) : (
                    <div className="text-gray-400">
                        <UploadCloud className="h-10 w-10 mx-auto mb-2" />
                        <p>Click to upload or drag & drop</p>
                        <p className="text-xs">Max 4MB</p>
                    </div>
                )}
            </div>
          </div>
          <div>
            <label htmlFor="prompt-analyzer" className="block text-sm font-medium text-gray-300 mb-1">
              Question or Prompt
            </label>
            <textarea
              id="prompt-analyzer"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="e.g., What is in this image? or Describe the main subject."
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !image}
            className="flex items-center justify-center w-full p-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:bg-gray-500 transition-colors"
          >
            <Eye className="h-5 w-5 mr-2" />
            {isLoading ? 'Analyzing...' : 'Analyze Content'}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex flex-col bg-gray-800/50 rounded-lg border border-cyan-500/20 p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Analysis Result</h3>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader text="Analyzing..." />
                </div>
            ) : analysis ? (
              <p className="text-gray-300 whitespace-pre-wrap">{analysis}</p>
            ) : (
              <div className="text-center text-gray-500 flex flex-col items-center justify-center h-full">
                <Eye className="h-16 w-16 mx-auto mb-2" />
                <p>Analysis results will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
       <div className="mt-4 p-3 bg-yellow-900/30 text-yellow-300 text-sm rounded-lg flex items-start">
            <HelpCircle className="h-5 w-5 mr-3 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Video Analysis:</strong> True video file analysis is not supported via this web interface due to browser limitations. For video-related queries, please describe the video in the chatbot.
            </span>
        </div>
    </SectionWrapper>
  );
};

export default ContentAnalyzer;
