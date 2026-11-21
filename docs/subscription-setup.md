# The supporter subscription — what is built and what you have to set up

The code is finished and deployed. The subscription page is live, it says "cannot be bought here
yet", and it will keep saying that until the environment variables in section 3 exist. Nothing
below is optional; nothing below can be done by a workflow.

Everything here was read out of RevenueCat's and Paddle's own documentation rather than
remembered. Where a page did not answer something, this one says so instead of guessing.

---

## The order, and the one step that takes days

Do these in order. One of them is not instant:

> **Paddle must approve `hivepulse.multihead.de` as a checkout domain before anything can be
> sold.** Production approval goes through Paddle's review; the sandbox needs no approval, so you
> can build and test the whole flow while it is pending.
>
> It used to say `pay.rev.cat` here, and that was the mistake that cost a week (#541). See 1.3.

So: Paddle sandbox → RevenueCat → test a real sandbox purchase → then production.

---

## 1. Paddle (you)

Paddle is the **merchant of record**: they are the legal seller, they collect and remit EU VAT,
and you receive payouts. That is why Paddle and not Stripe — RevenueCat's docs name merchant of
record only for Paddle, and with RevenueCat Billing + Stripe Tax you would stay the seller and
file OSS yourself in five countries.

### 1.1 Two accounts, deliberately separate

Paddle keeps sandbox and production completely apart — different logins, different data.

- Sandbox: <https://sandbox-vendors.paddle.com/>
- Production: <https://login.paddle.com/>

Create the **sandbox** one first. Everything in sections 1.2 to 1.6 is done there, then repeated
in production later.

### 1.2 Switch on Paddle Billing

Some accounts still start on the older "Paddle Classic".

**Paddle → Business Account → Account Settings → Get Paddle Billing**, then switch from *Paddle
Classic* to *Paddle Billing* with the tab at the bottom of the sidebar.

### 1.3 Approve our own domain — the slow one

**Settings → Website approval → Add domain →** enter `hivepulse.multihead.de` **→ Submit for
approval**. Sandbox does not need it; production does, and it is reviewed by a person.

Paddle refuses to render a checkout on a domain it has not approved, and the domain that matters
is the one the page runs on — ours, because `purchases-js` opens the Paddle checkout in our own
page (#541).

> **Not `pay.rev.cat`.** That was tried and refused, and it can never pass. Paddle's own
> "Add domain" dialog states the condition: *"Your website must link through to, or contain,
> your: terms of service, privacy notice and refund policy to be successfully approved."*
> `pay.rev.cat` is RevenueCat's domain, there is no setting anywhere in RevenueCat to put those
> three links on it, and purchase links have no custom domain. `hivepulse.multihead.de` carries
> all three on `/pricing` and was approved the same day it was submitted.
>
> RevenueCat's Paddle page lists the three domains a seller might need, and names ours:
> *"your own domain — if you're self-hosting purchases with RevenueCat's Web SDK"*.

The rejection mail blames an offline site, a missing certificate or a login wall. None of those
was true. Read it as "we could not find your terms, privacy and refund policy", because that is
what it means.

### 1.4 Checkout settings

Set the **default payment link** to `https://hivepulse.multihead.de/en/dashboard/subscription`
(<https://sandbox-vendors.paddle.com/checkout-settings>). Paddle requires one to create a
transaction, and it only accepts an approved domain.

### 1.5 Turn off abandoned-cart emails

**Checkout → Checkout recovery →** disable them. RevenueCat's reason, verbatim: *"The link in
these emails can't reopen a checkout started by RevenueCat."* So the email would send somebody to
a dead page.

### 1.6 The API key, and the permission everybody forgets

**Developer Tools → Authentication → + New API key.** Copy it and keep the window open until it
is saved in RevenueCat, because Paddle shows it once.

> **It will expire, and you have to write down when (#528).** This page used to say "set it to
> not expire", which came from RevenueCat's own instructions and holds in the sandbox only: the
> live account requires a date. Put that date in `PADDLE_API_KEY_EXPIRES_AT` (`YYYY-MM-DD`, see
> section 3) the moment you create the key.
>
> Not bookkeeping — this is the quietest failure the whole arrangement has. **This server never
> talks to Paddle**; RevenueCat does. So on the day the key stops working, RevenueCat loses
> Paddle and everything here keeps answering as though nothing were wrong: no endpoint errors,
> nothing reaches Sentry, nothing in the pipeline turns red. The only symptom is that purchases
> stop. With the date recorded, the admin health page says so and the daily reminder run warns
> for the last thirty days.

Permissions — this is the minimum RevenueCat documents, and it is worth setting exactly:

| Access | Scopes |
|---|---|
| Read only | Addresses, Adjustments, Businesses, Customers, Discounts, Notifications, Payment methods, Prices, Products, Subscriptions |
| Read **and** write | Client-side tokens, Notification settings, Transactions |
| **Write** | **Customer portal sessions** |
| None | Customer authentication tokens, Notification simulations, Reports |

**Customer portal sessions (write) is the one that matters to us.** Without it Paddle does not
embed an authenticated session token in the subscription-management URL — and that URL is exactly
what `GET /subscriptions/me` returns as `manage_url` and what the "Manage the subscription" button
on `/dashboard/subscription` opens. Forget this permission and that button leads nowhere.

### 1.7 The product

**Catalog → Products → New Product**, then **New Price** on it.

- One product, one price: **€19.99, yearly**. The code expects a single product; RevenueCat's
  Paddle integration states "We support purchases that contain only one product."
- The *price name* is what the customer reads in the checkout, so write it as a person would say
  it, not as an identifier.
- Each Paddle **Price** becomes its own product in RevenueCat.
- **Product icon URL:** `https://hivepulse.multihead.de/brand/product-icon-512.png` (#500).
  Optional, and worth filling in: Paddle shows it in the checkout and on the invoice. It is a
  file of its own rather than the Play listing icon — the same drawing today, but the next
  change Google asks for on the listing must not silently change what appears on a receipt.
  `scripts/make_store_graphics.py` redraws all three from the brand logo.

---

## 2. RevenueCat (you)

### 2.1 Connect Paddle

1. Open the project → **Web** (lower part of the dashboard) → create a web config for **Paddle**.
2. **Set secret** → paste the Paddle API key from 1.6 → **Set**.
3. Purchase tracking: **Automatic purchase tracking** and **Autogenerated user IDs**.
4. **Connect to Paddle**.

### 2.2 Import the product, then describe what it unlocks

5. **Product catalog → Products →** find the Paddle provider → **Import** → tick the product →
   **Import**.
6. **Product catalog → Entitlements → + New entitlement.** The identifier must be **`supporter`**
   — that is what `REVENUECAT_ENTITLEMENT` defaults to in `backend/app/config.py`, and
   `POST /subscriptions/sync` looks for exactly this name. Then **Attach** the imported Paddle
   product to it.
7. **Product catalog → Offerings → New offering**, with one package (**+ New Package**) whose
   identifier matches the billing cycle, pointing at the Paddle product.

### 2.3 The public SDK key — and no purchase link

8. **Web → your Paddle config → Public API Key.** Copy it. That is the whole of it: it goes into
   the website's build as `NEXT_PUBLIC_REVENUECAT_WEB_KEY`, the page configures the SDK with it,
   and the Paddle checkout opens over `/dashboard/subscription`.

   Public on purpose — it identifies the app and authorises nothing. It is still not written into
   this repository, which is public; it comes from a Vercel environment variable, the way the
   apps take theirs from a GitHub secret.

9. On the same config, **Purchase tracking** stays on **Automatic** ("Track all new Paddle
   purchases and updates via webhooks — no setup needed"). The page never tells our backend what
   was bought; RevenueCat does, through the webhook in 2.4.

**There is no Web Purchase Link, and there must not be one.** A hosted link lives on
`pay.rev.cat`, and Paddle cannot approve that domain (1.3). Creating one anyway would give you a
URL that looks right, takes a customer to a checkout, and fails in their face with
"Something went wrong."

Two things the hosted flow could not do, and the SDK does:

* **The checkout speaks the buyer's language.** Of the hosted flow RevenueCat says flatly that
  "it is not possible to specify the language used in Web Purchase Links"; the SDK takes
  `selectedLocale`, and covers all five of ours. #503's return route, which forwarded a buyer to
  their own language after a fixed redirect, is now only there for links in RevenueCat's emails.
* **The price on the button is the price at the till.** The offering carries it, already
  formatted in the customer's currency.

> The account id still has to be right. It is `appUserId` in `lib/revenuecatWeb.ts`, it is the
> HivePulse `user.id`, and the webhook matches on it — a purchase carrying anything else is money
> taken and credited to nobody. It used to be a path segment of a URL the server built; the
> hazard did not go away, it became a named argument with its own tests.

### 2.4 The webhook to our server

**Project → Integrations → Webhooks → Add new configuration.**

- URL: `https://hivepulse.multihead.de/api/v1/subscriptions/webhook`
- **Authorization header value:** a long random string you invent. RevenueCat sends whatever you
  type here as the request's authorization header; our server compares it in constant time
  against `REVENUECAT_WEBHOOK_SECRET`. Both `secret` and `Bearer secret` are accepted, so either
  spelling works — but the two sides must match exactly.

An unconfigured secret makes the endpoint refuse **everything**, which is deliberate: a
misconfigured deployment should go quiet rather than open.

---

## 3. The environment variables (you, in Vercel)

Settings → Environment Variables, on the **hivepulse** project for production and on
**hivepulse-staging** for the sandbox values.

| Variable | What it is | Where it comes from |
|---|---|---|
| `NEXT_PUBLIC_REVENUECAT_WEB_KEY` | the Paddle config's **public** API key, read by the browser | 2.3 |
| `PADDLE_API_KEY_EXPIRES_AT` | the date on the key, `YYYY-MM-DD` | 1.6 |
| `REVENUECAT_WEBHOOK_SECRET` | the string you typed in 2.4 | 2.4 |
| `REVENUECAT_API_KEY` | RevenueCat **secret** API key, for `POST /subscriptions/sync` | RevenueCat → API keys |
| `REVENUECAT_ENTITLEMENT` | only if you did not call the entitlement `supporter` | 2.2 |
| `REVENUECAT_ENVIRONMENT` | `SANDBOX` on staging. Production needs nothing | see below |
| `WEB_CHECKOUT_ENABLED` | `true` to let this deployment sell **on the website** | see below |
| `STORE_CHECKOUT_ENABLED` | `true` to let this deployment sell **in the apps** | see below |

**`WEB_CHECKOUT_ENABLED` is off unless you set it, and that is deliberate (#530).** Without it,
`GET /subscriptions/me` reports `web_checkout_enabled: false`, the page never asks RevenueCat for
a price at all, and it says "cannot be bought here yet" — the same thing it says on a deployment
whose build has no SDK key, in five languages.

The reason is that a key used to be enough. Set it, and the next deploy put a buy button in front
of people, whatever that deploy was about. Paddle approves a checkout domain on its own schedule,
and a checkout opened before that approval fails with "Something went wrong." in the customer's
face. A default of "on unless disabled" fails open; this one fails closed, so selling starts when
somebody decides it does.

Note which way round the two work: the key is a build value and the switch is a server value.
Deploying the key changes nothing on its own, and the switch can be flipped the morning Paddle
approves without shipping anything.

Only *selling* is gated. `GET /subscriptions/me`, `POST /subscriptions/sync` and the webhook keep
working, so anybody who already bought keeps their access and a cancellation still arrives.

Staging needs `WEB_CHECKOUT_ENABLED=true` as well, or sandbox purchases cannot be tested there.

**Add it as a plain variable, not a Sensitive one.** A flag that says whether a buy button
exists is not a secret, and marking it Sensitive costs something real: Vercel stores such a
value write-only — "can't be read back from the dashboard or API" — so `vercel pull` writes the
literal string `[SENSITIVE]` in its place. The deploy jobs source that file to run migrations,
pydantic gets `[SENSITIVE]` where it wants a boolean, and the staging deploy dies in its
migration step. Because the E2E gate and the production deploy sit behind it, **nothing reaches
production at all**, while every quality gate stays green and the error names pydantic rather
than the pull. Three merges sat on `main` unpublished that way (#536).

The deploy steps now drop any variable whose pulled value is that placeholder, and say in the
log which ones, so this fails in the open rather than taking the pipeline down. The value is
then simply absent and the default stands — closed, for this flag. But that also means a flag
stored as Sensitive **does not reach the migration step at all**, so keep it plain and the
question does not arise. `backend/tests/test_vercel_env_pull.py` holds the filter in place.

**`STORE_CHECKOUT_ENABLED` is the same switch for the apps, and a separate one on purpose.**
The website and the apps go live at different moments: Paddle approves a checkout domain, and
Apple and Google approve subscription products, on three different schedules. One flag for
both would mean the first approval starts selling through a store that has nothing to sell.

It is read by the apps from `GET /subscriptions/me`, which their paywall already fetches
before it offers anything. While it is off, both apps say the subscription cannot be bought
there yet — the same sentence as a build with no SDK key. **A build value in the apps would
have been the wrong answer:** changing one means shipping a new app through review, and the
morning Apple approves the products is not a morning to start a release.

An app that cannot reach the server does not sell either. Silence reads as "unknown", and
unknown is closed; `SupporterViewModelTest` and `SupporterViewModelTests` pin that on both
platforms.

**`REVENUECAT_ENVIRONMENT=SANDBOX` is the other thing staging needs, and it is easy to
forget.** The server accepts events only from the environment it was told to expect, and the
default is `PRODUCTION` — so a staging deployment without this variable answers
`handled: false` to every sandbox purchase and nothing unlocks. That is the harmless
direction of the mistake, and the reason the default is that way round: the opposite would
have a production deployment honour test cards. Production needs no variable; leave it unset.

**The sandbox token wins over the production one when both are set.** That is on purpose, so a
staging deployment cannot take real money. Never set the sandbox token on production.

---

## 4. Testing, and what does not work

- Sign in on staging and open `/dashboard/subscription`. With `WEB_CHECKOUT_ENABLED=true` and a
  sandbox SDK key in that build, the button carries a price and opens Paddle's sandbox checkout.
- Pay with Paddle's test cards.
- **Use a real-looking email.** Reserved domains — `.test`, `.invalid`, `.localhost` — fail
  Paddle's validation and RevenueCat will not record the purchase.
- **Paddle's webhook simulator does not work with RevenueCat.** Verbatim: *"Simulated webhook
  events are ignored, so they will not update customer status or entitlements."* Test with real
  sandbox purchases instead.
- Paddle sandbox subscriptions use **full** billing periods — there is no accelerated renewal the
  way the App Store sandbox has one. A yearly subscription will not renew while you watch.

What to check on our side after a sandbox purchase:

1. `GET /subscriptions/me` returns `status: "active"`, `source: "web"`, a `current_period_end`
   and a `manage_url`.
2. `/dashboard/subscription` shows it, and the colony counter says "unlimited".
3. The eleventh colony can be created.

---

## 5. Going to production

Sandbox and production are **separate Paddle accounts**, in RevenueCat's words: "Paddle has
entirely separate sandbox accounts that should be created and configured as standalone accounts."
Nothing carries over. Repeat sections 1.2 to 1.7 in the production account — **including the
domain approval**, which is the part that takes days — create a production web config in
RevenueCat pointing at it, and put its public key on the production Vercel project.

> ### What is no longer a trap
>
> There used to be a box here about the purchase link's single success redirect: point it at
> staging to test and every paying customer lands on staging, point it at production and your own
> sandbox purchase returns you to a site you are not signed in to. Nothing in the pipeline could
> catch either.
>
> There is no redirect any more. The checkout resolves in the page it was opened from, so each
> environment returns to itself by construction (#541). The `/dashboard/subscription-return`
> route stays for links in RevenueCat's own emails.

**The order of the last two moves**, once Paddle shows the checkout domain as approved:

1. Set the **default payment link** in Checkout settings to
   `https://hivepulse.multihead.de/en/dashboard/subscription`. Paddle refuses an unapproved
   domain — "In live it must be on an approved domain" — and until a default is set, every
   checkout fails with "Something went wrong."
2. Set **`WEB_CHECKOUT_ENABLED=true`** on the production project and deploy. This one is last on
   purpose: it is the moment the buy button appears, and everything above has to be true first.

Deploying before step 3 is safe and expected — the page simply keeps saying "cannot be bought
here yet", which is the truth until Paddle has approved the domain.

**Two webhooks, not one.** Each environment gets its own, with its own secret, and with
RevenueCat's *Environment* set explicitly — Sandbox for the one pointing at
`apiscan-staging.vercel.app`, Production for the one pointing at `hivepulse.multihead.de`. The
default is "Both", and "Both" on the production webhook would mean a purchase paid for with a
test card grants a real entitlement.

That is now caught on our side as well: the server reads the event's `environment` and
ignores anything that is not the environment this deployment was told to expect (#506).
Setting the webhooks correctly remains the first line of defence — the check is the
second, for the day somebody clicks "Both" without knowing what it means. It used to be
neither: what kept a sandbox event from granting a real entitlement was the mismatch between
the two databases' account ids, which is luck rather than design.

---

## 6. When somebody asks for their money back

**Two actions in Paddle, not one.** They do different things, and the one that is easy to forget is
the one that costs money.

| | What it does | What it does *not* do |
|---|---|---|
| **Refund** — Transactions → the transaction → Refund | Returns the money. RevenueCat sends `CANCELLATION` with `cancel_reason: CUSTOMER_SUPPORT`, the server maps that to `refunded`, and access ends **at once** | Stop the next payment |
| **Cancel** — Subscriptions → Actions → Cancel | Ends the subscription, so nothing is charged again | Return any money |

A refund on its own leaves the subscription **Active in Paddle, with a next payment date**: Paddle
refunds a *transaction* and does not touch the *subscription*. The customer loses the features
immediately and is charged 19.99 € again twelve months later. The first they would know of it is
the statement (#526).

When cancelling after a refund, choose **immediately** rather than at the end of the billing
period — the period is no longer paid for.

**Nothing can enforce this but the person doing it.** The server never learns Paddle's subscription
status; it sees only what RevenueCat sends, and a refunded subscription that is still live looks
exactly like one that is not. This list is the control.

**The ordinary case needs only one action.** Somebody who just wants to stop, without their money
back, is a plain cancellation — theirs through Paddle's customer portal, or yours here — and they
keep access until the year they paid for runs out. That is what the terms promise, and the mapping
produces it: a `CANCELLATION` whose reason is *not* `CUSTOMER_SUPPORT` leaves the subscription
active and only clears `will_renew`.

> **Verified, not assumed.** The whole cycle was run in the sandbox — buy, refund, cancel. The
> refund arrived as `CANCELLATION` with `cancel_reason: "CUSTOMER_SUPPORT"` and a negative price,
> the cancellation as `EXPIRATION` with `expiration_reason: "CUSTOMER_SUPPORT"`, and access ended
> on the first of the two without anybody touching the website. This is the first time #496's
> refund branch has run against a real payload rather than a fixture.
>
> One warning for whoever repeats it: **RevenueCat's Webhook Events list does not refresh in
> place.** Its Refresh button did nothing; both events appeared only after leaving the Webhooks
> page and returning. Reading that list too early is how an afternoon gets spent hunting a
> delivery problem that does not exist (#527).

---

## Nothing on the website may ask for a donation — decided the hard way (#533)

Paddle reviewed `hivepulse.multihead.de`, classified it as **"Other/Donations"** and refused the
application outright. Not the domain check — the whole application:

> We're not able to activate your account to take payments through Paddle.

It was not their mistake. Their Acceptable Use Policy excludes anything sold

> Where there is no bona fide software or service sold, including but not limited to donations,
> crowdfunding, community access, advertising, and sponsorship.

and what the reviewer found on the page we submitted as our pricing page was a third card reading
**"One-time donation — your amount"** with a **Ko-fi** button and a `paypal.com/donate/` button,
under the heading "Support the mission / A small contribution keeps the servers running". The
footer repeated both links on every page of the site.

So: **no donation link, button, tier or appeal goes back on this domain.** Not in the footer, not
on the landing page, not in a help article. A Ko-fi button looks like free money and costs the
ability to sell anything at all. `__tests__/NoDonationRoutes.test.ts` fails the build if one
returns, and it names the hosts it refuses.

If donations are ever wanted again, that is a decision about **who processes payments**, not a
tweak to a page. Make it first, then delete that test on purpose.

### The fallback, if the appeal fails

There is exactly one appeal. If it is refused, the way through is **Stripe Billing with Managed
Payments** behind the same RevenueCat interface:

* Stripe is then merchant of record and handles VAT collection and remittance, as Paddle would have.
* **Switzerland is a supported seller country**, and software/SaaS is an eligible category with its
  own tax code. Stripe runs an eligibility review of the account, but there is **no domain review** —
  it judges the *product* by its tax code, so donations elsewhere on the site cannot disqualify the
  subscription the way they did here.
* **Nothing in our code changes.** `purchases-js` talks to whichever billing engine the
  RevenueCat config names, and the webhook and `app/utils/entitlements.py` do not care either.
  That is the dividend of letting our own table be the source of truth instead of the provider.
* What it does cost is text: Paddle is named as the seller in the privacy policy, the terms and the
  refund policy, in five languages, plus sections 1 and 6 of this document.

## What this document does not know

- **Whether you need a trade registration.** `lib/imprint.ts` puts the operator in Sissach, so
  this is a Swiss question — selling a subscription regularly and with intent to profit, and from
  what turnover that has to be entered in the commercial register. Paddle being merchant of
  record removes the VAT filing, not the registration. That is a question for a Treuhand, and it
  belongs before the first franc rather than after it.

**Answered since this was written:** whether Paddle onboards an individual. It does, and it is the
easier path. Verification has three stages — domain review, business verification, identity
verification — and of the middle one Paddle says plainly: "this step is not required for
individuals or sole traders." Choosing *Individual* rather than *Private* at signup therefore
skips the registration documents and the ownership breakdown entirely; only your own identity is
checked, through their partner Sumsub, with a photo ID and a proof of address. *Private* means a
privately held company and asks for papers an individual does not have.

---

## What is already done, so you do not look for it

- `GET /subscriptions/me`, `POST /subscriptions/sync` and `POST /subscriptions/webhook`
  (`backend/app/routers/subscriptions.py`), and the browser's side of the checkout
  (`lib/revenuecatWeb.ts`).
- The event and store mapping (`backend/app/utils/revenuecat.py`), checked line by line against
  RevenueCat's published values: `PADDLE` is a real `store`, a refund arrives as a `CANCELLATION`
  with `cancel_reason: CUSTOMER_SUPPORT` and there is no `REFUND` event type, `expiration_at_ms`
  is milliseconds, and there is no auto-renew field — `will_renew` is derived from the event
  because nothing else can be.
- The single place that writes an entitlement (`backend/app/utils/entitlements.py`). The server
  never asks RevenueCat at request time: the webhook writes `subscriptions`, and that table
  answers. Swapping RevenueCat for something else later replaces that one module.
- The subscription page, the free-colony limit, the treatment record, and the five-language texts
  on all three clients.

- Buying inside the iPhone and Android apps, through StoreKit 2 and Play Billing with the
  RevenueCat SDKs (#17, #535). Both are gated by `STORE_CHECKOUT_ENABLED` and need product
  identifiers from App Store Connect and the Play Console before a price appears.
