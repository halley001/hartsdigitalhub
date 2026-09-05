# FAQ gaps — questions the bot deliberately cannot answer

These are questions visitors demonstrably ask, that **nothing in this repo or on the
site answers**. They are not in the chatbot's FAQ set, and they are listed in the
"NOT SETTLED" block of `api/chat.js`'s system prompt so the LLM refuses to guess at
them too. Right now the bot says some version of *"we don't want to give you a
number we can't stand behind — let us get you a firm answer from the team."*

That is the correct behaviour for an unanswered question. It is not the correct
behaviour for a question you already know the answer to, and every one of these is
a question you almost certainly do know. **Answer them here and they can go live**:
add them to `marketing/faq-knowledge-base-100.md`, run `npm run generate:faq`, run
the SQL, and they are in the bot — or, for the ones worth having offline, add them
to `FALLBACK_FAQ` in `app.js` where they will also work with the network down.

They are ordered by how much damage the silence does.

---

## 1. Hosting and the domain name — who buys it, who renews it, what it costs

The single most common follow-up to "who owns the website", and the site never
addresses it. Every package sells a website; none of them says who holds the
hosting account, who buys the domain, what the yearly renewal costs, or whether
the yearly package fee already includes it.

This one has teeth: if a client assumes hosting is included and it is not, they
find out when the site goes down. Worth answering precisely — including what
happens to hosting and the domain if they stop working with you.

## 2. Who pays Meta's WhatsApp Business API fees

Sold on every page, priced nowhere. WhatsApp bots on the Business API are billed
per conversation by Meta, on top of anything H@rts charges — and the rates are
moving: from 1 October 2026, service and utility messages inside the 24-hour
customer-service window become chargeable, having previously been free.

So a Pro client whose bot handles real volume has a monthly Meta bill. Does that
land on them or on you? Is it inside the $1,400/year or outside it? A client who
discovers this after signing will reasonably feel misled, and this is the kind of
detail a competitor will happily use against you.

## 3. Refunds and cancellation of a yearly package

Packages are billed a year at a time and paid by MoMo, which is effectively
irreversible once sent. There is no stated refund position, no cancellation
window, and no answer to "what if I want out after two months". `terms.html` is
new and uncommitted — if it covers this, the answer should be lifted into the FAQ
too, because nobody reads the terms page before asking the bot.

## 4. How many rounds of revisions a build includes

`services.html` says "You review and approve" but never says how many times.
Industry guidance is consistent that unbounded revisions are the most common
source of client–agency friction, and the fix is stating the number upfront.
"Two rounds, then it's billable" is a perfectly good answer. Silence is not.

## 5. Who writes the copy and supplies the photographs

The bot tells clients that content is the usual bottleneck on a 2–4 week build —
which is true, and immediately raises the question of whose job it is. If you
write it, that is a selling point worth saying out loud. If they write it, they
need to know before the clock starts, not on day nine.

---

## Lower priority, but they will come up

- **Data residency.** The privacy FAQs say data is on secure cloud infrastructure;
  they do not say which country. Enterprise buyers and anyone with a compliance
  officer ask this specifically, and "we don't know" reads badly.
- **What happens as conversation volume grows.** A bot handling 50 chats a day and
  one handling 5,000 are different infrastructure. Does the price move? At what point?
- **Which integrations are actually native.** "We integrate with everything" is a
  claim buyers are now explicitly coached to distrust. A short list of systems
  you have genuinely connected before is worth more than a general promise.
- **Who does the work.** Buyers are advised to ask whether the people who pitch are
  the people who build, and whether anything is subcontracted.
- **What happens if the site breaks outside a support plan.** Build & Launch has no
  recurring fee — so what does a one-time client do six months later when
  something breaks? That is also a natural upsell you are currently not making.
- **Corporate Upskilling specifics.** Cohort size limits, delivery format (remote,
  on-site, both), and duration. "No fixed pricing" is fine; "no fixed anything"
  makes it hard to picture.

---

## How to answer these well

Two things the current FAQ set does that these should copy. Give the real number
or the real rule rather than a reassurance — "two rounds of revisions, then it's
billed hourly" beats "we work with you until you're happy", which promises
something you cannot deliver and will resent. And where the answer is genuinely
"it depends", say what it depends on, the way the existing pricing answers do.
