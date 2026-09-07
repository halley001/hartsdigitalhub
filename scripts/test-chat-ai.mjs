// Exercises api/chat.js end to end with fetch stubbed, so the orchestration,
// escalation parsing, provider fallback and logging are all verified without
// touching a real API or a real database.
import handler from '../api/chat.js';

const realFetch = globalThis.fetch;
let stub = null;
globalThis.fetch = async (url, opts) => stub(String(url), opts);

function mkRes() {
  const r = { statusCode: null, body: null };
  r.status = c => { r.statusCode = c; return r; };
  r.json = b => { r.body = b; return r; };
  return r;
}

const req = (messages, lang = 'en') => ({ method: 'POST', body: { messages, lang } });
const ask = q => [{ role: 'user', content: q }];

function geminiOk(text) {
  return async (url) => {
    if (url.includes('generativelanguage')) {
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] }) };
    }
    throw new Error('unexpected call: ' + url);
  };
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra ? '  → ' + JSON.stringify(extra) : '')); }
}

console.log('\n── 1. No provider configured → 503 not-configured (rules keep their answer)');
{
  delete process.env.GEMINI_API_KEY; delete process.env.XAI_API_KEY;
  const res = mkRes();
  await handler(req(ask('do you do bookkeeping software?')), res);
  check('status 503', res.statusCode === 503, res.body);
  check('reason not-configured', res.body?.reason === 'not-configured', res.body);
}

console.log('\n── 2. Gemini answers plainly → 200, no escalation');
{
  process.env.GEMINI_API_KEY = 'test-key';
  stub = geminiOk('We build the automation and the systems underneath it. What are you trying to fix?');
  const res = mkRes();
  await handler(req(ask('what do you actually do?')), res);
  check('status 200', res.statusCode === 200, res.body);
  check('reply passed through', /automation and the systems/.test(res.body?.reply || ''), res.body);
  check('escalate null', res.body?.escalate === null, res.body);
  check('provider gemini', res.body?.provider === 'gemini', res.body);
}

console.log('\n── 3. Live-data question → [[ESCALATE:human]] marker stripped, flag set');
{
  stub = geminiOk('[[ESCALATE:human]]\nLet us check that with the team and come straight back to you.');
  const res = mkRes();
  await handler(req(ask('is order 4821 shipped yet?')), res);
  check('status 200', res.statusCode === 200, res.body);
  check('escalate human', res.body?.escalate === 'human', res.body);
  check('marker stripped', !/ESCALATE/.test(res.body?.reply || ''), res.body);
  check('sentence kept', /check that with the team/.test(res.body?.reply || ''), res.body);
}

console.log('\n── 4. Pricing question → [[ESCALATE:catalog]]');
{
  stub = geminiOk('[[ESCALATE:catalog]]\nHere is what each one covers.');
  const res = mkRes();
  await handler(req(ask('what do your packages cost?')), res);
  check('escalate catalog', res.body?.escalate === 'catalog', res.body);
  check('marker stripped', !/ESCALATE/.test(res.body?.reply || ''), res.body);
}

console.log('\n── 5. Stray mid-answer marker is swept too');
{
  stub = geminiOk('We can do that. [[ESCALATE:human]] Someone will confirm.');
  const res = mkRes();
  await handler(req(ask('can you integrate odoo?')), res);
  check('no marker leaks to visitor', !/ESCALATE/.test(res.body?.reply || ''), res.body);
  check('not treated as escalation (not first line)', res.body?.escalate === null, res.body);
}

console.log('\n── 6. Gemini fails, no xAI → 502 provider-failed + escalate human');
{
  delete process.env.XAI_API_KEY;
  stub = async () => ({ ok: false, status: 429, text: async () => 'rate limited' });
  const res = mkRes();
  await handler(req(ask('anything')), res);
  check('status 502', res.statusCode === 502, res.body);
  check('reason provider-failed', res.body?.reason === 'provider-failed', res.body);
  check('escalate human', res.body?.escalate === 'human', res.body);
}

console.log('\n── 7. Gemini fails, xAI configured → falls through to xAI');
{
  process.env.XAI_API_KEY = 'xai-test';
  stub = async (url) => {
    if (url.includes('generativelanguage')) return { ok: false, status: 500, text: async () => 'boom' };
    if (url.includes('api.x.ai')) {
      return { ok: true, json: async () => ({ choices: [{ message: { content: 'Answered by the backup model.' } }] }) };
    }
    throw new Error('unexpected: ' + url);
  };
  const res = mkRes();
  await handler(req(ask('anything')), res);
  check('status 200', res.statusCode === 200, res.body);
  check('provider xai', res.body?.provider === 'xai', res.body);
  check('reply from backup', /backup model/.test(res.body?.reply || ''), res.body);
  delete process.env.XAI_API_KEY;
}

console.log('\n── 8. Gemini timeout is caught, not thrown');
{
  process.env.GEMINI_TIMEOUT_MS = '40';
  stub = async (url, opts) => new Promise((_, reject) => {
    opts.signal.addEventListener('abort', () => {
      const e = new Error('aborted'); e.name = 'AbortError'; reject(e);
    });
  });
  const res = mkRes();
  await handler(req(ask('anything')), res);
  check('status 502', res.statusCode === 502, res.body);
  check('error mentions timeout', /timed out/.test(res.body?.error || ''), res.body);
  delete process.env.GEMINI_TIMEOUT_MS;
}

console.log('\n── 9. Safety-blocked / empty candidate is a failure, not a blank bubble');
{
  stub = async () => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'SAFETY', content: { parts: [] } }] }) });
  const res = mkRes();
  await handler(req(ask('anything')), res);
  check('status 502', res.statusCode === 502, res.body);
  check('error names the reason', /SAFETY/.test(res.body?.error || ''), res.body);
}

console.log('\n── 10. Bad input still rejected');
{
  const res = mkRes();
  await handler({ method: 'POST', body: { messages: 'nope' } }, res);
  check('status 400', res.statusCode === 400, res.body);
  const res2 = mkRes();
  await handler({ method: 'GET', body: {} }, res2);
  check('GET rejected 405', res2.statusCode === 405, res2.body);
}

console.log('\n── 11. System prompt actually carries the knowledge file + guardrail');
{
  let captured = null;
  stub = async (url, opts) => {
    if (url.includes('generativelanguage')) {
      captured = JSON.parse(opts.body);
      return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] }) };
    }
    throw new Error('unexpected');
  };
  const res = mkRes();
  await handler(req(ask('hello'), 'fr'), res);
  const sys = captured?.systemInstruction?.parts?.[0]?.text || '';
  check('knowledge file content present', /Harts Digital Hub, trading as H@rts/.test(sys));
  check('persona present', /never .I\/my\/me./.test(sys) || /Always "we\/our\/us"/.test(sys));
  check('hard live-data rule present', /THE ONE HARD RULE/.test(sys));
  check('escalation protocol present', /\[\[ESCALATE:human\]\]/.test(sys));
  check('catalog fallback present', /Starter: \$80 setup/.test(sys));
  check('editor comments stripped from prompt', !/THIS FILE IS THE ASSISTANT/.test(sys));
  check('language hint honours fr', /currently writing in: French/.test(sys));
  check('role mapped for gemini', captured?.contents?.[0]?.role === 'user');
}

globalThis.fetch = realFetch;
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
