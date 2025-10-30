export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  grounding?: GroundingChunk[];
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type VideoAspectRatio = "16:9" | "9:16";

// This is a simplified declaration for the global aistudio object.
// It's assumed to be available on the window object in the execution environment.
declare global {
  // Fix: Use a named interface 'AIStudio' to avoid declaration conflicts, as indicated by the error message.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio: AIStudio;
    webkitAudioContext: {
      new (contextOptions?: AudioContextOptions): AudioContext;
    };
  }
}
