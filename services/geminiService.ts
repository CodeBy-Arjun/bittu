
import { GoogleGenAI, GenerateContentResponse, Chat, GroundingChunk, Modality, Type, GenerateContentStreamResponse } from "@google/genai";
import { AspectRatio, VideoAspectRatio } from '../types';

let ai: GoogleGenAI | null = null;
const getAI = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
};
const getAIWithFreshKey = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const getChatResponse = async (
    history: { role: 'user' | 'model'; parts: { text: string }[] }[],
    newMessage: string,
    useSearch: boolean,
    useMaps: boolean,
    location: GeolocationCoordinates | null
): Promise<{ text: string, grounding?: GroundingChunk[] }> => {
    const ai = getAI();
    const chat = ai.chats.create({ model: 'gemini-2.5-flash', history });

    const tools: any[] = [];
    if(useSearch) tools.push({googleSearch: {}});
    if(useMaps) tools.push({googleMaps: {}});
    
    const config: any = {};
    if(tools.length > 0) config.tools = tools;
    if(useMaps && location) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
            }
        }
    }

    const result = await chat.sendMessage({ message: newMessage, config });
    return {
        text: result.text,
        grounding: result.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
};

export const getComplexResponse = async (prompt: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 32768 }
        }
    });
    return response.text;
};

export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });
    return response.generatedImages[0].image.imageBytes;
};

export const editImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    for (const part of response.candidates?.[0]?.content.parts ?? []) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error("No image was generated.");
};

export const generateVideo = async (
    prompt: string,
    aspectRatio: VideoAspectRatio,
    imageBase64?: string | null,
    onProgress?: (message: string) => void
): Promise<string> => {
    const ai = getAIWithFreshKey(); // Use fresh key for VEO
    onProgress?.("Initializing video generation...");

    const requestPayload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio
        }
    };

    if (imageBase64) {
        requestPayload.image = {
            imageBytes: imageBase64.split(',')[1],
            mimeType: imageBase64.split(';')[0].split(':')[1],
        };
    }
    
    let operation = await ai.models.generateVideos(requestPayload);
    onProgress?.("Your request is being processed. This can take a few minutes...");

    const progressMessages = [
        "Warming up the pixels...",
        "Directing the virtual movie...",
        "Rendering the digital masterpiece...",
        "Almost there, adding final touches...",
    ];
    let messageIndex = 0;

    while (!operation.done) {
        onProgress?.(progressMessages[messageIndex % progressMessages.length]);
        messageIndex++;
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress?.("Video generation complete!");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if(!videoResponse.ok) {
        throw new Error("Failed to download the generated video.");
    }
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
};

export const analyzeImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: imageBase64, mimeType } },
                { text: prompt },
            ],
        },
    });
    return response.text;
};

export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from API.");
    }
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
    
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    const dataInt16 = new Int16Array(bytes.buffer);
    const frameCount = dataInt16.length;
    const buffer = audioContext.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    
    return buffer;
};

// Functions for Live API audio processing
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
