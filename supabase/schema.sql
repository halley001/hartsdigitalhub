-- H@rts chatbot knowledge base — schema + seed data
--
-- Run this once in the Supabase SQL editor for the SAME project already used
-- for the `leads` and `payments` tables (same SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
-- already configured in Vercel — no new env vars needed).
--
-- What this powers: /api/services (read endpoint), which app.js and api/chat.js
-- both hydrate from instead of their own hardcoded PACKAGES/system-prompt copies.
--
-- Workflow for future content edits: update rows here (Supabase table editor
-- or SQL), then run `npm run generate:services` locally to regenerate the
-- static services.html sections from the new data, then commit + push.
--
-- Safe to re-run: CREATE TABLE IF NOT EXISTS + upsert seed rows.

create table if not exists services (
  id            text primary key,
  kind          text not null check (kind in ('sme_package','enterprise_category','sla_tier')),
  sort_order    int  not null default 0,
  name_en       text not null,
  name_fr       text not null,
  tagline_en    text,
  tagline_fr    text,
  desc_en       text,
  desc_fr       text,
  setup_fee_usd numeric,
  price_usd     numeric,
  price_unit    text check (price_unit in ('year','month','one_time','custom')),
  features      jsonb not null default '{}',   -- {"en":[...], "fr":[...]}
  tags          jsonb,                          -- ["ERP","Inventory","Dashboards"]
  popular       boolean not null default false,
  installment_note_en text,
  installment_note_fr text,
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);
create index if not exists services_kind_idx on services (kind, sort_order);

create table if not exists service_addons (
  id         text primary key,
  name_en    text not null,
  name_fr    text not null,
  price_usd  numeric not null,
  sort_order int not null default 0,
  active     boolean not null default true
);

alter table services enable row level security;
alter table service_addons enable row level security;
-- No anon/authenticated policies added on purpose — only the service_role key
-- (used server-side in api/_supabase.js, bypasses RLS) can read these, same
-- trust model as `leads`/`payments`. Never expose an anon key for this table.

-- ── Seed: 5 SME packages ──────────────────────────────────────────────────
-- Transcribed 1:1 from app.js PACKAGES (the values these rows are meant to replace).

insert into services (id, kind, sort_order, name_en, name_fr, desc_en, desc_fr, setup_fee_usd, price_usd, price_unit, features, popular, installment_note_en, installment_note_fr)
values
('starter', 'sme_package', 1, 'Starter', 'Démarrage',
  'Perfect for getting your business online quickly and affordably.',
  'Idéal pour mettre votre entreprise en ligne rapidement et à petit prix.',
  80, 50, 'year',
  '{"en":["Landing page","Google Business listing","WhatsApp Business setup"],"fr":["Page d''accueil","Fiche Google Business","Configuration WhatsApp Business"]}',
  false,
  'Pay the yearly fee in 2-3 interest-free MoMo installments',
  'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo'),

('essential', 'sme_package', 2, 'Essential', 'Essentiel',
  'A real multi-page website and a starter online presence — more than a landing page, without full social management.',
  'Un vrai site multi-pages et une présence en ligne de départ — plus qu''une page d''accueil, sans la gestion complète des réseaux sociaux.',
  125, 165, 'year',
  '{"en":["3-page website","Google Business + WhatsApp setup","Social media (1 platform, light management)","Basic SEO"],"fr":["Site web 3 pages","Fiche Google Business + configuration WhatsApp","Réseaux sociaux (1 plateforme, gestion légère)","SEO de base"]}',
  false,
  'Pay the yearly fee in 2-3 interest-free MoMo installments',
  'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo'),

('growth', 'sme_package', 3, 'Growth', 'Croissance',
  'Our most popular package. Great for businesses ready to grow visibility and customers.',
  'Notre forfait le plus populaire. Parfait pour les entreprises qui veulent gagner en visibilité et en clients.',
  200, 600, 'year',
  '{"en":["Full website (5 pages)","Social media management (2 platforms)","Basic SEO","Monthly performance report"],"fr":["Site web complet (5 pages)","Gestion réseaux sociaux (2 plateformes)","SEO de base","Rapport mensuel"]}',
  true,
  'Pay the yearly fee in 2-3 interest-free MoMo installments',
  'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo'),

