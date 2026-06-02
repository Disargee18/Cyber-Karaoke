import { useState, useEffect, useRef } from 'react';
import { WebcamBg } from './components/WebcamBg';
import { RetroWindow } from './components/RetroWindow';
import { MediaCenter } from './components/MediaCenter';
import { DEMO_SONGS } from './components/LrcEditor';
import { CyberTutorial } from './components/CyberTutorial';
import { LyricsDisplay } from './components/LyricsDisplay';
import { Music, FileText, Video, Radio, Tv, MonitorPlay, BookOpen } from 'lucide-react';

interface LyricLine {
  time: number;
  text: string;
}

function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const desktopRef = useRef<HTMLDivElement | null>(null);
  
  // Audio Playback state
  const [selectedSongId, setSelectedSongId] = useState('awesome-sauce');
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [customSongTitle, setCustomSongTitle] = useState('CUSTOM UPLOAD');
  const [filter, setFilter] = useState<'none' | 'vaporwave' | 'matrix' | 'crt-glitch' | 'sepia'>('crt-glitch');
  const [isMirrored, setIsMirrored] = useState(true);

  // Window State Manager (Position, Open/Closed, Minimized)
  const [windows, setWindows] = useState({
    mediaPlayer: { isOpen: true, isMinimized: false, title: 'Winamp Media Rack', defaultX: 20, defaultY: 20 },
    lyrics: { isOpen: true, isMinimized: false, title: 'Karaoke Lyrics Stage', defaultX: 375, defaultY: 20 },
    lrcEditor: { isOpen: false, isMinimized: false, title: 'Cyber Stage Help Book', defaultX: 800, defaultY: 375 },
    webcamStage: { isOpen: true, isMinimized: false, title: 'Cyber Camera Monitor', defaultX: 800, defaultY: 20 },
  });

  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [systemTime, setSystemTime] = useState('');

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const mins = date.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      setSystemTime(`${hours}:${mins} ${ampm}`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Request permissions
  const handleRequestPermissions = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (audioErr) {
        console.warn('Microphone permission check failed. Falling back to camera-only initialization:', audioErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      // Turn off stream immediately, WebcamBg will reopen it when permission is true
      stream.getTracks().forEach((t) => t.stop());
      setHasPermission(true);
    } catch (e) {
      console.warn('Media devices permission denied or not available:', e);
      setHasPermission(false);
    }
  };

  // BIOS Boot button trigger
  const handleBootStage = async () => {
    setIsBooted(true);
    await handleRequestPermissions();
    
    // Play startup chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      
      // Swell pads
      const freqs = [130.81, 164.81, 196.00, 261.63, 329.63, 392.00]; // C major lush chord
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.12, now);
      master.connect(ctx.destination);
      
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.04, now + 0.8 + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + 3.5);
      });
      
      // High bell chime notes: E5 -> G5 -> C6 -> E6
      const bells = [659.25, 783.99, 1046.50, 1318.51];
      bells.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = f;
        const delay = 0.6 + i * 0.15;
        g.gain.setValueAtTime(0, now);
        g.gain.setValueAtTime(0.06, now + delay);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.0);
        osc.connect(g);
        g.connect(master);
        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch (e) {
      console.warn('Chime audio blocked:', e);
    }
  };

  const toggleWindow = (winKey: keyof typeof windows) => {
    setWindows((prev) => ({
      ...prev,
      [winKey]: {
        ...prev[winKey],
        isOpen: !prev[winKey].isOpen,
        isMinimized: false,
      },
    }));
  };

  const minimizeWindow = (winKey: keyof typeof windows) => {
    setWindows((prev) => ({
      ...prev,
      [winKey]: {
        ...prev[winKey],
        isMinimized: !prev[winKey].isMinimized,
      },
    }));
  };

  const resetWindowLayout = () => {
    setWindows({
      mediaPlayer: { isOpen: true, isMinimized: false, title: 'Winamp Media Rack', defaultX: 20, defaultY: 20 },
      lyrics: { isOpen: true, isMinimized: false, title: 'Karaoke Lyrics Stage', defaultX: 375, defaultY: 20 },
      lrcEditor: { isOpen: false, isMinimized: false, title: 'Cyber Stage Help Book', defaultX: 800, defaultY: 375 },
      webcamStage: { isOpen: true, isMinimized: false, title: 'Cyber Camera Monitor', defaultX: 800, defaultY: 20 },
    });
    setStartMenuOpen(false);
  };

  if (!isBooted) {
    return (
      <div
        className="w-full h-full font-mono flex flex-col items-center justify-center p-4 select-none bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bliss.jpg')",
        }}
      >
        {/* Centered retro Windows 95 setup dialog box */}
        <div
          className="w-full max-w-md retro-window flex flex-col font-mono select-none"
          style={{
            background: '#c0c0c0',
            border: '3px solid',
            borderColor: '#ffffff #555555 #555555 #ffffff',
            boxShadow: '2px 2px 10px rgba(0,0,0,0.5), inset 1px 1px 0px #ffffff, inset -1px -1px 0px #888888',
            padding: '2px',
          }}
        >
          {/* Title Bar */}
          <div
            className="flex items-center justify-between p-1 bg-gradient-to-r from-[#000080] to-[#1084d0] text-white"
            style={{
              fontFamily: "'MS Sans Serif', Tahoma, Arial, sans-serif",
            }}
          >
            <div className="flex items-center gap-1.5 px-1 font-bold text-sm tracking-wide">
              <MonitorPlay size={14} className="text-yellow-300 animate-pulse" />
              <span>Cyber Karaoke Setup</span>
            </div>
            <div className="flex items-center gap-1">
              <button disabled className="w-5 h-5 flex items-center justify-center bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-black font-extrabold text-[9px] opacity-60 cursor-not-allowed">_</button>
              <button disabled className="w-5 h-5 flex items-center justify-center bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-black font-extrabold text-[9px] opacity-60 cursor-not-allowed">X</button>
            </div>
          </div>

          {/* Setup Window Client Area */}
          <div
            className="p-4 m-1 bg-[#c0c0c0] flex flex-col gap-4"
            style={{
              border: '1.5px solid',
              borderColor: '#555555 #ffffff #ffffff #555555',
            }}
          >
            {/* Header Banner */}
            <div className="flex gap-4 items-start border-b border-[#808080] pb-4">
              <div className="p-3 bg-gradient-to-tr from-pink-500 via-[#00ffcc] to-yellow-300 rounded border border-white shrink-0 shadow-md">
                <Music size={32} className="text-black animate-bounce" />
              </div>
              <div className="flex flex-col text-left">
                <h2 className="text-lg font-black tracking-widest text-[#000080] uppercase">
                  Cyber Karaoke
                </h2>
                <span className="text-[10px] text-neutral-600 font-bold">
                  System Stage Wizard v1.0
                </span>
              </div>
            </div>

            {/* Description Text */}
            <div className="text-left text-xs text-black flex flex-col gap-3">
              <p className="font-bold">
                Welcome to the Cyber Karaoke interactive stage setup!
              </p>
              <p className="text-[11px] text-neutral-700 leading-tight">
                This utility will initialize your digital video mirror, calibrate Web Audio channel splitters, and load real-time phase cancel filters.
              </p>

              {/* Username Input box */}
              <div className="flex flex-col gap-1 mt-1">
                <span className="font-bold text-[10px] text-neutral-800">SINGER HANDLE / CALLSIGN:</span>
                <div
                  className="bg-black p-1"
                  style={{
                    border: '1.5px solid',
                    borderColor: '#555555 #ffffff #ffffff #555555',
                  }}
                >
                  <input
                    type="text"
                    defaultValue="CYBER_SINGER_95"
                    className="w-full bg-black text-[#00ffcc] font-mono focus:outline-none border-none text-xs font-bold uppercase tracking-wider p-0.5"
                    style={{ caretColor: '#00ffcc' }}
                  />
                </div>
              </div>

              {/* Simulated checks */}
              <div className="flex flex-col gap-1.5 mt-2 text-[10px] text-neutral-800 font-bold">
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked disabled className="accent-neutral-700" />
                  <span>Configure Web Audio Splitter (Mono/Stereo)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input type="checkbox" defaultChecked disabled className="accent-neutral-700" />
                  <span>Inject High-Energy Y2K Overlays & Stickers</span>
                </div>
              </div>
            </div>

            {/* Form Buttons Footer */}
            <div className="flex justify-end gap-2 border-t border-[#808080] pt-3 mt-2">
              <button
                onClick={() => alert("Cancellation is not allowed! The retro cyber stage demands a singer!")}
                className="retro-button px-4 py-1"
              >
                Cancel
              </button>
              <button
                onClick={handleBootStage}
                className="retro-button px-4 py-1 flex items-center justify-center gap-1 bg-[#c0c0c0] text-black font-bold border-2 border-t-white border-l-white border-r-neutral-800 border-b-neutral-800 hover:bg-[#dfdfdf] active:bg-[#a0a0a0]"
                style={{
                  boxShadow: '1px 1px 0px #000',
                }}
              >
                <span>Boot Stage &gt;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden text-black font-sans select-none">
      
      {/* Draggable Desktop Area */}
      <div 
        ref={desktopRef}
        className="w-full h-[calc(100%-40px)] relative overflow-hidden select-none bg-cover bg-center bg-no-repeat"
        style={{
          transform: isMirrored ? 'none' : 'scaleX(-1)',
          backgroundImage: "url('/bliss.jpg')",
        }}
      >
        {/* Windows 95 Desktop Icons for closed windows */}
        <div className="absolute top-4 right-4 flex flex-col gap-4 z-10 text-white font-mono text-center select-none">
          {!windows.webcamStage.isOpen && (
            <button
              onClick={() => toggleWindow('webcamStage')}
              className="flex flex-col items-center gap-1 group w-20 cursor-pointer"
            >
              <div className="w-12 h-12 bg-[#c0c0c0]/10 hover:bg-[#c0c0c0]/30 active:scale-95 transition-all rounded flex items-center justify-center border border-white/20 shadow-lg p-2.5">
                <Video size={28} className="text-[#ff00ff] drop-shadow-[0_0_4px_#ff00ff]" />
              </div>
              <span className="text-[10px] font-bold text-shadow-[1px_1px_2px_#000000] truncate max-w-full">
                Video Stage
              </span>
            </button>
          )}

          {!windows.mediaPlayer.isOpen && (
            <button
              onClick={() => toggleWindow('mediaPlayer')}
              className="flex flex-col items-center gap-1 group w-20 cursor-pointer"
            >
              <div className="w-12 h-12 bg-[#c0c0c0]/10 hover:bg-[#c0c0c0]/30 active:scale-95 transition-all rounded flex items-center justify-center border border-white/20 shadow-lg p-2.5">
                <Music size={28} className="text-[#00ffcc] drop-shadow-[0_0_4px_#00ffcc]" />
              </div>
              <span className="text-[10px] font-bold text-shadow-[1px_1px_2px_#000000] truncate max-w-full">
                Winamp Rack
              </span>
            </button>
          )}

          {!windows.lyrics.isOpen && (
            <button
              onClick={() => toggleWindow('lyrics')}
              className="flex flex-col items-center gap-1 group w-20 cursor-pointer"
            >
              <div className="w-12 h-12 bg-[#c0c0c0]/10 hover:bg-[#c0c0c0]/30 active:scale-95 transition-all rounded flex items-center justify-center border border-white/20 shadow-lg p-2.5">
                <Radio size={28} className="text-yellow-400 drop-shadow-[0_0_4px_#ffff00]" />
              </div>
              <span className="text-[10px] font-bold text-shadow-[1px_1px_2px_#000000] truncate max-w-full">
                Karaoke Stage
              </span>
            </button>
          )}

          {!windows.lrcEditor.isOpen && (
            <button
              onClick={() => toggleWindow('lrcEditor')}
              className="flex flex-col items-center gap-1 group w-20 cursor-pointer"
            >
              <div className="w-12 h-12 bg-[#c0c0c0]/10 hover:bg-[#c0c0c0]/30 active:scale-95 transition-all rounded flex items-center justify-center border border-white/20 shadow-lg p-2.5">
                <BookOpen size={28} className="text-[#ff00ff] drop-shadow-[0_0_4px_#ff00ff]" />
              </div>
              <span className="text-[10px] font-bold text-shadow-[1px_1px_2px_#000000] truncate max-w-full">
                Help Book
              </span>
            </button>
          )}
        </div>

        {/* DRAGGABLE RETRO WINDOW 1: WINAMP MEDIA PLAYER */}
        {windows.mediaPlayer.isOpen && (
          <RetroWindow
            title={
              selectedSongId === 'procedural-synth'
                ? 'Winamp - BEEP BOOP 8-BIT SYNTH'
                : selectedSongId === 'custom'
                ? `Winamp - ${customSongTitle}`
                : (() => {
                    const demo = DEMO_SONGS.find((s) => s.id === selectedSongId);
                    return demo ? `Winamp - ${demo.title}` : windows.mediaPlayer.title;
                  })()
            }
            onClose={() => toggleWindow('mediaPlayer')}
            onMinimize={() => minimizeWindow('mediaPlayer')}
            isMinimized={windows.mediaPlayer.isMinimized}
            defaultX={windows.mediaPlayer.defaultX}
            defaultY={windows.mediaPlayer.defaultY}
            widthClass="w-full max-w-[340px] sm:w-[340px]"
            icon={<Music size={14} />}
            dragConstraints={desktopRef}
          >
            <MediaCenter
              selectedSongId={selectedSongId}
              onSongChange={setSelectedSongId}
              onTimeUpdate={setCurrentTime}
              onLyricsParsed={setLyrics}
              lyrics={lyrics}
              customSongTitle={customSongTitle}
              setCustomSongTitle={setCustomSongTitle}
            />
          </RetroWindow>
        )}

        {/* DRAGGABLE RETRO WINDOW 2: LYRICS TELEPROMPTER SCREEN */}
        {windows.lyrics.isOpen && (
          <RetroWindow
            title={windows.lyrics.title}
            onClose={() => toggleWindow('lyrics')}
            onMinimize={() => minimizeWindow('lyrics')}
            isMinimized={windows.lyrics.isMinimized}
            defaultX={windows.lyrics.defaultX}
            defaultY={windows.lyrics.defaultY}
            widthClass="w-full max-w-[410px] sm:w-[410px]"
            icon={<Radio size={14} />}
            isResizable={true}
            defaultWidth={410}
            defaultHeight={560}
            dragConstraints={desktopRef}
          >
            <LyricsDisplay
              lyrics={lyrics}
              currentTime={currentTime}
              songTitle={
                selectedSongId === 'procedural-synth'
                  ? 'BEEP BOOP 8-BIT SYNTH [WEB AUDIO API SYNTH]'
                  : selectedSongId === 'custom'
                  ? customSongTitle.toUpperCase()
                  : (() => {
                      const demo = DEMO_SONGS.find((s) => s.id === selectedSongId);
                      return demo ? `${demo.title.toUpperCase()} [BY ${demo.artist.toUpperCase()}]` : 'KARAOKE TAPE';
                    })()
              }
            />
          </RetroWindow>
        )}

        {/* DRAGGABLE RETRO WINDOW 3: CYBER HELP READ ME BOOK */}
        {windows.lrcEditor.isOpen && (
          <RetroWindow
            title={windows.lrcEditor.title}
            onClose={() => toggleWindow('lrcEditor')}
            onMinimize={() => minimizeWindow('lrcEditor')}
            isMinimized={windows.lrcEditor.isMinimized}
            defaultX={windows.lrcEditor.defaultX}
            defaultY={windows.lrcEditor.defaultY}
            widthClass="w-full max-w-[340px] sm:w-[340px]"
            icon={<BookOpen size={14} />}
            dragConstraints={desktopRef}
          >
            <CyberTutorial />
          </RetroWindow>
        )}

        {/* DRAGGABLE RETRO WINDOW 5: CYBER CAM MONITOR */}
        {windows.webcamStage.isOpen && (
          <RetroWindow
            title={windows.webcamStage.title}
            onClose={() => toggleWindow('webcamStage')}
            onMinimize={() => minimizeWindow('webcamStage')}
            isMinimized={windows.webcamStage.isMinimized}
            defaultX={windows.webcamStage.defaultX}
            defaultY={windows.webcamStage.defaultY}
            widthClass="w-full max-w-[440px] sm:w-[440px]"
            icon={<Video size={14} />}
            isResizable={true}
            defaultWidth={440}
            defaultHeight={340}
            dragConstraints={desktopRef}
          >
            <WebcamBg
              filter={filter}
              onRequestPermissions={handleRequestPermissions}
              hasPermission={hasPermission}
            />

            {/* Retro VHS Camera Filter Bezel Controller Strip */}
            <div className="mt-2 pt-2 border-t border-neutral-400 flex flex-col gap-1 text-[10px] text-neutral-800 font-bold select-none text-left">
              <span className="text-neutral-700 tracking-wider">VHS CAMERA FILTER:</span>
              <div className="grid grid-cols-5 gap-0.5 bg-black p-0.5 border border-white">
                {(['none', 'vaporwave', 'matrix', 'crt-glitch', 'sepia'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`py-1 text-[9px] font-black border uppercase tracking-tighter cursor-pointer ${
                      filter === f
                        ? 'bg-yellow-400 text-black border-yellow-200 shadow-inner'
                        : 'bg-[#c0c0c0] hover:bg-[#dfdfdf] text-black border-t-white border-l-white border-r-[#555] border-b-[#555]'
                    }`}
                  >
                    {f === 'none' ? 'NORMAL' : f.replace('-glitch', '').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </RetroWindow>
        )}
      </div>

      {/* WINDOWS 95 SYSTEM TASKBAR */}
      <div
        className="fixed bottom-0 left-0 w-full h-10 bg-[#c0c0c0] flex items-center justify-between px-1 z-50 shadow-inner select-none font-mono"
        style={{
          borderTop: '2px solid #ffffff',
          boxShadow: '0 -1px 0px #000',
        }}
      >
        {/* Start Button & Active Trays */}
        <div className="flex items-center gap-1.5 h-full relative">
          <button
            onClick={() => setStartMenuOpen(!startMenuOpen)}
            className={`h-7 px-2 font-black select-none text-xs flex items-center gap-1.5 border border-t-white border-l-white border-r-[#404040] border-b-[#404040] ${
              startMenuOpen
                ? 'bg-[#a0a0a0] border-t-[#404040] border-l-[#404040] border-r-white border-b-white shadow-inner'
                : 'bg-[#c0c0c0] hover:bg-[#dfdfdf]'
            }`}
            style={{
              boxShadow: startMenuOpen ? 'none' : '1px 1px 0px #000',
            }}
          >
            <div className="w-4 h-4 bg-gradient-to-tr from-pink-500 via-[#00ffcc] to-yellow-300 rounded-sm flex items-center justify-center text-[10px] text-black font-black">
              ★
            </div>
            <span>START</span>
          </button>

          {/* Tray divider line */}
          <div className="w-[1.5px] h-6 bg-neutral-600 border-r border-white self-center mx-1" />

          {/* Window Taskbar tray items */}
          <div className="hidden sm:flex items-center gap-1 h-full select-none text-[10px]">
            {/* MediaPlayer Task */}
            {windows.mediaPlayer.isOpen && (
              <button
                onClick={() => minimizeWindow('mediaPlayer')}
                className={`h-7 px-2 font-bold max-w-[110px] truncate border border-t-white border-l-white border-r-[#404040] border-b-[#404040] flex items-center gap-1 ${
                  windows.mediaPlayer.isMinimized
                    ? 'bg-[#a0a0a0] border-t-neutral-800 border-l-neutral-800 border-r-white border-b-white'
                    : 'bg-[#dfdfdf]'
                }`}
              >
                <Music size={10} className="text-[#00ffcc] drop-shadow-[0_0_1px_#00ffcc]" />
                <span>Winamp Rack</span>
              </button>
            )}

            {/* Lyrics Task */}
            {windows.lyrics.isOpen && (
              <button
                onClick={() => minimizeWindow('lyrics')}
                className={`h-7 px-2 font-bold max-w-[110px] truncate border border-t-white border-l-white border-r-[#404040] border-b-[#404040] flex items-center gap-1 ${
                  windows.lyrics.isMinimized
                    ? 'bg-[#a0a0a0] border-t-neutral-800 border-l-neutral-800 border-r-white border-b-white'
                    : 'bg-[#dfdfdf]'
                }`}
              >
                <Radio size={10} className="text-yellow-500" />
                <span>Lyrics Stage</span>
              </button>
            )}

            {/* Help Book Task */}
            {windows.lrcEditor.isOpen && (
              <button
                onClick={() => minimizeWindow('lrcEditor')}
                className={`h-7 px-2 font-bold max-w-[110px] truncate border border-t-white border-l-white border-r-[#404040] border-b-[#404040] flex items-center gap-1 ${
                  windows.lrcEditor.isMinimized
                    ? 'bg-[#a0a0a0] border-t-neutral-800 border-l-neutral-800 border-r-white border-b-white'
                    : 'bg-[#dfdfdf]'
                }`}
              >
                <BookOpen size={10} className="text-pink-500" />
                <span>Help Book</span>
              </button>
            )}



            {/* Webcam Stage Task */}
            {windows.webcamStage.isOpen && (
              <button
                onClick={() => minimizeWindow('webcamStage')}
                className={`h-7 px-2 font-bold max-w-[110px] truncate border border-t-white border-l-white border-r-[#404040] border-b-[#404040] flex items-center gap-1 ${
                  windows.webcamStage.isMinimized
                    ? 'bg-[#a0a0a0] border-t-neutral-800 border-l-neutral-800 border-r-white border-b-white'
                    : 'bg-[#dfdfdf]'
                }`}
              >
                <Video size={10} className="text-[#ff00ff]" />
                <span>Webcam Stage</span>
              </button>
            )}
          </div>
        </div>

        {/* System Clock Tray (Right side) */}
        <div
          className="h-7 px-2 bg-[#c0c0c0] flex items-center gap-1.5 text-xs font-bold"
          style={{
            border: '1.5px solid',
            borderColor: '#555555 #ffffff #ffffff #555555',
          }}
        >
          <Tv size={12} className="stroke-[2] text-[#ff00ff] animate-[pulse_1s_infinite]" />
          <span>{systemTime}</span>
        </div>

        {/* WINDOWS 95 START MENU POP-UP */}
        {startMenuOpen && (
          <div
            className="absolute bottom-10 left-1 w-52 bg-[#c0c0c0] z-50 p-1 flex flex-col gap-0.5 border-2"
            style={{
              borderColor: '#ffffff #555555 #555555 #ffffff',
              boxShadow: '2px 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {/* Start Menu Sidebar logo graphic */}
            <div className="flex border-b border-neutral-400 pb-1">
              <div className="bg-gradient-to-b from-[#000080] to-[#1084d0] text-white px-2 py-1 select-none flex flex-col justify-end font-black italic tracking-widest text-[9px] w-8 h-28">
                <span className="origin-bottom-left -rotate-90 translate-x-[4px] -translate-y-[4px] whitespace-nowrap">
                  Y2K STAGE
                </span>
              </div>
              <div className="flex-1 flex flex-col pl-1.5 justify-around font-mono text-[9px] select-none">
                <button
                  onClick={resetWindowLayout}
                  className="w-full text-left py-1 px-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-1 cursor-pointer font-bold text-neutral-800"
                >
                  <MonitorPlay size={10} />
                  RESET DESKTOP
                </button>
                <button
                  onClick={() => {
                    setIsMirrored(!isMirrored);
                    setStartMenuOpen(false);
                  }}
                  className="w-full text-left py-1 px-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-1 cursor-pointer font-bold text-neutral-800"
                >
                  <Video size={10} />
                  {isMirrored ? 'NORMAL CAMERA' : 'MIRROR CAMERA'}
                </button>
                <button
                  onClick={() => {
                    setWindows({
                      mediaPlayer: { isOpen: true, isMinimized: false, title: 'Winamp Media Rack', defaultX: 20, defaultY: 20 },
                      lyrics: { isOpen: true, isMinimized: false, title: 'Karaoke Lyrics Stage', defaultX: 375, defaultY: 20 },
                      lrcEditor: { isOpen: true, isMinimized: false, title: 'Cyber Stage Help Book', defaultX: 800, defaultY: 375 },
                      webcamStage: { isOpen: true, isMinimized: false, title: 'Cyber Camera Monitor', defaultX: 800, defaultY: 20 },
                    });
                    setStartMenuOpen(false);
                  }}
                  className="w-full text-left py-1 px-1.5 hover:bg-[#000080] hover:text-white flex items-center gap-1 cursor-pointer font-bold text-neutral-800"
                >
                  <MonitorPlay size={10} />
                  OPEN ALL WINDOWS
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
