import { useState, useMemo } from "react";

// HTML 이스케이프 (태그 실행 방지)
const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 라인/구간 주석 바로 앞의 플레이스홀더만 깔끔히 남기기
const stripCommentedPlaceholders = (escaped: string) => {
  // 1) 파이썬 스타일:  [indent]# __N__  →  [indent]__N__
  let out = escaped.replace(
    /(^|\n)([ \t]*)#\s*__\s*(\d+)\s*__/g,
    (_m, a, indent, d) => `${a}${indent}__${d}__`
  );
  // 2) C/JS 블록 주석: /* __N__ */ → __N__
  out = out.replace(/\/\*\s*__\s*(\d+)\s*__\s*\*\//g, (_m, d) => `__${d}__`);
  // 3) C/JS 라인 주석: // __N__ → __N__
  out = out.replace(/\/\/\s*__\s*(\d+)\s*__/g, (_m, d) => `__${d}__`);
  return out;
};

// __N__을 <mark>로 강조 (배경 노란색, 글자 약간 강조)
const emphasizePlaceholders = (code: string) => {
  const escaped = escapeHtml(code);
  const noComments = stripCommentedPlaceholders(escaped);
  return noComments.replace(
    /__\s*(\d+)\s*__/g,
    (_m, d) =>
      `<mark class="px-1 rounded bg-yellow-500/30 text-yellow-200 font-semibold">__${d}__</mark>`
  );
};

type Blank = {
  id: number;
  hint?: string;
  answer?: string;
};

type GeneratedProblem = {
  id?: number;
  title: string;
  statement?: string;
  input_spec?: string;
  output_spec?: string;
  constraints?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  code: string;
  blanks: Blank[];
  level?: number;
  topic?: string;
  language?: string;
};

export default function QuizPage() {
  // 생성 파라미터
  const [level, setLevel] = useState<number>(29);
  const [topic, setTopic] = useState<string>("graph");
  const [language, setLanguage] = useState<string>("python");

  // 데이터 & UI 상태
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [fills, setFills] = useState<string[]>([]);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");

  // blanks 정렬 (id 오름차순)
  const orderedBlanks = useMemo(() => {
    const arr = (problem?.blanks ?? []).slice().map((b) => {
      const n = Number(String(b.id).replace(/\D/g, ""));
      return { ...b, id: Number.isFinite(n) && n > 0 ? n : 1 };
    });
    arr.sort((a, b) => a.id - b.id);
    return arr;
  }, [problem]);

  const fetchGeneratedProblem = async () => {
    try {
      setLoading(true);
      setErr("");
      setScore(null);
      setShowAnswers(false);

      const res = await fetch("/api/problem-bank/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic, language }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`API ${res.status}: ${t}`);
      }
      const j: GeneratedProblem = await res.json();

      // blanks 정규화 길이에 맞춰 입력칸 초기화
      const blanksLen = (j.blanks ?? []).length;
      setProblem(j);
      setFills(Array(blanksLen).fill(""));
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  const updateFill = (i: number, v: string) => {
    setFills((prev) => {
      const next = prev.slice();
      next[i] = v;
      return next;
    });
  };

  const grade = () => {
    if (!problem) return;
    const blanks = orderedBlanks;
    let correct = 0;
    blanks.forEach((b, i) => {
      const a = (b.answer ?? "").trim();
      const u = (fills[i] ?? "").trim();
      if (a.length > 0 && u.length > 0 && a === u) correct++;
    });
    setScore({ correct, total: blanks.length });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold">알고리즘 빈칸 학습</h1>

      {/* 생성 파라미터 */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-sm text-gray-600">Level</label>
          <input
            type="number"
            value={level}
            onChange={(e) => setLevel(Number(e.target.value || 0))}
            className="w-full border rounded px-2 py-1"
            min={1}
            max={30}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="graph, dp, greedy ..."
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="python">python</option>
            <option value="javascript">javascript</option>
            <option value="cpp">cpp</option>
            <option value="java">java</option>
            <option value="typescript">typescript</option>
          </select>
        </div>
        <button
          onClick={fetchGeneratedProblem}
          disabled={loading}
          className="h-9 border rounded px-3 font-semibold hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? "생성 중..." : "문제 생성"}
        </button>
      </div>

      {err && (
        <div className="mt-3 text-sm text-red-600 whitespace-pre-wrap">
          에러: {err}
        </div>
      )}

      {/* 문제 표시 */}
      {problem && (
        <div className="mt-6 space-y-6">
          {/* 문제 전문 */}
          <section>
            <h2 className="text-xl font-bold mb-2">문제 전문</h2>
            <div className="border rounded p-3 whitespace-pre-wrap">
              <div className="font-semibold mb-2">[{problem.title}]</div>
              {problem.statement ? (
                <div className="mb-3">{problem.statement}</div>
              ) : (
                <div className="mb-3 text-gray-500">
                  문제 설명이 포함되지 않았습니다.
                </div>
              )}
              {(problem.input_spec || problem.output_spec) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border rounded p-2">
                    <div className="text-sm font-semibold mb-1">입력 형식</div>
                    <div className="whitespace-pre-wrap text-sm">
                      {problem.input_spec ?? "-"}
                    </div>
                  </div>
                  <div className="border rounded p-2">
                    <div className="text-sm font-semibold mb-1">출력 형식</div>
                    <div className="whitespace-pre-wrap text-sm">
                      {problem.output_spec ?? "-"}
                    </div>
                  </div>
                </div>
              )}
              {problem.constraints && (
                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                  <span className="font-semibold">제약:</span>{" "}
                  {problem.constraints}
                </div>
              )}
              {Array.isArray(problem.examples) &&
                problem.examples.length > 0 && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold mb-1">예시</div>
                    <div className="space-y-2">
                      {problem.examples.map((ex, idx) => (
                        <div key={idx} className="border rounded p-2 text-sm">
                          <div>
                            <span className="font-semibold">입력:</span>{" "}
                            <pre className="inline whitespace-pre-wrap">
                              {ex.input}
                            </pre>
                          </div>
                          <div>
                            <span className="font-semibold">출력:</span>{" "}
                            <pre className="inline whitespace-pre-wrap">
                              {ex.output}
                            </pre>
                          </div>
                          {ex.explanation && (
                            <div className="text-gray-600 whitespace-pre-wrap">
                              {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </section>
          +{" "}
          {/* 알고리즘 빈칸 문제 (검은 배경 + 흰 글자 + 빈칸 주석 제거/강조) */}
          <section>
            <h2 className="text-xl font-bold mb-2">알고리즘 빈칸 문제</h2>
            {(() => {
              const displayHtml = emphasizePlaceholders(problem?.code ?? "");
              return (
                <pre className="rounded-lg p-4 overflow-auto text-[13px] leading-6 bg-black text-white">
                  <code
                    className="font-mono whitespace-pre"
                    dangerouslySetInnerHTML={{ __html: displayHtml }}
                  />
                </pre>
              );
            })()}
          </section>
          {/* 힌트 */}
          <section>
            <h2 className="text-xl font-bold mb-2">힌트</h2>
            <div className="border rounded p-3">
              {orderedBlanks.length === 0 ? (
                <div className="text-gray-500 text-sm">힌트가 없습니다.</div>
              ) : (
                <ol className="list-decimal ml-5 space-y-1">
                  {orderedBlanks.map((b) => (
                    <li key={b.id} className="text-sm">
                      <span className="font-semibold">빈칸 {b.id}:</span>{" "}
                      {b.hint || "(힌트 없음)"}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
          {/* 답 입력 */}
          <section>
            <h2 className="text-xl font-bold mb-2">답을 적을 수 있는 칸</h2>
            <div className="border rounded p-3">
              {orderedBlanks.length === 0 ? (
                <div className="text-gray-500 text-sm">
                  입력할 빈칸이 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {orderedBlanks.map((b, i) => (
                    <div key={b.id} className="flex items-center gap-2">
                      <label className="text-sm w-20">빈칸 {b.id}</label>
                      <input
                        value={fills[i] ?? ""}
                        onChange={(e) => updateFill(i, e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        placeholder={`정답 입력`}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={grade}
                  className="border rounded px-3 py-1 font-semibold hover:bg-gray-50"
                >
                  채점
                </button>
                <button
                  onClick={() => setShowAnswers((s) => !s)}
                  className="border rounded px-3 py-1 font-semibold hover:bg-gray-50"
                >
                  {showAnswers ? "정답 숨기기" : "정답 보기"}
                </button>
              </div>
              {score && (
                <div className="mt-2 text-sm">
                  점수: <span className="font-semibold">{score.correct}</span> /{" "}
                  {score.total}
                </div>
              )}
            </div>
          </section>
          {/* 정답 보기 (토글) */}
          {showAnswers && (
            <section>
              <h2 className="text-xl font-bold mb-2">정답</h2>
              <div className="border rounded p-3">
                {orderedBlanks.length === 0 ? (
                  <div className="text-gray-500 text-sm">
                    정답 데이터가 없습니다.
                  </div>
                ) : (
                  <ol className="list-decimal ml-5 space-y-1 text-sm">
                    {orderedBlanks.map((b) => (
                      <li key={b.id}>
                        빈칸 {b.id}:{" "}
                        <code className="bg-gray-100 px-1 rounded">
                          {b.answer ?? "(제공되지 않음)"}
                        </code>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
