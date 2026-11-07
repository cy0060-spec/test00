import React from 'react';
import { QuizQuestion } from '../types/quiz';
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  BookOpen,
  Award,
  Sparkles,
  Hand
} from 'lucide-react';

interface ExplanationCardProps {
  question: QuizQuestion;
  selectedOption: number;
  isCorrect: boolean;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
  advanceCandidateProgress: number; // 0 ~ 100% when holding 1 finger
}

export const ExplanationCard: React.FC<ExplanationCardProps> = ({
  question,
  selectedOption,
  isCorrect,
  onNextQuestion,
  isLastQuestion,
  advanceCandidateProgress,
}) => {
  return (
    <div
      className={`rounded-3xl p-6 lg:p-7 border shadow-2xl transition-all duration-300 ${
        isCorrect
          ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-950/20'
          : 'bg-slate-900 border-rose-500/40 shadow-rose-950/20'
      }`}
    >
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isCorrect
                ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/30'
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <XCircle className="w-7 h-7" />
            )}
          </div>
          <div>
            <h3
              className={`text-xl font-bold ${
                isCorrect ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isCorrect ? '정답입니다! 🎉 (+10점)' : '아쉽습니다! 오답입니다 💭'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              선택한 답: <strong className="text-slate-200">{selectedOption}번</strong> / 정답:{' '}
              <strong className="text-emerald-400 font-bold">
                {question.correctAnswer}번. {question.options[question.correctAnswer - 1]}
              </strong>
            </p>
          </div>
        </div>

        {/* Next Question Action Button */}
        <button
          type="button"
          onClick={onNextQuestion}
          className="relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer shrink-0"
        >
          {/* Progress bar overlay when gesture held */}
          {advanceCandidateProgress > 0 && (
            <div
              className="absolute inset-0 bg-white/30 pointer-events-none transition-all duration-75 ease-linear"
              style={{ width: `${advanceCandidateProgress}%` }}
            />
          )}

          <span className="relative z-10 flex items-center gap-2 text-sm sm:text-base">
            {isLastQuestion ? (
              <>
                <Award className="w-5 h-5 text-amber-300" />
                최종 결과 확인하기
              </>
            ) : (
              <>
                다음 문제로 이동
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </span>
        </button>
      </div>

      {/* Explanation Content */}
      <div className="pt-5 space-y-4">
        {/* Core Concept Box */}
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
              핵심 과학 개념
            </span>
            <p className="text-sm font-medium text-slate-200">
              {question.coreConcept}
            </p>
          </div>
        </div>

        {/* Detailed Explanation */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4.5 flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
              상세 해설
            </span>
            <p className="text-sm text-slate-300 leading-relaxed break-keep">
              {question.explanation}
            </p>
          </div>
        </div>

        {/* Gesture Advance Tip */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-emerald-400" />
            손가락 1개(☝️)를 1.5초 유지하면 버튼 클릭 없이도 다음 문제로 넘어갑니다.
          </span>
          {advanceCandidateProgress > 0 && (
            <span className="text-amber-300 font-bold font-mono">
              {Math.round(advanceCandidateProgress)}% 유지 중
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
