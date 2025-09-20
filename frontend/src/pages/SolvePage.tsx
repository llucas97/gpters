import { useMemo, useState } from "react";

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

// ===== code view helpers (same as QuizPage) =====
const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripCommentedPlaceholders = (escaped: string): string => {
  if (!escaped) return "";
  let out = escaped.replace(
    /(^|[\r\n])([ \t]*)#\s*__\s*(\d+)\s*__/g,
    (_m: string, a: string, indent: string, d: string): string =>
      `${a}${indent}__${d}__`
  );
  out = out.replace(
    /\/\*\s*__\s*(\d+)\s*__\s*\*\//g,
    (_m: string, d: string): string => `__${d}__`
  );
  out = out.replace(
    /\/\/\s*__\s*(\d+)\s*__/g,
    (_m: string, d: string): string => `__${d}__`
  );
  return out;
};
const emphasizePlaceholders = (code: string) => {
  const escaped = escapeHtml(code);
  const noComments = stripCommentedPlaceholders(escaped);
  return noComments.replace(
    /__\s*(\d+)\s*__/g,
    (_m, d) =>
      `<mark class="px-1 rounded bg-yellow-500/30 text-yellow-200 font-semibold">__${d}__</mark>`
  );
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
  const [uiLevel, setUiLevel] = useState<number>(2); // 0-5
  const [language, setLanguage] = useState<string>("javascript"); // editor용
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

  // 블록 모드 상태(토큰 박스)
  const [blockTokens, setBlockTokens] = useState<string[]>([]);
  // 클로즈 입력
  const [fills, setFills] = useState<string[]>([]);
  // 에디터 코드
  const [editorCode, setEditorCode] = useState<string>(
    "function solve(){\n  // TODO: implement\n  return 0;\n}"
  );

  // 로딩: 문제 생성 (랜덤)
  const fetchProblem = async () => {
    try {
      setLoading(true);
      setErr("");
      const topics = ["graph", "dp", "greedy", "tree", "string", "math"];
      const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
      const params = {
        level: 25 + Math.floor(Math.random() * 6),
        topic: pick(topics),
        language: "python",
      };

      const res = await fetch("/api/problem-bank/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error(await res.text());
      const j: Problem = await res.json();
      setProblem(j);
      setFills(Array((j.blanks ?? []).length).fill(""));
      // 블록 모드: 정답 토큰 셔플
      const tokens = (j.blanks ?? [])
        .map((b) => (b as any).answer ?? "")
        .filter(Boolean);
      setBlockTokens(shuffle(tokens));
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const shuffle = (arr: string[]) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const submitBlock = async () => {
    if (!problem) return;
    const started_at = new Date().toISOString();
    const finished_at = new Date().toISOString();
    const body = {
      mode: "block",
      client_id: CLIENT_ID,
      problem_id: problem.id,
      block_tokens: blockTokens,
      started_at,
      finished_at,
    };
    const r = await fetch("/api/solve/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    alert(JSON.stringify(j, null, 2));
  };

  const submitCloze = async () => {
    if (!problem) return;
    const blanks_user = orderedBlanks.map((b, i) => ({
      id: b.id,
      value: fills[i] ?? "",
    }));
    const body = {
      mode: "cloze",
      client_id: CLIENT_ID,
      problem_id: problem.id,
      blanks_user,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    };
    const r = await fetch("/api/solve/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    alert(JSON.stringify(j, null, 2));
  };

  const submitEditor = async () => {
    if (!problem) return;
    const body = {
      mode: "editor",
      client_id: CLIENT_ID,
      problem_id: problem.id,
      language,
      code: editorCode,
      started_at: new Date().toISOString(),
      finished_at: new Date().toISOString(),
    };
    const r = await fetch("/api/solve/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    alert(JSON.stringify(j, null, 2));
  };

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
            <option value="javascript">javascript</option>
            <option value="python" disabled>
              python (미지원)
            </option>
            <option value="cpp" disabled>
              cpp (미지원)
            </option>
          </select>
        </div>
        <button
          onClick={fetchProblem}
          disabled={loading}
          className="h-9 border rounded px-3 font-semibold hover:bg-gray-50"
        >
          {loading ? "불러오는 중..." : "문제 생성"}
        </button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          {/* ===== 0-1: 블록(토큰 드래그-드롭) ===== */}
          {uiLevel <= 1 && (
            <section>
              <h2 className="text-xl font-bold mb-2">블록 코딩(초급)</h2>
              <p className="text-sm text-gray-600 mb-2">
                정답 토큰을 올바른 순서로 정렬하세요.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 코드 미리보기 */}
                <div>
                  <div className="text-sm font-semibold mb-1">코드</div>
                  {(() => {
                    const html = emphasizePlaceholders(problem.code || "");
                    return (
                      <pre className="rounded-lg p-3 overflow-auto text-[13px] leading-6 bg-black text-white">
                        <code
                          className="font-mono whitespace-pre"
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      </pre>
                    );
                  })()}
                  <div className="mt-2 text-sm text-gray-600">힌트:</div>
                  <ol className="list-decimal ml-5 text-sm">
                    {orderedBlanks.map((b: any) => (
                      <li key={String(b.id)}>{b.hint || "(힌트 없음)"}</li>
                    ))}
                  </ol>
                </div>

                {/* 드래그 영역 */}
                <BlockDnD tokens={blockTokens} setTokens={setBlockTokens} />
              </div>

              <div className="mt-3">
                <button
                  onClick={submitBlock}
                  className="border rounded px-3 py-1 font-semibold hover:bg-gray-50"
                >
                  제출
                </button>
              </div>
            </section>
          )}

          {/* ===== 2-3: 빈칸 채우기 ===== */}
          {uiLevel >= 2 && uiLevel <= 3 && (
            <section>
              <h2 className="text-xl font-bold mb-2">빈칸 채우기</h2>
              {(() => {
                const html = emphasizePlaceholders(problem.code || "");
                return (
                  <pre className="rounded-lg p-3 overflow-auto text-[13px] leading-6 bg-black text-white">
                    <code
                      className="font-mono whitespace-pre"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  </pre>
                );
              })()}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {orderedBlanks.map((b: any, i: number) => (
                  <div key={String(b.id)} className="flex items-center gap-2">
                    <label className="text-sm w-20">빈칸 {b.id}</label>
                    <input
                      className="flex-1 border rounded px-2 py-1 text-sm"
                      value={fills[i] ?? ""}
                      onChange={(e) =>
                        setFills((p) => {
                          const n = p.slice();
                          n[i] = e.target.value;
                          return n;
                        })
                      }
                      placeholder="정답 입력"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button
                  onClick={submitCloze}
                  className="border rounded px-3 py-1 font-semibold hover:bg-gray-50"
                >
                  제출
                </button>
              </div>
            </section>
          )}

          {/* ===== 4-5: 코드 에디터(JS) ===== */}
          {uiLevel >= 4 && (
            <section>
              <h2 className="text-xl font-bold mb-2">코드 에디터</h2>
              <p className="text-sm text-gray-600 mb-2">
                현재는 JavaScript만 채점합니다.{" "}
                <code>function solve(...) {/* ... */}</code> 를 구현하세요.
              </p>
              <textarea
                value={editorCode}
                onChange={(e) => setEditorCode(e.target.value)}
                className="w-full h-64 border rounded p-2 font-mono text-sm"
              />
              <div className="mt-3">
                <button
                  onClick={submitEditor}
                  className="border rounded px-3 py-1 font-semibold hover:bg-gray-50"
                >
                  제출
                </button>
              </div>
              {/* 예시 표시 */}
              {Array.isArray(problem.examples) &&
                problem.examples.length > 0 && (
                  <div className="mt-3 text-sm">
                    <div className="font-semibold">테스트 예시</div>
                    <ul className="list-disc ml-5">
                      {problem.examples.map((ex, idx) => (
                        <li key={idx}>
                          <b>input:</b> {ex.input} <b>→ expected:</b>{" "}
                          {ex.output}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** 간단 드래그-드롭 정렬 컴포넌트 (레벨 0-1용) */
function BlockDnD({
  tokens,
  setTokens,
}: {
  tokens: string[];
  setTokens: (t: string[]) => void;
}) {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.dataTransfer.setData("text/plain", String(idx));
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isFinite(from)) return;
    const a = tokens.slice();
    const [moved] = a.splice(from, 1);
    a.splice(idx, 0, moved);
    setTokens(a);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  return (
    <div>
      <div className="text-sm font-semibold mb-1">토큰 순서</div>
      <div className="border rounded p-2 min-h-12">
        {tokens.length === 0 ? (
          <div className="text-sm text-gray-500">토큰이 없습니다.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tokens.map((t, i) => (
              <div
                key={i}
                draggable
                onDragStart={(e) => onDragStart(e, i)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, i)}
                className="cursor-move select-none bg-indigo-50 border border-indigo-200 px-2 py-1 rounded text-xs"
              >
                {t}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        드래그해서 순서를 맞춘 뒤 제출하세요.
      </div>
    </div>
  );
}