('pro', 'sme_package', 4, 'Pro', 'Pro',
  'Full digital presence with advertising and automation for serious growth.',
  'Présence digitale complète avec publicité et automatisation pour une croissance sérieuse.',
  400, 1400, 'year',
  '{"en":["E-commerce store","Google/Facebook Ads management","WhatsApp chatbot","Monthly analytics dashboard","Priority support"],"fr":["Boutique en ligne","Gestion Google/Facebook Ads","Chatbot WhatsApp","Tableau de bord analytique","Support prioritaire"]}',
  false,
  'Pay the yearly fee in 2-3 interest-free MoMo installments',
  'Payez le forfait annuel en 2 ou 3 versements sans intérêts par MoMo'),

('build_only', 'sme_package', 5, 'Build & Launch (One-Time)', 'Création & Mise en ligne (Paiement unique)',
  'Perfect if you want a complete digital project (website, app, or branding) delivered without ongoing commitment. You own everything.',
  'Idéal si vous voulez un projet numérique complet (site, application ou branding) livré sans engagement continu. Vous en êtes propriétaire.',
  300, null, 'one_time',
  '{"en":["Professional 5-page website","Google Business + WhatsApp setup","Mobile-friendly design","Training on how to manage your new digital assets"],"fr":["Site web professionnel 5 pages","Fiche Google Business + configuration WhatsApp","Design adapté mobile","Formation sur la gestion de vos nouveaux actifs numériques"]}',
  false, null, null)
on conflict (id) do update set
  name_en = excluded.name_en, name_fr = excluded.name_fr,
  desc_en = excluded.desc_en, desc_fr = excluded.desc_fr,
  setup_fee_usd = excluded.setup_fee_usd, price_usd = excluded.price_usd, price_unit = excluded.price_unit,
  features = excluded.features, popular = excluded.popular,
  installment_note_en = excluded.installment_note_en, installment_note_fr = excluded.installment_note_fr,
  updated_at = now();

-- ── Seed: 4 enterprise categories ─────────────────────────────────────────
-- From index.html's capability grid + today's broadened chatbot positioning.

insert into services (id, kind, sort_order, name_en, name_fr, tagline_en, tagline_fr, desc_en, desc_fr, tags)
values
('custom_software', 'enterprise_category', 1, 'Custom Software & Web Systems', 'Logiciels & Systèmes Web Sur Mesure',
  'ERPs, inventory engines, admin dashboards and internal tools built around how your business actually operates.',
  'ERP, systèmes de gestion des stocks, tableaux de bord d''administration et outils internes conçus autour du fonctionnement réel de votre entreprise.',
  null, null,
  '["ERP","Inventory","Dashboards"]'),

('cloud_database', 'enterprise_category', 2, 'Cloud & Database Architecture', 'Architecture Cloud & Bases de Données',
  'Performance optimization, zero-downtime migrations, and uptime-focused architecture on scalable cloud infrastructure.',
  'Optimisation des performances, migrations sans interruption de service, et architecture axée sur la disponibilité sur une infrastructure cloud évolutive.',
  null, null,
  '["Optimization","Migrations","Uptime"]'),

('managed_it', 'enterprise_category', 3, 'Managed IT & SLA Retainers', 'IT Géré & Contrats SLA',
  'System care, security hardening and dedicated engineering on a monthly retainer — your outsourced technical team.',
  'Entretien des systèmes, renforcement de la sécurité et ingénierie dédiée sur un forfait mensuel — votre équipe technique externalisée.',
  null, null,
  '["System Care","Security","Dedicated Eng"]'),

