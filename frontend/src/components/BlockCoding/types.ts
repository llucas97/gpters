// frontend/src/components/BlockCoding/types.ts

export type BlockType = 
  | 'start'        // 시작 블록
  | 'step'         // 알고리즘 단계 블록
  | 'input'        // 입력 받기
  | 'output'       // 출력하기
  | 'variable'     // 변수 선언/할당
  | 'if'           // 조건문
  | 'for'          // 반복문 (for)
  | 'while'        // 반복문 (while)
  | 'function'     // 함수 정의
  | 'operation'    // 산술 연산
  | 'comparison'   // 비교 연산
  | 'condition'    // 조건 표현식
  | 'logic'        // 논리 연산
  | 'list'         // 리스트 생성
  | 'listAccess'   // 리스트 접근
  | 'listAppend'   // 리스트에 추가
  | 'comment'      // 주석
  | 'print'        // 출력
  | 'number'       // 숫자 값
  | 'break'        // 반복문 탈출
  | 'continue'     // 반복문 계속
  | 'return';      // 함수 반환

export interface BlockData {
  // 공통 필드
  label?: string;
  
  // 알고리즘 단계 블록
  content?: string;
  code?: string;
  order?: number;
  
  // 입력 블록
  variableName?: string;
  inputType?: 'string' | 'int' | 'float';
  
  // 출력 블록
  expression?: string;
  
  // 변수 블록
  name?: string;
  value?: string;
  dataType?: 'int' | 'float' | 'string' | 'bool' | 'list';
  
  // 조건문 블록
  condition?: string;
  
  // 반복문 블록
  variable?: string;
  start?: string;
  end?: string;
  step?: string;
  
  // 함수 블록
  functionName?: string;
  parameters?: string[];
  returnType?: string;
  
  // 연산 블록
  operator?: string;
  operands?: string[];
  left?: string;
  right?: string;
  
  // 리스트 블록
  items?: string[];
  listName?: string;
  index?: string;
  item?: string;
  
  // 주석 블록
  text?: string;
  
  // 출력 블록
  message?: string;
  text?: string;
  
  // 반복 블록
  count?: number;
  
  // 반환 블록
  returnValue?: string;
}

export interface BlockConnections {
  next: string | null;        // 다음에 실행될 블록
  previous: string | null;    // 이전에 실행된 블록
  children: string[];         // 내부에 포함된 블록들 (if, for 등)
}

export interface Block {
  id: string;
  type: BlockType;
  position: { x: number; y: number };
  data: BlockData;
  connections: BlockConnections;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

export interface BlockPaletteCategory {
  name: string;
  color: string;
  blocks: {
    type: BlockType;
    label: string;
    icon?: string;
    description: string;
  }[];
}

export interface DragItem {
  type: 'BLOCK';
  blockType: BlockType;
  isNew: boolean;
  blockId?: string;
}

export interface DropResult {
  position: { x: number; y: number };
  targetBlockId?: string;
  connectionType?: 'next' | 'child';
}

// 블록 검증 결과
export interface BlockValidationResult {
  isValid: boolean;
  score: number;
  feedback: string;
  errors?: Array<{
    blockId: string;
    message: string;
    type: 'error' | 'warning';
  }>;
  suggestions?: string[];
}

// 문제 정의
export interface BlockCodingProblem {
  id: string;
  title: string;
  statement: string;
  level: number;
  expectedBlocks?: BlockType[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string;
  hints?: string[];
  solution?: {
    blocks: Block[];
    code: string;
  };
}

// 코드 생성 옵션
export interface CodeGenerationOptions {
  language: 'python' | 'javascript' | 'java';
  indentSize: number;
  includeComments: boolean;
}
