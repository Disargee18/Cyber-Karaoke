import React, { useEffect, useRef, useState } from 'react';
import { CameraOff, Video } from 'lucide-react';

interface WebcamBgProps {
  filter: 'none' | 'vaporwave' | 'matrix' | 'crt-glitch' | 'sepia';
  onRequestPermissions: () => void;
  hasPermission: boolean | null;
}

export const WebcamBg: React.FC<WebcamBgProps> = ({
  filter,
  onRequestPermissions,
  hasPermission,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamActive, setStreamActive] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true, // Try requesting both first
          });
        } catch (audioErr) {
          console.warn('Camera audio input initialization failed. Falling back to video-only feed:', audioErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false, // Fallback to video-only
          });
        }
        
        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((playErr) => {
            console.error('Explicit video.play() call was blocked:', playErr);
          });
          setStreamActive(true);
        }
      } catch (err) {
        console.error('Error opening camera feed:', err);
        setStreamActive(false);
      }
    };

    if (hasPermission === true) {
      startCamera();
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [hasPermission]);

  // CSS classes for various retro filters
  const getFilterClass = () => {
    switch (filter) {
      case 'vaporwave':
        return 'hue-rotate-[280deg] saturate-[250%] contrast-[130%] brightness-[105%]';
      case 'matrix':
        return 'grayscale sepia-[80%] hue-rotate-[90deg] saturate-[400%] contrast-[150%] brightness-[90%]';
      case 'crt-glitch':
        return 'saturate-[180%] contrast-[150%] brightness-[110%] animate-[flicker_0.15s_infinite]';
      case 'sepia':
        return 'sepia-[100%] saturate-[120%] contrast-[95%] brightness-[95%]';
      default:
        return '';
    }
  };

  return (
    <div className="relative w-full aspect-video bg-[#050510] overflow-hidden select-none" style={{
      boxShadow: 'inset 0 0 10px #000000',
    }}>
      {/* Background video - Always rendered in the DOM to avoid null ref lifecycle binding errors */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover scale-x-[-1] transition-all duration-300 ${
          hasPermission && streamActive ? 'block' : 'hidden'
        } ${getFilterClass()}`}
      />

      {/* Fallback Awaiting System Access dialog */}
      {(!hasPermission || !streamActive) && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#050510] text-[#00ffcc] font-mono px-4 text-center">
          <div className="animate-pulse mb-6">
            <CameraOff size={64} className="stroke-[1.5] text-pink-500 drop-shadow-[0_0_8px_#ff00ff]" />
          </div>
          <h2 className="text-2xl font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] drop-shadow-[0_0_5px_rgba(0,255,204,0.5)]">
            AWAITING SYSTEM ACCESS...
          </h2>
          <p className="max-w-md text-sm text-[#8a8a9e] mt-2 mb-6">
            We require access to your retro webcam and audio inputs to create a synced stage mirror experience.
          </p>
          <button
            onClick={onRequestPermissions}
            className="px-6 py-2 bg-[#c0c0c0] hover:bg-[#dfdfdf] active:bg-[#a0a0a0] text-black font-bold border-2 border-t-white border-l-white border-r-neutral-800 border-b-neutral-800 flex items-center gap-2"
            style={{
              boxShadow: '1px 1px 0px 0px #000',
            }}
          >
            <Video size={16} /> INITIALIZE FEED
          </button>
        </div>
      )}

      {/* Retro Pixel-Grid Overlay & Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
            linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))
          `,
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />

      {/* Moving CRT Scanline */}
      <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden">
        <div
          className="w-full h-[5px] bg-[#00ffcc]/10 opacity-30 shadow-[0_0_10px_#00ffcc]"
          style={{
            animation: 'scanline 6s linear infinite',
          }}
        />
      </div>

      {/* Ambient Vignette */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.85)] bg-gradient-to-b from-black/20 via-transparent to-black/45" />
    </div>
  );
};
