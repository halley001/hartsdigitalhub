// Verifies the client-side half: that the AI layer is reached ONLY on a rule
// no-match, and that each /api/chat outcome maps to the right reply object.
// app.js is a browser script, so the two pure functions under test are pulled
// out of the source and evaluated against a minimal stand-in environment.
import { readFileSync } from 'fs';

const src = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

function extractFn(name) {
  const start = src.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name} not found in app.js`);
  let depth = 0, i = src.indexOf('{', start);
  for (let j = i; j < src.length; j++) {
    if (src[j] === '{') depth++;
    else if (src[j] === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  throw new Error(`unbalanced ${name}`);
}

const KNOWLEDGE = { en: { contact: 'EN_CONTACT' }, fr: { contact: 'FR_CONTACT' } };
const sandbox = new Function('KNOWLEDGE', `
  ${extractFn('aiHandoffReply')}
  ${extractFn('applyAIReply')}
  return { aiHandoffReply, applyAIReply };
`)(KNOWLEDGE);

let pass = 0, fail = 0;
const check = (name, cond, extra) => {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra !== undefined ? '  → ' + JSON.stringify(extra) : '')); }
};

// The gate as written in sendMessage, restated here so a change to it that
// breaks "rules win" fails this test rather than shipping quietly.
const gateSrc = src.match(/const useLLM = ([\s\S]*?);\n/)[1];
const gate = new Function('reply', 'awaitingLeadField', 'awaitingAddons', 'awaitingMomoNumber', 'currentStage',
  `return ${gateSrc};`);
const idle = [null, false, false, 'discovery'];

console.log('\n── Gate: the AI layer speaks only on a rule no-match');
check('rule no-match → AI runs', gate({ fallback: true, text: 'x' }, ...idle) === true);
check('plain rule match → AI silent', gate({ text: 'Our hours are 8-6' }, ...idle) === false);
check('HTML rule match → AI silent', gate({ text: 'x', isHTML: true }, ...idle) === false);
check('FAQ hit → AI silent', gate({ text: 'x', faq: true }, ...idle) === false);
check('package card → AI silent', gate({ packageHTML: '<div>' }, ...idle) === false);
check('handoff action → AI silent', gate({ action: 'handoff', text: 'x' }, ...idle) === false);

console.log('\n── Gate: stateful flows are never interrupted');
check('mid lead capture', gate({ fallback: true }, 'name', false, false, 'discovery') === false);
check('mid add-on choice', gate({ fallback: true }, null, true, false, 'discovery') === false);
check('mid MoMo number', gate({ fallback: true }, null, false, true, 'discovery') === false);
check('in payment stage', gate({ fallback: true }, ...[null, false, false], 'payment') === false);
check('in review stage', gate({ fallback: true }, ...[null, false, false], 'review') === false);
check('in handoff stage', gate({ fallback: true }, ...[null, false, false], 'handoff') === false);

console.log('\n── Mapping /api/chat outcomes to replies');
const ruleReply = { fallback: true, text: 'RULE_FALLBACK' };
{
  const r = sandbox.applyAIReply(ruleReply, { reply: 'A real answer.', escalate: null }, 'en');
  check('plain answer shown', r.text === 'A real answer.' && !r.action, r);
}
{
  const r = sandbox.applyAIReply(ruleReply, { reply: 'Let us check.', escalate: 'human' }, 'en');
  check('human: model sentence kept', r.text.startsWith('Let us check.'), r);
  check('human: contact appended', r.text.includes('EN_CONTACT'), r);
  check('human: handoff action set', r.action === 'handoff', r);
}
{
  const r = sandbox.applyAIReply(ruleReply, { reply: '', escalate: 'human' }, 'fr');
  check('human: bare marker still yields contact (fr)', r.text === 'FR_CONTACT' && r.action === 'handoff', r);
}
{
  const r = sandbox.applyAIReply(ruleReply, { reply: 'Voici les formules :', escalate: 'catalog' }, 'fr');
  check('catalog: renders real package cards', r.multiPackage === true, r);
  check('catalog: no model-written prices', !/\$/.test(r.text), r);
}
{
  const r = sandbox.applyAIReply(ruleReply, { reply: '', escalate: 'catalog' }, 'fr');
  check('catalog: empty body gets a fr lead-in', /formule/.test(r.text) && r.multiPackage === true, r);
}
{
  const r = sandbox.applyAIReply(ruleReply, { reply: null, escalate: null }, 'en');
  check('empty answer → keeps rule fallback, never a blank bubble', r === ruleReply, r);
}
{
  const en = sandbox.aiHandoffReply('en'), fr = sandbox.aiHandoffReply('fr');
  check('provider failure → EN handover', en.text === 'EN_CONTACT' && en.action === 'handoff', en);
  check('provider failure → FR handover', fr.text === 'FR_CONTACT' && fr.action === 'handoff', fr);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
