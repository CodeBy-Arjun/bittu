
import React, { useState, useCallback } from 'react';
import { UploadCloud, Wand2 } from 'lucide-react';
import SectionWrapper from '../../components/SectionWrapper';
import Loader from '../../components/Loader';
import { editImage } from '../../services/geminiService';

const ImageEditor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<{name: string, type: string} | null>(null);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(file.size > 4 * 1024 * 1024) {
        setError("File is too large. Please upload an image under 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result as string);
        setEditedImage(null);
        setFileInfo({ name: file.name, type: file.type });
        setError(null);
      };
      reader.onerror = () => {
          setError("Failed to read the file.");
      }
      reader.readAsDataURL(file);
    }
  };
  
  const handleEdit = async () => {
      if (!originalImage || !fileInfo) {
          setError("Please upload an image first.");
          return;
      }
      if (!prompt.trim()) {
          setError("Please enter an editing instruction.");
          return;
      }
      setIsLoading(true);
      setError(null);
      
      try {
          const base64Data = originalImage.split(',')[1];
          const resultBase64 = await editImage(prompt, base64Data, fileInfo.type);
          setEditedImage(`data:${fileInfo.type};base64,${resultBase64}`);
      } catch (err) {
          console.error(err);
          setError("Failed to edit image. Please try again.");
      } finally {
          setIsLoading(false);
      }
  }

  return (
    <SectionWrapper
      title="AI Image Editor"
      description="Upload an image and use simple text commands to edit it with Gemini."
    >
      <div className="flex flex-col h-full space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-300 mb-1">Original Image</label>
                <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-cyan-500">
                    <input id="image-upload" type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                    {originalImage ? (
                        <img src={originalImage} alt="Original" className="max-h-48 mx-auto rounded-lg" />
                    ) : (
                        <div className="text-gray-400">
                            <UploadCloud className="h-10 w-10 mx-auto mb-2" />
                            <p>Click to upload or drag & drop</p>
                            <p className="text-xs">Max 4MB</p>
                        </div>
                    )}
                </div>
                {fileInfo && <p className="text-xs text-gray-500 text-center truncate">{fileInfo.name}</p>}
            </div>
            <div className="flex items-center justify-center bg-gray-800/50 rounded-lg border border-cyan-500/20 p-4">
                {isLoading ? (
                    <Loader text="Applying edits..." />
                ) : editedImage ? (
                    <img src={editedImage} alt="Edited" className="max-w-full max-h-full object-contain rounded-lg" />
                ) : (
                    <div className="text-center text-gray-500">
                        <Wand2 className="h-16 w-16 mx-auto mb-2" />
                        <p>Your edited image will appear here.</p>
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex-grow flex flex-col space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
                Editing Instruction
              </label>
              <textarea
                id="prompt"
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full p-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., Add a retro filter, or remove the person in the background"
              />
            </div>
            <button
              onClick={handleEdit}
              disabled={isLoading || !originalImage}
              className="flex items-center justify-center w-full p-3 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:bg-gray-500 transition-colors"
            >
              <Wand2 className="h-5 w-5 mr-2" />
              {isLoading ? 'Editing...' : 'Apply Edit'}
            </button>
             {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default ImageEditor;
