import { HandDetectionResult } from '../types/quiz';

interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

function euclideanDistance(a: NormalizedLandmark, b: NormalizedLandmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Analyzes 21 MediaPipe hand landmarks and counts extended fingers.
 */
export function analyzeHandGestures(landmarks: NormalizedLandmark[]): HandDetectionResult {
  if (!landmarks || landmarks.length < 21) {
    return {
      fingerCount: 0,
      isHandPresent: false,
      confidence: 0,
      extendedFingers: {
        thumb: false,
        index: false,
        middle: false,
        ring: false,
        pinky: false,
      },
    };
  }

  const wrist = landmarks[0];

  // MCPs
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  // Hand scale factor (wrist to middle MCP) to make thresholds invariant to distance from camera
  const handScale = Math.max(0.01, euclideanDistance(wrist, middleMcp));

  // 1. Index finger extended check:
  // Tip is further from wrist than PIP, and tip is higher than PIP (accounting for slight tilt)
  const indexDistToWrist = euclideanDistance(wrist, indexTip);
  const indexPipDistToWrist = euclideanDistance(wrist, indexPip);
  const isIndexExtended =
    indexDistToWrist > indexPipDistToWrist * 1.15 &&
    euDistanceRatio(indexTip, indexMcp, indexPip, indexMcp) > 1.3 &&
    indexTip.y < indexPip.y + 0.08 * handScale;

  // 2. Middle finger
  const middleDistToWrist = euclideanDistance(wrist, middleTip);
  const middlePipDistToWrist = euclideanDistance(wrist, middlePip);
  const isMiddleExtended =
    middleDistToWrist > middlePipDistToWrist * 1.15 &&
    euDistanceRatio(middleTip, middleMcp, middlePip, middleMcp) > 1.3 &&
    middleTip.y < middlePip.y + 0.08 * handScale;

  // 3. Ring finger
  const ringDistToWrist = euclideanDistance(wrist, ringTip);
  const ringPipDistToWrist = euclideanDistance(wrist, ringPip);
  const isRingExtended =
    ringDistToWrist > ringPipDistToWrist * 1.15 &&
    euDistanceRatio(ringTip, ringMcp, ringPip, ringMcp) > 1.3 &&
    ringTip.y < ringPip.y + 0.08 * handScale;

  // 4. Pinky finger
  const pinkyDistToWrist = euclideanDistance(wrist, pinkyTip);
  const pinkyPipDistToWrist = euclideanDistance(wrist, pinkyPip);
  const isPinkyExtended =
    pinkyDistToWrist > pinkyPipDistToWrist * 1.15 &&
    euDistanceRatio(pinkyTip, pinkyMcp, pinkyPip, pinkyMcp) > 1.3 &&
    pinkyTip.y < pinkyPip.y + 0.08 * handScale;

  // 5. Thumb finger:
  // When extended, thumb tip is far from index MCP (5) and pinky MCP (17).
  // When curled across palm, thumb tip is close to index MCP or middle MCP.
  const thumbTipToPinkyMcp = euclideanDistance(thumbTip, pinkyMcp);
  const thumbMcpToPinkyMcp = euclideanDistance(thumbMcp, pinkyMcp);
  const thumbTipToIndexMcp = euclideanDistance(thumbTip, indexMcp);
  const isThumbExtended =
    thumbTipToPinkyMcp > thumbMcpToPinkyMcp * 1.25 &&
    thumbTipToIndexMcp > 0.15 * handScale &&
    euclideanDistance(thumbTip, wrist) > euclideanDistance(thumbIp, wrist);

  // Compute total extended fingers
  // Standard 4 fingers (index, middle, ring, pinky) are the primary way 1~4 are represented.
  const nonThumbExtendedCount =
    (isIndexExtended ? 1 : 0) +
    (isMiddleExtended ? 1 : 0) +
    (isRingExtended ? 1 : 0) +
    (isPinkyExtended ? 1 : 0);

  let finalCount = 0;

  // If thumb is not extended, directly use non-thumb count (most common for 1, 2, 3, 4)
  if (!isThumbExtended) {
    finalCount = nonThumbExtendedCount;
  } else {
    // If thumb is extended, check if user is doing "1" with thumb alone, or 5 fingers
    if (nonThumbExtendedCount === 0) {
      finalCount = 1; // Thumbs up = 1
    } else {
      finalCount = nonThumbExtendedCount + 1; // e.g. thumb + index = 2 or all 5
    }
  }

  // Cap between 0 and 5
  if (finalCount > 5) finalCount = 5;

  return {
    fingerCount: finalCount,
    isHandPresent: true,
    confidence: 1.0,
    extendedFingers: {
      thumb: isThumbExtended,
      index: isIndexExtended,
      middle: isMiddleExtended,
      ring: isRingExtended,
      pinky: isPinkyExtended,
    },
  };
}

function euDistanceRatio(a: NormalizedLandmark, origin: NormalizedLandmark, b: NormalizedLandmark, _originB: NormalizedLandmark): number {
  const d1 = euclideanDistance(a, origin);
  const d2 = euclideanDistance(b, origin);
  return d2 > 0 ? d1 / d2 : 1;
}

/**
 * Draws the hand skeleton and landmarks onto an HTML Canvas.
 */
export function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  highlightColor: string = '#10B981'
) {
  if (!landmarks || landmarks.length < 21) return;

  const CONNECTIONS = [
    // Thumb
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm base
    [5, 9], [9, 13], [13, 17]
  ];

  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw connections
  for (const [startIdx, endIdx] of CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];
    ctx.beginPath();
    ctx.moveTo(start.x * width, start.y * height);
    ctx.lineTo(end.x * width, end.y * height);
    ctx.stroke();
  }

  // Draw points
  for (let i = 0; i < landmarks.length; i++) {
    const pt = landmarks[i];
    const px = pt.x * width;
    const py = pt.y * height;
    const isTip = [4, 8, 12, 16, 20].includes(i);

    ctx.beginPath();
    ctx.arc(px, py, isTip ? 6 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = isTip ? highlightColor : '#38BDF8';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}
