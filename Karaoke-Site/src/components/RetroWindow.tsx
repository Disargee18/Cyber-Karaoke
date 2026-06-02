import React from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Square } from 'lucide-react';

interface RetroWindowProps {
  title: string;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  defaultX?: number;
  defaultY?: number;
  widthClass?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const RetroWindow: React.FC<RetroWindowProps> = ({
  title,
  onClose,
  onMinimize,
  isMinimized = false,
  defaultX = 0,
  defaultY = 0,
  widthClass = 'w-96',
  children,
  icon,
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: defaultX, y: defaultY }}
      animate={isMinimized ? { height: 'auto', scale: 0.95 } : { height: 'auto', scale: 1 }}
      className={`absolute z-20 retro-window flex flex-col font-mono select-none ${widthClass}`}
      style={{
        background: '#c0c0c0',
        border: '3px solid',
        borderColor: '#ffffff #555555 #555555 #ffffff',
        boxShadow: '1px 1px 0px #000000, inset 1px 1px 0px #ffffff, inset -1px -1px 0px #888888',
        padding: '2px',
      }}
    >
      {/* Title Bar */}
      <div
        className="window-title-bar flex items-center justify-between p-1 bg-gradient-to-r from-[#000080] to-[#1084d0] text-white cursor-move"
        style={{
          fontFamily: "'MS Sans Serif', Tahoma, Arial, sans-serif",
          textRendering: 'optimizeSpeed',
        }}
      >
        <div className="flex items-center gap-1.5 px-1 font-bold text-sm tracking-wide select-none">
          {icon && <span className="w-4 h-4 flex items-center justify-center">{icon}</span>}
          <span className="truncate max-w-[200px] sm:max-w-xs">{title}</span>
        </div>

        {/* Window Controls */}
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button
              onClick={onMinimize}
              className="w-5 h-5 flex items-center justify-center bg-[#c0c0c0] active:bg-[#e0e0e0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white text-black focus:outline-none"
            >
              <Minus size={12} className="stroke-[3]" />
            </button>
          )}
          <button
            className="w-5 h-5 flex items-center justify-center bg-[#c0c0c0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] text-black focus:outline-none cursor-not-allowed opacity-60"
            disabled
          >
            <Square size={10} className="stroke-[3]" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-5 h-5 flex items-center justify-center bg-[#c0c0c0] active:bg-[#e0e0e0] border border-t-white border-l-white border-r-[#404040] border-b-[#404040] active:border-t-[#404040] active:border-l-[#404040] active:border-r-white active:border-b-white text-black focus:outline-none hover:bg-red-600 hover:text-white"
            >
              <X size={12} className="stroke-[3]" />
            </button>
          )}
        </div>
      </div>

      {/* Main Window Client Area */}
      {!isMinimized && (
        <div
          className="flex-1 p-3 m-1 bg-[#c0c0c0]"
          style={{
            border: '1.5px solid',
            borderColor: '#555555 #ffffff #ffffff #555555',
          }}
        >
          {children}
        </div>
      )}
    </motion.div>
  );
};
