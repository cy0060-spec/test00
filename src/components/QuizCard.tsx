import React from 'react';
import { QuizQuestion } from '../types/quiz';
import { CheckCircle2, XCircle, Hand, MousePointer } from 'lucide-react';

interface QuizCardProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  selectedOption: number | null; // locked-in answer
  candidateOption: number | null; // actively held gesture (1~4)
  candidateProgress: number; // 0 ~ 100%
  isAnswered: boolean;
  onSelectOption: (optionNumber: number) => void;
  inputMode: 'gesture' | 'mouse';
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  물리: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  화학: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  생물: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  지구과학: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
};

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  selectedOption,
  candidateOption,
  candidateProgress,
  isAnswered,
  onSelectOption,
  inputMode,
}) => {
  const subjectStyle = SUBJECT_COLORS[question.subject] || {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/30',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl flex flex-col gap-6">
      {/* Top Question Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="px-3 py-1 rounded-xl bg-indigo-600/20 text-indigo-300 font-bold text-sm tracking-wide border border-indigo-500/30">
            문제 {currentIndex + 1} / {totalQuestions}
          </span>
          <span
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${subjectStyle.bg} ${subjectStyle.text} ${subjectStyle.border}`}
          >
            {question.subject}
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs bg-slate-800 text-slate-400 font-medium">
            {question.grade}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          {inputMode === 'gesture' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-emerald-400 border border-slate-700/60">
              <Hand className="w-3.5 h-3.5 animate-pulse" />
              손가락 1~4개 1.5초 유지 또는 클릭
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 text-sky-400 border border-slate-700/60">
              <MousePointer className="w-3.5 h-3.5" />
              보기를 마우스로 클릭하세요
            </span>
          )}
        </div>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <h2 className="text-xl lg:text-2xl font-bold text-slate-100 leading-snug">
          {question.question}
        </h2>
        {question.context && (
          <p className="text-sm text-slate-400 bg-slate-800/50 p-3 rounded-xl border-l-4 border-indigo-500">
            💡 {question.context}
          </p>
        )}
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
        {question.options.map((optionText, idx) => {
          const optionNumber = idx + 1;
          const isCandidate = candidateOption === optionNumber && !isAnswered;
          const isChosen = selectedOption === optionNumber;
          const isCorrect = isAnswered && question.correctAnswer === optionNumber;
          const isWrongSelection = isAnswered && isChosen && !isCorrect;

          let cardStyle =
            'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70 text-slate-200';

          if (isCandidate) {
            cardStyle =
              'border-amber-400 bg-amber-500/10 text-white ring-2 ring-amber-400/40 shadow-lg shadow-amber-500/10';
          }

          if (isAnswered) {
            if (isCorrect) {
              cardStyle =
                'border-emerald-500 bg-emerald-500/15 text-emerald-100 ring-2 ring-emerald-500/50 font-medium';
            } else if (isWrongSelection) {
              cardStyle =
                'border-rose-500 bg-rose-500/15 text-rose-100 ring-2 ring-rose-500/50 line-through opacity-90';
            } else {
              cardStyle = 'border-slate-800/50 bg-slate-900/40 text-slate-500 opacity-60';
            }
          }

          return (
            <button
              key={optionNumber}
              type="button"
              disabled={isAnswered}
              onClick={() => onSelectOption(optionNumber)}
              className={`relative overflow-hidden text-left p-4 lg:p-5 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 group cursor-pointer disabled:cursor-default ${cardStyle}`}
            >
              {/* Hold Progress Bar background (when gesture candidate) */}
              {isCandidate && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 pointer-events-none transition-all duration-100 ease-linear"
                  style={{ width: `${candidateProgress}%` }}
                />
              )}

              {/* Number Badge */}
              <div
                className={`relative z-10 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  isCorrect
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : isWrongSelection
                    ? 'bg-rose-500 text-white'
                    : isCandidate
                    ? 'bg-amber-400 text-slate-950 font-black scale-110 shadow-md'
                    : 'bg-slate-700/80 group-hover:bg-slate-600 text-slate-200'
                }`}
              >
                {optionNumber}
              </div>

              {/* Option Text */}
              <div className="relative z-10 flex-1 pt-0.5">
                <span className="text-sm lg:text-base leading-relaxed break-keep">
                  {optionText}
                </span>

                {/* Candidate hold percentage badge */}
                {isCandidate && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-75 ease-linear rounded-full"
                        style={{ width: `${candidateProgress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-amber-300 font-mono shrink-0">
                      {Math.round(candidateProgress)}% 유지
                    </span>
                  </div>
                )}
              </div>

              {/* Result Icon */}
              {isAnswered && (
                <div className="relative z-10 shrink-0 self-center">
                  {isCorrect && (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                  )}
                  {isWrongSelection && (
                    <XCircle className="w-6 h-6 text-rose-400" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
