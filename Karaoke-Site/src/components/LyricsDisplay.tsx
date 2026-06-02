import React, { useEffect, useRef, useState } from 'react';
import { Music, AlertCircle } from 'lucide-react';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ lyrics, currentTime }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Find the active lyric index based on the currentTime
  useEffect(() => {
    let newIndex = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        newIndex = i;
      } else {
        break;
      }
    }
    setActiveIndex(newIndex);
  }, [currentTime, lyrics]);

  // Smoothly center the active lyric line in the container
  useEffect(() => {
    if (activeIndex !== -1 && containerRef.current) {
      const activeElement = lineRefs.current[activeIndex];
      const container = containerRef.current;

      if (activeElement) {
        const containerHeight = container.clientHeight;
        const elemTop = activeElement.offsetTop;
        const elemHeight = activeElement.clientHeight;

        // Center target position
        const targetScroll = elemTop - containerHeight / 2 + elemHeight / 2;

        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      }
    }
  }, [activeIndex]);

  // Reset line references array if lyrics list changes
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lyrics.length);
  }, [lyrics]);

  if (lyrics.length === 0 || (lyrics.length === 1 && lyrics[0].time === 0 && lyrics[0].text === '')) {
    return (
      <div className="h-64 flex flex-col items-center justify-center bg-black/60 text-[#ff00ff] font-mono p-4 text-center rounded">
        <AlertCircle size={32} className="animate-bounce mb-3 text-pink-500" />
        <p className="text-sm font-bold tracking-widest text-[#00ffcc] animate-pulse">
          AWAITING LYRIC INJECTION...
        </p>
        <p className="text-[10px] text-[#8a8a9e] mt-2 max-w-xs">
          Paste some standard `.lrc` lyrics in the LRC editor or click on a quick-load demo template to begin!
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-64 overflow-y-auto overflow-x-hidden relative bg-black/75 px-4 py-32 rounded scroll-smooth select-none"
      style={{
        border: '2px solid',
        borderColor: '#555555 #ffffff #ffffff #555555',
        backgroundImage: 'radial-gradient(circle, rgba(0, 255, 204, 0.05) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      <div className="flex flex-col gap-6 items-center">
        {lyrics.map((line, idx) => {
          const isActive = idx === activeIndex;
          const isPast = idx < activeIndex;

          return (
            <div
              key={idx}
              ref={(el) => {
                lineRefs.current[idx] = el;
              }}
              className={`w-full max-w-[90%] text-center py-2 px-3 rounded font-mono text-sm sm:text-base tracking-wide transition-all duration-300 flex flex-col items-center justify-center ${
                isActive
                  ? 'scale-110 md:scale-115 font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] via-[#ffff00] to-[#ff00ff] drop-shadow-[0_0_8px_rgba(0,255,204,0.7)] z-10'
                  : isPast
                  ? 'opacity-40 scale-95 blur-[0.4px] text-pink-400 font-semibold'
                  : 'opacity-70 text-gray-300 font-medium'
              }`}
            >
              {/* Active Marker Arrow */}
              {isActive && (
                <div className="flex items-center gap-1 text-[9px] font-bold text-yellow-400 uppercase tracking-widest mb-1.5 animate-bounce select-none">
                  <Music size={10} className="animate-spin text-cyan-400" />
                  <span>★ SING NOW ★</span>
                  <Music size={10} className="animate-spin text-pink-400" />
                </div>
              )}

              {/* Lyric Text Line */}
              <span
                className={`transition-all duration-300 border-b-2 ${
                  isActive
                    ? 'border-yellow-400 pb-1.5'
                    : 'border-transparent'
                }`}
                style={{
                  fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                }}
              >
                {line.text}
              </span>
            </div>
          );
        })}
      </div>

      {/* Decorative Scanlines for the Teleprompter */}
      <div className="absolute inset-0 pointer-events-none border-4 border-black/45 bg-gradient-to-b from-black/10 via-transparent to-black/10" />
    </div>
  );
};
