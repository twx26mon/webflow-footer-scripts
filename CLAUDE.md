# Tillageworx Customer Portal & Website — Claude Code Project Brief
_Adapted from chat handoff doc, 29 June 2026 → for Claude Code, 2 July 2026_

> **Read this whole file before touching any code.** This is Moni's live business — real customers, real orders, real invoices. Don't guess at conventions; they're documented below. If something isn't covered here, ask rather than assume.

---

## How to work with me (read first)

- I have ADHD — keep instructions clear and step-by-step, minimal unexplained jargon.
- I'm learning React as I go — this is my first real React project. When you make a non-trivial change, briefly say *what* you changed and *why* in plain English alongside the code.
- I work in VS Code on Windows, PowerShell terminal, GitHub Desktop for some deploys.
- **Ask before:** pushing to GitHub, deploying (Cloudflare Pages/Workers), or publishing the Webflow site. I'll confirm each time — don't chain these together automatically.
- **Branching:** I commit directly to `main` for normal work. For bigger/riskier changes, I test on a `staging` branch first before merging to `main`. Before committing, weigh up whether the change is big enough to warrant staging (e.g. touches multiple pages, changes shared components like TopNav, touches auth/payment-adjacent logic) vs small enough for `main` directly (e.g. a copy tweak, a CSS fix) — flag your reasoning to me, then **always confirm with me before actually committing**, regardless of which branch.
- **Commit messages:** fine for you to write these yourself.
- **Never** put real API keys, secrets, or tokens directly in code or commit them. Reference the password manager entry name instead (see Credentials section). If you need a secret's actual value to test something, ask me to paste it into the terminal/env directly — not into chat.
- If you hit something ambiguous (e.g. two components could reasonably own a piece of logic), stop and ask rather than picking one and running with it — small decisions compound fast in a codebase I'm still learning.
- **Keeping this file current:** at the end of every session, update this `CLAUDE.md` (and the matching one in the other repo, if anything you did touches it) to reflect the current state — move ✅/⚠️ markers as things get finished, add any new gotchas you hit and solved, remove or update anything in "Open questions" that got answered, and re-order "Current priorities" if things shipped or changed. Edit sections in place — don't append a session log, changelog, or dated notes; this file should always read as a clean current snapshot, not a history. If in doubt whether something belongs, leave it out — a shorter accurate file beats a longer one, since the whole thing gets read at the start of every session.

---

## Business context

Tillageworx Pty Ltd (ABN 38 671 005 940) — Perth, WA. I import and sell aftermarket tillage wear parts (disc blades, points, wings, shins) for European machinery brands (Horsch, Väderstad, Lemken, Amazone) to AU/NZ broad-acre cropping customers. I run the business largely solo.

**Why this portal exists:** Since adding prices + a quote cart to the public Webflow site, enquiries dropped — visitors see prices, do the maths, and leave without contacting us. The portal gates pricing behind a free customer account signup, which recaptures lead data and makes "create an account" the primary conversion path instead of anonymous browsing.

**Brand language (use consistently in any UI copy):** "Customer Accounts" — never "trade accounts" (implies wholesale discount) or "user accounts" (too generic). CTA: "Create a customer account". Login button: "Customer login".

---

## Two repos, two jobs

| Repo | Purpose | Local path |
|---|---|---|
| `twx-order-app` | React/Vite customer portal (accounts, orders, invoices) | `C:\Users\61451\OneDrive - tillageworx.com\Desktop\Tillageworx\twx-order-app` |
| `twx26mon/webflow-footer-scripts` | Global JS/CSS injected into the public Webflow site (`global-footer.js`, `global-styles.css`) — includes price gate, cart logic, and site nav styling | `C:\Users\61451\OneDrive - tillageworx.com\Desktop\Tillageworx\Webflow Code\Github\webflow-footer-scripts` |

These are separate concerns: the portal is its own app; `global-footer.js` runs on the public Webflow marketing site and talks to the portal (price gate, cart personalisation, `?cart=open` deep link). Don't conflate the two when making changes — confirm which repo a task belongs to if unclear.

---

## Tech stack

| Layer | Technology |
|---|---|
| Portal front-end | React + Vite |
| Auth | Supabase (email + password, email verification required) |
| API middleware | Cloudflare Worker (`twx-zoho-proxy.monica-6b5.workers.dev`) |
| Back-end data | Zoho Inventory (org ID `7006335832`) |
| Transactional email | Resend (`noreply@tillageworx.com`) |
| Public website | Webflow (`tillageworx.com.au`) |
| Global site JS | `global-footer.js`, repo `twx26mon/webflow-footer-scripts` |
| Global site CSS | `global-styles.css`, same repo — served via Cloudflare Worker (see gotchas) |
| Deploy target (portal) | Cloudflare Pages → `customers.tillageworx.com.au` |

