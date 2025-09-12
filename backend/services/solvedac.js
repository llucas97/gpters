'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

const BASE = process.env.SOLVEDAC_BASE || 'https://solved.ac/api/v3';

async function _json(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'gpters/1.0 (quiz-lite)' } });
  const text = await res.text();
  if (!res.ok) throw new Error(`solved.ac ${res.status} ${url}\n${text}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`solved.ac JSON parse error\n${text.slice(0, 200)}`);
  }
}

async function getUserTier(handle) {
  const j = await _json(`${BASE}/user/show?handle=${encodeURIComponent(handle)}`);
  return j?.tier ?? null;
}

async function searchProblemsByTier({ tierMin, tierMax, tags = [], page = 1 }) {
  const tagQ = tags.map((t) => `tag:${t}`).join(' ');
  const query = `tier:${tierMin}..${tierMax} ${tagQ}`.trim();
  const j = await _json(`${BASE}/search/problem?query=${encodeURIComponent(query)}&page=${page}`);
  const items = j?.items ?? [];
  return items.map((p) => ({
    problemId: p.problemId ?? p.id,
    titleKo: p.titleKo ?? p.title ?? '',
    level: p.level ?? p.tier ?? null,
    tags: (p.tags ?? p.tagIds ?? []).map((t) => t?.key ?? t?.displayNames?.ko ?? String(t)),
  }));
}

module.exports = { getUserTier, searchProblemsByTier };
