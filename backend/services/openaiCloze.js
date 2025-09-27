'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

// === 유틸: 강건 JSON 파서 + JS용 정리 ===
const JSON5 = require('json5');

function extractFirstJsonLike(text='') {
  // ```json ... ``` 안쪽 또는 가장 바깥 { ... } 추출
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = text.indexOf('{');
  const last  = text.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return text.slice(first, last+1);
  return text.trim();
}

function safeParse(text='') {
  try { return JSON.parse(text); } catch { /* noop */ }
  try { return JSON5.parse(text); } catch { /* noop */ }
  // 흔한 노이즈 제거 후 재시도
  let t = text
    .replace(/^[^\{\[]+/, '')               // 앞쪽 잡다한 문구 제거
    .replace(/```[\s\S]*?```/g, '')         // 코드펜스 제거
    .replace(/,\s*([}\]])/g, '$1')          // 트레일링 콤마 제거
    .trim();
  try { return JSON.parse(t); } catch { /* noop */ }
  try { return JSON5.parse(t); } catch { /* noop */ }
  return null;
}

// JS 코드에 섞인 주석형 플레이스홀더를 실제 토큰으로 정리
function normalizeJsPlaceholders(code='') {
  return code
    .replace(/\/\*\s*__\s*(\d+)\s*__\s*\*\//g, '__$1__')
    .replace(/\/\/\s*__\s*(\d+)\s*__/g, '__$1__');
}

// 레벨0: 2칸·1단어 토큰 강제(이전 안내대로)
function sanitizeSingleWordToken(s) {
  if (!s) return null;
  const first = String(s).trim().split(/\s+/)[0];
  let t = first.normalize('NFKC').replace(/[^A-Za-z0-9_]/g,'_').replace(/_+/g,'_').replace(/^_+|_+$/g,'');
  return (t || 'val').toLowerCase();
}
function extractPlaceholderIds(code) {
  const out = new Set(); const re = /__\s*(\d+)\s*__/g; let m;
  while ((m = re.exec(code)) !== null) out.add(Number(m[1]));
  return Array.from(out).sort((a,b)=>a-b);
}
function replacePlaceholder(code, id, rep) {
  return code.replace(new RegExp(`__\\s*${id}\\s*__`,'g'), rep);
}
function enforceLevel0Shape(result) {
  if (!result || typeof result !== 'object') return result;
  let { code = '', blanks = [] } = result;
  const ids = extractPlaceholderIds(code);
  const map = new Map();
  for (const b of (blanks||[])) {
    const id = Number(String(b?.id ?? b).replace(/\D/g,''));
    if (!id) continue;
    const ans = sanitizeSingleWordToken(b?.answer ?? b?.value ?? '');
    if (ans) map.set(id, ans);
  }
  for (const id of ids) {
    if (id === 1 || id === 2) continue;
    code = replacePlaceholder(code, id, map.get(id) || 'x');
  }
  for (const k of [1,2]) {
    if (!new RegExp(`__\\s*${k}\\s*__`).test(code)) {
      code = code.replace(/\b([A-Za-z_][A-Za-z0-9_]*)\b/, `__${k}__`);
    }
  }
  const ans1 = sanitizeSingleWordToken(map.get(1) || 'n');
  const ans2 = sanitizeSingleWordToken(map.get(2) || 'arr');
  return { ...result, code, blanks: [{id:1,hint:'간단한 식별자 1',answer:ans1},{id:2,hint:'간단한 식별자 2',answer:ans2}] };
}

module.exports = {
  // 강건 JSON 파서
  extractFirstJsonLike,
  safeParse,
  normalizeJsPlaceholders,
  
  // 레벨0 전용 유틸
  sanitizeSingleWordToken,
  extractPlaceholderIds,
  replacePlaceholder,
  enforceLevel0Shape
};
