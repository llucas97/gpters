'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function computeBlankConfig({ tier = 8, prevAcc = 0.6 }) {
  const base = tier <= 8 ? 2 : tier <= 12 ? 3 : tier <= 16 ? 4 : 5;
  let blanks = base;
  let depth = 'shallow';
  if (prevAcc >= 0.8) { blanks += 1; depth = 'mixed'; }
  if (prevAcc >= 0.9) { blanks += 1; depth = 'deep'; }
  if (prevAcc < 0.5) { blanks = Math.max(2, base - 1); depth = 'shallow'; }
  return { blanks, depth };
}

async function makeCloze({ problem, language = 'python', tags = [], tier = 8, prevAcc = 0.6 }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');
  const { blanks, depth } = computeBlankConfig({ tier, prevAcc });

  const system =
    'You are an algorithm tutor. Create a fill-in-the-blank coding exercise. ' +
    'Return STRICT JSON with keys: code, blanks. ' +
    'code: the source with placeholders like /* __1__ */, /* __2__ */. ' +
    'blanks: array of { id, answer, hint }. ' +
    'Do NOT include markdown. Keep code self-contained and runnable. ' +
    'Do NOT quote or reproduce any original problem statement; abstract the task.';

  const user = JSON.stringify({
    instruction: 'Generate a single-file solution; include minimal I/O or function stub.',
    language,
    blanks,
    depth,
    problem: {
      id: problem?.problemId,
      title: problem?.titleKo,
      url: problem?.problemId ? `https://www.acmicpc.net/problem/${problem.problemId}` : '',
      tags,
    },
  });

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}\n${text}`);
  let parsed;
  try {
    parsed = JSON.parse(JSON.parse(text)?.choices?.[0]?.message?.content || '{}');
  } catch {
    throw new Error(`Invalid JSON from model\n${text.slice(0, 200)}`);
  }
  if (!parsed?.code || !Array.isArray(parsed?.blanks)) {
    throw new Error('Malformed cloze payload (missing code/blanks)');
  }
  return { ...parsed, blanksCount: parsed.blanks.length, depth };
}

module.exports = { computeBlankConfig, makeCloze };
