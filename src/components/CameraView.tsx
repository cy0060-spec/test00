import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { analyzeHandGestures, drawHandSkeleton } from '../utils/handGesture';
import { HandDetectionResult } from '../types/quiz';
import { soundManager } from '../utils/audio';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface CameraViewProps {
  isActive: boolean;
  onFingerGesture: (result: HandDetectionResult | null) => void;
  onHoldProgress: (candidate: number | null, progressPercent: number) => void;
  onLockIn: (chosenOption: number) => void;
  isQuestionLocked: boolean; // True when showing explanation/feedback
  canAdvanceWithGesture?: boolean; // When on feedback screen, gesture 1 advances
  onAdvanceNext?: () => void;
}

const HOLD_DURATION_MS = 1500; // 1.5 seconds

export const CameraView: React.FC<CameraViewProps> = ({
  isActive,
  onFingerGesture,
  onHoldProgress,
  onLockIn,
  isQuestionLocked,
  canAdvanceWithGesture,
  onAdvanceNext,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameId = useRef<number | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [detectedResult, setDetectedResult] = useState<HandDetectionResult | null>(null);

  // Hold confirmation state
  const holdCandidateRef = useRef<number | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);
  const lastTickPercentRef = useRef<number>(0);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    const initHandLandmarker = async () => {
      try {
        setIsLoadingModel(true);
        setModelError(null);

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        // Try GPU first, fallback to CPU if unavailable
        let landmarker: HandLandmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        } catch {
          // GPU failed, retry with CPU
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minHandPresenceConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
        }

        if (isCancelled) return;
        landmarkerRef.current = landmarker;
        setIsLoadingModel(false);
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error('Failed to initialize MediaPipe HandLandmarker:', err);
        setModelError(
          'MediaPipe AI 모델을 불러오는 중 문제가 발생했습니다. 마우스 모드를 이용해 주세요.'
        );
        setIsLoadingModel(false);
      }
    };

    initHandLandmarker();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Start or Stop Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
      const e = err as { name?: string; message?: string };
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setCameraError('카메라 권한이 차단되었습니다. 브라우저 주소창의 카메라 권한을 허용해 주세요.');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setCameraError('연결된 카메라 장치를 찾을 수 없습니다. 마우스 클릭으로 풀 수 있습니다.');
      } else {
        setCameraError('카메라를 시작할 수 없습니다. 마우스 클릭 모드를 이용해 보세요.');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
  }, []);

  useEffect(() => {
    if (isActive && !isLoadingModel && !modelError) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isActive, isLoadingModel, modelError, startCamera, stopCamera]);

  // Main Detection Loop
  useEffect(() => {
    if (!isActive) return;

    let lastVideoTime = -1;

    const detectFrame = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (
        video &&
        video.readyState >= 2 &&
        landmarker &&
        canvas &&
        !video.paused &&
        !video.ended
      ) {
        const currentTime = video.currentTime;
        if (currentTime !== lastVideoTime) {
          lastVideoTime = currentTime;

          // Set canvas dimensions
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const results = landmarker.detectForVideo(video, performance.now());

            if (results && results.landmarks && results.landmarks.length > 0) {
              const rawLandmarks = results.landmarks[0];
              // If mirrored, flip X coordinate for skeleton visualization
              const displayLandmarks = isMirrored
                ? rawLandmarks.map((pt) => ({ ...pt, x: 1 - pt.x }))
                : rawLandmarks;

              const gestureResult = analyzeHandGestures(rawLandmarks);
              setDetectedResult(gestureResult);
              onFingerGesture(gestureResult);

              if (showSkeleton) {
                drawHandSkeleton(ctx, displayLandmarks, canvas.width, canvas.height, '#10B981');
              }

              // Evaluate 1.5s Hold confirmation
              handleHoldCountdown(gestureResult.fingerCount);
            } else {
              setDetectedResult(null);
              onFingerGesture(null);
              handleHoldCountdown(0);
            }
          }
        }
      }

      animFrameId.current = requestAnimationFrame(detectFrame);
    };

    animFrameId.current = requestAnimationFrame(detectFrame);

    return () => {
      if (animFrameId.current) {
        cancelAnimationFrame(animFrameId.current);
      }
    };
  }, [
    isActive,
    isMirrored,
    showSkeleton,
    isQuestionLocked,
    canAdvanceWithGesture,
    onFingerGesture,
    onHoldProgress,
    onLockIn,
    onAdvanceNext,
  ]);

  // Hold Countdown Logic
  const handleHoldCountdown = (count: number) => {
    const now = performance.now();

    // Mode A: During Question Solving (count between 1 and 4)
    if (!isQuestionLocked) {
      if (count >= 1 && count <= 4) {
        if (holdCandidateRef.current !== count) {
          holdCandidateRef.current = count;
          holdStartTimeRef.current = now;
          lastTickPercentRef.current = 0;
          onHoldProgress(count, 0);
        } else if (holdStartTimeRef.current !== null) {
          const elapsed = now - holdStartTimeRef.current;
          const percent = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
          onHoldProgress(count, percent);

          // Audio tick progression
          if (percent - lastTickPercentRef.current >= 25) {
            soundManager.playProgressTick(percent);
            lastTickPercentRef.current = percent;
          }

          if (percent >= 100) {
            soundManager.playLockIn();
            onLockIn(count);
            holdCandidateRef.current = null;
            holdStartTimeRef.current = null;
            onHoldProgress(null, 0);
          }
        }
      } else {
        // Reset when hand not in 1~4
        if (holdCandidateRef.current !== null) {
          holdCandidateRef.current = null;
          holdStartTimeRef.current = null;
          lastTickPercentRef.current = 0;
          onHoldProgress(null, 0);
        }
      }
    } else if (canAdvanceWithGesture && onAdvanceNext) {
      // Mode B: When Question is already answered & showing explanation
      // 1 finger held for 1.5s (or open palm 5) advances to the next question
      if (count === 1 || count === 5) {
        if (holdCandidateRef.current !== 99) {
          holdCandidateRef.current = 99;
          holdStartTimeRef.current = now;
          onHoldProgress(99, 0);
        } else if (holdStartTimeRef.current !== null) {
          const elapsed = now - holdStartTimeRef.current;
          const percent = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
          onHoldProgress(99, percent);

          if (percent >= 100) {
            soundManager.playLockIn();
            onAdvanceNext();
            holdCandidateRef.current = null;
            holdStartTimeRef.current = null;
            onHoldProgress(null, 0);
          }
        }
      } else {
        if (holdCandidateRef.current === 99) {
          holdCandidateRef.current = null;
          holdStartTimeRef.current = null;
          onHoldProgress(null, 0);
        }
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3 text-slate-100">
      {/* Camera Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Camera className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-slate-200">
            MediaPipe 모션 인식
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            실시간 로컬 분석
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <button
            onClick={() => setIsMirrored((prev) => !prev)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
            title="좌우 반전 전환"
            aria-label="좌우 반전"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowSkeleton((prev) => !prev)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-300"
            title="손가락 관절 표시 On/Off"
            aria-label="관절 선 토글"
          >
            {showSkeleton ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-800">
        {/* Loading State */}
        {isLoadingModel && (
          <div className="flex flex-col items-center gap-2 text-center p-4">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-300 font-medium">
              MediaPipe Hand Landmarker 로딩 중...
            </p>
            <p className="text-[11px] text-slate-500">
              최초 1회 AI 모델 파일을 안전하게 준비하고 있습니다.
            </p>
          </div>
        )}

        {/* Model or Camera Error State */}
        {(modelError || cameraError) && !isLoadingModel && (
          <div className="flex flex-col items-center text-center p-4 max-w-sm gap-2">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="text-xs font-semibold text-amber-300">
              {modelError ? '모델 로딩 실패' : '카메라 연결 안내'}
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {modelError || cameraError}
            </p>
            {cameraError && (
              <button
                onClick={startCamera}
                className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 카메라 다시 시도
              </button>
            )}
            <p className="text-[10px] text-slate-400 mt-1">
              💡 카메라 없이도 마우스 클릭으로 모든 문제를 정상적으로 풀 수 있습니다.
            </p>
          </div>
        )}

        {/* Live Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''} ${
            isLoadingModel || modelError || cameraError ? 'hidden' : 'block'
          }`}
        />

        {/* Landmark Canvas Overlay */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            isLoadingModel || modelError || cameraError ? 'hidden' : 'block'
          }`}
        />

        {/* On-Camera Gesture HUD */}
        {!isLoadingModel && !cameraError && !modelError && (
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-700/60 text-xs flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {detectedResult && detectedResult.isHandPresent ? (
                <span className="font-semibold text-emerald-300">
                  인식된 손가락:{' '}
                  <span className="text-amber-300 text-sm font-bold">
                    {detectedResult.fingerCount}개
                  </span>
                  {detectedResult.fingerCount >= 1 &&
                    detectedResult.fingerCount <= 4 &&
                    !isQuestionLocked && (
                      <span className="text-slate-200 ml-1">
                        👉 {detectedResult.fingerCount}번 선택 중
                      </span>
                    )}
                  {isQuestionLocked &&
                    (detectedResult.fingerCount === 1 || detectedResult.fingerCount === 5) && (
                      <span className="text-emerald-300 ml-1">
                        👉 다음 문제 이동 중
                      </span>
                    )}
                </span>
              ) : (
                <span className="text-slate-400">카메라 앞에 손을 비춰보세요</span>
              )}
            </div>
          </div>
        )}

        {/* Finger Dots Status (Bottom inside video) */}
        {!isLoadingModel && !cameraError && detectedResult && detectedResult.isHandPresent && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1.5 bg-slate-900/85 backdrop-blur-md py-1 px-3 rounded-xl border border-slate-700/60 text-[10px] text-slate-300 pointer-events-none">
            <span className="text-slate-400 mr-1">인식 부위:</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono ${
                detectedResult.extendedFingers.thumb
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              엄지
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono ${
                detectedResult.extendedFingers.index
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              검지
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono ${
                detectedResult.extendedFingers.middle
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              중지
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono ${
                detectedResult.extendedFingers.ring
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              약지
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono ${
                detectedResult.extendedFingers.pinky
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              소지
            </span>
          </div>
        )}
      </div>

      {/* Guide & Privacy Notice */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] font-medium text-slate-300">
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
            ☝️ 1개 = 1번
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
            ✌️ 2개 = 2번
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
            🤟 3개 = 3번
          </div>
          <div className="bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60">
            ✋ 4개 = 4번
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 px-1">
          <span className="flex items-center gap-1">
            ⏱️ <strong className="text-amber-300 font-semibold">1.5초</strong> 유지 시 확정
          </span>
          <span className="flex items-center gap-1 text-slate-400" title="영상은 브라우저 밖으로 전송되지 않습니다.">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            외부 서버 전송 없음
          </span>
        </div>
      </div>
    </div>
  );
};
