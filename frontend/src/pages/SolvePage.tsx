import { useEffect, useMemo, useState } from "react";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import { useAuth } from "../contexts/AuthContext";

// ===== client id =====
const getClientId = (): string => {
  const KEY = "gpters.clientId";
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem(KEY) : null;
  if (stored) return stored;

  const rand = (n = 8) =>
    Math.random()
      .toString(36)
      .slice(2, 2 + n);
  // globalThis.crypto?.randomUUID() 가 있으면 사용, 없으면 fallback
  const newId =
    (typeof globalThis !== "undefined" &&
      (globalThis as any).crypto?.randomUUID?.()) ||
    `${rand(6)}-${Date.now().toString(36)}-${rand(6)}`;

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(KEY, newId); // newId는 string 확정
  }
  return newId;
};

const CLIENT_ID = getClientId();

// 사용하지 않는 헬퍼 함수들 제거됨

// --- 공통 유틸 (파일 상단에) ---

function stripCommentedPlaceholdersRaw(code: string): string {
  if (!code) return "";
  let out = code;

  // Python style: # __N__
  out = out.replace(
    /(^|[\r\n])([ \t]*)#\s*__\s*(\d+)\s*__/g,
    (_m, a, indent, d) => `${a}${indent}__${d}__`
  );

  // C/C++/Java style: /* __N__ */
  out = out.replace(/\/\*\s*__\s*(\d+)\s*__\s*\*\//g, (_m, d) => `__${d}__`);

  // JavaScript/C++ style: // __N__
  out = out.replace(
    /(^|[\r\n])([ \t]*)\/\/\s*__\s*(\d+)\s*__/g,
    (_m, a, indent, d) => `${a}${indent}__${d}__`
  );

  return out;
}

type CodeSeg = { t: "text"; v: string } | { t: "blank"; id: number };
function parseClozeSegments(code: string): CodeSeg[] {
  const raw = stripCommentedPlaceholdersRaw(code);
  const re = /__\s*(\d+)\s*__/g;
  const segs: CodeSeg[] = [];
  let last = 0,
    m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const id = Number(m[1]);
    if (m.index > last) segs.push({ t: "text", v: raw.slice(last, m.index) });
    segs.push({ t: "blank", id });
    last = re.lastIndex;
  }
  if (last < raw.length) segs.push({ t: "text", v: raw.slice(last) });
  return segs;
}

// initialEditorCode 함수 제거됨 (사용하지 않음)

const styles = {
  panel: {
    background: "#fff",
    border: "2px solid #e5e7eb",
    borderRadius: 18,
    padding: 12,
  },
  codePanel: {
    background: "#0d1117",
    color: "#e6edf3",
    border: "2px solid #111827",
    borderRadius: 18,
    padding: 12,
  },
  sectionTitle: { fontWeight: 600, marginBottom: 8 },
  blankChip: {
    border: "2px solid #facc15",
    background: "#374151",
    color: "#fff",
    borderRadius: 8,
    padding: "2px 8px",
    display: "inline-flex",
    alignItems: "center",
    height: 26,
    minWidth: 80,
    margin: "0 2px",
  },
  tokenPill: {
    border: "3px solid #6366f1",
    background: "#e0e7ff",
    color: "#1e1b4b",
    borderRadius: 12,
    padding: "6px 12px",
    fontSize: 12,
    userSelect: "none" as const,
  },
  submit: {
    border: "3px solid rgb(5,150,105)",
    background: "rgb(209,250,229)",
    color: "rgb(6,95,70)",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
  },
};

// ===== types =====
type Blank = { id: number | string; hint?: string; answer?: string };
type Example = { input: string; output: string; explanation?: string };
type Problem = {
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
};

