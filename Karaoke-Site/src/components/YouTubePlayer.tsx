import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

// Declare YT globally for the IFrame API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YouTubePlayerProps {
  videoId: string;
  onTimeUpdate: (time: number) => void;
  onDurationUpdate?: (duration: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  initialTime?: number;
}

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  stop: () => void;
  seekTo: (seconds: number) => void;
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(({
  videoId,
  onTimeUpdate,
  onDurationUpdate,
  onPlay,
  onPause,
  onEnded,
  initialTime = 0,
}, ref) => {
  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const pollingIntervalRef = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (playerRef.current && playerRef.current.playVideo) {
        playerRef.current.playVideo();
      }
    },
    pause: () => {
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
    },
    stop: () => {
      if (playerRef.current && playerRef.current.stopVideo) {
        playerRef.current.stopVideo();
        if (playerRef.current.seekTo) {
          playerRef.current.seekTo(0, true);
        }
      }
    },
    seekTo: (seconds: number) => {
      if (playerRef.current && playerRef.current.seekTo) {
        playerRef.current.seekTo(seconds, true);
      }
    }
  }));

  // 1. Load the YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    // Check if script already exists to prevent duplicate injection
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Define or wrap the global callback
    const prevCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback();
      setIsApiReady(true);
    };

    return () => {
      // Cleanup polling if unmounted
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // 2. Initialize Player when API is ready and videoId is present
  useEffect(() => {
    if (!isApiReady || !videoId || !wrapperRef.current) return;

    // Dynamically create the div that YT will replace.
    // This prevents React from losing track of the DOM node in StrictMode.
    const playerDiv = document.createElement('div');
    playerDiv.style.width = '100%';
    playerDiv.style.height = '100%';
    wrapperRef.current.innerHTML = ''; // clear previous just in case
    wrapperRef.current.appendChild(playerDiv);

    const startPolling = () => {
      if (!pollingIntervalRef.current) {
        pollingIntervalRef.current = window.setInterval(() => {
          if (playerRef.current && playerRef.current.getCurrentTime) {
            onTimeUpdate(playerRef.current.getCurrentTime());
          }
        }, 100);
      }
    };

    const stopPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };

    playerRef.current = new window.YT.Player(playerDiv, {
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        fs: 0,
        start: Math.floor(initialTime),
      },
      events: {
        onReady: (event: any) => {
          if (onDurationUpdate) {
            onDurationUpdate(event.target.getDuration());
          }
          event.target.playVideo();
        },
        onStateChange: (event: any) => {
          const state = event.data;
          // YT.PlayerState.PLAYING = 1
          if (state === 1) {
            startPolling();
            if (onPlay) onPlay();
          } else {
            stopPolling();
            // YT.PlayerState.PAUSED = 2
            if (state === 2 && onPause) onPause();
            // YT.PlayerState.ENDED = 0
            if (state === 0 && onEnded) onEnded();
          }
        },
      },
    });

    return () => {
      stopPolling();
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = ''; // Ensure the DOM is cleaned up
      }
    };
  }, [isApiReady, videoId]);

  return (
    <div className="w-full h-full bg-black relative p-1">
      {/* Neon border styling for retro feel */}
      <div 
        className="w-full h-full border-2 border-[#ff00ff] shadow-[0_0_10px_#ff00ff,inset_0_0_10px_#ff00ff] flex items-center justify-center relative overflow-hidden"
      >
        {!isApiReady && <span className="text-[#00ffcc] font-mono animate-pulse text-sm">LOADING VIDEO LINK...</span>}
        
        {/* Wrapper div that React safely manages */}
        <div className="w-full h-full" ref={wrapperRef}></div>
      </div>
    </div>
  );
});
