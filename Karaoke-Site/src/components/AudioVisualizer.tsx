import React, { useEffect, useRef, useState } from 'react';
import { Activity, BarChart2 } from 'lucide-react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualMode, setVisualMode] = useState<'spectrum' | 'oscilloscope'>('spectrum');
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      const width = canvas.width;
      const height = canvas.height;

      // Clear with solid dark navy/black background
      ctx.fillStyle = '#050512';
      ctx.fillRect(0, 0, width, height);

      // Draw standard grids in the background for retro look
      ctx.strokeStyle = 'rgba(0, 255, 204, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 16;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (!analyser) {
        // Draw idle line (flatline or low noise)
        ctx.strokeStyle = '#00ffcc';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00ffcc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (visualMode === 'oscilloscope') {
          ctx.moveTo(0, height / 2);
          ctx.lineTo(width, height / 2);
        } else {
          // Draw low idle spectrum bars
          const numBars = 24;
          const barWidth = width / numBars;
          for (let i = 0; i < numBars; i++) {
            const h = 2 + Math.random() * 3;
            ctx.fillStyle = '#00ffcc';
            ctx.fillRect(i * barWidth + 1, height - h, barWidth - 2, h);
          }
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset shadow
        return;
      }

      if (visualMode === 'spectrum') {
        // Spectrum Equalizer mode
        analyser.fftSize = 128; // lower fftSize gives fewer, thicker bars
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 1.4;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          // Keep only first 75% of frequencies (bass to mids, highs are usually low)
          if (x > width) break;

          const percent = dataArray[i] / 255;

          // Draw segments for a pixelated LED look
          const segments = 12;
          const segmentGap = 1.5;
          const singleSegmentHeight = (height - (segments * segmentGap)) / segments;
          const activeSegments = Math.round(percent * segments);

          for (let j = 0; j < segments; j++) {
            const sy = height - (j * (singleSegmentHeight + segmentGap)) - singleSegmentHeight;
            
            // Choose color based on height (green at bottom, yellow middle, pink top)
            if (j < activeSegments) {
              if (j > segments * 0.8) {
                ctx.fillStyle = '#ff00ff'; // Hot pink
              } else if (j > segments * 0.5) {
                ctx.fillStyle = '#ffff00'; // Neon yellow
              } else {
                ctx.fillStyle = '#00ffcc'; // Neon Cyan
              }
              ctx.fillRect(x, sy, barWidth - 1.5, singleSegmentHeight);
            } else {
              // Dim background cells
              ctx.fillStyle = 'rgba(0, 255, 204, 0.04)';
              ctx.fillRect(x, sy, barWidth - 1.5, singleSegmentHeight);
            }
          }

          x += barWidth;
        }
      } else {
        // Oscilloscope Waveform mode
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 3;
        ctx.strokeStyle = '#ff00ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ff00ff';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // Reset
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, visualMode]);

  return (
    <div className="flex flex-col gap-2 font-mono">
      {/* Visualizer Window Body */}
      <div
        className="relative bg-[#050512] p-1.5"
        style={{
          border: '2px solid',
          borderColor: '#555555 #ffffff #ffffff #555555',
        }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={80}
          className="w-full h-20 block image-render-pixel"
        />

        {/* Floating Y2K indicators */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-80 text-[10px] text-[#00ffcc]">
          <span className="animate-ping w-2 h-2 rounded-full bg-red-500" />
          <span className="text-red-500 font-bold">REALTIME ANALYZER</span>
        </div>
      </div>

      {/* Mode Switches */}
      <div className="flex gap-2">
        <button
          onClick={() => setVisualMode('spectrum')}
          className={`flex-1 py-1 text-xs font-bold flex items-center justify-center gap-1 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] ${
            visualMode === 'spectrum'
              ? 'bg-[#a0a0a0] border-t-[#404040] border-l-[#404040] border-r-white border-b-white text-black shadow-inner'
              : 'bg-[#c0c0c0] hover:bg-[#dfdfdf] text-black'
          }`}
          style={{
            boxShadow: visualMode === 'spectrum' ? 'none' : '1px 1px 0px #000',
          }}
        >
          <BarChart2 size={12} />
          SPECTRUM
        </button>
        <button
          onClick={() => setVisualMode('oscilloscope')}
          className={`flex-1 py-1 text-xs font-bold flex items-center justify-center gap-1 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] ${
            visualMode === 'oscilloscope'
              ? 'bg-[#a0a0a0] border-t-[#404040] border-l-[#404040] border-r-white border-b-white text-black shadow-inner'
              : 'bg-[#c0c0c0] hover:bg-[#dfdfdf] text-black'
          }`}
          style={{
            boxShadow: visualMode === 'oscilloscope' ? 'none' : '1px 1px 0px #000',
          }}
        >
          <Activity size={12} />
          WAVEFORM
        </button>
      </div>
    </div>
  );
};
