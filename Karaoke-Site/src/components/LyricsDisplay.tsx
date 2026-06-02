import React, { useEffect, useRef, useState } from 'react';
import { Music, AlertCircle } from 'lucide-react';

interface LyricLine {
  time: number;
  text: string;
}

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentTime: number;
  songTitle: string;
}

export const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ lyrics, currentTime, songTitle }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('lyrics-font-size');
    return saved ? parseInt(saved, 10) : 18; // Default 18px (perfect starting Y2K font size)
  });

  const increaseFontSize = () => {
    setFontSize(prev => {
      const next = Math.min(prev + 4, 48);
      localStorage.setItem('lyrics-font-size', next.toString());
      return next;
    });
  };

  const decreaseFontSize = () => {
    setFontSize(prev => {
      const next = Math.max(prev - 4, 12);
      localStorage.setItem('lyrics-font-size', next.toString());
      return next;
    });
  };

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
      <div
        className="w-full h-full flex-grow flex-1 min-h-[15rem] flex flex-col items-center justify-center bg-black/60 text-[#ff00ff] font-mono p-4 text-center rounded border border-[#555555]/30"
        style={{
          boxShadow: 'inset 0 0 10px #000000',
        }}
      >
        <AlertCircle size={32} className="animate-bounce mb-3 text-pink-500 animate-pulse" />
        <p className="text-sm font-bold tracking-widest text-[#00ffcc] animate-pulse uppercase">
          Awaiting Music Playback...
        </p>
        <p className="text-[10px] text-[#8a8a9e] mt-2 max-w-xs leading-normal">
          Awaiting for you to play some music! Insert a local cassette tape or paste a YouTube stream in the Winamp Rack to trigger the synced lyrics.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full flex-grow flex-1 min-h-[15rem] bg-black/75 rounded overflow-hidden"
      style={{
        border: '2px solid',
        borderColor: '#555555 #ffffff #ffffff #555555',
      }}
    >
      {/* Sticky Neon Song Title Header with interactive Font Size adjusters */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#200020] via-black to-[#002020] text-[#00ffcc] font-mono text-[9px] font-black text-center py-1.5 border-b border-pink-500/35 z-20 uppercase tracking-widest flex items-center justify-between px-3 shadow-md">
        <div className="flex items-center gap-1.5 truncate max-w-[65%] text-left">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping shrink-0" />
          <span className="truncate">{songTitle}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 select-none">
          <span className="text-[8px] text-gray-400 font-bold hidden xs:inline">FONT:</span>
          <div className="flex items-center bg-black/50 p-0.5 border border-pink-500/30 rounded">
            <button
              onClick={decreaseFontSize}
              title="Decrease Font Size"
              className="px-1 py-0.5 bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bg-[#a0a0a0] text-black font-extrabold text-[8px] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] select-none cursor-pointer"
            >
              A-
            </button>
            <span className="px-1.5 text-[9px] text-[#00ffcc] font-black min-w-[18px] text-center">
              {fontSize}
            </span>
            <button
              onClick={increaseFontSize}
              title="Increase Font Size"
              className="px-1 py-0.5 bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bg-[#a0a0a0] text-black font-extrabold text-[8px] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] select-none cursor-pointer"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto overflow-x-hidden relative px-4 pt-10 pb-24 scroll-smooth select-none"
        style={{
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
                className={`w-full max-w-[95%] text-center py-2 px-3 rounded font-mono tracking-wide transition-all duration-300 flex flex-col items-center justify-center ${
                  isActive
                    ? 'scale-110 md:scale-115 font-black text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] via-[#ffff00] to-[#ff00ff] drop-shadow-[0_0_8px_rgba(0,255,204,0.7)] z-10'
                    : isPast
                    ? 'opacity-40 scale-95 blur-[0.4px] text-pink-400 font-semibold'
                    : 'opacity-70 text-gray-300 font-medium'
                }`}
                style={{
                  fontSize: isActive ? `${fontSize * 1.15}px` : `${fontSize}px`,
                  lineHeight: '1.3',
                }}
              >
                {/* Active Marker Arrow */}
                {isActive && (
                  <div 
                    className="flex items-center gap-1 font-bold text-yellow-400 uppercase tracking-widest mb-1.5 animate-bounce select-none"
                    style={{ fontSize: `${Math.max(9, fontSize - 6)}px` }}
                  >
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
      </div>

      {/* Decorative Scanlines for the Teleprompter */}
      <div className="absolute inset-0 pointer-events-none border-4 border-black/45 bg-gradient-to-b from-black/10 via-transparent to-black/10 z-10" />
    </div>
  );
};
