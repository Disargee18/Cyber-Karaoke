import React, { useState } from 'react';
import { BookOpen, Music, Video, Radio, MonitorPlay, HelpCircle } from 'lucide-react';

export const CyberTutorial: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'welcome' | 'winamp' | 'lyrics' | 'webcam' | 'desktop'>('welcome');

  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none h-full flex-1">
      {/* Help Tab Headers */}
      <div className="flex flex-wrap shrink-0 border-b border-neutral-400 pb-[1px]">
        {(['welcome', 'winamp', 'lyrics', 'webcam', 'desktop'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-2 py-1 font-bold border border-b-0 border-t-white border-l-white border-r-[#404040] select-none text-[9px] uppercase tracking-tighter cursor-pointer ${
              activeTab === tab
                ? 'bg-[#dfdfdf] text-black border-r-[#404040] border-b-[#dfdfdf] z-10 font-black'
                : 'bg-[#c0c0c0] hover:bg-[#efefef] text-neutral-600 active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white opacity-85'
            }`}
            style={{
              boxShadow: activeTab === tab ? 'none' : '1px 1px 0px #000',
              marginBottom: activeTab === tab ? '-1px' : '0px',
            }}
          >
            {tab === 'welcome' && '📖 INTRO'}
            {tab === 'winamp' && '🎛️ MEDIA'}
            {tab === 'lyrics' && '🎤 LYRICS'}
            {tab === 'webcam' && '📹 CAMERA'}
            {tab === 'desktop' && '🖥️ DESKTOP'}
          </button>
        ))}
      </div>

      {/* Help Document Body Area */}
      <div
        className="flex-grow flex-1 p-3 bg-white text-black overflow-y-auto text-left relative flex flex-col gap-3"
        style={{
          border: '2px solid',
          borderColor: '#555555 #ffffff #ffffff #555555',
          boxShadow: 'inset 1px 1px 2px #000000',
        }}
      >
        {/* Book Spine Overlay decoration */}
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-neutral-200 border-r border-neutral-400 opacity-50 pointer-events-none" />

        {activeTab === 'welcome' && (
          <div className="pl-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 pb-1.5">
              <BookOpen className="text-pink-600" size={16} />
              <h3 className="font-bold text-[#000080] uppercase tracking-wider text-xs">
                Y2K Stage Welcome Guide
              </h3>
            </div>
            <p className="text-[10px] text-neutral-700 leading-tight">
              Welcome to the **Cyber Karaoke Web Stage**! This interactive application simulates a late 90s Y2K desktop environment designed to let you perform with live audio processing and camera effects.
            </p>
            <div className="bg-yellow-100 p-2 border border-yellow-300 rounded text-[10px] text-yellow-900 leading-normal flex gap-1.5 items-start mt-1">
              <HelpCircle size={14} className="shrink-0 text-yellow-700 mt-0.5" />
              <span>
                <strong>GETTING STARTED:</strong> Pick one of the tab items above to learn how to manipulate audio tracks, synchronize lyrics, apply VHS camera filters, or master the retro OS controls!
              </span>
            </div>
            <div className="mt-2 text-[9px] text-neutral-500 font-bold border-t border-neutral-200 pt-2">
              System Stage Guide v1.0 • Built on Web Audio & Pointer APIs
            </div>
          </div>
        )}

        {activeTab === 'winamp' && (
          <div className="pl-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 pb-1.5">
              <Music className="text-cyan-600" size={16} />
              <h3 className="font-bold text-[#000080] uppercase tracking-wider text-xs">
                Winamp Media & Vocals
              </h3>
            </div>
            
            <div className="flex flex-col gap-2 text-[10px] text-neutral-800 leading-tight">
              <div>
                <strong className="text-neutral-900">📁 LOCAL CASSETTE INJECTION:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Select the **📁 LOCAL UPLOAD** tab in the Winamp Rack, click the button, and choose any MP3 or WAV audio track from your disk. All processing is processed 100% locally on your computer!
                </p>
              </div>

              <div>
                <strong className="text-neutral-900">🌐 YT STREAMING PIPELINE:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Select the **🌐 YT STREAMER** tab, paste a valid YouTube watch URL, and click Stream. Our Node.js backend retrieves the audio and automatically attempts to fetch synchronized synced `.lrc` lyrics!
                </p>
              </div>

              <div>
                <strong className="text-neutral-900">🎚️ VOCAL CANCEL MATRIX ($L - R$):</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Toggle the **VOCAL REMOVER** switch. The audio engine immediately splits the stereo stream, inverts the right channel's phase, and subtracts it from the left. This cancels out any audio panned directly to the center (typically the lead vocals), creating an instant karaoke backing track!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lyrics' && (
          <div className="pl-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 pb-1.5">
              <Radio className="text-purple-600" size={16} />
              <h3 className="font-bold text-[#000080] uppercase tracking-wider text-xs">
                Karaoke Lyrics Teleprompter
              </h3>
            </div>

            <div className="flex flex-col gap-2 text-[10px] text-neutral-800 leading-tight">
              <div>
                <strong className="text-neutral-900">🎵 LYRICS PLAYBACK LOCK:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  To prevent off-key humming, audio playback is locked by default unless valid synced lyrics are loaded or retrieved. Clearing lyrics will automatically pause the music.
                </p>
              </div>

              <div>
                <strong className="text-neutral-900">🔄 ACTIVE CENTERING & SCROLL:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  As the track plays, the teleprompter highlights active lyrics in glowing neon colors and automatically centers the active line smoothly within the viewport.
                </p>
              </div>

              <div>
                <strong className="text-neutral-900">🔎 TEXT SCALING (BIGGER OR TALLER):</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Enlarge or shrink the text using the interactive **`[A-]`** and **`[A+]`** buttons located directly in the teleprompter's header bar, stretching font sizes up to **`48px`**!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'webcam' && (
          <div className="pl-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 pb-1.5">
              <Video className="text-pink-600" size={16} />
              <h3 className="font-bold text-[#000080] uppercase tracking-wider text-xs">
                Cyber Camera & VHS FX
              </h3>
            </div>

            <div className="flex flex-col gap-2 text-[10px] text-neutral-800 leading-tight">
              <div>
                <strong className="text-neutral-900">📹 LIVE performance SCREEN:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  The **Cyber Camera Monitor** mirrors your web camera feed in real-time, functioning as a virtual mirror so you can watch yourself perform.
                </p>
              </div>

              <div>
                <strong className="text-neutral-900">📼 RETRO VHS FILTERS:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Use the bezel control buttons underneath the video screen to swap live styling filters instantly, including **VAPORWAVE**, **MATRIX** green rain, **CRT GLITCH**, and warm nostalgia **SEPIA**!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'desktop' && (
          <div className="pl-2 flex flex-col gap-2">
            <div className="flex items-center gap-2 border-b border-dashed border-neutral-300 pb-1.5">
              <MonitorPlay className="text-blue-600" size={16} />
              <h3 className="font-bold text-[#000080] uppercase tracking-wider text-xs">
                OS Desktop Environment
              </h3>
            </div>

            <div className="flex flex-col gap-2 text-[10px] text-neutral-800 leading-tight">
              <div>
                <strong className="text-neutral-900">🖱️ WINDOW DRAGGING & RESIZING:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Drag any window by its blue title bar to reposition it. Grab the classic diagonal resize gripper at the bottom right corner of the resizable windows to expand or shrink them in width and height.
                </p>
              </div>

              <div>
                <strong className="text-neutral-900">📥 TASKBAR MINIMIZATION:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Click the **`_`** minimize button on a window title bar to shrink it into the system taskbar. Click the taskbar button to restore it. Closing a window creates a desktop shortcut icon.
                </p>
              </div>

              <div>
                <strong className="text-neutral-900">⭐ Y2K START MENU:</strong>
                <p className="pl-3 mt-0.5 text-[9px] text-neutral-600">
                  Click the **START** button to trigger options:
                  <br />• **RESET DESKTOP**: Restores all windows to their side-by-side coordinate grid instantly.
                  <br />• **MIRROR CAMERA**: Toggles between mirrored/unmirrored camera orientations.
                  <br />• **OPEN ALL WINDOWS**: Restores closed screens.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Book Cover simulated binding footer */}
      <div className="flex justify-between items-center text-[9px] text-neutral-500 font-bold shrink-0 px-1 border-t border-neutral-300 pt-1">
        <span>📖 Windows 95 Help System</span>
        <span>Topic active: {activeTab.toUpperCase()}</span>
      </div>
    </div>
  );
};
