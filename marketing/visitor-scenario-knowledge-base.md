# Harts Digital Hub — Visitor Scenario Knowledge Base

Different from [faq-knowledge-base-100.md](faq-knowledge-base-100.md): that file answers explicit
questions people ask. This file covers **vague or implicit requests** — the way real visitors
actually talk ("I need a booking website") — and how the bot should reason its way to the right
recommendation, since these rarely map to one exact package name.

Each entry: **what they say → what's really going on → how to respond.** The "how to respond"
lines are the actual reusable copy (we/our voice, one clarifying question, then a concrete
recommendation grounded in the real catalog — never invent a product that doesn't exist).

Intended use: few-shot grounding for `api/chat.js`'s system prompt (which currently has catalog
data but no needs→product mapping), or a future `intents`/`scenarios` table alongside `services`.
See [[chatbot-knowledge-base]].

---

## 1. Booking & Appointments

**"I need a booking website."**
Really means: wants customers to self-schedule instead of calling/messaging back and forth. Could be simple (one calendar) or complex (multi-staff, deposits, existing system).
→ "We can build that. Quick question first: is this a simple calendar where customers pick a time and you confirm, or does it need to handle multiple staff, deposits, or an existing system you use? Simple booking fits well in our Growth or Pro package — Pro even includes a WhatsApp chatbot that can take bookings straight in chat. Anything more custom (multi-location, staff calendars, payments) moves into a scoped Custom Software project."

**"Customers keep calling to book appointments and it's a lot."**
Really means: they already have a booking process, it's just manual and eating their time.
→ "That's exactly what automation is good for — we can set up a chatbot that checks your real availability and books directly, so customers self-serve and you just see it land on your calendar. Want to walk through how bookings work for you today so we can map it over?"

**"Can people book and pay at the same time?"**
Really means: wants deposits/prepayment built into the booking flow.
→ "Yes, we can set that up — the bot can collect a deposit or full payment at the moment of booking, which also cuts down on no-shows. That's usually part of a Pro package or a custom build depending on how you take payments today."

**"I run a salon/clinic/gym and want online booking."**
Really means: vertical-specific booking, often with multiple staff or resources.
→ "We've built booking systems for businesses like yours before. The main thing that changes the setup is whether customers book with a specific staff member/resource or just 'next available' — which is it for you?"

---

## 2. Vague "I need a website / app"

**"I need a website."**
Really means: could be anything from a one-pager to a full store. Needs qualifying before recommending.
→ "Happy to help — what's the main thing you want it to do for your business? Just get you found online, sell products, or something more like a booking or customer system? That'll tell us whether Starter, Essential, Growth, or something custom fits best."

**"I want an app for my business."**
Really means: often means "website" or "WhatsApp bot" in disguise — rarely an actual native mobile app.
→ "When you say app, do you mean something customers download from the app store, or more like a way for them to interact with your business online — website, WhatsApp, chat? A lot of what people picture as 'an app' we actually deliver more affordably as a website or WhatsApp-based system. What would customers actually be doing in it?"

**"How is this different from just using Wix/Shopify?"**
Really means: comparing to DIY website builders, wants to know why pay for a service.
→ "Wix and Shopify are fine tools, but they leave you building and maintaining it yourself, and they don't include automation like a chatbot that actually answers customers or books appointments for you. We handle the build, the ongoing care, and wire in the automation — so it's less 'here's a tool' and more 'here's a system that works for you.'"

**"I already have a website, I just want to add a chatbot."**
Really means: doesn't need a full package, wants the AI Chatbots & Automation service specifically.
→ "That's doable without rebuilding anything — we can add a chatbot to your existing site or WhatsApp and connect it to whatever data it needs (prices, availability, inventory). That falls under our AI Chatbots & Automation service, scoped to just that."

---

## 3. Sales / Lead Response

**"I keep losing customers because I reply too late."**
Really means: core sales-automation pain point — direct hit for the product.
→ "That's the single biggest thing automation fixes — the bot replies instantly, any time of day, so you're never losing a sale to someone who just answered faster. Tell us a bit about how customers usually reach you (WhatsApp, website, both?) and we'll show you what that'd look like."

**"I want to automate my sales."**
Really means: broad ask, needs narrowing to what part of "sales" — first response, qualifying, closing, follow-up.
→ "We can help with that — the usual starting point is having the bot handle first contact and qualify leads (find out what they need, budget, timeline) so your team only steps in for conversations that are ready to close. Where does most of your sales conversation happen today — WhatsApp, website, both?"