## Live URLs

| Environment | URL |
|---|---|
| Live portal | `https://customers.tillageworx.com.au` ✅ |
| Cloudflare Pages | `https://twx-customer-portal.pages.dev` |
| Cloudflare Worker (API proxy) | `https://twx-zoho-proxy.monica-6b5.workers.dev` |
| Cloudflare Worker (static assets) | `https://empty-cake-b32dtwx-assets.monica-6b5.workers.dev` |
| Main website | `https://www.tillageworx.com.au` |

---

## Supabase project

- Project name: `tillageworx-customer-portal` · ID: `srgndcoiobilpwbliwgn` · Region: `ap-southeast-2` (Sydney)
- URL: `https://srgndcoiobilpwbliwgn.supabase.co`
- Publishable key lives in the React app's `.env` as `VITE_SUPABASE_ANON_KEY`
- **Legacy `eyJ...` anon key is what the Worker needs for JWT verification** — the newer `sb_publishable_...` key returns 401 on `/auth/v1/user`. Never swap these. Actual key value is in the password manager, not in this file.
- Auth: email verification ON, SMTP via Resend
- Test account: `monica@tillageworx.com`

---

## Cloudflare Worker (`twx-zoho-proxy`)

**CORS allowed origins:**
`https://www.tillageworx.com.au`, `http://localhost:5173`, `http://localhost:5174`, `https://customers.tillageworx.com.au`, `https://twx-customer-portal.pages.dev`

> Vite falls back to port 5174 when a ghost process holds 5173. If you see CORS errors locally, check which port Vite actually started on before assuming the Worker config is wrong.

**Env vars (names only — real values in password manager under "Zoho API - Tillageworx Portal"):**
`ZOHO_WEBHOOK_URL`, `ZOHO_CLIENT_ID` (plaintext, not secret), `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ORG_ID` (`7006335832`, plaintext), `SUPABASE_URL` (plaintext), `SUPABASE_ANON_KEY` (legacy key, secret), `RESEND_API_KEY`

**Routes (current):**

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | None | Zoho Flow webhook proxy (quote form) |
| GET | `/contact` | JWT | Find existing Zoho contact by email |
| POST | `/contact` | JWT | Create new Zoho contact |
| PUT | `/contact` | JWT | Update Zoho contact (address, mobile, accounts email) |
| GET | `/orders` | JWT | Fetch sales orders filtered by customer `zoho_id` |
| GET | `/invoices` | JWT | Fetch invoices filtered by customer `zoho_id` |
| POST | `/orders` | JWT | Create new sales order |
| POST | `/orders/confirm` | JWT | Confirm sales order (accept freight quote) |
| POST | `/contact-us` | JWT | Send customer message via Resend |
| POST | `/quotes` | JWT | Create new estimate in Zoho |
| GET | `/items` | JWT | Fetch specific product items by ID |
| GET | `/purchaseorders` | JWT | Fetch open POs (backorder tracking) |

---

## React app — file structure

```
twx-order-app/
  src/
    assets/
      twx-logo.png
    components/
      TopNav.jsx          ← current nav (replaced old Sidebar)
    lib/
      supabase.js
    pages/
      Signup.jsx           ✅ done
      Login.jsx             ✅ done
      Dashboard.jsx        ✅ done — uses TopNav
      Orders.jsx             ⚠️ still on old Sidebar — needs TopNav
      Invoices.jsx            ⚠️ still on old Sidebar — needs TopNav
      Account.jsx            ⚠️ still on old Sidebar — needs TopNav
  App.jsx
  index.css                ✅ #root text-align: left (fixed)
  .env
```

`.env`:
```
VITE_SUPABASE_URL=https://srgndcoiobilpwbliwgn.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_6KrJ0rECybfj3_Pj-nz7yA_K2jaXjnU
```

`App.jsx` routes:
```jsx
<Route path="/signup" element={<Signup />} />
<Route path="/login" element={<Login />} />
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/orders" element={<Orders />} />
<Route path="/invoices" element={<Invoices />} />
<Route path="/account" element={<Account />} />
<Route path="/" element={<Navigate to="/dashboard" replace />} />
```

---

## What's already built (don't rebuild this)

**Authentication & onboarding**
- Signup form — name, business, postcode, machines, email verification
- Supabase SMTP via Resend
- Login with find-or-create Zoho contact (runs on first login only, not signup — see gotchas)

**Portal pages**
- Dashboard — TopNav, "MONI'S DASHBOARD" gold/white title, live stat cards, two-column layout
- Orders — Q-xxxx → SO-xxxx renaming on confirmed orders, status colour strips, invoice number when converted, backorder ETA banner, address gate before approval, contact form
- Invoices — live from Zoho, overdue flagging, due dates
- Account — full edit form (contact, billing/delivery addresses, machines), saves to Supabase + Zoho

