import React, { useEffect, useState } from 'react';
import { ShieldAlert, Terminal, Eye, Sparkles, Smile, Play } from 'lucide-react';

interface RetroBlingProps {
  filter: 'none' | 'vaporwave' | 'matrix' | 'crt-glitch' | 'sepia';
  setFilter: (filter: 'none' | 'vaporwave' | 'matrix' | 'crt-glitch' | 'sepia') => void;
}

export const RetroBling: React.FC<RetroBlingProps> = ({ filter, setFilter }) => {
  const [visitorCount, setVisitorCount] = useState(1337420);
  
  // Real-time visitor counter ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setVisitorCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // -------------------------------------------------------------
  // --- REAL-TIME RETRO SOUNDBOARD SYNTH (WEB AUDIO API) ---------
  // -------------------------------------------------------------
  const playSoundEffect = (type: 'win95' | 'coin' | 'laser' | 'siren') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const masterVolume = ctx.createGain();
      masterVolume.gain.setValueAtTime(0.15, now);
      masterVolume.connect(ctx.destination);

      if (type === 'win95') {
        // Synthesizing a nostalgic, swelling chord reminiscent of a vintage OS chime!
        // Chord: Db2, Ab3, Db4, F4, Ab4 (Db Major Pad)
        const chordFreqs = [73.42, 207.65, 277.18, 349.23, 415.30];
        
        chordFreqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = freq;
          
          // Delayed swelling envelope
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.04, now + 1.2 + idx * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3.5);
          
          osc.connect(gainNode);
          gainNode.connect(masterVolume);
          osc.start(now);
          osc.stop(now + 4.0);
        });

        // High shimmer bell arpeggio: Db5 -> Ab5 -> C6 -> Db6
        const bellNotes = [554.37, 830.61, 1046.50, 1108.73];
        bellNotes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.value = freq;

          const delay = 0.8 + idx * 0.18;
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.setValueAtTime(0.06, now + delay);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);
          
          osc.connect(gainNode);
          gainNode.connect(masterVolume);
          osc.start(now);
          osc.stop(now + 3.0);
        });
      } 
      
      else if (type === 'coin') {
        // Classic 8-Bit Coin collection beep (Frequency jumps immediately up)
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, now); // B5 note
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6 note
        
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        osc.connect(gainNode);
        gainNode.connect(masterVolume);
        osc.start(now);
        osc.stop(now + 0.4);
      } 
      
      else if (type === 'laser') {
        // Vintage sci-fi laser blast frequency sweep downwards
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.connect(gainNode);
        gainNode.connect(masterVolume);
        osc.start(now);
        osc.stop(now + 0.35);
      } 
      
      else if (type === 'siren') {
        // Cyber alert siren - frequency modulates high and low repeatedly
        const osc = ctx.createOscillator();
        const fmOsc = ctx.createOscillator();
        const fmGain = ctx.createGain();
        const gainNode = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        
        fmOsc.frequency.setValueAtTime(6, now); // 6 Hz vibrato speed
        fmOsc.type = 'sine';
        
        fmGain.gain.setValueAtTime(150, now); // swing between 450Hz and 750Hz
        
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.linearRampToValueAtTime(0.08, now + 1.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
        
        // FM Patching
        fmOsc.connect(fmGain);
        fmGain.connect(osc.frequency);
        
        osc.connect(gainNode);
        gainNode.connect(masterVolume);
        
        fmOsc.start(now);
        osc.start(now);
        
        fmOsc.stop(now + 1.5);
        osc.stop(now + 1.5);
      }
    } catch (e) {
      console.error('Could not synthesize sound effect:', e);
    }
  };

  return (
    <div className="flex flex-col gap-3 font-mono text-xs select-none text-left">
      {/* 📹 Camera VHS Filter Selection Row */}
      <div className="flex flex-col gap-1">
        <span className="text-[#00ffcc] font-bold uppercase tracking-wider flex items-center gap-1">
          <Terminal size={12} />
          <span>VHS Camera Overlay FX</span>
        </span>
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

      {/* 🔊 Synthesized Retro Soundboard */}
      <div className="flex flex-col gap-1 mt-1">
        <span className="text-[#ff00ff] font-bold uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={12} className="animate-spin text-cyan-400" />
          <span>Retro Synthesized Soundboard</span>
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => playSoundEffect('win95')}
            className="retro-button py-1 text-center font-bold text-black border border-white flex items-center justify-center gap-1 uppercase"
            style={{ boxShadow: '1px 1px 0px #000' }}
          >
            <Play size={10} className="fill-black" />
            Win95 Chime
          </button>
          <button
            onClick={() => playSoundEffect('coin')}
            className="retro-button py-1 text-center font-bold text-black border border-white flex items-center justify-center gap-1 uppercase"
            style={{ boxShadow: '1px 1px 0px #000' }}
          >
            <Play size={10} className="fill-black" />
            8-Bit Coin
          </button>
          <button
            onClick={() => playSoundEffect('laser')}
            className="retro-button py-1 text-center font-bold text-black border border-white flex items-center justify-center gap-1 uppercase"
            style={{ boxShadow: '1px 1px 0px #000' }}
          >
            <Play size={10} className="fill-black" />
            Laser Blast
          </button>
          <button
            onClick={() => playSoundEffect('siren')}
            className="retro-button py-1 text-center font-bold text-black border border-white flex items-center justify-center gap-1 uppercase"
            style={{ boxShadow: '1px 1px 0px #000' }}
          >
            <Play size={10} className="fill-black" />
            Alert Siren
          </button>
        </div>
        <span className="text-[8px] text-neutral-600">
          * Note: Sound effects are synthesized on-the-fly using oscillators! No audio files loaded.
        </span>
      </div>

      {/* 🚧 Under Construction Blink Badge & Hit Counter */}
      <div
        className="mt-2 p-2.5 bg-black/85 flex flex-col gap-2 rounded border"
        style={{
          border: '1.5px solid',
          borderColor: '#555555 #ffffff #ffffff #555555',
        }}
      >
        {/* Blinking Construction Zone */}
        <div className="flex items-center gap-2 justify-center text-yellow-400 font-extrabold text-center tracking-widest text-[9px] animate-[pulse_1s_infinite]">
          <ShieldAlert size={12} className="stroke-[2.5]" />
          <span className="retro-blink">🚧 AWESOME SAUCE SING ZONE 🚧</span>
          <ShieldAlert size={12} className="stroke-[2.5]" />
        </div>

        {/* Vintage Visitor Hit Counter */}
        <div className="flex items-center justify-between border-t border-dotted border-[#ff00ff]/30 pt-2 select-none">
          <div className="flex items-center gap-1 text-[#ff00ff] font-bold text-[9px]">
            <Eye size={10} />
            <span>PROFILE HIT COUNTER:</span>
          </div>

          {/* Odometer pixel blocks */}
          <div className="flex gap-0.5 bg-neutral-900 border border-neutral-700 px-1 py-0.5 text-yellow-400 font-mono text-[11px] font-bold tracking-widest select-none shadow-inner">
            {visitorCount.toString().split('').map((char, index) => (
              <span
                key={index}
                className="bg-[#220022] border-x border-[#ff00ff]/10 px-0.5 text-transparent bg-clip-text bg-gradient-to-b from-[#00ffcc] to-[#ff00ff]"
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* Top 8 Profile Avatar badge */}
        <div className="flex items-center gap-2 border-t border-dotted border-[#ff00ff]/30 pt-2">
          <div className="w-8 h-8 bg-neutral-800 border-2 border-neutral-500 overflow-hidden flex items-center justify-center text-neutral-400">
            <Smile size={20} className="text-pink-500 animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-cyan-400 font-bold tracking-wider">YOUR RETRO COACH:</span>
            <span className="text-[8px] text-neutral-400">"Tom is in your Top 8. Rock that vocal remover!"</span>
          </div>
        </div>
      </div>

      {/* Retro bottom marquee */}
      <div className="retro-marquee w-full bg-[#c0c0c0] border border-t-[#555] border-l-[#555] border-r-white border-b-white py-0.5 px-1 mt-1 text-[8px] font-bold text-[#222] select-none uppercase">
        <div className="retro-marquee-content">
          💻 SYSTEM STATUS: SECURE STAGE // REALTIME Web Audio Splitter ENGAGED // MIRRORED MIRROR STAGE ACTIVE // SING YOUR HEART OUT // WELCOME TO CODESPACE
        </div>
      </div>
    </div>
  );
};
