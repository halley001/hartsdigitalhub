-- H@rts — chatbot FAQ knowledge base
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
  ('q001', 'general', 1, 'What does Harts Digital Hub actually do?', 'We build AI systems that handle the busywork around sales and bookings — answering customer questions, qualifying leads, and getting appointments on the calendar — so you''re not doing it all manually or losing customers to slow replies.'),
  ('q002', 'general', 2, 'Are you an agency, a software company, or something else?', 'A bit of both, honestly. We build the software (chatbots, booking flows, dashboards) and we also handle the setup and ongoing care, so you don''t need an in-house dev team to run it.'),
  ('q003', 'general', 3, 'Who is this actually for?', 'Anyone tired of missing sales because nobody answered fast enough — small businesses that need a simple booking bot, and larger operations that want automation wired into their existing systems.'),
  ('q004', 'general', 4, 'What makes you different from just buying a chatbot tool off the shelf?', 'Off-the-shelf tools give you a chat window. We give you a chat window connected to your actual business — your prices, your calendar, your CRM — so it can do real work instead of just answering FAQs.'),
  ('q005', 'general', 5, 'Do you only work with businesses in one country?', 'We''re based in Cameroon and started serving businesses here, but our systems work anywhere — WhatsApp, websites, and cloud infrastructure don''t care about borders.'),
  ('q006', 'general', 6, 'What industries do you work with?', 'Retail, services, hospitality, healthcare bookings, and a growing list of B2B clients who want internal tools built around how they actually operate. If sales or bookings are part of your business, we can probably help.'),
  ('q007', 'general', 7, 'How long have you been doing this?', 'We''ve been building and refining these systems long enough to know what actually gets used by real customers versus what just looks good in a demo.'),
  ('q008', 'general', 8, 'Can I see examples of what you''ve built?', 'Yes — ask us and we''ll walk you through relevant examples for your type of business. We keep specific client details private, but we''re happy to show you what''s possible.'),
  ('q009', 'general', 9, 'Is this just a fancy chatbot, or does it actually replace work I''m doing?', 'The goal is the second one. If all it did was chat, it wouldn''t be worth your time — ours checks real data, books real appointments, and hands off to a human exactly when it should.'),
  ('q010', 'general', 10, 'What''s the first step if I want to work with you?', 'Tell us what''s eating your time right now — missed messages, no-shows, manual booking — and we''ll tell you honestly whether automation is the right fix and roughly what it''d take.'),
  ('q011', 'chatbots', 11, 'What can your AI chatbot actually do?', 'It answers customer questions in real time, checks your live prices or availability, qualifies leads, books appointments, and hands the conversation to a human the moment it needs a real person.'),
  ('q012', 'chatbots', 12, 'Is the chatbot just following a script, or is it actually "AI"?', 'Both, blended. It uses a real language model so conversations feel natural, but it''s also wired into your actual data — so it''s not guessing or making things up when it answers.'),
  ('q013', 'chatbots', 13, 'What happens if the bot doesn''t know the answer?', 'It says so, instead of making something up, and hands the conversation to a human. We''d rather it admit it doesn''t know than give your customer bad information.'),
  ('q014', 'chatbots', 14, 'Can the bot talk to customers in more than one language?', 'Yes — our bots handle English and French out of the box, and we can add more languages depending on your customer base.'),
  ('q015', 'chatbots', 15, 'Does the bot ever sound robotic or scripted?', 'We specifically tune it not to. Customers should feel like they''re talking to someone who works there, not reading a script — that''s a big part of what we spend time getting right.'),
  ('q016', 'chatbots', 16, 'Can it handle more than one conversation at once?', 'Yes — that''s actually one of the biggest wins. A human can only reply to one customer at a time; the bot handles dozens simultaneously without anyone waiting.'),
  ('q017', 'chatbots', 17, 'What if a customer gets frustrated or asks something sensitive?', 'It''s built to recognize when a conversation needs a human touch and hand off immediately, rather than trying to push through with a canned response.'),
  ('q018', 'chatbots', 18, 'Can the bot proactively reach out, or does it only respond?', 'Both are possible — reactive answering is the default, but we can set up proactive follow-ups too, like a nudge to a lead who went quiet.'),
  ('q019', 'chatbots', 19, 'Does the bot ever go "off-script" and say something we wouldn''t want?', 'We build in guardrails specifically to prevent that — it stays grounded in your actual business information rather than free-styling.'),
  ('q020', 'chatbots', 20, 'Can we review or edit what the bot says before it goes live?', 'Absolutely — we walk through sample conversations with you before launch, and you can request tone or content changes at any point after.'),
  ('q021', 'chatbots', 21, 'How "smart" is it really — can it handle unusual questions?', 'It handles a lot more than a basic FAQ bot because it''s reasoning over real data, not just matching keywords. It won''t get everything, but it covers far more ground than people expect.'),
  ('q022', 'chatbots', 22, 'What''s the difference between automation and just having a chatbot?', 'A chatbot talks. Automation acts — checking your calendar, updating a record, sending a confirmation. We build the second one; the chat is just the interface.'),
  ('q023', 'sales_automation', 23, 'How does the AI actually help with sales?', 'It answers product and pricing questions instantly, qualifies whether someone''s a serious buyer, and moves them toward a purchase or a human handoff — all before you''d have even seen the message.'),
  ('q024', 'sales_automation', 24, 'Will it replace my sales team?', 'No — it handles the repetitive first-contact work so your team spends their time on the conversations that actually need a person, not answering "what''s the price" for the twentieth time today.'),
  ('q025', 'sales_automation', 25, 'Can it actually close a sale, or just answer questions?', 'Depends on the business — for simpler products it can walk someone all the way to payment or checkout; for higher-touch sales it qualifies the lead and hands off to your team at the right moment.'),
  ('q026', 'sales_automation', 26, 'How does it qualify a lead?', 'By asking the questions your sales team would ask anyway — budget, timeline, what they actually need — so by the time a human gets involved, the groundwork is done.'),
  ('q027', 'sales_automation', 27, 'What happens to leads that come in outside business hours?', 'They get answered immediately instead of waiting until morning — which matters a lot, because a same-day reply converts far better than a next-day one.'),
  ('q028', 'sales_automation', 28, 'Can it upsell or recommend add-ons?', 'Yes, if that fits your business — it can suggest relevant packages or add-ons the way a good salesperson would, based on what the customer''s already asked about.'),
  ('q029', 'sales_automation', 29, 'Does it track where leads come from?', 'Yes — we can tag conversations by source (website, WhatsApp, ads) so you know which channels are actually bringing in customers.'),
  ('q030', 'sales_automation', 30, 'What if someone just wants to browse, not buy yet?', 'The bot''s fine with that — it doesn''t pressure, it informs. But it also keeps the door open for a follow-up later instead of letting the conversation just disappear.'),
  ('q031', 'sales_automation', 31, 'Can it follow up with leads who went quiet?', 'Yes, we can set up gentle automated follow-ups so leads don''t just fall through the cracks after the first message.'),
  ('q032', 'sales_automation', 32, 'How fast does it respond compared to a human?', 'Instantly, 24/7 — no lag, no "let me check with someone," which is often the difference between winning a sale and losing it to a competitor who replied first.'),
  ('q033', 'bookings', 33, 'How does the booking automation actually work?', 'A customer messages, the bot checks your real calendar or availability, offers open slots, and confirms the booking — no back-and-forth, no double-booking.'),
  ('q034', 'bookings', 34, 'Does it connect to my existing calendar or booking system?', 'Yes, that''s the point — it reads and writes to the system you already use, so you''re not managing two calendars or re-entering anything by hand.'),
  ('q035', 'bookings', 35, 'What happens if two customers try to book the same slot at once?', 'The system locks the slot the moment one booking is confirmed, so the second customer sees it''s already taken — no accidental double-bookings.'),
  ('q036', 'bookings', 36, 'Can it send reminders before an appointment?', 'Yes — automated reminders are one of the easiest wins, and they noticeably cut down on no-shows.'),
  ('q037', 'bookings', 37, 'Can customers reschedule or cancel through the bot?', 'Yes, that''s built in — they don''t need to call or message you separately to change a booking.'),
  ('q038', 'bookings', 38, 'Does it handle deposits or booking fees?', 'It can, if your business takes them — the bot can collect a deposit at the time of booking to reduce no-shows.'),
  ('q039', 'bookings', 39, 'What if my business has multiple staff or locations with different availability?', 'The bot can be set up to check availability per staff member or location, not just one shared calendar.'),
  ('q040', 'bookings', 40, 'Can it handle recurring appointments?', 'Yes — for businesses with repeat bookings (like regular services or check-ins), it can offer or manage recurring slots too.'),
  ('q041', 'bookings', 41, 'What happens to booking data — do I still get to see it?', 'Yes, everything flows into your dashboard or calendar as normal — the bot is doing the coordination, but you keep full visibility.'),
  ('q042', 'bookings', 42, 'Can it handle group bookings, not just one person at a time?', 'Yes, depending on your business — we set the booking logic to match how you actually take reservations, solo or group.'),
  ('q043', 'whatsapp', 43, 'Why WhatsApp specifically?', 'Because that''s where a lot of your customers already are, especially in markets like ours — it removes the friction of asking someone to download a new app or visit a website first.'),
  ('q044', 'whatsapp', 44, 'Do I need WhatsApp Business, or does my personal number work?', 'We set you up on WhatsApp Business, which is built for exactly this — separate from your personal number, with the tools automation actually needs.'),
  ('q045', 'whatsapp', 45, 'Will customers know they''re talking to a bot, or does it feel like a person replied?', 'We''re upfront that it''s automated when it matters, but the conversation itself is designed to feel natural and helpful rather than obviously scripted.'),
  ('q046', 'whatsapp', 46, 'Can I still message customers manually on the same WhatsApp number?', 'Yes — the bot and your team share the same inbox, so you can jump into any conversation at any time.'),
  ('q047', 'whatsapp', 47, 'Does the bot work with WhatsApp voice notes or images?', 'Text is the primary channel today; voice and image handling depend on the setup — ask us about your specific use case.'),
  ('q048', 'whatsapp', 48, 'What if a customer sends something urgent — does the bot know to escalate?', 'Yes, it''s built to recognize urgency and hand off to a human immediately rather than trying to handle everything itself.'),
  ('q049', 'whatsapp', 49, 'Can the bot send catalog items or images through WhatsApp?', 'Yes — it can share product photos, pricing, or catalog links right in the conversation.'),
  ('q050', 'whatsapp', 50, 'Is there a limit to how many WhatsApp conversations it can handle?', 'Practically, no — it scales to as many simultaneous conversations as your business gets, which is exactly the problem it''s solving.'),
  ('q051', 'web_chat', 51, 'Do you also build chat for websites, not just WhatsApp?', 'Yes — the same underlying system powers a chat bubble on your website too, so customers can get answers without leaving your site.'),
  ('q052', 'web_chat', 52, 'Can the website chatbot hand off to WhatsApp?', 'Yes, that''s a common setup — start on the website, continue on WhatsApp if the customer prefers, without losing context.'),
  ('q053', 'web_chat', 53, 'Will the widget match our website''s design?', 'Yes — we style it to fit your branding rather than dropping in a generic-looking chat box.'),
  ('q054', 'web_chat', 54, 'Does it slow down my website?', 'No — it''s built to load asynchronously so it doesn''t affect your site''s speed or performance.'),
  ('q055', 'web_chat', 55, 'Can it work on mobile as well as desktop?', 'Yes, it''s fully responsive — most of your customers are probably on mobile anyway, so that''s a priority, not an afterthought.'),
  ('q056', 'web_chat', 56, 'Can I control when the widget pops up, or does it appear immediately?', 'You choose — immediate, after a delay, or triggered by specific behavior like time on page.'),
  ('q057', 'integrations', 57, 'Can this connect to the CRM or system we already use?', 'Yes — we specifically build to integrate with what you already have rather than asking you to switch tools.'),
  ('q058', 'integrations', 58, 'What if we don''t have a CRM or POS system yet?', 'That''s fine — we can build a lightweight one as part of the automation, or recommend something simple that fits your size.'),
  ('q059', 'integrations', 59, 'Does it work with inventory systems, so it knows what''s in stock?', 'Yes — when it''s connected to your inventory, it won''t offer or sell something that''s actually out of stock.'),
  ('q060', 'integrations', 60, 'Can it update records automatically, like marking a lead as "contacted"?', 'Yes — the automation isn''t just chatting, it''s also doing the data entry your team would otherwise do by hand.'),
  ('q061', 'integrations', 61, 'What systems have you integrated with before?', 'A range of CRM, ERP, and POS tools, plus custom internal systems — tell us what you''re running and we''ll tell you what''s involved.'),
  ('q062', 'integrations', 62, 'Is integration a separate cost, or is it included?', 'It depends on how deep the integration needs to go — simpler connections are often included, deeper custom integrations are scoped separately. We''re upfront about this before starting.'),
  ('q063', 'integrations', 63, 'How long does an integration usually take?', 'Straightforward integrations can take days; deeper custom ones take longer. We''ll give you a real timeline once we understand your systems, not a generic estimate.'),
  ('q064', 'integrations', 64, 'What if our internal systems are old or a bit messy?', 'That''s more common than you''d think, and it''s exactly the kind of problem we''re used to working around — we assess what''s there before promising anything.'),
  ('q065', 'pricing', 65, 'How much does this cost?', 'It depends on scope — a simple booking bot for a small business costs far less than a fully integrated enterprise system. We''ll give you real numbers once we know what you need, not a vague range.'),
  ('q066', 'pricing', 66, 'Do you have set packages, or is everything custom quoted?', 'Both — we have straightforward SME packages with clear pricing, and for bigger or more integrated needs, we scope and quote based on the actual work.'),
  ('q067', 'pricing', 67, 'Is there a setup fee on top of the ongoing cost?', 'For our packaged tiers, yes — a one-time setup fee alongside the yearly or monthly rate. We''re upfront about both numbers before you commit to anything.'),
  ('q068', 'pricing', 68, 'Can I pay in installments instead of all at once?', 'Yes — most of our packages support paying the yearly fee in interest-free installments rather than one lump sum.'),
  ('q069', 'pricing', 69, 'What payment methods do you accept?', 'Mobile money (MoMo) is our primary method, which fits how most of our clients already pay for things.'),
  ('q070', 'pricing', 70, 'Is there a contract, or can I cancel anytime?', 'We''ll always be clear about the terms before you sign anything — nothing hidden, no surprise lock-ins.'),
  ('q071', 'pricing', 71, 'What''s included in the monthly SLA/retainer plans versus a one-time build?', 'A one-time build gets you the system and you own it outright. A retainer adds ongoing support, monitoring, and updates on top — which one makes sense depends on how "live" and critical the system is.'),
  ('q072', 'pricing', 72, 'Do prices go up once I''m a customer, or are they locked in?', 'We don''t spring price increases on existing clients without a conversation first — you''ll know about any change well before it happens.'),
  ('q073', 'pricing', 73, 'Is there a cheaper option if I just want to try this out first?', 'Yes — our entry-level package is built exactly for that: getting started affordably without committing to the full build.'),
  ('q074', 'pricing', 74, 'Do you charge extra for things like a logo or branding?', 'Those are optional add-ons, priced separately from the core packages, so you only pay for what you actually want.'),
  ('q075', 'onboarding', 75, 'How long does it take to get up and running?', 'Simpler setups can go live in days; more integrated systems take longer depending on scope. We''ll give you a realistic timeline upfront, not an optimistic one.'),
  ('q076', 'onboarding', 76, 'Do I need to do anything technical on my end?', 'Not really — we handle the technical setup. We''ll just need some information about your business, your offerings, and access to any systems we''re connecting to.'),
  ('q077', 'onboarding', 77, 'Will I get trained on how to use or manage it afterward?', 'Yes — we walk you through your dashboard and how everything works before we consider the job done, not just hand it over and disappear.'),
  ('q078', 'onboarding', 78, 'What information do you need from me to get started?', 'The basics — what you sell or offer, your pricing, your availability or booking rules, and access to whatever system needs connecting. We''ll send a simple checklist.'),
  ('q079', 'onboarding', 79, 'Can we launch in stages instead of everything at once?', 'Yes, that''s often the smarter approach — start with the core chatbot, add booking or deeper integration once you''re comfortable.'),
  ('q080', 'onboarding', 80, 'What if we''re not happy with how it turns out?', 'We build in review points before launch specifically so there aren''t surprises — you''ll see and approve how it behaves before it ever talks to a real customer.'),
  ('q081', 'onboarding', 81, 'Do you migrate our existing data (like past bookings or customer records)?', 'Where relevant, yes — we''ll assess what needs to move over and handle the migration as part of setup.'),
  ('q082', 'onboarding', 82, 'Who owns the system once it''s built — you or us?', 'You do, for anything built as a one-time project. Retainer/SLA plans work more like an ongoing partnership, but the specifics are always spelled out clearly upfront.'),
  ('q083', 'support', 83, 'What happens if something breaks?', 'Depending on your plan, we monitor for issues proactively or respond when you flag something — either way, we don''t leave a live system unattended.'),
  ('q084', 'support', 84, 'What''s the difference between your support tiers?', 'Standard covers business-hours support and monthly maintenance. Priority adds faster response times and ongoing feature work. Enterprise is fully dedicated, including 24/7 on-call for critical systems.'),
  ('q085', 'support', 85, 'Do you offer 24/7 support?', 'At the Enterprise tier, yes, for critical systems. Standard and Priority plans cover business hours with fast response windows.'),
  ('q086', 'support', 86, 'How quickly do you respond to an issue?', 'It depends on your support tier — from next-business-day on our Standard plan to priority, faster-turnaround response on higher tiers.'),
  ('q087', 'support', 87, 'Can I upgrade my support plan later if my needs grow?', 'Yes — plenty of clients start smaller and move up as the system becomes more central to how they operate.'),
  ('q088', 'support', 88, 'Do you handle security updates and patching?', 'Yes, that''s part of our Priority and Enterprise plans — we keep systems patched rather than waiting for something to go wrong.'),
  ('q089', 'support', 89, 'What if I want changes made after launch — new features, different wording?', 'That''s normal and expected — retainer plans include ongoing feature and content work; one-time builds can still request paid changes anytime.'),
  ('q090', 'support', 90, 'Do you provide reports on how the system is performing?', 'Yes — performance and monthly reporting is built into several of our plans so you''re not just trusting it blindly.'),
  ('q091', 'security', 91, 'Is our customer data safe with this system?', 'Yes — we treat customer and business data seriously, with access controls so only what needs to be exposed is exposed, and nothing sits open to the public.'),
  ('q092', 'security', 92, 'Where is our data actually stored?', 'On secure cloud infrastructure, with access locked down server-side — we don''t expose direct database access to the chatbot or the public.'),
  ('q093', 'security', 93, 'Do you share or sell our data to anyone?', 'No — your data is yours. We use it to run the system you''re paying for, nothing else.'),
  ('q094', 'security', 94, 'What happens to our data if we stop working with you?', 'We''ll work with you on an export or handover — you''re not locked out of your own business information.'),
  ('q095', 'security', 95, 'Are conversations with the chatbot private?', 'Yes — conversations are handled with the same care as any other customer data, accessible only to your business and to us for support purposes.'),
  ('q096', 'roi', 96, 'How do I know this is actually worth the cost?', 'Think about what a missed lead or a no-show actually costs you — automation usually pays for itself the moment it stops one or two of those from slipping through each month.'),
  ('q097', 'roi', 97, 'What results have other clients seen?', 'Faster response times, fewer missed leads, and fewer no-shows are the consistent wins — the specifics vary by business, and we''re happy to talk through what''s realistic for yours.'),
  ('q098', 'roi', 98, 'How do you measure whether it''s actually working?', 'Response times, booking completion rates, and lead conversion are the numbers we watch — and we can share those with you through your dashboard or reports.'),
  ('q099', 'roi', 99, 'Is this overkill for a really small business?', 'Not necessarily — our entry-level package exists specifically because even small operations lose sales to slow replies. It scales down as easily as it scales up.'),
  ('q100', 'roi', 100, 'What if I''m still not sure this is right for my business?', 'Tell us what a typical week looks like — how leads come in, how bookings happen now — and we''ll give you an honest read on whether automation actually moves the needle for you, no pressure either way.')
on conflict (id) do update set
  category = excluded.category,
  sort_order = excluded.sort_order,
  question_en = excluded.question_en,
  answer_en = excluded.answer_en,
  updated_at = now();

-- Verify
select category, count(*) from faq where active group by category order by category;
