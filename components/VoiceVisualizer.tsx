
import React, { useRef, useEffect } from 'react';

interface VoiceVisualizerProps {
  analyserNode: AnalyserNode | null;
  isListening: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ analyserNode, isListening }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!analyserNode || !canvasRef.current || !isListening) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    let animationFrameId: number;

    const draw = () => {
      if (!canvasCtx || !analyserNode) return;

      analyserNode.fftSize = 2048;
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      canvasCtx.clearRect(0, 0, width, height);
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(56, 189, 248)';
      canvasCtx.beginPath();

      const sliceWidth = (width * 1.0) / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (canvasCtx) {
         canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
  }, [analyserNode, isListening]);
  
  return <canvas ref={canvasRef} className="w-full h-24" />;
};

export default VoiceVisualizer;
