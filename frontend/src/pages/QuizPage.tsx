import React, { useMemo, useState } from "react";

type BlankWire = { id: number | string; hint?: string };
type NextResp = {
  user?: { handle?: string; tier?: number; range?: string };
  problem?: { id?: number; title?: string; level?: number; url?: string };
  blankConfig?: any;
  code: string;
  blanks?: BlankWire[];
};

type Blank = { id: number; hint?: string };

function normalizeBlankId(id: number | string): number | null {
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    const m = id.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
  }
  return null;
}

function extractPlaceholderIdsFromCode(code: string): number[] {
  const ids = new Set<number>();
  for (const m of code.matchAll(/\/\*\s*__\s*(\d+)\s*__\s*\*\//g)) ids.add(parseInt(m[1], 10));
  for (const m of code.matchAll(/\/\/\s*__\s*(\d+)\s*__/g)) ids.add(parseInt(m[1], 10));
  for (const m of code.matchAll(/#\s*__\s*(\d+)\s*__/g)) ids.add(parseInt(m[1], 10));
  for (const m of code.matchAll(/__\s*(\d+)\s*__/g)) ids.add(parseInt(m[1], 10));
  return Array.from(ids).sort((a, b) => a - b);
}

function prettify(code: string): string {
  return code
    .replace(/\/\*\s*__\s*(\d+)\s*__\s*\*\//g, "[__$1__]")
    .replace(/\/\/\s*__\s*(\d+)\s*__/g, "[__$1__]")
    .replace(/#\s*__\s*(\d+)\s*__/g, "[__$1__]")
    .replace(/__\s*(\d+)\s*__/g, "[__$1__]");
}

export default function QuizPage() {
  const [handle, setHandle] = useState("");
  const [lang, setLang] = useState<"python" | "javascript" | "java">("python");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);

  const [resp, setResp] = useState<NextResp | null>(null);
  const [blanks, setBlanks] = useState<Blank[]>([]);

  const prettyCode = useMemo(() => (resp?.code ? prettify(resp.code) : ""), [resp?.code]);

  async function fetchNext() {
    if (!handle.trim()) {
      alert("solved.ac 핸들을 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        handle,
        lang,
        ...(tags.trim() ? { tags } : {}),
      }).toString();

      const r = await fetch(`/api/quiz/next?${qs}`);
      const j: NextResp = await r.json();
      if (!r.ok) throw new Error(typeof j === "string" ? j : "요청 실패");

      let normalized: Blank[] = [];
      if (j.blanks?.length) {
        normalized = j.blanks
          .map((b) => {
            const id = normalizeBlankId(b.id);
            return id ? { id, hint: b.hint } : null;
          })
          .filter(Boolean) as Blank[];
      }
      
      if (normalized.length === 0) {
        normalized = extractPlaceholderIdsFromCode(j.code).map((id) => ({ id }));
      }

      setResp(j);
      setBlanks(normalized);
    } catch (e: any) {
      alert(e?.message ?? "문제 불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "24px auto", padding: 16 }}>
      <h2>알고리즘 문제 불러오기</h2>

      <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
        <input
          placeholder="solved.ac 핸들"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
          style={{ padding: 8, minWidth: 220 }}
        />
        <select value={lang} onChange={(e) => setLang(e.target.value as any)} style={{ padding: 8 }}>
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
        </select>
        <input
          placeholder="태그(선택, 예: dp,graph)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          style={{ padding: 8, minWidth: 220 }}
        />
        <button onClick={fetchNext} disabled={loading || !handle.trim()}>
          {loading ? "불러오는 중..." : "문제 받기"}
        </button>
      </div>

      {resp && (
        <div style={{ display: "grid", gap: 12 }}>
          {}
          <div style={{ fontSize: 14, color: "#555" }}>
            {resp.problem?.title ?? "문제"}{" "}
            {resp.problem?.level ? `(lvl ${resp.problem.level})` : ""}
            {resp.problem?.url ? (
              <>
                {" · "}
                <a href={resp.problem.url} target="_blank" rel="noreferrer">
                  원문
                </a>
              </>
            ) : null}
            {resp.user?.handle ? (
              <span style={{ float: "right", opacity: 0.75 }}>
                @{resp.user.handle} · tier {resp.user.tier ?? "-"} · {resp.user.range ?? ""}
              </span>
            ) : null}
          </div>

          {}
          <pre
            style={{
              background: "#0b1020",
              color: "#e6e6e6",
              padding: 12,
              borderRadius: 8,
              whiteSpace: "pre-wrap",
              overflowX: "auto",
            }}
          >
            <code>{prettyCode}</code>
          </pre>

          {}
          <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <b>힌트</b>
            <ul style={{ marginTop: 8 }}>
              {blanks.map((b) => (
                <li key={b.id}>
                  #{b.id} {b.hint ? `: ${b.hint}` : ""}
                </li>
              ))}
            </ul>
            {!blanks.length && <div style={{ color: "#777" }}>표시할 빈칸이 없습니다.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
