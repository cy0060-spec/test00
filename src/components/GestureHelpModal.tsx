import React from 'react';
import { X, Sparkles, Check, ShieldCheck, Hand, MousePointer } from 'lucide-react';

interface GestureHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureHelpModal: React.FC<GestureHelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 text-slate-200 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Hand className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">손가락 모션 퀴즈 가이드</h2>
            <p className="text-xs text-slate-400">
              MediaPipe AI를 이용한 비접촉 제스처 인식 안내
            </p>
          </div>
        </div>

        {/* 4 Gestures Illustrated */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-center flex flex-col items-center gap-1.5">
            <span className="text-3xl">☝️</span>
            <span className="font-bold text-emerald-400 text-sm">1번 선택</span>
            <span className="text-[11px] text-slate-400">검지 1개</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-center flex flex-col items-center gap-1.5">
            <span className="text-3xl">✌️</span>
            <span className="font-bold text-emerald-400 text-sm">2번 선택</span>
            <span className="text-[11px] text-slate-400">검지+중지 2개</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-center flex flex-col items-center gap-1.5">
            <span className="text-3xl">🤟</span>
            <span className="font-bold text-emerald-400 text-sm">3번 선택</span>
            <span className="text-[11px] text-slate-400">손가락 3개</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3.5 text-center flex flex-col items-center gap-1.5">
            <span className="text-3xl">✋</span>
            <span className="font-bold text-emerald-400 text-sm">4번 선택</span>
            <span className="text-[11px] text-slate-400">손가락 4개</span>
          </div>
        </div>

        {/* How it works */}
        <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            핵심 사용 팁
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">1.</span>
              <span>
                원하는 번호에 해당하는 손가락 개수를 카메라 화면에 올리고{' '}
                <strong className="text-amber-300 font-bold">1.5초 동안 유지</strong>
                하면 답안이 자동으로 확정됩니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">2.</span>
              <span>
                손바닥이 카메라를 마주보게 하고, 손가락 간격을 살짝 벌려주시면 인식이 훨씬 더 정확합니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">3.</span>
              <span>
                답안 제출 후 나오는 해설 화면에서도{' '}
                <strong className="text-emerald-300 font-bold">검지 1개(☝️)</strong>를 1.5초 유지하면
                버튼 클릭 없이 다음 문제로 넘어갈 수 있습니다.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold shrink-0">4.</span>
              <span className="flex items-center gap-1">
                <MousePointer className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                카메라가 없거나 손 인식이 힘든 경우, 마우스로 보기를 직접 클릭하여 풀 수도 있습니다!
              </span>
            </li>
          </ul>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            <strong>개인정보 보호 안심:</strong> 모든 영상 분석은 이용자의 웹 브라우저 내에서만
            실시간 처리되며, 외부 서버로 영상을 일절 전송하거나 저장하지 않습니다.
          </span>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-colors cursor-pointer shadow-lg shadow-indigo-600/30"
        >
          확인했습니다! 퀴즈 시작하기
        </button>
      </div>
    </div>
  );
};
