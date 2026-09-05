// scripts/generate-faq-sql.js
//
// Turns marketing/faq-knowledge-base-100.md into supabase/faq.sql — the seed for
// the `faq` table that api/services.js serves and app.js matches against.
//
// The markdown is the source of truth for FAQ CONTENT: it is written in the
// company voice and is far easier to edit and review than SQL. Run this after
// editing it, then paste the generated SQL into the Supabase SQL editor. Same
// idea as scripts/generate-services.js — an offline authoring step, not a build
// step (this site has no build).
//
// Usage:
//   npm run generate:faq
//   git diff supabase/faq.sql    # sanity-check before committing
//
// Zero dependencies — Node builtins only.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', 'marketing', 'faq-knowledge-base-100.md');
const OUT = join(__dirname, '..', 'supabase', 'faq.sql');

// A question's category decides which conversations it is allowed to win. The
// markdown headings are prose; these are the stable slugs the matcher scores on.
const CATEGORY_SLUGS = {
  'General / What We Do': 'general',
  'AI Chatbots & Automation': 'chatbots',
  'Sales Automation': 'sales_automation',
  'Bookings & Appointments': 'bookings',
  'WhatsApp-Specific': 'whatsapp',
  'Website Chat Widget': 'web_chat',
  'Integrations (CRM / ERP / POS)': 'integrations',
  'Pricing & Packages': 'pricing',
  'Setup & Onboarding': 'onboarding',
  'Support & Maintenance': 'support',
  'Security & Data Privacy': 'security',
  'Results & ROI': 'roi'
};

function parse(md) {
  const lines = md.split(/\r?\n/);
  const items = [];
  let category = 'general';
  let current = null;

  const flush = () => {
    if (current && current.answer.trim()) items.push(current);
    current = null;
  };

  for (const raw of lines) {
    const heading = raw.match(/^##\s+\d+\.\s+(.+?)\s*$/);
    if (heading) {
      flush();
      const name = heading[1];
      category = CATEGORY_SLUGS[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      continue;
    }

    // "12. **Q: Is the chatbot just following a script?**" — indentation varies
    // once the numbering reaches three digits, so leading space is tolerated.
    const q = raw.match(/^\s*(\d+)\.\s+\*\*Q:\s*(.+?)\s*\*\*\s*$/);
    if (q) {
      flush();
      current = { num: Number(q[1]), category, question: q[2], answer: '' };
      continue;
    }

    const a = raw.match(/^\s+A:\s*(.*)$/);
    if (a && current) { current.answer = a[1]; continue; }

    // A wrapped answer line: indented, not a new question, while one is open.
    if (current && current.answer && /^\s{3,}\S/.test(raw)) {
      current.answer += ' ' + raw.trim();
      continue;
    }

    if (/^\s*$/.test(raw) || /^---/.test(raw)) flush();
  }
  flush();
  return items;
}

const esc = (s) => String(s).replace(/'/g, "''");
const pad = (n) => String(n).padStart(3, '0');

const items = parse(readFileSync(SRC, 'utf8'));
if (!items.length) {
  console.error('generate-faq-sql: parsed 0 questions — has the markdown format changed?');
  process.exit(1);
}

const rows = items.map(it =>
  `('q${pad(it.num)}', '${esc(it.category)}', ${it.num}, '${esc(it.question)}', '${esc(it.answer)}')`
).join(',\n  ');

const sql = `-- H@rts — chatbot FAQ knowledge base
--
-- GENERATED FILE — do not edit by hand.
-- Source:    marketing/faq-knowledge-base-100.md
-- Regenerate: npm run generate:faq
--
-- Run this in the Supabase SQL editor for the same project as schema.sql and
-- leads-and-payments.sql. Safe to re-run: the seed upserts by id, so editing the
-- markdown and re-running updates rows in place rather than duplicating them.
--
-- What reads it: api/services.js returns these rows alongside the catalog (the
-- Vercel Hobby plan caps the project at 12 serverless functions and we are at
-- exactly 12, so this shares that endpoint rather than adding a 13th). app.js
-- matches a visitor's message against question_en; api/chat.js folds the
-- policy-critical ones into its system prompt so the LLM half of a conversation
-- cannot contradict the rule-based half.
--
-- answer_fr is nullable and currently null for the generated rows: the source
-- markdown is English-only. app.js deliberately does NOT serve an English canned
-- answer to a French speaker — it falls through to the LLM, which replies in the
-- visitor's language. Fill answer_fr in to make a row available in French too.

create table if not exists faq (
  id           text primary key,
  category     text not null,
  sort_order   int  not null default 0,
  question_en  text not null,
  question_fr  text,
  answer_en    text not null,
  answer_fr    text,
  active       boolean not null default true,
  updated_at   timestamptz not null default now()
);
create index if not exists faq_category_idx on faq (category, sort_order);

alter table faq enable row level security;
-- No anon/authenticated policies, matching services/service_addons: only the
-- service_role key (server-side, in api/_supabase.js) reads this.

insert into faq (id, category, sort_order, question_en, answer_en)
values
  ${rows}
on conflict (id) do update set
  category = excluded.category,
  sort_order = excluded.sort_order,
  question_en = excluded.question_en,
  answer_en = excluded.answer_en,
  updated_at = now();

-- Verify
select category, count(*) from faq where active group by category order by category;
`;

writeFileSync(OUT, sql);
console.log(`generate-faq-sql: wrote ${items.length} questions to supabase/faq.sql`);

const byCat = items.reduce((m, i) => { m[i.category] = (m[i.category] || 0) + 1; return m; }, {});
for (const [c, n] of Object.entries(byCat)) console.log(`  ${c}: ${n}`);
