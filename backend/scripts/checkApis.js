const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

(async () => {
  let _fetch = global.fetch;
  if (!_fetch) {
    _fetch = (await import('node-fetch')).default;
  }
  const fetch = (...args) => _fetch(...args);

  const key = process.env.OPENAI_API_KEY || '';
  console.log('OPENAI_API_KEY:', key ? key.slice(0, 7) + '...' : '(missing)');
  console.log('OPENAI_MODEL :', process.env.OPENAI_MODEL || '(default gpt-4o-mini)');
  console.log('SOLVEDAC_BASE:', process.env.SOLVEDAC_BASE || '(default https://solved.ac/api/v3)');
  console.log('Node version :', process.version);

  async function checkSolvedAc(handle = 'koosaga') {
    const base = process.env.SOLVEDAC_BASE || 'https://solved.ac/api/v3';
    const url = `${base}/user/show?handle=${encodeURIComponent(handle)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'gpters-check/1.0' } });
    const text = await res.text();
    console.log('\n[solved.ac] status:', res.status);
    if (!res.ok) throw new Error(text);
    try {
      const j = JSON.parse(text);
      console.log('[solved.ac] sample:', { handle: j.handle, tier: j.tier, solvedCount: j.solvedCount });
    } catch (e) {
      console.log('[solved.ac] JSON parse err:', e.message, 'body:', text.slice(0, 200));
    }
  }

  async function checkOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('\n[openai] OPENAI_API_KEY missing → skip test'); return;
    }
    const body = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Return only: OK' }],
      max_tokens: 4,
      temperature: 0
    };
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(async () => ({ raw: await res.text() }));
    console.log('\n[openai] status:', res.status);
    console.log('[openai] sample:', data?.choices?.[0]?.message?.content ?? data);
  }

  const handle = process.argv[2] || 'koosaga';
  try { await checkSolvedAc(handle); } catch (e) { console.error('[solved.ac] error:', e.message); }
  try { await checkOpenAI(); } catch (e) { console.error('[openai] error:', e.message); }
})();
