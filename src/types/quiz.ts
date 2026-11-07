export type ScienceSubject = '물리' | '화학' | '생물' | '지구과학';

export interface QuizQuestion {
  id: number;
  subject: ScienceSubject;
  grade: string; // 예: "중1", "중2", "중3"
  question: string;
  context?: string; // 보충 실험/상황 설명
  options: string[]; // 4지선다 (길이 4)
  correctAnswer: number; // 1, 2, 3, 4 (1-based index)
  explanation: string; // 상세 해설
  coreConcept: string; // 핵심 과학 개념 1줄 요약
}

export type InputMode = 'gesture' | 'mouse';

export interface HandDetectionResult {
  fingerCount: number; // 0, 1, 2, 3, 4, 5
  isHandPresent: boolean;
  confidence: number;
  extendedFingers: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
}

export interface QuizAnswerRecord {
  questionId: number;
  question: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  subject: ScienceSubject;
  explanation: string;
}
