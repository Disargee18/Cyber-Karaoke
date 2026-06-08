import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Square, Volume2, Upload, Globe, RefreshCw } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { YouTubePlayer, type YouTubePlayerHandle } from './YouTubePlayer';
import { DEMO_SONGS } from './LrcEditor';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface MediaCenterProps {
  selectedSongId: string;
  onSongChange: (songId: string) => void;
  onTimeUpdate: (time: number) => void;
  onLyricsParsed?: (lyrics: { time: number; text: string }[]) => void;
  lyrics: { time: number; text: string }[];
  customSongTitle: string;
  setCustomSongTitle: (title: string) => void;
  ytVideoId: string | null;
  onYtVideoIdChange: (id: string | null) => void;
  ytDuration: number;
  onYtDurationChange: (duration: number) => void;
  ytPlayerRef: React.RefObject<YouTubePlayerHandle>;
  isYtPoppedOut: boolean;
  onToggleYtPopOut: () => void;
}

export const MediaCenter: React.FC<MediaCenterProps> = ({
  selectedSongId,
  onSongChange,
  onTimeUpdate,
  onLyricsParsed,
  lyrics,
  customSongTitle,
  setCustomSongTitle,
  ytVideoId,
  onYtVideoIdChange,
  ytDuration,
  onYtDurationChange,
  ytPlayerRef,
  isYtPoppedOut,
  onToggleYtPopOut,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTimeState, setCurrentTimeState] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [vocalRemover, setVocalRemover] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'youtube'>('upload');
  
  // YouTube Tab States
  const [ytUrl, setYtUrl] = useState('');
  const [ytStatus, setYtStatus] = useState<'idle' | 'loading' | 'streaming' | 'error'>('idle');

  // Web Audio Nodes Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const splitterNodeRef = useRef<ChannelSplitterNode | null>(null);
  const invertGainNodeRef = useRef<GainNode | null>(null);
  const mergerNodeRef = useRef<ChannelMergerNode | null>(null);
  
  // Wet/Dry path gains
  const directGainNodeRef = useRef<GainNode | null>(null);
  const processedGainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);

  // Procedural Synth States & Refs
  const synthTimerRef = useRef<number | null>(null);
  const synthTimeRef = useRef<number>(0);
  const synthStepRef = useRef<number>(0);
  const [isSynthMode, setIsSynthMode] = useState(false);
  const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);

  // Initialize Audio Context lazily
  const initAudioEngine = () => {
    if (audioContextRef.current || !audioRef.current) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Create main nodes
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;

      const splitter = ctx.createChannelSplitter(2);
      splitterNodeRef.current = splitter;

      const invertGain = ctx.createGain();
      invertGain.gain.value = -1.0;
      invertGainNodeRef.current = invertGain;

      const merger = ctx.createChannelMerger(2);
      mergerNodeRef.current = merger;

      const directGain = ctx.createGain();
      directGain.gain.value = 1.0;
      directGainNodeRef.current = directGain;

      const processedGain = ctx.createGain();
      processedGain.gain.value = 0.0;
      processedGainNodeRef.current = processedGain;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserNodeRef.current = analyser;
      setAnalyserState(analyser);

      // --- Connect Phase Cancellation Path ($L - R$) ---
      // Source splits into L and R channels
      source.connect(splitter);
      
      // Connect Splitter Left (Output 0) directly to Merger Left & Merger Right (Inputs 0 & 1)
      splitter.connect(merger, 0, 0);
      splitter.connect(merger, 0, 1);
      
      // Connect Splitter Right (Output 1) to Inverter (-1 Gain), then to Merger Left & Merger Right
      splitter.connect(invertGain, 1);
      invertGain.connect(merger, 0, 0);
      invertGain.connect(merger, 0, 1);

      // Merger goes to the Processed Gain node
      merger.connect(processedGain);

      // --- Connect Direct/Bypass Path ---
      source.connect(directGain);

      // --- Connect Paths to Analyser, then Destination ---
      directGain.connect(analyser);
      processedGain.connect(analyser);
      analyser.connect(ctx.destination);

      // Sync initial volume and vocal remover toggle values
      directGain.gain.value = vocalRemover ? 0.0 : 1.0;
      processedGain.gain.value = vocalRemover ? 1.0 : 0.0;
    } catch (e) {
      console.error('Failed to initialize Web Audio context:', e);
    }
  };

  // Clean up Audio Graph on Unmount
  useEffect(() => {
    return () => {
      stopProceduralSynth();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Set Vocal Remover Wet/Dry gains on switch
  useEffect(() => {
    if (directGainNodeRef.current && processedGainNodeRef.current) {
      // Crossfade to prevent audio click artifacts
      if (vocalRemover) {
        directGainNodeRef.current.gain.setValueAtTime(0.0, audioContextRef.current?.currentTime || 0);
        processedGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current?.currentTime || 0);
      } else {
        directGainNodeRef.current.gain.setValueAtTime(1.0, audioContextRef.current?.currentTime || 0);
        processedGainNodeRef.current.gain.setValueAtTime(0.0, audioContextRef.current?.currentTime || 0);
      }
    }
  }, [vocalRemover]);

  // Adjust volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const hasValidLyrics = () => {
    if (!lyrics || lyrics.length === 0) return false;
    if (lyrics.length === 1) {
      const text = lyrics[0].text;
      if (
        text.includes("No LRC Timestamps Found") ||
        text.includes("AWAITING LYRIC INJECTION") ||
        text.includes("No synced lyrics found") ||
        text.trim() === ""
      ) {
        return false;
      }
    }
    return true;
  };

  // Halt playback if lyrics are removed or cleared during execution
  useEffect(() => {
    if (isPlaying && !hasValidLyrics()) {
      handleStop();
    }
  }, [lyrics]);

  // Track switching or procedural mode toggling
  useEffect(() => {
    stopProceduralSynth();
    setIsPlaying(false);
    setCurrentTimeState(0);
    onTimeUpdate(0);

    const activeDemo = DEMO_SONGS.find((s) => s.id === selectedSongId);
    
    if (selectedSongId === 'procedural-synth') {
      setIsSynthMode(true);
      setDuration(45); // Fake duration for the procedural sequencer
    } else {
      setIsSynthMode(false);
      if (audioRef.current && activeDemo && activeDemo.url !== 'procedural') {
        audioRef.current.src = activeDemo.url;
        audioRef.current.load();
      }
    }
  }, [selectedSongId]);

  const isYtMode = selectedSongId === 'youtube';

  // Handle Play/Pause
  const handlePlayPause = async () => {
    if (!hasValidLyrics()) {
      alert("⚠️ PLAYBACK LOCKED!\n\nKaraoke stage requires lyrics before you can play the music. Please upload a local cassette tape or enter a streaming YouTube link in the Winamp Rack tabs to load synced lyrics first!");
      return;
    }

    if (isYtMode) {
      if (isPlaying) {
        ytPlayerRef.current?.pause();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // Resume audio context if suspended by browser security policy
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isSynthMode) {
      if (isPlaying) {
        stopProceduralSynth();
      } else {
        startProceduralSynth();
      }
      setIsPlaying(!isPlaying);
    } else {
      if (!audioRef.current) return;
      initAudioEngine();

      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (e) {
          console.error('Playback blocked. User interaction required first.', e);
        }
      }
    }
  };

  // Handle Stop
  const handleStop = () => {
    setIsPlaying(false);
    setCurrentTimeState(0);
    onTimeUpdate(0);

    if (isYtMode) {
      ytPlayerRef.current?.stop();
    } else if (isSynthMode) {
      stopProceduralSynth();
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // HTML5 Audio events
  const onAudioTimeUpdate = () => {
    if (audioRef.current && !isSynthMode) {
      const cur = audioRef.current.currentTime;
      setCurrentTimeState(cur);
      onTimeUpdate(cur);
    }
  };

  const onAudioLoadedMetadata = () => {
    if (audioRef.current && !isSynthMode) {
      setDuration(audioRef.current.duration);
    }
  };

  const onAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTimeState(0);
    onTimeUpdate(0);
  };

  // Scrub bar dragging
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTimeState(time);
    onTimeUpdate(time);
    
    if (isYtMode) {
      ytPlayerRef.current?.seekTo(time);
    } else if (isSynthMode) {
      synthTimeRef.current = time;
      synthStepRef.current = Math.floor(time / 0.18);
    } else if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // -------------------------------------------------------------
  // --- PROCEDURAL 8-BIT SYNTH SEQUENCER ENGINE (WEB AUDIO API) --
  // -------------------------------------------------------------
  const startProceduralSynth = () => {
    initAudioEngine();
    const ctx = audioContextRef.current;
    const analyser = analyserNodeRef.current;
    if (!ctx || !analyser) return;

    synthTimeRef.current = currentTimeState;
    synthStepRef.current = Math.floor(synthTimeRef.current / 0.18);
    
    // Y2K melody sequencer notes: C Major Pentatonic
    // C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
    
    // Fun Y2K techno groove pattern (indexes inside the scale)
    const melodyPattern = [
      0, 2, 4, 7, 5, 7, 9, 7,
      9, 7, 5, 4, 2, 4, 0, 2,
      5, 5, 7, 9, 7, 5, 4, 2,
      0, 0, 4, 4, 7, 7, 9, 9
    ];

    const bassPattern = [
      130.81, 130.81, 196.00, 196.00,
      146.83, 146.83, 220.00, 220.00,
      164.81, 164.81, 246.94, 246.94,
      130.81, 130.81, 196.00, 196.00
    ];

    const stepDuration = 0.18; // 180ms per tick (~333 BPM double time!)

    const playStep = () => {
      const now = ctx.currentTime;
      const step = synthStepRef.current;

      // 1. Play Lead Synth (Square wave for digital NES flavor)
      const melIdx = melodyPattern[step % melodyPattern.length];
      const freq = scale[melIdx];
      
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);
      
      // Pitch slide vibrato for classic chip-tune glide
      if (step % 4 === 0) {
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);
      }

      // Envelopes
      oscGain.gain.setValueAtTime(0.12 * volume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration - 0.02);

      osc.connect(oscGain);
      oscGain.connect(analyser);
      osc.start(now);
      osc.stop(now + stepDuration);

      // 2. Play Sub Bass (Triangle wave for soft, round punch)
      const bassFreq = bassPattern[Math.floor(step / 2) % bassPattern.length];
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();

      bassOsc.type = 'triangle';
      bassOsc.frequency.setValueAtTime(bassFreq, now);
      
      bassGain.gain.setValueAtTime(0.35 * volume, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 2 - 0.02);

      bassOsc.connect(bassGain);
      bassGain.connect(analyser);
      bassOsc.start(now);
      bassOsc.stop(now + stepDuration * 2);

      // 3. Play Percussion (Noise Node for retro Snare/Crash)
      if (step % 2 === 1) {
        // Snare Noise Burst
        const bufferSize = ctx.sampleRate * 0.1; // 100ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1000;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08 * volume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noiseNode.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(analyser);
        
        noiseNode.start(now);
        noiseNode.stop(now + 0.1);
      } else {
        // Kick sweep
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(150, now);
        kickOsc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);

        kickGain.gain.setValueAtTime(0.4 * volume, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        kickOsc.connect(kickGain);
        kickGain.connect(analyser);
        kickOsc.start(now);
        kickOsc.stop(now + 0.1);
      }

      // Step progression
      synthStepRef.current = step + 1;
      synthTimeRef.current = synthStepRef.current * stepDuration;
      
      setCurrentTimeState(synthTimeRef.current);
      onTimeUpdate(synthTimeRef.current);

      if (synthTimeRef.current >= duration) {
        handleStop();
      }
    };

    // Sequencer interval clock
    synthTimerRef.current = window.setInterval(playStep, stepDuration * 1000);
  };

  const stopProceduralSynth = () => {
    if (synthTimerRef.current) {
      clearInterval(synthTimerRef.current);
      synthTimerRef.current = null;
    }
  };

  // -------------------------------------------------------------
  // --- LOCAL FILE UPLOAD TAPE HANDLING -------------------------
  // -------------------------------------------------------------
  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && audioRef.current) {
      handleStop();
      const localUrl = URL.createObjectURL(file);
      
      // Extract file name without extension
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      setCustomSongTitle(`UPLOAD: ${fileName}`);
      
      // Generate Y2K generic synced lyrics so playing local cassettes is immediately unlocked!
      if (onLyricsParsed) {
        onLyricsParsed([
          { time: 0, text: `🎵 [CASSETTE TAPE ACTIVE: ${fileName.toUpperCase()}] 🎵` },
          { time: 3, text: "★ READY TO SING! MIRROR FEED ACTIVE ★" },
          { time: 8, text: "Windows 95 Winamp console loaded," },
          { time: 14, text: "A digital back-row stage is fully coded!" },
          { time: 20, text: "Sing your heart out in front of the screen," },
          { time: 26, text: "The coolest Y2K performance ever seen!" },
          { time: 32, text: "★ KEEP SINGING! MULTI-STAGE EFFECT ACTIVE ★" },
          { time: 60, text: "🎵 [Instrumental Solo - check the audio waveform!] 🎵" },
          { time: 120, text: "★ PERFORMANCE WRAP! SYSTEM COMPILING... ★" }
        ]);
      }
      
      // Update song info in UI
      onSongChange('custom');
      
      // Load and play
      audioRef.current.src = localUrl;
      audioRef.current.load();
      
      // Force trigger permissions to make sure they can see screen
      initAudioEngine();
    }
  };

  // -------------------------------------------------------------
  // --- LIVE YOUTUBE backend STREAMING PIPELINE ----------------
  // -------------------------------------------------------------
  const parseLRC = (textToParse: string): { time: number; text: string }[] => {
    const lines = textToParse.split('\n');
    const parsed: { time: number; text: string }[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (let line of lines) {
      line = line.trim();
      const match = timeRegex.exec(line);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3], 10);
        
        const msFactor = match[3].length === 2 ? 100 : 1000;
        const time = minutes * 60 + seconds + milliseconds / msFactor;
        const text = line.replace(timeRegex, '').trim();

        parsed.push({ time, text });
      }
    }
    return parsed.sort((a, b) => a.time - b.time);
  };

  const handleYtSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ytUrl.trim()) return;

    setYtStatus('loading');
    
    try {
      // 1. Fetch the automated lyrics FIRST before starting audio
      const response = await fetch(`${API_BASE_URL}/api/lyrics?url=${encodeURIComponent(ytUrl)}`);
      if (!response.ok) {
        if (response.status === 404) {
          let errMsg = "We could not find synchronized lyrics for this song in the database.";
          try {
            const errData = await response.json();
            if (errData && errData.error) {
              errMsg = errData.error;
            }
          } catch (e) {}
          alert(`⚠️ LYRICS NOT FOUND!\n\n${errMsg}\n\nPlease try a different YouTube video.`);
          setYtStatus('error');
          return;
        }
        throw new Error('Failed to fetch lyrics from backend API');
      }
      const data = await response.json();

      // 2. Lyrics are ready! Parse and inject them to the teleprompter screen
      if (onLyricsParsed) {
        onLyricsParsed(parseLRC(data.syncedLyrics));
      }

      const resolvedTitle = data.title || (data.parsedMeta && data.parsedMeta.title) || 'YouTube Song';
      const resolvedArtist = data.artist || (data.parsedMeta && data.parsedMeta.artist);
      if (resolvedArtist) {
        setCustomSongTitle(`${resolvedTitle} - ${resolvedArtist}`);
      } else {
        setCustomSongTitle(resolvedTitle);
      }

      // 3. Lyrics are fully set and ready. Now load the embed
      let videoId = '';
      try {
        const urlObj = new URL(ytUrl);
        videoId = urlObj.searchParams.get('v') || '';
        if (!videoId && urlObj.hostname === 'youtu.be') {
          videoId = urlObj.pathname.slice(1);
        }
      } catch (e) {}

      if (!videoId) {
        alert("Could not extract YouTube video ID from URL.");
        setYtStatus('error');
        return;
      }

      if (audioRef.current) {
        handleStop(); // Reset current stream
      }
      
      onSongChange('youtube'); // Flag song selection as youtube
      onYtVideoIdChange(videoId);
      
      setYtStatus('streaming');
    } catch (error) {
      console.error("YouTube streaming handshake failure:", error);
      setYtStatus('error');
      alert(`❌ PIPELINE HANDSHAKE FAILED!\n\nMake sure your Node.js backend is running at ${API_BASE_URL} and yt-dlp is installed, or try a different URL.`);
    }
  };

  // Formatting helper for clock timer
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSongDisplayTitle = () => {
    if (selectedSongId === 'procedural-synth') {
      return `⚡ SEQUENCER: BEEP BOOP 8-BIT SYNTH [WEB AUDIO API SYNTH] ⚡`;
    }
    if (selectedSongId === 'youtube') {
      return `🎶 PLAYING: ${customSongTitle.toUpperCase()} 🎶`;
    }
    if (selectedSongId === 'custom') {
      return `🎶 PLAYING: ${customSongTitle.toUpperCase()} 🎶`;
    }
    const activeDemo = DEMO_SONGS.find((s) => s.id === selectedSongId);
    if (activeDemo) {
      return `🎶 PLAYING: ${activeDemo.title.toUpperCase()} - ${activeDemo.artist.toUpperCase()} 🎶`;
    }
    return `🎶 PLAYING: ${selectedSongId.toUpperCase()} 🎶`;
  };

  return (
    <div className="flex flex-col gap-4 font-mono text-xs select-none">
      {/* Visualizer Canvas or Inline YouTube Player */}
      {isYtMode && !isYtPoppedOut && ytVideoId ? (
        <div className="relative w-full h-[150px] group bg-black border-2 border-white/20 shadow-inner">
          <YouTubePlayer 
            ref={ytPlayerRef}
            videoId={ytVideoId}
            onTimeUpdate={(t) => { setCurrentTimeState(t); onTimeUpdate(t); }}
            onDurationUpdate={onYtDurationChange}
            initialTime={currentTimeState}
          />
          {/* Pop Out overlay */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
            <button onClick={onToggleYtPopOut} className="retro-button text-[9px] px-1 py-0.5 shadow-md">
              ↗ POP OUT TO DESKTOP
            </button>
          </div>
        </div>
      ) : (
        <AudioVisualizer analyser={analyserState} />
      )}

      {/* Winamp Metadata Banner / Scrolling Song Title */}
      <div
        className="bg-black text-[#00ffcc] p-1.5 flex justify-between items-center"
        style={{
          border: '1.5px solid',
          borderColor: '#555555 #ffffff #ffffff #555555',
        }}
      >
        <div className="flex-1 overflow-hidden relative h-4 select-none">
          <div className="winamp-carousel font-black tracking-widest text-[#00ffcc] uppercase flex items-center">
            <span className="winamp-carousel-item">{getSongDisplayTitle()}</span>
            <span className="winamp-carousel-item">{getSongDisplayTitle()}</span>
          </div>
        </div>
        <div className="text-[10px] text-pink-500 font-extrabold bg-[#220022] px-1 ml-2 border border-pink-500 select-none z-10 shrink-0">
          {formatTime(currentTimeState)} / {formatTime(isYtMode && ytDuration ? ytDuration : duration)}
        </div>
      </div>

      {/* Scrub Bar / Timeline */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#ff00ff] font-bold select-none">TRACK</span>
        <input
          type="range"
          min={0}
          max={isYtMode && ytDuration ? ytDuration : (duration || 100)}
          step={0.1}
          value={currentTimeState}
          onChange={handleScrub}
          className="flex-grow h-6 bg-[#dfdfdf] border border-t-neutral-700 border-l-neutral-700 border-r-white border-b-white cursor-pointer accent-magenta-500 outline-none"
          style={{
            WebkitAppearance: 'none',
          }}
        />
      </div>

      {/* Player Action Buttons Winamp Deck */}
      <div className="flex flex-wrap justify-between items-center gap-1.5 p-1 bg-[#b5b5b5] border border-white">
        <div className="flex gap-1.5">
          <button
            onClick={handlePlayPause}
            className="retro-button flex items-center justify-center gap-1 min-w-[70px]"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={10} className="fill-black" /> : <Play size={10} className="fill-black" />}
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            onClick={handleStop}
            className="retro-button flex items-center justify-center gap-1"
            title="Stop"
          >
            <Square size={10} className="fill-black" />
            STOP
          </button>
        </div>

        {/* Volume controls */}
        <div className="flex items-center gap-1.5">
          <Volume2 size={12} className="text-neutral-700" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 h-4 bg-[#808080] outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Phase Canceling vocal remover toggle box */}
      <div
        className="p-3 bg-[#c0c0c0] flex flex-col gap-2 rounded"
        style={{
          border: '1.5px solid',
          borderColor: '#555555 #ffffff #ffffff #555555',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col text-left">
            <span className="font-extrabold text-[#00ffcc] tracking-widest drop-shadow-[0_0_2px_#00ffcc] text-sm">
              VOCAL CANCEL RACK
            </span>
            <span className="text-[9px] text-[#555] font-semibold">
              $L - R$ Phase cancellation node matrix
            </span>
          </div>

          {/* Flashy Neon Toggle Switch */}
          <button
            onClick={() => setVocalRemover(!vocalRemover)}
            className={`px-3 py-1 font-mono font-black text-[10px] select-none border-2 transition-all ${
              vocalRemover
                ? 'bg-[#ff00ff] text-white border-t-[#555] border-l-[#555] border-r-white border-b-white animate-pulse shadow-[0_0_8px_#ff00ff]'
                : 'bg-black text-[#888] border-t-[#555] border-l-[#555] border-r-white border-b-white'
            }`}
          >
            VOCAL REMOVER: {vocalRemover ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {vocalRemover && !isYtMode && (
          <div className="text-[10px] text-pink-600 bg-pink-100 p-1.5 font-bold text-left border border-pink-300">
            ⚠️ NOTICE: Lead vocals in stereo mix are inverted & canceled. Sub-bass and stereo reverbs remain. Works best on stereo audio uploads!
          </div>
        )}
        {isYtMode && (
          <div className="text-[10px] text-neutral-500 bg-neutral-200 p-1.5 font-bold text-left border border-neutral-400">
            ⚠️ UNAVAILABLE: Web Audio API cannot process cross-origin iframe audio. Works with local file uploads.
          </div>
        )}
      </div>

      {/* Media Input Tabs System */}
      <div className="flex flex-col mt-2">
        {/* Tab Headers */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 font-bold border-b-0 border border-t-white border-l-white border-r-[#404040] ${
              activeTab === 'upload'
                ? 'bg-[#c0c0c0] text-black border-r-[#404040] border-b-0 z-10'
                : 'bg-[#a0a0a0] text-[#444] border-b-white shadow-inner opacity-75'
            }`}
          >
            📁 LOCAL UPLOAD
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-1.5 font-bold border-b-0 border border-t-white border-l-white border-r-[#404040] ${
              activeTab === 'youtube'
                ? 'bg-[#c0c0c0] text-black border-r-[#404040] border-b-0 z-10'
                : 'bg-[#a0a0a0] text-[#444] border-b-white shadow-inner opacity-75'
            }`}
          >
            🌐 YT STREAMER
          </button>
        </div>

        {/* Tab Contents Frame */}
        <div
          className="p-3 bg-[#c0c0c0]"
          style={{
            border: '1.5px solid',
            borderColor: '#ffffff #555555 #555555 #ffffff',
            marginTop: '-1px', // overlap borders
          }}
        >
          {activeTab === 'upload' && (
            <div className="flex flex-col gap-2 items-center font-mono">
              <span className="text-[10px] text-[#444] font-bold text-left self-start">UPLOAD RETRO CASSETTE TAPE:</span>
              <label
                className="w-full flex items-center justify-center gap-2 p-2 bg-[#dfdfdf] hover:bg-[#efefef] active:bg-[#c0c0c0] text-black font-bold border border-t-white border-l-white border-r-[#404040] border-b-[#404040] cursor-pointer"
                style={{
                  boxShadow: '1px 1px 0px #000',
                }}
              >
                <Upload size={12} />
                <span>INJECT MP3/WAV FILE</span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleLocalUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[9px] text-neutral-600">Audio stays entirely local. We generate a local blob URL.</span>
            </div>
          )}

          {activeTab === 'youtube' && (
            <form onSubmit={handleYtSubmit} className="flex flex-col gap-2">
              <span className="text-[10px] text-[#444] font-bold text-left">YT RETRIEVAL PIPELINE:</span>
              <div className="flex gap-1.5">
                <div
                  className="flex-grow bg-black p-1"
                  style={{
                    border: '1.5px solid',
                    borderColor: '#555555 #ffffff #ffffff #555555',
                  }}
                >
                  <input
                    type="url"
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-black text-[#00ffcc] font-mono focus:outline-none border-none text-[10px]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={ytStatus === 'loading'}
                  className="retro-button flex items-center gap-1.5 shrink-0"
                >
                  {ytStatus === 'loading' ? (
                    <RefreshCw size={10} className="animate-spin" />
                  ) : (
                    <Globe size={10} />
                  )}
                  <span>{ytStatus === 'loading' ? 'FETCHING...' : 'STREAM'}</span>
                </button>
              </div>
              <span className="text-[8px] text-neutral-500 text-left">
                * Note: Video and audio will play in the YouTube Stage window.
              </span>
            </form>
          )}
        </div>
      </div>

      {/* Hidden standard Audio Tag */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onTimeUpdate={onAudioTimeUpdate}
        onLoadedMetadata={onAudioLoadedMetadata}
        onEnded={onAudioEnded}
        className="hidden"
      />
    </div>
  );
};
