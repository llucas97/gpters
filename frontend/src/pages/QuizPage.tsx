import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { CLIENT_ID } from "../utils/clientId";
import { ApiErrorHandler } from "../utils/apiHelpers";
import type { GeneratedProblem, StudyLogData } from "../types/api";

// ===== 코드 표시 헬퍼들 (주석 제거 + 빈칸 강조) =====
const escapeHtml = (s: string) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const stripCommentedPlaceholders = (escaped: string) => {
  let out = escaped.replace(
    /(^|\n)([ \t]*)#\s*__\s*(\d+)\s*__/g,
    (_m, a, indent, d) => `${a}${indent}__${d}__`
  );
  out = out.replace(/\/\*\s*__\s*(\d+)\s*__\s*\*\//g, (_m, d) => `__${d}__`);
  out = out.replace(/\/\/\s*__\s*(\d+)\s*__/g, (_m, d) => `__${d}__`);
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

// 타입은 별도 파일에서 import

export default function QuizPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    navigate('/login');
    return (
      <div className="max-w-4xl mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-600">로그인이 필요합니다</h1>
        <p className="mt-2 text-gray-500">잠시 후 로그인 페이지로 이동합니다...</p>
      </div>
    );
  }

  // 생성 파라미터
  const [level, setLevel] = useState<number | "">("");
  const [topic, setTopic] = useState<string>("");
  const [language, setLanguage] = useState<string>("python");
  const [randomize, setRandomize] = useState<boolean>(true); // ✅ 기본 랜덤

  // 데이터 & UI 상태
  const [problem, setProblem] = useState<GeneratedProblem | null>(null);
  const [fills, setFills] = useState<string[]>([]);
  const [showAnswers, setShowAnswers] = useState<boolean>(false);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [err, setErr] = useState<string>("");
  const [startedAtMs, setStartedAtMs] = useState<number | null>(null);

  const orderedBlanks = useMemo(() => {
    const arr = (problem?.blanks ?? []).map((b) => {
      const n = Number(String(b.id).replace(/\D/g, ""));
      return { ...b, id: Number.isFinite(n) && n > 0 ? n : 1 };
    });
    arr.sort((a, b) => a.id - b.id);
    return arr;
  }, [problem]);

  const randomParams = () => {
    const topics = [
      "graph",
      "dp",
      "greedy",
      "tree",
      "string",
      "math",
      "number theory",
      "binary search",
      "two pointers",
      "shortest path",
    ];
    const langs = ["python", "javascript", "cpp", "java", "typescript"];
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    const rndLevel = 20 + Math.floor(Math.random() * 11); // 20~30
    return {
      level: rndLevel,
      topic: pick(topics),
      language: pick(langs),
    };
  };

  const fetchGeneratedProblem = async () => {
    try {
      setLoading(true);
      setErr("");
      setScore(null);
      setShowAnswers(false);

      const params = randomize
        ? randomParams()
        : {
            level: typeof level === "number" ? level : 29,
            topic: topic || "graph",
            language: language || "python",
          };

      const response = await fetch("/api/problem-bank/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const problemData = await ApiErrorHandler.handleResponse<GeneratedProblem>(response);

      setProblem(problemData);
      setFills(Array((problemData.blanks ?? []).length).fill(""));
      setStartedAtMs(Date.now());
      // 선택적으로, 생성된 언어/주제/레벨 UI 반영
      setLanguage(problemData.language || params.language);
      setTopic(problemData.topic || params.topic);
      setLevel(problemData.level ?? params.level);
    } catch (error) {
      setErr(ApiErrorHandler.formatError(error));
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
      if (a && u && a === u) correct++;
    });
    setScore({ correct, total: blanks.length });

    // ---- 학습 로그 저장 (핸들 없이 client_id로) ----
    try {
      const duration = startedAtMs ? Date.now() - startedAtMs : null;
      const detail = blanks.map((b, i) => ({
        id: b.id,
        user: (fills[i] ?? "").trim(),
        answer: (b.answer ?? "").trim(),
        correct: (b.answer ?? "").trim() === (fills[i] ?? "").trim(),
      }));

      const logData: StudyLogData = {
        user_id: user?.id, // 로그인된 사용자 ID 추가
        client_id: CLIENT_ID, // 백업용으로 유지
        language: problem.language || "python",
        topic: problem.topic || "unknown",
        level: problem.level || 0,
        source: "bank",
        problem_id: problem.id || undefined,
        started_at: startedAtMs
          ? new Date(startedAtMs).toISOString()
          : undefined,
        finished_at: new Date().toISOString(),
        duration_ms: duration ?? undefined,
        blanks_total: blanks.length,
        blanks_correct: correct,
        blanks_detail: detail,
      };

      fetch("/api/analytics/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 세션 쿠키 포함
        body: JSON.stringify(logData),
      }).catch((error) => {
        console.warn("Failed to log study data:", error);
      });
    } catch (error) {
      console.warn("Failed to prepare study log:", error);
    }
  };

  // ===== 렌더 =====
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">알고리즘 빈칸 학습</h1>
        <div className="text-sm text-gray-600">
          안녕하세요, <span className="font-semibold text-blue-600">{user?.username}</span>님!
        </div>
      </div>

      {/* 생성 파라미터 (핸들 제거, 랜덤 옵션 추가) */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
        <div className="flex items-center gap-2">
          <input
            id="rnd"
            type="checkbox"
            checked={randomize}
            onChange={(e) => setRandomize(e.target.checked)}
          />
          <label htmlFor="rnd" className="text-sm">
            랜덤 생성
          </label>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Level</label>
          <input
            type="number"
            value={level}
            onChange={(e) =>
              setLevel(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full border rounded px-2 py-1"
            min={1}
            max={30}
            disabled={randomize}
            placeholder="(랜덤)"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Topic</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border rounded px-2 py-1"
            placeholder="graph, dp, ..."
            disabled={randomize}
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border rounded px-2 py-1"
            disabled={randomize}
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

          {/* 알고리즘 빈칸 문제 (검은 배경 + 흰 글자 + 빈칸 강조/주석 제거) */}
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

          {/* 정답 보기 */}
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
                        <code className="bg-gray-100 px-1 rounded text-gray-800">
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
