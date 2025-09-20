// frontend/src/components/CodeEditor/types.ts

export interface CodeEditorProblem {
  id: string;
  title: string;
  level: number;
  language: string;
  statement: string;
  constraints?: string;
  timeLimit?: number; // ms
  memoryLimit?: number; // MB
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  testCases?: TestCase[];
  starterCode?: string;
  solution?: string;
  hints?: string[];
  topic?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
}

export interface CodeEditorSettings {
  theme: 'light' | 'dark' | 'high-contrast';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  insertSpaces: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  minimap: boolean;
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  autoComplete: boolean;
  bracketMatching: boolean;
  folding: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
}

export interface CodeExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number; // ms
  memoryUsage?: number; // bytes
  testResults?: Array<{
    input: string;
    expectedOutput: string;
    actualOutput: string;
    passed: boolean;
    executionTime?: number;
  }>;
  score?: number;
  totalTests?: number;
  passedTests?: number;
}

export interface CodeSubmissionResult {
  problemId: string;
  userId: string;
  language: string;
  code: string;
  submittedAt: string;
  result: CodeExecutionResult;
  verdict: 'Accepted' | 'Wrong Answer' | 'Time Limit Exceeded' | 'Memory Limit Exceeded' | 'Runtime Error' | 'Compilation Error';
  score: number;
  attempts: number;
}

export interface LanguageConfig {
  id: string;
  name: string;
  extension: string;
  monacoLanguage: string;
  defaultCode: string;
  keywords: string[];
  builtins: string[];
  executionCommand?: string;
  compileCommand?: string;
  configuration?: any;
}

export interface CodeEditorTheme {
  name: string;
  base: 'vs' | 'vs-dark' | 'hc-black';
  inherit: boolean;
  rules: Array<{
    token: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }>;
  colors: Record<string, string>;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isPublic: boolean;
  explanation?: string;
  timeLimit?: number;
  memoryLimit?: number;
}

export interface CodeEditorState {
  code: string;
  language: string;
  isRunning: boolean;
  isSubmitting: boolean;
  results: CodeExecutionResult | null;
  submissions: CodeSubmissionResult[];
  settings: CodeEditorSettings;
  currentTheme: string;
}

export interface CodeValidation {
  isValid: boolean;
  errors: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  warnings: Array<{
    line: number;
    column: number;
    message: string;
  }>;
}