**Navigation**
- `TopNav.jsx` replaces the old Sidebar everywhere it's been rolled out. Two-tier: info bar (`#111`, phone/email/dealer finder + greeting + return-to-website pill) and main nav (`#050505`, logo + links + Order Now button + sign out). Gold underline on active page. Container: `max-width: 90rem`, `padding: 0 1.75rem` — matches Webflow's `body-container` exactly. Don't deviate from this without checking against the live site.

**Webflow integration**
- Cart auto-opens on `?cart=open`
- Cart header shows "[First Name]'s Cart" when logged in (reads Supabase session from localStorage)
- "Browse Parts" nav link → Webflow `?cart=open`
- Price gate built into `global-footer.js` but **currently OFF** (`GATING_ENABLED = false`)
- **Webflow nav redesign** ⚠️ in progress — `global-styles.css` nav section written and verified on `tillageworx.webflow.io` staging. Moni completing final Webflow Designer tweaks. Next: merge `staging` → `main`, update Cloudflare Worker `empty-cake-b32dtwx-assets` with new CSS.

**Design system** — Oswald (headings), Arial (body). Gold `#c2934a`. Backgrounds `#111`/`#0e0e0e`/`#050505`. Text `#fff`/`#aaa`/`#686868`. Letter-spacing `1px` nav, `0.3px` body. Container `90rem` / `1.75rem` padding everywhere. Status colours: green=confirmed, blue=delivered, orange=awaiting approval, grey=draft.

---

## Zoho custom fields (Sales Orders)

| Field | Type | Purpose |
|---|---|---|
| `cf_backorder_eta` | Date | Primary backorder ETA |
| `cf_backorder_eta_2` | Date | Secondary ETA (split shipments) |

Order approval status is `current_sub_status === "cs_quotepe"` → "Pending Customer Approval" (not a `custom_status` field — easy to get wrong).

---

## Signup fields → Supabase `user_metadata`

`first_name`, `last_name`, `business_name`, `postcode` (delivery), `machines` (array: Horsch/Väderstad/Lemken/Amazone/John Deere/Allen/Other), `other_machine`, `zoho_id` (set on first login), `mobile`, `accounts_email`, `billing_street/town/state/postcode`, `same_as_billing` (bool), `delivery_depot`, `delivery_street/town/state/postcode`.

---

## Key gotchas — read before debugging, will save you time

- **Vite cache:** changes not showing → `taskkill /F /IM node.exe` then `npm run dev` fresh. Check `index-[hash].js` in DevTools Network tab to confirm the right bundle loaded.
- **Port shifting:** Vite falls back to 5174 if 5173 is busy. Worker CORS must allow both.
- **Stale JS after restart:** hard reload (right-click reload button → "Empty cache and hard reload") or try a different browser.
- **Zoho token caching:** parallel requests can invalidate tokens. Worker caches for 55 min via `cachedToken`/`tokenExpiry`.
- **Unverified Supabase JWT:** not valid for Worker calls until email is verified — Zoho contact creation happens at first *login*, not signup.
- **Zoho OAuth:** must use Self Client (non-expiring refresh token). Web-Based Application client tokens expire and break the Worker.
- **Q→SO numbering:** Zoho always shows `Q-xxxx` internally; portal swaps the prefix to `SO-` for confirmed/invoiced/fulfilled/closed orders only — this is a display transform, not a Zoho field.
- **Email:** MailChannels' free Cloudflare integration is dead — Resend only. Resend DNS records go on `tillageworx.com` (not `.com.au`) — all live email addresses use `.com`.
- **Business name casing:** stored exactly as typed (may be ALL CAPS) — use the `toTitleCase()` helper when displaying, don't re-derive this logic elsewhere.
- **`global-styles.css` is served via Cloudflare Worker**, not from GitHub directly. The Worker `empty-cake-b32dtwx-assets.monica-6b5.workers.dev` has its own copy of the CSS — pushing to GitHub does NOT update the live site. To test staging changes: temporarily swap the Webflow head code `<link>` to `https://cdn.jsdelivr.net/gh/twx26mon/webflow-footer-scripts@[commit-hash]/global-styles.css`. After confirming on staging, merge to `main` and update the Worker manually via Cloudflare dashboard. Always use a commit hash (not branch name) for jsDelivr test URLs — branch-based CDN URLs cache aggressively.
- **Raw GitHub CSS URLs don't work in browsers** — `raw.githubusercontent.com` serves files as `text/plain` and Chrome refuses to apply them as stylesheets. Always use jsDelivr for testing.
- **Webflow CSS class names:** always inspect the live DOM before writing selectors — Webflow's designer labels often differ from the real class names. Key info bar classes: `.header-contact-container` (the desktop layout wrapper), `.header-phone-wrapper`, `.header-email-wrapper`, `.header-dealer-wrapper`, `.social-icon-container`, `.header-social-text h3` ("Follow Us" is an h3, not `.text-block`). Info bar link text uses `a.topbar-text` (not `.nav-top-link`). Navbar dropdown toggle is a `div.w-dropdown-toggle.nav-link`, not an `a` element.

