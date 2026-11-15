# H@rts — email templates

Two different things live in this folder. They are sent by different systems and
edited in different places, so keep the distinction clear.

| File | Sent by | Configured in |
|---|---|---|
| `magic-link.html` | Supabase Auth | Dashboard → Authentication → Email Templates → **Magic Link** |
| `confirm-signup.html` | Supabase Auth | → **Confirm signup** |
| `change-email.html` | Supabase Auth | → **Change Email Address** |
| `lead-received.html` | our code (proposed) | `api/_notify.js`, via Resend |
| `lead-alert-internal.html` | our code (proposed) | `api/_notify.js` `sendEmail()` |
| `payment-confirmed.html` | our code (proposed) | `api/pay/webhook.js`, on `SUCCESSFUL` |
| `certificate-issued.html` | our code (proposed) | `api/trainee/progress.js`, when `git_cert_id` is minted |

The Supabase ones replace templates that exist today and are sending the stock
Supabase default. The four marked *proposed* send nothing at all yet — they are
drafts of emails the flows in this repo imply but never actually deliver.

The files are version-controlled here for the same reason `schema.sql` is: the
authoritative copy lives in a dashboard, and without this folder there is no
reviewable record of what our customers actually receive.

## Supabase Auth templates

Paste the file contents into the matching template's message body. The subject
line for each is in the comment at the top of the file.

**Do not swap `{{ .ConfirmationURL }}` for a `{{ .TokenHash }}` link.**
`login.html` reads `access_token` and `refresh_token` out of the URL **hash**
(`handleMagicLinkCallback`), which is the implicit flow that `.ConfirmationURL`
produces. A `token_hash` + `verifyOtp` link is the PKCE flow and lands on
`login.html` with nothing in the hash, so the page would silently fall back to
the sign-in form and the user would never get in.

Available variables: `{{ .ConfirmationURL }}`, `{{ .Token }}` (the 6-digit code),
`{{ .Email }}`, `{{ .NewEmail }}` (change-email only), `{{ .SiteURL }}`,
`{{ .RedirectTo }}`.

Templates not included, deliberately:

- **Reset Password** — there are no passwords. `login.html` is magic-link only.
- **Reauthentication** — nothing in the app calls it.
- **Invite user** — no invite flow exists. Worth adding the day trainees are
  enrolled by an admin rather than signing themselves up.

### Before these matter: check who is sending

Supabase's built-in email service is rate-limited to a handful of messages per
hour and is explicitly not for production use. With sign-in gated entirely on
email delivery, a single busy afternoon silently locks people out — and the
failure looks like "the link never arrived", which nobody reports as a bug.

Resend is already wired up in `api/_notify.js` with a verified domain, so the fix
is configuration, not code: Dashboard → Authentication → **SMTP Settings**, point
it at Resend, and set the sender to the same verified domain as `LEAD_NOTIFY_FROM`.
Worth doing before the templates.

## Transactional templates (proposed)

Placeholders are `{{name}}`-style and substituted server-side — they are *not*
Supabase template variables and nothing renders them automatically. Each file's
header comment names the exact call site and why it belongs there.

Two rules the drafts already follow, worth keeping:

- **`payment-confirmed.html` sends from the webhook, never from `collect.js`.**
  At `collect` time the payment is `PENDING`; only `webhook.js` has re-queried
  Campay and reconciled the amount. A receipt sent any earlier can be a receipt
  for money that never arrived.
- **Both currencies, always.** We bill USD and Campay collects XAF. A customer
  holding a MoMo SMS for 75,000 XAF cannot match it to a receipt that only says
  $125.

## House style

Table-based layout, inline CSS, 600px max width, no external stylesheets, fonts
or images — anything else is unreliable across Gmail, Outlook and the Android
clients most of our customers read email on. Strictly black and white, matching
the site. Company voice: "we/our", never "I". No emoji. Bilingual EN/FR on
anything a customer receives, since the site and the assistant both are.

## Testing

There is no build step, so preview by opening a file in a browser — but a
browser is a generous renderer and Outlook is not. Before shipping a change,
send one real message to a Gmail address and one to an Outlook address, and
check it on a phone, which is where most of these are opened.
