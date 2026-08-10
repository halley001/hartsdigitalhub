// scripts/generate-services.js
//
// Regenerates the SME pricing cards in services.html from the `services` table
// (kind='sme_package') in Supabase — the same knowledge base app.js and
// api/chat.js hydrate from at runtime. Run this locally after editing catalog
// rows in Supabase; it is NOT run as part of any deploy/build step (this site
// has none) — it's an offline content-authoring step, same idea as hand-updating
// sitemap.xml today.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run generate:services
//   (or export both env vars in your shell first, then just `npm run generate:services`)
//
// Then: git diff services.html to sanity-check the regenerated markup before
// committing. Only the region between <!-- KB:PRICING:START --> and
// <!-- KB:PRICING:END --> is touched — the rest of the page (nav, hero, SEO
// meta, services grid, process, work, testimonials, footer) is untouched.
//
// Zero dependencies — Node builtins + global fetch only, matching api/lead.js's style.

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sbSelectAll, supabaseConfigured } from '../api/_supabase.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVICES_HTML_PATH = join(__dirname, '..', 'services.html');
const START_MARKER = '<!-- KB:PRICING:START -->';
const END_MARKER = '<!-- KB:PRICING:END -->';
const WA_NUMBER = '237622341343';

function fail(message) {
  console.error(`generate-services: ${message}`);
  process.exit(1);
}

function waLink(name) {
  const text = encodeURIComponent(`Hi Harts, I'm interested in the ${name} package.`);
  return `https://wa.me/${WA_NUMBER}?text=${text}`;
}

function usd(n) {
  return '$' + Number(n).toLocaleString('en-US');
}

function renderRegularCard(row) {
  const features = (row.features?.en || [])
    .map(f => `            <li><span class="checkmark"></span> ${f}</li>`)
    .join('\n');
  const badge = row.popular ? '\n              <span class="pricing-badge">Most popular</span>' : '';
  const cardClass = row.popular ? 'pricing-card pricing-card-popular' : 'pricing-card';

  return `        <div class="${cardClass}">
          <div class="pricing-card-inner">
            <div class="pricing-card-header">
              <span class="pricing-card-name">${row.name_en}</span>${badge}
            </div>
            <div class="pricing-card-fees">
              <span class="pricing-card-setup">${usd(row.setup_fee_usd)} setup</span>
              <span class="pricing-card-price">${usd(row.price_usd)} <span class="pricing-card-month">/ year</span></span>
            </div>
            <ul class="pricing-card-features">
${features}
            </ul>
            <a href="/?chat=${row.id}" class="pricing-cta">Choose ${row.name_en}</a>
            <a href="${waLink(row.name_en)}" class="pricing-wa-link" target="_blank" rel="noopener">or ask on WhatsApp</a>
          </div>
        </div>`;
}

function renderBuildCard(row) {
  const features = (row.features?.en || [])
    .map(f => `            <li><span class="checkmark"></span> ${f}</li>`)
    .join('\n');
  const waText = encodeURIComponent(`Hi Harts, I'm interested in a one-time website build.`);

  return `        <div class="pricing-card" style="max-width:720px;flex:1 1 720px;">
          <div class="pricing-card-inner">
            <div class="pricing-card-header">
              <span class="pricing-card-name">One-Time Build</span>
              <span class="pricing-badge">No recurring fee</span>
            </div>
            <div class="pricing-card-fees">
              <span class="pricing-card-setup">One-time project · you own everything</span>
              <span class="pricing-card-price">${usd(row.setup_fee_usd)}</span>
            </div>
            <ul class="pricing-card-features">
${features}
            </ul>
            <a href="/?chat=build" class="pricing-cta">Get a one-time build</a>
            <a href="https://wa.me/${WA_NUMBER}?text=${waText}" class="pricing-wa-link" target="_blank" rel="noopener">or ask on WhatsApp</a>
          </div>
        </div>`;
}

async function main() {
  if (!supabaseConfigured()) {
    fail('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set in the environment.');
  }

  let rows;
  try {
    rows = await sbSelectAll('services', "kind=eq.sme_package&active=eq.true&order=sort_order.asc");
  } catch (err) {
    fail(`could not fetch services from Supabase — ${err.message}`);
  }

  if (!rows.length) {
    fail('Supabase returned zero active sme_package rows — refusing to write an empty pricing section.');
  }

  const regular = rows.filter(r => r.price_unit !== 'one_time');
  const buildRows = rows.filter(r => r.price_unit === 'one_time');

  const regularRow = `      <div class="pricing-cards-row">

${regular.map(renderRegularCard).join('\n\n')}

      </div>`;

  const buildRow = buildRows.length
    ? `\n\n      <!-- One-time build -->\n      <div class="pricing-cards-row" style="margin-top:0.5rem;">\n${buildRows.map(renderBuildCard).join('\n\n')}\n      </div>`
    : '';

  const newBlock = `${START_MARKER}\n${regularRow}${buildRow}\n      ${END_MARKER}`;

  let html;
  try {
    html = readFileSync(SERVICES_HTML_PATH, 'utf8');
  } catch (err) {
    fail(`could not read services.html — ${err.message}`);
  }

  const startIdx = html.indexOf(START_MARKER);
  const endIdx = html.indexOf(END_MARKER);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    fail(`markers ${START_MARKER} / ${END_MARKER} not found (or out of order) in services.html — refusing to write a partial file.`);
  }

  const before = html.slice(0, startIdx);
  const after = html.slice(endIdx + END_MARKER.length);
  const updated = `${before}${newBlock}${after}`;

  writeFileSync(SERVICES_HTML_PATH, updated, 'utf8');
  console.log(`generate-services: wrote ${regular.length} package card(s) + ${buildRows.length} build card(s) to services.html`);
}

main();