**"Can it actually sell for me, or just answer questions?"**
Really means: wants to know if this replaces or just supports a human.
→ "Depends on your product — for simpler, lower-touch sales it can walk a customer all the way to payment. For anything that needs more judgment, it qualifies the lead and hands off to your team at the right moment, fully briefed. Which sounds more like your business?"

**"I get a lot of messages but most people don't actually buy."**
Really means: needs lead qualification, not just more volume.
→ "That's a qualification problem more than a volume problem — the bot can ask the same questions your team would (what they need, budget, urgency) before anyone spends time on them, so you're focusing effort on the leads that are actually ready."

---

## 4. Integration / Existing Systems

**"I already have a system, can you just connect to it?"**
Really means: doesn't want to migrate, wants automation layered on top.
→ "Yes — that's usually the goal, connecting to what you already run rather than replacing it. Tell us what system it is (CRM, ERP, POS, something custom) and we'll tell you honestly how straightforward that integration is."

**"We use [specific software] for inventory/customers."**
Really means: wants confirmation of compatibility before committing.
→ "We've connected to a range of systems like that before — even if we haven't touched that exact one, most expose a way in. We'd take a quick look at what it offers before quoting anything, so you're not paying to find out it's not possible."

**"I don't have any system, everything's on paper/in my head."**
Really means: starting from zero — needs the lightweight version, not enterprise integration.
→ "That's actually simpler in some ways — we can build something lightweight alongside the automation instead of working around an old system. No need to digitize everything first; we start with what actually matters for the bot to do its job."

---

## 5. Pricing / Hesitation

**"That sounds expensive."**
Really means: hasn't connected cost to what it's replacing (missed sales, manual time).
→ "Totally fair to ask. It's worth weighing against what a missed booking or a slow reply actually costs you over a month — for most businesses, automation pays for itself the first time it catches a sale that would've been lost. We also have an entry-level package if you want to start small and grow into it."

**"I need to think about it."**
Really means: not ready, don't push — leave the door open.
→ "Of course, no pressure at all. If it's helpful, we can send over the details we discussed so you have something concrete to think over, and we're here whenever you're ready — no expiry on that."

**"Can I try it before paying?"**
Really means: wants proof before committing, reasonable ask.
→ "We don't have a free trial as such, since each setup is built around your real data, but we're happy to walk you through examples and exactly what you'd get before you commit to anything."

**"Do I need to sign a long contract?"**
Really means: worried about lock-in.
→ "No hidden lock-in — we'll always be upfront about the terms before you commit to anything, and our packages are clear about what's yearly, monthly, or one-time."

---

## 6. Not Sure What They Need

**"I don't really know what I need, I just want more customers."**
Really means: outcome-focused, not solution-focused — needs guided discovery, not a menu.
→ "That's a great place to start, honestly — let's work backward from that. How do customers find and reach you right now, and where do you feel like you're losing them along the way (slow replies, no online presence, missed bookings)? That'll point us to the right fix instead of guessing."

**"What would you recommend for a small business like mine?"**
Really means: wants a human-feeling recommendation, not a price list.
→ "Depends a bit on where you are today — do you have a website or online presence at all yet, or would this be starting from scratch? That's the main fork in the road for which package makes sense."

**"Is this even worth it for a really small business?"**
Really means: self-doubt about scale/fit — reassure without overselling.
→ "Yes — our Starter package exists specifically for that. Even a small business loses real money to slow replies or no online presence, and automation scales down just as easily as it scales up."

---

## 7. Objections / Comparisons

**"Can't I just hire someone to answer messages instead?"**
Really means: comparing cost/effort of a hire vs. automation.
→ "You could, and some businesses do both — but a person can only handle one conversation at a time and needs to sleep. The bot handles unlimited conversations at once, any hour, and doesn't replace good judgment where you actually need a human — it just makes sure nobody's left waiting."

**"Will customers know it's a bot? Will they be annoyed?"**
Really means: worried about a bad, robotic-feeling experience.
→ "We're upfront that it's automated when it matters, but we specifically design the conversation to feel natural and helpful, not scripted — most customers care more about getting a fast, useful answer than about who or what answered."

**"What if the bot says something wrong to a customer?"**
Really means: trust/risk concern.
→ "It's grounded in your actual business data, not guessing, and it's built to say 'let me get someone who can help' rather than bluff an answer it's not sure of. You'll also see and approve sample conversations before it ever goes live."

---

*Same next step as [faq-knowledge-base-100.md](faq-knowledge-base-100.md): not wired into the live bot yet. Two ways to use this once approved: (1) paste the "how to respond" lines into `api/chat.js`'s system prompt as few-shot grounding, or (2) structure into a `scenarios` table (trigger_phrases, reasoning, response_en/fr) read the same way `services` is today.*
