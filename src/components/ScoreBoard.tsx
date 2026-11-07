import React from 'react';
import { QuizAnswerRecord } from '../types/quiz';
import { Trophy, Target, Flame } from 'lucide-react';

interface ScoreBoardProps {
  currentIndex: number;
  totalQuestions: number;
  score: number;
  records: QuizAnswerRecord[];
  streak: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  currentIndex,
  totalQuestions,
  score,
  records,
  streak,
}) => {
  const answeredCount = records.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const correctCount = records.filter((r) => r.isCorrect).length;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
      {/* Top metrics row */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        {/* Progress Info */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-200">진행도:</span>
          <span className="font-mono text-indigo-400 font-semibold">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <span className="text-xs text-slate-500">
            ({Math.round(progressPercent)}%)
          </span>
        </div>

        {/* Current Score & Accuracy */}
        <div className="flex items-center gap-4">
          {streak >= 2 && (
            <div className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {streak}연속 정답!
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Target className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400">정답:</span>
            <span className="font-bold text-slate-200 text-sm">
              {correctCount}개
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-bold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>{score}점</span>
            <span className="text-[11px] text-indigo-400/80 font-normal">/ 100점</span>
          </div>
        </div>
      </div>

      {/* Segmented Question Pill Status */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const record = records[idx];
          const isCurrent = idx === currentIndex;

          let pillColor = 'bg-slate-800 text-slate-500 border-slate-700/60';
          if (record) {
            pillColor = record.isCorrect
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/30 font-bold'
              : 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/30 font-bold';
          } else if (isCurrent) {
            pillColor =
              'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-400/40 animate-pulse font-bold';
          }

          return (
            <div
              key={idx}
              className={`flex-1 h-6 rounded-lg border text-xs flex items-center justify-center transition-all ${pillColor}`}
              title={`문제 ${idx + 1}${
                record ? (record.isCorrect ? ' (정답)' : ' (오답)') : ''
              }`}
            >
              {idx + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};