('ai_chatbots', 'enterprise_category', 4, 'AI Chatbots & Automation', 'Chatbots IA & Automatisation',
  'Chatbots for WhatsApp, your website or other channels — integrated into new or existing systems, not bolted on the side.',
  'Des chatbots pour WhatsApp, votre site web ou d''autres canaux — intégrés à des systèmes nouveaux ou existants, pas ajoutés en périphérie.',
  'We build AI chatbots that answer customers, check your live database, engage leads and hand off to a human the moment it matters — on WhatsApp, your website, or wherever your customers already are, integrated into new or already-existing systems (CRM, ERP, POS).',
  'Nous concevons des chatbots IA qui répondent aux clients, vérifient votre base de données en direct, engagent les prospects et transfèrent à un humain au bon moment — sur WhatsApp, votre site web, ou tout autre canal utilisé par vos clients, intégrés à des systèmes nouveaux ou déjà existants (CRM, ERP, POS).',
  '["WhatsApp","Website Chat","CRM / ERP Sync"]')
on conflict (id) do update set
  name_en = excluded.name_en, name_fr = excluded.name_fr,
  tagline_en = excluded.tagline_en, tagline_fr = excluded.tagline_fr,
  desc_en = excluded.desc_en, desc_fr = excluded.desc_fr,
  tags = excluded.tags, updated_at = now();

-- ── Seed: 3 SLA pricing tiers ──────────────────────────────────────────────
-- From index.html's #pricing "Manage" section.

insert into services (id, kind, sort_order, name_en, name_fr, tagline_en, tagline_fr, price_usd, price_unit, features, popular)
values
('sla_standard', 'sla_tier', 1, 'Standard', 'Standard',
  'For live systems that need a safety net',
  'Pour les systèmes en production qui ont besoin d''un filet de sécurité',
  125, 'month',
  '{"en":["Business-hours support","Monthly maintenance & updates","Uptime monitoring & alerts","Next-business-day response"],"fr":["Support aux heures ouvrées","Maintenance et mises à jour mensuelles","Surveillance de disponibilité et alertes","Réponse sous un jour ouvré"]}',
  false),

('sla_priority', 'sla_tier', 2, 'Priority', 'Priorité',
  'Active development + priority care',
  'Développement actif + prise en charge prioritaire',
  400, 'month',
  '{"en":["Everything in Standard","Priority support & faster SLAs","Monthly feature engineering hours","Security patching & backups","Quarterly architecture review"],"fr":["Tout ce qui est inclus dans Standard","Support prioritaire et SLA plus rapides","Heures d''ingénierie mensuelles pour de nouvelles fonctionnalités","Correctifs de sécurité et sauvegardes","Revue d''architecture trimestrielle"]}',
  true),

('sla_enterprise', 'sla_tier', 3, 'Enterprise', 'Enterprise',
  'Dedicated engineering & guarantees',
  'Ingénierie dédiée et garanties',
  null, 'custom',
  '{"en":["Everything in Priority","Dedicated engineer allocation","Custom uptime & response SLAs","24/7 on-call for critical systems","Roadmap & capacity planning"],"fr":["Tout ce qui est inclus dans Priorité","Allocation d''un ingénieur dédié","SLA de disponibilité et de réponse personnalisés","Astreinte 24h/24 pour les systèmes critiques","Planification de la feuille de route et de la capacité"]}',
  false)
on conflict (id) do update set
  name_en = excluded.name_en, name_fr = excluded.name_fr,
  tagline_en = excluded.tagline_en, tagline_fr = excluded.tagline_fr,
  price_usd = excluded.price_usd, price_unit = excluded.price_unit,
  features = excluded.features, popular = excluded.popular, updated_at = now();

-- ── Seed: 2 add-ons ────────────────────────────────────────────────────────

insert into service_addons (id, name_en, name_fr, price_usd, sort_order)
values
('logo', 'Logo', 'Logo', 40, 1),
('full_branding', 'Full branding (logo, colours, business card, templates)', 'Branding complet (logo, couleurs, carte de visite, templates)', 130, 2)
on conflict (id) do update set
  name_en = excluded.name_en, name_fr = excluded.name_fr, price_usd = excluded.price_usd;
