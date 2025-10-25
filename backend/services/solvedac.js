'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}

let jsdom;
try {
  jsdom = require('jsdom');
} catch (e) {
  console.warn('JSDOM not available, will use basic text parsing');
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
    url: `https://www.acmicpc.net/problem/${p.problemId ?? p.id}`,
  }));
}

async function scrapeBaekjoonProblem(problemId) {
  try {
    console.log(`Scraping Baekjoon problem ${problemId}`);
    const url = `https://www.acmicpc.net/problem/${problemId}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    
    if (!jsdom) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s*-\s*백준\s*온라인\s*ㅖ지/i, '').trim() : '';
      
      return {
        title,
        description: '문제 설명을 가져올 수 없습니다. 원문 링크를 확인해주세요.',
        inputDescription: '',
        outputDescription: '',
        examples: []
      };
    }
    
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const titleElement = document.querySelector('#problem_title');
    const title = titleElement ? titleElement.textContent.trim() : '';
    
    const descElement = document.querySelector('#problem_description');
    const description = descElement ? descElement.textContent.trim() : '';
    
    const inputElement = document.querySelector('#problem_input');
    const inputDescription = inputElement ? inputElement.textContent.trim() : '';
    
    const outputElement = document.querySelector('#problem_output');
    const outputDescription = outputElement ? outputElement.textContent.trim() : '';
    
    const examples = [];
    const sampleInputs = document.querySelectorAll('pre[id^="sample-input"]');
    const sampleOutputs = document.querySelectorAll('pre[id^="sample-output"]');
    
    for (let i = 0; i < Math.min(sampleInputs.length, sampleOutputs.length); i++) {
      examples.push({
        input: sampleInputs[i].textContent.trim(),
        output: sampleOutputs[i].textContent.trim()
      });
    }
    
    return {
      title,
      description,
      inputDescription,
      outputDescription,
      examples
    };
    
  } catch (e) {
    console.error(`Failed to scrape Baekjoon problem ${problemId}:`, e.message);
    return null;
  }
}

async function getProblemDetail(problemId) {
  try {
    console.log(`Fetching problem detail for ID: ${problemId}`);
    
    let solvedacData = null;
    try {
      const j = await _json(`${BASE}/problem/show?problemId=${problemId}`);
      console.log(`Solved.ac response keys:`, Object.keys(j));
      solvedacData = {
        problemId: j.problemId ?? j.id,
        titleKo: j.titleKo ?? j.title ?? '',
        level: j.level ?? j.tier ?? null,
        tags: (j.tags ?? j.tagIds ?? []).map((t) => t?.key ?? t?.displayNames?.ko ?? String(t)),
        url: `https://www.acmicpc.net/problem/${j.problemId ?? j.id}`,
        description: j.description || '',
        inputDescription: j.inputDescription || '',
        outputDescription: j.outputDescription || '',
        examples: j.examples || [],
      };
    } catch (e) {
      console.log(`Solved.ac API failed, will try scraping: ${e.message}`);
    }
    
    let baekjoonData = null;
    if (!solvedacData?.description || !solvedacData?.examples?.length) {
      baekjoonData = await scrapeBaekjoonProblem(problemId);
    }
    
    return {
      problemId: solvedacData?.problemId || problemId,
      titleKo: solvedacData?.titleKo || baekjoonData?.title || '',
      level: solvedacData?.level || null,
      tags: solvedacData?.tags || [],
      url: `https://www.acmicpc.net/problem/${problemId}`,
      description: solvedacData?.description || baekjoonData?.description || `백준 ${problemId}번 문제입니다.`,
      inputDescription: solvedacData?.inputDescription || baekjoonData?.inputDescription || '',
      outputDescription: solvedacData?.outputDescription || baekjoonData?.outputDescription || '',
      examples: solvedacData?.examples?.length ? solvedacData.examples : (baekjoonData?.examples || []),
    };
    
  } catch (e) {
    console.error(`Failed to get problem detail for ${problemId}:`, e.message);
    return null;
  }
}

module.exports = { getUserTier, searchProblemsByTier, getProblemDetail };
