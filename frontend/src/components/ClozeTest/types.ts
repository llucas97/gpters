// frontend/src/components/ClozeTest/types.ts

export interface ClozeBlank {
  id: string | number;
  hint?: string;
  answer: string;
  userInput?: string;
  isCorrect?: boolean;
  placeholder?: string;
  validation?: {
    required: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
}

export interface ClozeTestProblem {
  id: string;
  title: string;
  level: number;
  language: string;
  statement: string;
  code: string; // 빈칸이 포함된 코드
  blanks: ClozeBlank[];
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  hints?: string[];
  constraints?: string;
  timeLimit?: number; // 초 단위
  topic?: string;
}

export interface ClozeTestResult {
  problemId: string;
  blanks: Array<{
    id: string | number;
    userInput: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>;
  score: number;
  totalBlanks: number;
  correctBlanks: number;
  timeSpent: number; // 초 단위
  startedAt: string;
  completedAt: string;
}

export interface ClozeTestValidation {
  isValid: boolean;
  score: number;
  feedback: string;
  blankResults: Array<{
    id: string | number;
    isCorrect: boolean;
    userInput: string;
    correctAnswer: string;
    feedback?: string;
  }>;
  suggestions?: string[];
  hints?: string[];
}

export interface ClozeTestSettings {
  showHints: boolean;
  allowPartialCredit: boolean;
  caseSensitive: boolean;
  strictWhitespace: boolean;
  autoValidation: boolean; // 실시간 검증
  showProgress: boolean;
}
