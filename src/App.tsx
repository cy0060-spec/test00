import React, { useState, useCallback } from 'react';
import { SCIENCE_QUESTIONS } from './data/scienceQuestions';
import { QuizAnswerRecord, InputMode, HandDetectionResult } from './types/quiz';
import { Header } from './components/Header';
import { ScoreBoard } from './components/ScoreBoard';
import { QuizCard } from './components/QuizCard';
import { ExplanationCard } from './components/ExplanationCard';
import { CameraView } from './components/CameraView';
import { QuizResult } from './components/QuizResult';
import { GestureHelpModal } from './components/GestureHelpModal';
import { soundManager } from './utils/audio';
import { ShieldCheck, Sparkles, MousePointer, Camera } from 'lucide-react';

export default function App() {
  const [questions] = useState(SCIENCE_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [records, setRecords] = useState<QuizAnswerRecord[]>([]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Input & Modal States
  const [inputMode, setInputMode] = useState<InputMode>('gesture');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Gesture Hold Tracking
  const [candidateOption, setCandidateOption] = useState<number | null>(null);
  const [candidateProgress, setCandidateProgress] = useState<number>(0);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  // Handle Answer Selection (via Hand Gesture 1.5s or direct Mouse Click)
  const handleSelectOption = useCallback(
    (optionNumber: number) => {
      if (isAnswered || !currentQuestion) return;

      const isCorrect = currentQuestion.correctAnswer === optionNumber;

      if (isCorrect) {
        soundManager.playCorrect();
        setScore((prev) => prev + 10);
        setStreak((prev) => prev + 1);
      } else {
        soundManager.playIncorrect();
        setStreak(0);
      }

      setSelectedOption(optionNumber);
      setIsAnswered(true);
      setCandidateOption(null);
      setCandidateProgress(0);

      const record: QuizAnswerRecord = {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        selectedOption: optionNumber,
        correctOption: currentQuestion.correctAnswer,
        isCorrect,
        subject: currentQuestion.subject,
        explanation: currentQuestion.explanation,
      };

      setRecords((prev) => [...prev, record]);
    },
    [isAnswered, currentQuestion]
  );

  // Handle Advance to Next Question
  const handleNextQuestion = useCallback(() => {
    soundManager.playClick();
    if (!isLastQuestion) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setCandidateOption(null);
      setCandidateProgress(0);
    } else {
      setIsFinished(true);
      setCandidateOption(null);
      setCandidateProgress(0);
    }
  }, [isLastQuestion]);

  // Handle Restart Quiz
  const handleRestart = useCallback(() => {
    soundManager.playClick();
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setRecords([]);
    setScore(0);
    setStreak(0);
    setIsFinished(false);
    setCandidateOption(null);
    setCandidateProgress(0);
  }, []);

  // Gesture callback handlers
  const handleFingerGesture = useCallback((_result: HandDetectionResult | null) => {
    // Hand tracking event loop hook
  }, []);

  const handleHoldProgress = useCallback((candidate: number | null, percent: number) => {
    setCandidateOption(candidate);
    setCandidateProgress(percent);
  }, []);

  const handleToggleInputMode = () => {
    soundManager.playClick();
    setInputMode((prev) => (prev === 'gesture' ? 'mouse' : 'gesture'));
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundManager.isMuted = nextMute;
    if (!nextMute) {
      soundManager.playClick();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        inputMode={inputMode}
        onToggleInputMode={handleToggleInputMode}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* If Quiz is NOT finished */}
        {!isFinished ? (
          <>
            {/* Top Score & Progress Bar */}
            <ScoreBoard
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              score={score}
              records={records}
              streak={streak}
            />

            {/* Layout: Quiz Card & Camera View */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Question & Explanation Section (7 or 8 columns on desktop) */}
              <div
                className={`${
                  inputMode === 'gesture' ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'
                } flex flex-col gap-6`}
              >
                <QuizCard
                  question={currentQuestion}
                  currentIndex={currentIndex}
                  totalQuestions={questions.length}
                  selectedOption={selectedOption}
                  candidateOption={candidateOption}
                  candidateProgress={candidateProgress}
                  isAnswered={isAnswered}
                  onSelectOption={handleSelectOption}
                  inputMode={inputMode}
                />

                {/* Explanation Card shows immediately when answered */}
                {isAnswered && selectedOption !== null && (
                  <ExplanationCard
                    question={currentQuestion}
                    selectedOption={selectedOption}
                    isCorrect={currentQuestion.correctAnswer === selectedOption}
                    onNextQuestion={handleNextQuestion}
                    isLastQuestion={isLastQuestion}
                    advanceCandidateProgress={candidateOption === 99 ? candidateProgress : 0}
                  />
                )}
              </div>

              {/* Camera & Hand Tracking Panel (5 or 4 columns on desktop) */}
              {inputMode === 'gesture' && (
                <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sticky top-20">
                  <CameraView
                    isActive={inputMode === 'gesture'}
                    onFingerGesture={handleFingerGesture}
                    onHoldProgress={handleHoldProgress}
                    onLockIn={handleSelectOption}
                    isQuestionLocked={isAnswered}
                    canAdvanceWithGesture={isAnswered}
                    onAdvanceNext={handleNextQuestion}
                  />

                  {/* Switch to mouse mode shortcut callout */}
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MousePointer className="w-3.5 h-3.5 text-sky-400" />
                      마우스 클릭으로도 바로 풀 수 있습니다.
                    </span>
                    <button
                      type="button"
                      onClick={() => setInputMode('mouse')}
                      className="text-sky-400 hover:text-sky-300 font-semibold cursor-pointer underline underline-offset-2"
                    >
                      마우스 모드 전환
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Final Results Screen */
          <div className="space-y-6">
            <QuizResult
              score={score}
              records={records}
              onRestart={handleRestart}
              restartProgress={candidateOption === 99 ? candidateProgress : 0}
            />

            {/* Optional Camera View on Results screen so student can restart via hand gesture */}
            {inputMode === 'gesture' && (
              <div className="max-w-md mx-auto pt-4">
                <CameraView
                  isActive={inputMode === 'gesture'}
                  onFingerGesture={handleFingerGesture}
                  onHoldProgress={handleHoldProgress}
                  onLockIn={() => {}}
                  isQuestionLocked={true}
                  canAdvanceWithGesture={true}
                  onAdvanceNext={handleRestart}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>중학교 과학 4지선다 모션 퀴즈 (물리 · 화학 · 생물 · 지구과학)</span>
          <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            브라우저 로컬 MediaPipe 처리 (카메라 영상은 외부로 전송되지 않습니다)
          </span>
        </div>
      </footer>

      {/* Guide Modal */}
      <GestureHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
