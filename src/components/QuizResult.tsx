import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { QuizAnswerRecord } from '../types/quiz';
import {
  Trophy,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  Filter,
  Flame,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface QuizResultProps {
  score: number;
  records: QuizAnswerRecord[];
  onRestart: () => void;
  restartProgress?: number;
}

export const QuizResult: React.FC<QuizResultProps> = ({
  score,
  records,
  onRestart,
  restartProgress = 0,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'wrong'>('all');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const correctCount = records.filter((r) => r.isCorrect).length;
  const wrongCount = records.length - correctCount;

  // Trigger celebration confetti
  useEffect(() => {
    try {
      if (score >= 60) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        if (score >= 90) {
          const timeout = setTimeout(() => {
            confetti({
              particleCount: 120,
              spread: 100,
              origin: { y: 0.5 },
            });
          }, 400);
          return () => clearTimeout(timeout);
        }
      }
    } catch {
      // Ignored
    }
  }, [score]);

  // Tier info
  const getTierInfo = () => {
    if (score === 100) {
      return {
        title: '🏆 완벽한 과학 마스터!',
        subtitle: '10문제를 모두 맞히셨습니다. 중학교 과학 개념이 완벽합니다!',
        badgeColor: 'from-amber-400 to-yellow-500 text-slate-950',
      };
    } else if (score >= 80) {
      return {
        title: '🧪 우수 과학 탐구자',
        subtitle: '대단해요! 중학교 과학의 핵심 원리를 깊이 이해하고 있습니다.',
        badgeColor: 'from-emerald-400 to-teal-500 text-slate-950',
      };
    } else if (score >= 60) {
      return {
        title: '🔬 과학 탐구 꿈나무',
        subtitle: '좋은 성적입니다! 헷갈렸던 문제들의 해설을 복습해 보세요.',
        badgeColor: 'from-blue-400 to-indigo-500 text-white',
      };
    } else {
      return {
        title: '📚 개념 충전이 필요한 과학자',
        subtitle: '틀린 문제를 다시 확인하고 한 번 더 도전해 보세요!',
        badgeColor: 'from-purple-400 to-violet-500 text-white',
      };
    }
  };

  const tier = getTierInfo();

  // Calculate subject breakdown
  const subjects = ['물리', '화학', '생물', '지구과학'] as const;
  const subjectStats = subjects.map((subj) => {
    const list = records.filter((r) => r.subject === subj);
    const correct = list.filter((r) => r.isCorrect).length;
    return {
      subject: subj,
      total: list.length,
      correct,
      rate: list.length > 0 ? Math.round((correct / list.length) * 100) : 0,
    };
  });

  const filteredRecords =
    filterMode === 'wrong' ? records.filter((r) => !r.isCorrect) : records;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-18 h-18 rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center justify-center shadow-inner">
          <Trophy className="w-10 h-10 text-amber-400" />
        </div>

        <div className="space-y-1">
          <span
            className={`inline-block px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r shadow-md ${tier.badgeColor}`}
          >
            {tier.title}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white pt-2">
            최종 점수: <span className="text-amber-400">{score}점</span>
            <span className="text-lg text-slate-400 font-normal ml-2">/ 100점</span>
          </h1>
          <p className="text-slate-300 text-sm max-w-md mx-auto pt-1">
            {tier.subtitle}
          </p>
        </div>

        {/* Quick Numbers */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md pt-2">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 text-center">
            <span className="text-xs text-slate-400">총 문제</span>
            <p className="text-lg font-bold text-slate-100">10문항</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 text-center">
            <span className="text-xs text-emerald-400 font-medium">정답</span>
            <p className="text-lg font-bold text-emerald-300">{correctCount}개</p>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-center">
            <span className="text-xs text-rose-400 font-medium">오답</span>
            <p className="text-lg font-bold text-rose-300">{wrongCount}개</p>
          </div>
        </div>

        {/* Restart Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onRestart}
            className="relative overflow-hidden px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 transition-all transform active:scale-95 cursor-pointer"
          >
            {restartProgress > 0 && (
              <div
                className="absolute inset-0 bg-white/30 pointer-events-none transition-all duration-75 ease-linear"
                style={{ width: `${restartProgress}%` }}
              />
            )}
            <RotateCcw className="w-5 h-5" />
            <span>퀴즈 다시 풀기</span>
            {restartProgress > 0 && (
              <span className="text-xs font-mono font-bold text-amber-300">
                ({Math.round(restartProgress)}%)
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Subject Analysis Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-400" />
          영역별 분석 (물리 · 화학 · 생물 · 지구과학)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {subjectStats.map((item) => (
            <div
              key={item.subject}
              className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-3.5 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{item.subject}</span>
                <span className="text-slate-400 font-mono">
                  {item.correct}/{item.total}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                  style={{ width: `${item.rate}%` }}
                />
              </div>
              <p className="text-[11px] text-right text-slate-400 font-semibold font-mono">
                {item.rate}% 정답
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Question Review Section with Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            10문제 전체 리뷰 및 오답 노트
          </h3>

          {/* Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              전체 보기 ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('wrong')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                filterMode === 'wrong'
                  ? 'bg-rose-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              틀린 문제만 ({wrongCount})
            </button>
          </div>
        </div>

        {/* Filtered List */}
        {filteredRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-400 space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-200">
              틀린 문제가 없습니다!
            </p>
            <p className="text-xs text-slate-500">
              모든 문제를 완벽하게 맞혔습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecords.map((item, idx) => {
              const isExpanded = expandedIndex === item.questionId;

              return (
                <div
                  key={item.questionId}
                  className={`border rounded-2xl transition-all ${
                    item.isCorrect
                      ? 'bg-slate-800/40 border-slate-700/60'
                      : 'bg-rose-950/20 border-rose-900/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedIndex(isExpanded ? null : item.questionId)
                    }
                    className="w-full text-left p-4 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          item.isCorrect
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {item.questionId}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                            {item.subject}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              item.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.isCorrect ? '정답' : '오답'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-200 line-clamp-1 mt-0.5">
                          {item.question}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-slate-800/80 space-y-3 text-xs">
                      <div className="flex flex-wrap gap-4 pt-3">
                        <span className="text-slate-400">
                          내가 고른 답:{' '}
                          <strong
                            className={
                              item.isCorrect ? 'text-emerald-400' : 'text-rose-400 font-bold'
                            }
                          >
                            {item.selectedOption}번
                          </strong>
                        </span>
                        <span className="text-slate-400">
                          정답:{' '}
                          <strong className="text-emerald-400 font-bold">
                            {item.correctOption}번
                          </strong>
                        </span>
                      </div>

                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-slate-300 leading-relaxed break-keep">
                        <span className="font-bold text-indigo-300 block mb-1">
                          💡 해설
                        </span>
                        {item.explanation}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
