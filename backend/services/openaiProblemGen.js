'use strict';

if (!global.fetch) {
  global.fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
}
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL   = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function placeholderSyntax(language) {
  const lang = String(language || '').toLowerCase();
  if (['py', 'python'].includes(lang)) {
    return { wrap: (n) => `# __${n}__` };
  }

  return { wrap: (n) => `/* __${n}__ */` };
}

function countPlaceholders(code) {
  return (String(code).match(/__\s*\d+\s*__/g) || []).length;
}

function normalizePlaceholders(code, language, blanksLen) {
  let src = String(code);
  const { wrap } = placeholderSyntax(language);

  if (countPlaceholders(src) === blanksLen) return src;

  const unders = src.match(/_{3,}/g);
  if (unders && unders.length === blanksLen) {
    let i = 1;
    src = src.replace(/_{3,}/g, () => wrap(i++));
    if (countPlaceholders(src) === blanksLen) return src;
  }

  src = src.replace(/(?:<|\[)?\s*BLANK\s*[-_ ]*(\d+)\s*(?:>|\])?/gi, (_, d) => wrap(Number(d)));
  if (countPlaceholders(src) === blanksLen) return src;

  src = src.replace(/__\s*(\d+)\s*__/g, (_, d) => wrap(Number(d)));
  return src;
}

function buildSystemPrompt(language) {
  const { wrap } = placeholderSyntax(language);
  const example = wrap('N').replace('N', 'N');
  return [
    'You are an algorithm problem author for programming contests.',
    'Generate a brand-new ORIGINAL problem (no copyrighted content).',
    'Return STRICT JSON with keys:',
    'title, statement, input_spec, output_spec, constraints, examples, difficulty_level, code_template, blanks.',
    '- statement/input_spec/output_spec/constraints: concise text.',
    "- examples: array of {input, output, explanation}.",
    '- difficulty_level: integer 1..30.',
    `- code_template: single-file starter code with placeholders EXACTLY as "__N__", using language-appropriate comments; for ${language}, use the form like: ${example}.`,
    '- blanks: array of {id:int, answer:string, hint:string}; ids start at 1 and match the placeholders.',
    'NO markdown, NO backticks. Return valid JSON only.',
    'Ensure the number of placeholders in code_template EQUALS blanks.length. Strictly follow the format.',
  ].join(' ');
}

function userPayload({ level, topic, language }) {
  return JSON.stringify({
    level, topic, language,
    instruction: 'Create minimal, self-contained starter code with placeholders for key expressions/lines.'
  });
}

async function generateProblem({ level = 10, topic = 'graph', language = 'python' }) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing');

  const system = buildSystemPrompt(language);
  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: userPayload({ level, topic, language }) },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(body)
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}\n${raw}`);

  let data;
  try {
    data = JSON.parse(JSON.parse(raw)?.choices?.[0]?.message?.content || '{}');
  } catch {
    throw new Error(`Invalid JSON from model\n${raw.slice(0, 200)}`);
  }

  const must = ['title','statement','input_spec','output_spec','examples','difficulty_level','code_template','blanks'];
  for (const k of must) if (!(k in data)) throw new Error(`missing field: ${k}`);
  if (!Array.isArray(data.examples) || !Array.isArray(data.blanks)) throw new Error('examples/blanks must be arrays');

  data.blanks = data.blanks.map((b, i) => {
    const n = Number(String(b.id ?? (i + 1)).toString().replace(/\D/g, '')) || (i + 1);
    return { id: n, answer: String(b.answer ?? ''), hint: String(b.hint ?? '') };
  });

  let code = String(data.code_template || '');
  code = normalizePlaceholders(code, language, data.blanks.length);
  const phCount = countPlaceholders(code);
  
  // placeholder와 blanks 개수가 맞지 않을 때 조정
  if (phCount !== data.blanks.length) {
    console.warn(`Placeholder count mismatch: placeholders(${phCount}) != blanks(${data.blanks.length})`);
    
    if (phCount > data.blanks.length) {
      // placeholder가 더 많으면 blanks를 추가
      const needed = phCount - data.blanks.length;
      for (let i = 0; i < needed; i++) {
        data.blanks.push({
          id: data.blanks.length + i + 1,
          answer: '???',
          hint: 'Fill in the blank'
        });
      }
    } else if (phCount < data.blanks.length) {
      // blanks가 더 많으면 blanks를 줄임
      data.blanks = data.blanks.slice(0, phCount);
    }
    
    // 여전히 0개라면 최소 1개는 만들기
    if (phCount === 0 && data.blanks.length === 0) {
      code = code + '\n# __1__ # Complete this line';
      data.blanks = [{ id: 1, answer: 'pass', hint: 'Complete the implementation' }];
    }
  }

  return {
    title: String(data.title || '').slice(0, 255),
    statement: String(data.statement || ''),
    input_spec: String(data.input_spec || ''),
    output_spec: String(data.output_spec || ''),
    constraints: String(data.constraints || ''),
    examples: data.examples,
    level: Number(data.difficulty_level || level) || level,
    language,
    topic,
    code,
    blanks: data.blanks
  };
}

module.exports = { generateProblem };