---

## Local dev

```powershell
taskkill /F /IM node.exe
cd "C:\Users\61451\OneDrive - tillageworx.com\Desktop\Tillageworx\twx-order-app"
npm run dev
# → http://localhost:5173 (or 5174)
```

## Deploy process (always confirm with me first)

**Portal:**
```powershell
cd "C:\Users\61451\OneDrive - tillageworx.com\Desktop\Tillageworx\twx-order-app"
npm run build
```
Then Cloudflare dashboard → Workers & Pages → `twx-customer-portal` → Deployments → Upload assets → drag `dist` folder.

**Worker:** Cloudflare dashboard → Workers & Pages → `twx-zoho-proxy` → Edit Code → paste → Deploy.

**Webflow JS (`global-footer.js`):** edit in VS Code → commit → push via GitHub Desktop → Publish in Webflow Designer (forces CDN refresh — site won't reflect changes without this step).

**Webflow CSS (`global-styles.css`):** edit in VS Code → commit → push → verify on staging via jsDelivr commit hash URL → merge `staging` → `main` → open Cloudflare dashboard → Workers & Pages → `empty-cake-b32dtwx-assets` → Edit Code → paste updated CSS → Deploy. Restore the `<link>` in Webflow head code to the worker URL if it was changed for testing.

---

## Current priorities (in order)

1. **Migrate Orders, Invoices, Account to `TopNav`** — these three pages still use the old Sidebar layout. Swap in `<TopNav />`, remove the old sidebar+main flex row (single column, TopNav on top, content below), match the `90rem`/`1.75rem` container pattern already used in Dashboard. Touches three files — worth doing on `staging` branch.

2. **Enable the price gate** — once all four pages are confirmed working live on `customers.tillageworx.com.au`: flip `GATING_ENABLED = false → true` in `global-footer.js`, push to GitHub, publish Webflow. Don't do this until step 1 is fully verified live — the whole point is customers land on a working portal after signing up.

3. **Ship Webflow nav redesign** ⚠️ in progress — nav section in `global-styles.css` is on `staging` branch, verified on `tillageworx.webflow.io`. Moni completing Webflow Designer tweaks. Next steps: (a) confirm staging looks right, (b) merge `staging` → `main` in webflow-footer-scripts, (c) update Cloudflare Worker `empty-cake-b32dtwx-assets` with new CSS content, (d) restore `<link>` in Webflow head code to worker URL.

4. **Backlog (not urgent):** attach sales order PDFs to order cards; order status progress bar (Confirmed → Packed → Sent → Delivered); ability for me to leave order messages visible to customers; Invoices page visual polish to match Orders; tooltips/helper text on Account address fields.

---

## `global-footer.js` — section map

- **Section 0** — price gating (`GATING_ENABLED` toggle)
- **Section 1** — CMS data loading for cart
- **Section 2** — cart open/close (`showCart()` / `hideCart()`)
- **Section 3** — quote cart item management
- **Section 4** — quote form submission → Zoho Flow webhook
- **`?cart=open` auto-open** — end of `init()`, checks URL param, calls `showCart()` after 500ms delay
- **Cart header personalisation** — inside `showCart()`, reads Supabase session from localStorage, injects "[FirstName]'s Cart"

## `global-styles.css` — section map

- **Body/wrapper resets** — `body`, `.page-wrapper`, `.w-nav` margin/padding resets
- **Quote Cart** — qty controls, remove button, browse button
- **Quote Review Form** — inputs, address rows, side-by-side fields, delivery toggle, headings, submit button
- **Quote Review** — freight disclaimer, parts table, summary rows
- **Brands nav** — active pill, scroll behaviour, premium ghost pill buttons
- **Mobile navigation** — dropdown styling for mobile hamburger menu (below 991px)
- **Nav style update** — info bar (`.header-contact-container`) and main navbar (`section.navbar`) redesign to match portal TopNav

---

## Credentials reference (names only — never real values)

All API credentials live in Google Password Manager under **"Zoho API - Tillageworx Portal"**. Never write actual secret values into code comments, commit messages, or this file.

Keys to look for there: Zoho Client Secret, Zoho Refresh Token, Supabase legacy anon key (`eyJ...`), Resend API key (`re_...`).

---

## Open questions — still need answers

1. **Testing** — there's no automated test suite currently (confirm this is still true?) — verification is manual via localhost + live site check. Should we add basic tests as we go, or keep it manual for now given the size of the app?
