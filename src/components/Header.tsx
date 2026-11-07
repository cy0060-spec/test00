import React from 'react';
import {
  Atom,
  Camera,
  MousePointer,
  Volume2,
  VolumeX,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HeaderProps {
  inputMode: 'gesture' | 'mouse';
  onToggleInputMode: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  inputMode,
  onToggleInputMode,
  isMuted,
  onToggleMute,
  onOpenHelp,
}) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Atom className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg sm:text-xl text-white tracking-tight">
                중학 과학 모션 퀴즈
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                10문항
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              MediaPipe 손가락 제스처 1.5초 유지 & 마우스 클릭 4지선다
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Input Mode Toggle */}
          <button
            type="button"
            onClick={onToggleInputMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              inputMode === 'gesture'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
            }`}
            title="입력 모드 전환"
          >
            {inputMode === 'gesture' ? (
              <>
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">카메라</span> 모션 모드
              </>
            ) : (
              <>
                <MousePointer className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden xs:inline">마우스</span> 클릭 모드
              </>
            )}
          </button>

          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
            title={isMuted ? '음소거 해제' : '소리 끄기'}
            aria-label="소리 제어"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Help Modal Trigger */}
          <button
            type="button"
            onClick={onOpenHelp}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-colors border border-slate-700/60 cursor-pointer flex items-center gap-1 text-xs"
            title="손가락 제스처 가이드"
            aria-label="제스처 가이드"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline font-medium">가이드</span>
          </button>
        </div>
      </div>
    </header>
  );
};
