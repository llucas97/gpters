// API 응답 타입 정의

// 공통 에러 응답
export interface ApiError {
  error: string;
  detail?: string;
}

// 사용자 타입
export interface User {
  id: number;
  username: string;
  email: string;
  current_level?: number;
}

// 미세해서 정의

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface Blank {
  id: number;
  hint?: string;
  answer?: string;
}

export interface GeneratedProblem {
  id?: number;
  title: string;
  statement?: string;
  input_spec?: string;
  output_spec?: string;
  constraints?: string;
  examples?: Example[];
  code: string;
  blanks: Blank[];
  level?: number;
  topic?: string;
  language?: string;
}

// 대시보드 통계 데이터
export interface AnalyticsSummary {
  totals?: {
    sessions?: number;
    avg_accuracy?: number;
    avg_duration_ms?: number;
    blanks_total?: number;
    blanks_correct?: number;
  };
  perTopic?: Array<{
    topic: string;
    sessions: number;
    accuracy: number;
  }>;
  perLevel?: Array<{
    level: number;
    sessions: number;
    accuracy: number;
  }>;
  recent?: any[];
}

export interface TimeSeriesData {
  bucket: string;
  items: Array<{
    bucket: string;
    sessions: number;
    accuracy: number;
    blanks_total?: number;
    blanks_correct?: number;
  }>;
}

// 학습 로그 데이터
export interface StudyLogData {
  user_id?: string; // 로그인된 사용자 ID
  client_id?: string; // 비로그인 사용자용 클라이언트 ID
  language: string;
  topic: string;
  level: number;
  source: string;
  problem_id?: number;
  started_at?: string;
  finished_at: string;
  duration_ms?: number;
  blanks_total: number;
  blanks_correct: number;
  blanks_detail: Array<{
    id: number;
    user: string;
    answer: string;
    correct: boolean;
  }>;
}