export default function SolvePage() {
  const { user } = useAuth(); // 사용자 정보 가져오기
  const [uiLevel, setUiLevel] = useState<number>(2); // 0-5
  const [language, setLanguage] = useState<string>("javascript"); // 기본 언어를 JavaScript로 변경
  const [problem, setProblem] = useState<Problem | null>(null);
  const [err, setErr] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // 클로즈/블록 공통
  const orderedBlanks = useMemo<Blank[]>(() => {
    const arr = (problem?.blanks ?? []).map((b) => {
      const n = Number(String(b.id).replace(/\D/g, ""));
      return { ...b, id: Number.isFinite(n) && n > 0 ? n : 1 };
    });
    arr.sort((a: any, b: any) => Number(a.id) - Number(b.id));
    return arr;
  }, [problem]);

  // 블록 모드 상태(토큰 박스) - 사용하지 않으므로 제거
  // const [blockTokens, setBlockTokens] = useState<string[]>([]);
  // 클로즈 입력 - 사용하지 않으므로 제거
  // const [fills, setFills] = useState<string[]>([]);
  // 에디터 코드 - 사용하지 않으므로 제거
  // const [editorCode, setEditorCode] = useState<string>("");

  // 로딩: 문제 생성 (랜덤)
  const fetchProblem = async () => {
    try {
      setLoading(true);
      setErr("");
      const topics = ["graph", "dp", "greedy", "tree", "string", "math"];
      const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

      // 사용자 현재 레벨에 정확히 맞는 문제 생성
      const userLevel = user?.current_level ?? 0;

      const params = {
        level: userLevel, // 사용자 현재 레벨 그대로 사용
        topic: pick(topics),
        language: language, // 현재 선택된 언어 사용
      };

      // 레벨 0~1은 블록코딩 API 사용, 나머지는 기존 API 사용
      const apiEndpoint = userLevel <= 1 ? "/api/block-coding/generate" : "/api/problem-bank/generate";
      
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(await res.text());
      const response = await res.json();
      // 블록코딩 API 응답 구조: { success: true, data: problem }
      const j: Problem = userLevel <= 1 ? response.data : response;
      setProblem(j);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  // shuffle 함수 제거됨 (사용하지 않음)


  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold">레벨별 문제 해결</h1>

      {/* 상단 컨트롤 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <div className="col-span-2">
          <label className="block text-sm text-gray-600">UI Level (0~5)</label>
          <input
            type="range"
            min={0}
            max={5}
            value={uiLevel}
            onChange={(e) => setUiLevel(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">
            0-1: 블록 / 2-3: 빈칸 / 4-5: 에디터
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Editor Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">문제 생성</label>
          <button
            onClick={fetchProblem}
            disabled={loading}
            className="w-full h-9 border rounded px-3 font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "생성 중..." : "문제 생성"}
          </button>
          {user && (
            <div className="text-xs text-gray-500 mt-1">
              현재 레벨: {user.current_level ?? 0} (레벨{" "}
              {user.current_level ?? 0} 문제 생성)
            </div>
          )}
        </div>
      </div>

      {err && (
        <div className="mt-3 text-sm text-red-600 whitespace-pre-wrap">
          에러: {err}
        </div>
      )}

      {/* 문제 본문 */}
      {problem && (
        <section className="mt-6">
          <h2 className="text-xl font-bold mb-2">문제 전문</h2>
          <div className="border rounded p-3 whitespace-pre-wrap">
            <div className="font-semibold mb-2">[{problem.title}]</div>
            <div className="mb-3">
              {problem.statement || (
                <span className="text-gray-500">문제 설명 없음</span>
              )}
            </div>
            {(problem.input_spec || problem.output_spec) && (
              <div className="flex flex-col gap-4">
                <div className="border rounded p-2">
                  <div className="text-sm font-semibold mb-1">입력 형식</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {problem.input_spec ?? "-"}
                  </div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-sm font-semibold mb-1">출력 형식</div>
                  <div className="text-sm whitespace-pre-wrap">
                    {problem.output_spec ?? "-"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 모드별 UI */}
      {problem && (
        <div className="mt-6 space-y-6">
          {/* 0–1: 블록코딩(4스택) */}
          {problem && uiLevel <= 1 && (
            <BlockCodingPanel
              problem={problem}
              CLIENT_ID={CLIENT_ID}
            />
          )}

          {/* 2–3: 빈칸채우기(3스택, 힌트 없음) */}
          {problem && uiLevel >= 2 && uiLevel <= 3 && (
            <ClozePanel
              problem={problem}
              orderedBlanks={orderedBlanks}
              CLIENT_ID={CLIENT_ID}
            />
          )}

          {/* 4–5: 코드 에디터(3스택: 문제 → 에디터 → 제출) */}
          {problem && uiLevel >= 4 && (
            <CodeEditorPanel problem={problem} CLIENT_ID={CLIENT_ID} />
          )}
        </div>
      )}
    </div>
  );
}

// --- 공통 소형 컴포넌트 ---

function DragToken({ token, type = 'answer' }: { token: string; type?: 'answer' | 'distractor' }) {
  const [dragging, setDragging] = useState(false);

  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', token);
    setDragging(true);
    // 크롬에서 drag ghost를 선명하게
    if (e.currentTarget instanceof HTMLElement) {
      const crt = e.currentTarget.cloneNode(true) as HTMLElement;
      crt.style.position = 'absolute';
      crt.style.top = '-9999px';
      crt.style.left = '-9999px';
      document.body.appendChild(crt);
      e.dataTransfer.setDragImage(crt, crt.offsetWidth / 2, crt.offsetHeight / 2);
      setTimeout(() => document.body.removeChild(crt), 0);
    }
  };
  const onDragEnd = () => setDragging(false);

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    // 단어 길이에 꼭 맞게
    width: 'fit-content',
    whiteSpace: 'nowrap',
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.1,
    borderRadius: 14,
    border: type === 'answer' 
      ? '2px solid #7C83FF'  // 정답: 보라색
      : '2px solid #FF6B6B', // 오답: 빨간색
    background: type === 'answer'
      ? 'linear-gradient(180deg, #EEF2FF 0%, #E0E7FF 100%)'  // 정답: 보라색 그라데이션
      : 'linear-gradient(180deg, #FFF1F1 0%, #FFE5E5 100%)', // 오답: 빨간색 그라데이션
    color: type === 'answer' ? '#1e1b4b' : '#7F1D1D',
    // 살짝 떠있는 느낌 + 드래그 시 눌리는 느낌
    boxShadow: dragging
      ? type === 'answer'
        ? '0 1px 0 #c7d2fe, 0 6px 14px rgba(99,102,241,0.18)'
        : '0 1px 0 #fecaca, 0 6px 14px rgba(239,68,68,0.18)'
      : type === 'answer'
        ? '0 2px 0 #c7d2fe, 0 4px 10px rgba(99,102,241,0.15)'
        : '0 2px 0 #fecaca, 0 4px 10px rgba(239,68,68,0.15)',
    transform: dragging ? 'translateY(1px) scale(0.98)' : 'translateY(0)',
    transition: 'all .12s ease',
    userSelect: 'none',
    cursor: 'grab'
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={pillStyle}
      className="select-none"
      title={token}
    >
      {token}
    </div>
  );
}

function DropSlot({
  id,
  value,
  onDropToken,
  onClear,
}: {
  id: number;
  value?: string | null;
  onDropToken: (id: number, token: string) => void;
  onClear: (id: number) => void;
}) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const t = e.dataTransfer.getData("text/plain");
    if (t) onDropToken(id, t);
  };
  return (
    <span
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={styles.blankChip}
      title={`빈칸 ${id}`}
    >
      {value ? (
        <>
          {value}
          <button onClick={() => onClear(id)} className="ml-1 text-[10px]">
            ×
          </button>
        </>
      ) : (
        "BLANK"
      )}
    </span>
  );
}

function InputSlot({
  id,
  value,
  onChange,
  onClear,
}: {
  id: number;
  value?: string | null;
  onChange: (id: number, v: string) => void;
  onClear: (id: number) => void;
}) {
  return (
    <span style={styles.blankChip}>
      <input
        value={value ?? ""}
        onChange={(e) => onChange(id, e.target.value)}
        className="font-mono text-[12px]"
        style={{
          background: "transparent",
          color: "#fff",
          width: 90,
          outline: "none",
          border: "none",
        }}
        placeholder="입력..."
      />
      {value ? (
        <button onClick={() => onClear(id)} className="ml-1 text-[10px]">
          ×
        </button>
      ) : null}
    </span>
  );
}

// --- 블록코딩(새로운 로직) ---
function BlockCodingPanel({
  problem,
  CLIENT_ID,
}: {
  problem: any;
  CLIENT_ID: string;
}) {
  // 새로운 블록코딩 문제 구조 사용
  const blankedCode = problem.blankedCode || "";
  const blocks = problem.blocks || [];
  const blankCount = problem.blankCount || 1;
  
  const [filled, setFilled] = useState<Record<number, string | null>>({});
  
  // 블랭크 ID 추출 (BLANK_1, BLANK_2 등)
  const blankIds = useMemo(() => {
    const ids: number[] = [];
    for (let i = 1; i <= blankCount; i++) {
      if (blankedCode.includes(`BLANK_${i}`)) {
        ids.push(i);
      }
    }
    return ids;
  }, [blankedCode, blankCount]);
  
  // 드래그할 블록들 (정답 + 오답)
  const draggableBlocks = useMemo(() => {
    return blocks.filter((block: any) => block.type === 'answer' || block.type === 'distractor');
  }, [blocks]);

  useEffect(() => {
    const init: Record<number, string | null> = {};
    blankIds.forEach((id) => (init[id] = null));
    setFilled(init);
  }, [blankIds.join(",")]);

  const onDropToken = (id: number, t: string) =>
    setFilled((p) => ({ ...p, [id]: t }));
  const onClear = (id: number) => setFilled((p) => ({ ...p, [id]: null }));

  const submit = async () => {
    const userAnswers = blankIds.map(id => filled[id] || "");
    
    if (
      userAnswers.some((answer) => !answer) &&
      !confirm("빈칸이 비어 있습니다. 제출할까요?")
    )
      return;
      
    const body = {
      problem,
      userAnswers
    };
    
    try {
      const r = await fetch("/api/block-coding/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      const result = await r.json();
      alert(JSON.stringify(result.data, null, 2));
    } catch (error: any) {
      alert("제출 오류: " + (error?.message || error));
    }
  };

  // 블랭크가 포함된 코드를 렌더링하는 함수
  const renderBlankedCode = () => {
    const parts = blankedCode.split(/(BLANK_\d+)/);
    return parts.map((part: string, index: number) => {
      if (part.startsWith('BLANK_')) {
        const blankId = parseInt(part.replace('BLANK_', ''));
        return (
          <DropSlot
            key={`slot-${blankId}-${index}`}
            id={blankId}
            value={filled[blankId]}
            onDropToken={onDropToken}
            onClear={onClear}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <section className="flex flex-col gap-4">
      {/* 문제 정보 */}
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>문제 정보</div>
        <div className="text-sm text-gray-300">
          <p><strong>제목:</strong> {problem.title}</p>
          <p><strong>설명:</strong> {problem.description}</p>
          <p><strong>지시사항:</strong> {problem.instruction}</p>
          <p><strong>레벨:</strong> {problem.level} | <strong>언어:</strong> {problem.language}</p>
        </div>
      </div>
      
      {/* 1) 코드(드롭 슬롯) */}
      <div style={styles.codePanel}>
        <div style={{ ...styles.sectionTitle, color: "#e5e7eb" }}>
          1) 코드에 빈칸 채우기
        </div>
        <pre
          className="rounded p-3 overflow-auto text-[13px] leading-6"
          style={{ background: "transparent" }}
        >
          <code className="font-mono whitespace-pre-wrap break-words">
            {renderBlankedCode()}
          </code>
        </pre>
      </div>
      
      {/* 2) 드래그할 블록들 */}
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>2) 드래그할 블록들</div>
        <div className="flex flex-wrap gap-2">
          {draggableBlocks.length ? (
            draggableBlocks.map((block: any, idx: number) => (
              <DragToken 
                key={`${block.id}-${idx}`} 
                token={block.text}
                type={block.type}
              />
            ))
          ) : (
            <span className="text-sm text-gray-500">블록 없음</span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          정답 블록: {blocks.filter((b: any) => b.type === 'answer').length}개 | 
          오답 블록: {blocks.filter((b: any) => b.type === 'distractor').length}개
        </div>
      </div>
      
      {/* 3) 제출 */}
      <div>
        <button onClick={submit} style={styles.submit}>
          3) 제출하기
        </button>
      </div>
    </section>
  );
}

// --- 코드 에디터 패널(Monaco Editor 사용) ---
function CodeEditorPanel({
  problem,
  CLIENT_ID,
}: {
  problem: any;
  CLIENT_ID: string;
}) {
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    const raw = stripCommentedPlaceholdersRaw(problem?.code || "");
    setCode(
      raw.replace(/__\s*\d+\s*__/g, "") || "# write your solution here\n"
    );
  }, [problem?.id]);

  const lang = (problem?.language || "python").toLowerCase();

  const beforeMount: BeforeMount = (monacoInstance) => {
    // Visual Studio Dark+ 프로페셔널 테마
    monacoInstance.editor.defineTheme("vs-dark-plus-enhanced", {
      base: "vs-dark",
      inherit: true,
      rules: [
        // 주석 - 이탤릭체로 구분감 높이기
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "comment.line", foreground: "6A9955", fontStyle: "italic" },
        { token: "comment.block", foreground: "6A9955", fontStyle: "italic" },

        // 문자열 - 따뜻한 주황색
        { token: "string", foreground: "CE9178" },
        { token: "string.quoted", foreground: "CE9178" },
        { token: "string.template", foreground: "CE9178" },

        // 숫자 - 연한 녹색
        { token: "number", foreground: "B5CEA8" },
        { token: "number.hex", foreground: "B5CEA8" },
        { token: "number.float", foreground: "B5CEA8" },

        // 키워드 - 보라색 + 볼드
        { token: "keyword", foreground: "C586C0", fontStyle: "bold" },
        { token: "keyword.control", foreground: "C586C0", fontStyle: "bold" },
        { token: "keyword.operator", foreground: "D4D4D4" },

        // 타입과 클래스 - 민트색 + 볼드
        { token: "type", foreground: "4EC9B0", fontStyle: "bold" },
        { token: "support.type", foreground: "4EC9B0" },
        { token: "support.class", foreground: "4EC9B0" },

        // 함수 - 노란색 + 볼드
        { token: "function", foreground: "DCDCAA", fontStyle: "bold" },
        { token: "support.function", foreground: "DCDCAA" },
        { token: "entity.name.function", foreground: "DCDCAA" },

        // 변수 - 연한 파란색
        { token: "variable", foreground: "9CDCFE" },
        { token: "variable.parameter", foreground: "9CDCFE" },

        // 상수 - 밝은 파란색
        { token: "constant", foreground: "4FC1FF" },
        { token: "constant.language", foreground: "569CD6" },

        // 연산자와 구두점
        { token: "operator", foreground: "D4D4D4" },
        { token: "delimiter", foreground: "D4D4D4" },
        { token: "delimiter.bracket", foreground: "FFD700" },
        { token: "delimiter.parenthesis", foreground: "FFD700" },

        // JavaScript 특화
        { token: "support.constant.math", foreground: "4FC1FF" },
        { token: "meta.object-literal.key", foreground: "9CDCFE" },

        // Python 특화
        { token: "support.function.builtin.python", foreground: "DCDCAA" },
        { token: "constant.language.python", foreground: "569CD6" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#858585",
        "editorLineNumber.activeForeground": "#c6c6c6",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editorIndentGuide.background": "#404040",
        "editorIndentGuide.activeBackground": "#707070",
        "editor.wordHighlightBackground": "#575757b8",
        "editorBracketMatch.background": "#0064001a",
        "editorBracketMatch.border": "#888888",
        "editorGutter.background": "#1e1e1e",
        "editorWhitespace.foreground": "#404040",
      },
    });
  };

  const onMount: OnMount = (editor, _monaco) => {
    editor.updateOptions({
      fontSize: 16, // 더 큰 폰트로 가독성 향상
      fontFamily:
        "'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
      fontWeight: "400",
      lineHeight: 22, // 줄 간격 조정
      lineNumbers: "on",
      lineNumbersMinChars: 3,
      glyphMargin: true,
      folding: true, // 코드 접기 기능
      foldingStrategy: "indentation",
      showFoldingControls: "always",
      minimap: { enabled: false }, // 미니맵 비활성화로 공간 확보
      wordWrap: "on",
      wordWrapColumn: 120,
      tabSize: 4,
      insertSpaces: true, // 탭을 스페이스로 변환
      detectIndentation: true, // 자동 들여쓰기 감지
      trimAutoWhitespace: true, // 자동 공백 제거
      renderWhitespace: "boundary", // 공백 문자 표시
      // renderIndentGuides는 더 이상 사용되지 않음 - guides 옵션으로 대체됨
      smoothScrolling: true,
      cursorBlinking: "smooth", // 부드러운 커서 깜빡임
      cursorSmoothCaretAnimation: "on",
      cursorWidth: 2,
      multiCursorModifier: "ctrlCmd", // 다중 커서 지원
      formatOnPaste: true, // 붙여넣기 시 자동 포맷
      formatOnType: true, // 타이핑 시 자동 포맷
      autoIndent: "full", // 완전 자동 들여쓰기
      bracketPairColorization: { enabled: true }, // 괄호 색상화
      guides: {
        bracketPairs: true, // 괄호 쌍 가이드
        indentation: true, // 들여쓰기 가이드
        highlightActiveIndentation: true,
      },
      suggest: {
        snippetsPreventQuickSuggestions: false,
        localityBonus: true,
      },
      acceptSuggestionOnCommitCharacter: true,
      acceptSuggestionOnEnter: "on",
      tabCompletion: "on",
      wordBasedSuggestions: "currentDocument",
      parameterHints: { enabled: true },
      quickSuggestions: { other: true, comments: false, strings: false },
      scrollbar: {
        verticalScrollbarSize: 14,
        horizontalScrollbarSize: 14,
        useShadows: true,
      },
      overviewRulerBorder: false,
      hideCursorInOverviewRuler: true,
      scrollBeyondLastLine: false,
      scrollBeyondLastColumn: 5,
      stickyScroll: { enabled: true }, // 현재 함수/클래스 표시
      padding: { top: 10, bottom: 10 }, // 상하 여백
    });
  };

  const submit = async () => {
    const body = {
      mode: "editor",
      client_id: CLIENT_ID,
      problem_id: problem.id,
      language: lang,
      code: code, // code_user -> code로 변경
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    };
    try {
      const r = await fetch("/api/solve/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      alert(JSON.stringify(j, null, 2));
    } catch (error: any) {
      alert("제출 오류: " + (error?.message || error));
    }
  };

  return (
    <section className="flex flex-col gap-4">
      {/* 1) 문제 전문 */}
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>1) 문제 전문</div>
        <div className="text-sm whitespace-pre-wrap">
          {problem.statement || (
            <span className="text-gray-500">문제 설명 없음</span>
          )}
        </div>
      </div>

      {/* 2) Monaco 에디터 */}
      <div style={styles.codePanel}>
        <div style={{ ...styles.sectionTitle, color: "#e5e7eb" }}>
          2) 알고리즘을 작성할 수 있는 에디터
        </div>
        <Editor
          height="420px"
          language={lang} // 'python' | 'javascript' | ...
          theme="vs-dark-plus-enhanced" // Visual Studio Dark+ 프로페셔널 테마
          value={code}
          beforeMount={beforeMount}
          onMount={onMount}
          onChange={(v) => setCode(v ?? "")}
          options={{
            automaticLayout: true, // 컨테이너 리사이즈 반영
          }}
        />
      </div>

      {/* 3) 제출하기 */}
      <div>
        <button onClick={submit} style={styles.submit}>
          3) 제출하기
        </button>
      </div>
    </section>
  );
}

// --- 빈칸채우기(3스택, 힌트 없음) ---
function ClozePanel({
  problem,
  orderedBlanks,
  CLIENT_ID,
}: {
  problem: any;
  orderedBlanks: any[];
  CLIENT_ID: string;
}) {
  const segs = useMemo(
    () => parseClozeSegments(problem.code || ""),
    [problem?.code]
  );
  const blankIds = useMemo(
    () =>
      orderedBlanks
        .map((b) => Number(String(b.id).replace(/\D/g, "")))
        .filter((n) => n > 0),
    [orderedBlanks]
  );
  const [filled, setFilled] = useState<Record<number, string | null>>({});
  useEffect(() => {
    const init: Record<number, string | null> = {};
    blankIds.forEach((id) => (init[id] = null));
    setFilled(init);
  }, [blankIds.join(",")]);
  const onChange = (id: number, v: string) =>
    setFilled((p) => ({ ...p, [id]: v }));
  const onClear = (id: number) => setFilled((p) => ({ ...p, [id]: null }));

  const submit = async () => {
    const blanks_user = orderedBlanks.map((b: any) => ({
      id: Number(String(b.id).replace(/\D/g, "")),
      value: filled[Number(String(b.id).replace(/\D/g, ""))] ?? "",
    }));
    if (
      blanks_user.some((x) => !x.value) &&
      !confirm("빈칸이 비어 있습니다. 제출할까요?")
    )
      return;
    const body = {
      mode: "cloze",
      client_id: CLIENT_ID,
      problem_id: problem.id,
      blanks_user,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    };
    try {
      const r = await fetch("/api/solve/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      alert(JSON.stringify(await r.json(), null, 2));
    } catch (error: any) {
      alert("제출 오류: " + (error?.message || error));
    }
  };

  return (
    <section className="flex flex-col gap-4">
      {/* 1) 문제 */}
      <div style={styles.panel}>
        <div style={styles.sectionTitle}>1) 문제 전문</div>
        <div className="text-sm whitespace-pre-wrap">
          {problem.statement || (
            <span className="text-gray-500">문제 설명 없음</span>
          )}
        </div>
      </div>
      {/* 2) 코드(인라인 입력) */}
      <div style={styles.codePanel}>
        <div style={{ ...styles.sectionTitle, color: "#e5e7eb" }}>
          2) 빈칸을 적을 수 있는 정답 알고리즘
        </div>
        <pre
          className="rounded p-3 overflow-auto text-[13px] leading-6"
          style={{ background: "transparent" }}
        >
          <code className="font-mono whitespace-pre-wrap break-words">
            {segs.map((s, i) =>
              s.t === "text" ? (
                <span key={i}>{s.v}</span>
              ) : (
                <InputSlot
                  key={`input-${s.id}-${i}`}
                  id={s.id}
                  value={filled[s.id]}
                  onChange={onChange}
                  onClear={onClear}
                />
              )
            )}
          </code>
        </pre>
      </div>
      {/* 3) 제출 */}
      <div>
        <button onClick={submit} style={styles.submit}>
          3) 제출하기
        </button>
      </div>
    </section>
  );
}

// BlockDnD 컴포넌트 제거됨 (사용하지 않음)
