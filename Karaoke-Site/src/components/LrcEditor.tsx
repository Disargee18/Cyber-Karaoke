import React, { useState, useEffect } from 'react';
import { Edit3, FileText } from 'lucide-react';

interface LrcEditorProps {
  onLyricsParsed: (lyrics: { time: number; text: string }[]) => void;
  selectedSongId: string;
  onSongChange: (songId: string) => void;
}

export const DEMO_SONGS = [
  {
    id: 'awesome-sauce',
    title: 'Awesome Sauce Anthem',
    artist: 'The Coding Wizards',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // High quality license-free synth-pop
    lrc: `[00:00.00] (Retro synth intro playing...)
[00:04.00] Welcome to the Y2K Karaoke Web Stage!
[00:08.00] Windows 95 and Winamp on the screen,
[00:12.00] The coolest digital player you've ever seen!
[00:16.00] Turn the volume UP, let the bass line grow,
[00:20.00] We're singing in the mirror with a neon glow!
[00:24.00] Internet Awesome Sauce, burning so bright,
[00:28.00] We are the cyber wizards of the neon night!
[00:32.00] Toggle the vocal phase cancellation node,
[00:36.00] To split the frequencies and crack the code!
[00:40.00] (Epic synthwave solo! Check the visualizer waveform!)
[00:48.00] Paste your own LRC lyrics, load a local file,
[00:52.00] And rock the retro retro-futuristic style!
[00:56.00] Phase-inverted center! Vocals are all gone,
[01:00.00] Antigravity Karaoke singing until dawn!
[01:04.00] Thank you for rocking our Y2K sound!
[01:08.00] (Synth fadeout... System shutting down...)`
  },
  {
    id: 'vaporwave-sunset',
    title: 'Vaporwave Sunset',
    artist: 'Analog Dreams',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', // Chill electronic beat
    lrc: `[00:00.00] [Lo-Fi VHS Static humming...]
[00:05.00] Cool breeze, purple skies,
[00:10.00] Neon suns begin to rise in your eyes.
[00:15.00] Stardust in our floating mirrored stage,
[00:20.00] We are turning a brand new nostalgic page...
[00:25.00] (Smooth digital saxophone solo drifting by...)
[00:32.00] Cyber sunset, soft retro shore,
[00:37.00] Tell me that you love me, forevermore.
[00:42.00] Floating in the matrix, room 104,
[00:47.00] Free your soul, leave the keyboard on the floor!
[00:52.00] [Lofi audio fading away into cyberspace...]`
  },
  {
    id: 'procedural-synth',
    title: 'BEEP BOOP 8-BIT SYNTH',
    artist: 'Web Audio API Synth',
    url: 'procedural', // Special flag for built-in Web Audio oscillator melody
    lrc: `[00:00.00] [PROCEDURAL CHIP-TUNE DRUMS CHARGING...]
[00:03.00] Initializing Oscillator Nodes...
[00:06.00] BEEP! BOOP! Welcome to pure synthesis!
[00:09.00] No files! No buffers! Pure math and bliss!
[00:12.00] Frequency modulated, square wave lead,
[00:15.00] Playing an 8-bit tune to fulfill your need!
[00:18.00] Watch the visualizer bounce to every beat!
[00:21.00] Real-time sound waves generated in your street!
[00:24.00] Try turning on the VOCAL REMOVER now!
[00:27.00] (Note: Synthesized mono square leads won't cancel!)
[00:30.00] Because mono waves are identical on each track,
[00:33.00] $L - R$ subtraction strikes them completely back!
[00:36.00] Play with the sliders, adjust the cyber tone,
[00:39.00] We are the master synthesizers on our own!
[00:42.00] [Synth outro melody playing...]`
  }
];

export const LrcEditor: React.FC<LrcEditorProps> = ({
  onLyricsParsed,
  selectedSongId,
  onSongChange,
}) => {
  const [lrcText, setLrcText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  // Initialize with selected demo song LRC
  useEffect(() => {
    const activeDemo = DEMO_SONGS.find((s) => s.id === selectedSongId);
    if (activeDemo) {
      setLrcText(activeDemo.lrc);
      handleParse(activeDemo.lrc);
    }
  }, [selectedSongId]);

  const handleParse = (textToParse: string) => {
    try {
      const lines = textToParse.split('\n');
      const parsed: { time: number; text: string }[] = [];
      const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

      let matchCount = 0;

      for (let line of lines) {
        line = line.trim();
        const match = timeRegex.exec(line);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds = parseInt(match[3], 10);
          
          // Convert milliseconds to seconds fraction
          const msFactor = match[3].length === 2 ? 100 : 1000;
          const time = minutes * 60 + seconds + milliseconds / msFactor;
          const text = line.replace(timeRegex, '').trim();

          parsed.push({ time, text });
          matchCount++;
        }
      }

      if (matchCount === 0) {
        setParseError('Warning: No valid timestamp tags matching [mm:ss.xx] were found.');
        // Still push an empty structure or standard text line if they just want basic lines
        onLyricsParsed([{ time: 0, text: 'No LRC Timestamps Found. Paste LRC to sync!' }]);
      } else {
        setParseError(null);
        // Sort items chronologically
        parsed.sort((a, b) => a.time - b.time);
        onLyricsParsed(parsed);
      }
    } catch (e) {
      setParseError('Error parsing LRC text format.');
      console.error(e);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setLrcText(text);
    // If it's custom, let's flag as custom song or allow parsing
    if (selectedSongId !== 'custom') {
      onSongChange('custom');
    }
    handleParse(text);
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none h-full flex-1">
      {/* Editor Frame */}
      <div className="flex flex-col gap-1 flex-grow flex-1 min-h-[10rem]">
        <div className="flex justify-between items-center text-[#ff00ff] font-bold tracking-wide shrink-0">
          <div className="flex items-center gap-1">
            <Edit3 size={12} />
            <span>LRC LYRIC INJECTOR (EDIT OR PASTE)</span>
          </div>
          {selectedSongId === 'custom' && (
            <span className="text-[10px] bg-pink-500 text-white px-1 font-bold animate-pulse">
              CUSTOM TAPE ACTIVE
            </span>
          )}
        </div>

        {/* Input Textarea with double Win95 border bevel inward */}
        <div
          className="relative bg-black flex-grow flex-1 flex"
          style={{
            border: '2px solid',
            borderColor: '#555555 #ffffff #ffffff #555555',
          }}
        >
          <textarea
            value={lrcText}
            onChange={handleTextChange}
            placeholder="[00:00.00] Intro Synth Beat
[00:05.10] Sing your first line!
[00:10.50] Watch the teleprompter glow!"
            className="w-full h-full min-h-[6rem] bg-black text-[#00ffcc] font-mono text-xs p-2 focus:outline-none resize-none placeholder-emerald-900 border-none caret-[#00ffcc] font-semibold"
            style={{
              fontFamily: 'ui-monospace, Consolas, monospace',
            }}
          />
        </div>

        {parseError && <div className="text-red-500 text-[10px] font-bold text-left shrink-0">⚠️ {parseError}</div>}
        {!parseError && (
          <div className="text-[#8a8a9e] text-[10px] text-left flex items-center gap-1 select-none shrink-0">
            <FileText size={10} />
            <span>Timestamp format must match [minute:second.centisecond]</span>
          </div>
        )}
      </div>
    </div>
  );
};
