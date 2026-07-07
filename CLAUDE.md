# Tillageworx Customer Portal & Website — Claude Code Project Brief
_Adapted from chat handoff doc, 29 June 2026 → for Claude Code, 2 July 2026. Trimmed 6 July 2026 — full technical reference moved to `docs/reference.md`._

> **Read this whole file before touching any code.** This is Moni's live business — real customers, real orders, real invoices. Don't guess at conventions. Detailed technical reference (routes, gotchas, file structure, section maps) lives in `docs/reference.md` — open that when you're actually working in the relevant area, it doesn't need to be read every session.

---

## How to work with me (read first)

- I have ADHD — keep instructions clear and step-by-step, minimal unexplained jargon.
- I'm learning React as I go — this is my first real React project. When you make a non-trivial change, briefly say *what* you changed and *why* in plain English alongside the code.
- I work in VS Code on Windows, PowerShell terminal, GitHub Desktop for some deploys.
- **Ask before:** pushing to GitHub, deploying (Cloudflare Pages/Workers), or publishing the Webflow site. I'll confirm each time — don't chain these together automatically.
- **Branching:** I commit directly to `main` for normal work. For bigger/riskier changes, I test on a `staging` branch first before merging to `main`. Before committing, weigh up whether the change is big enough to warrant staging (e.g. touches multiple pages, changes shared components like TopNav, touches auth/payment-adjacent logic) vs small enough for `main` directly (e.g. a copy tweak, a CSS fix) — flag your reasoning to me, then **always confirm with me before actually committing**, regardless of which branch.
- **Commit messages:** fine for you to write these yourself.
- **Never** put real API keys, secrets, or tokens directly in code or commit them. Reference the password manager entry name instead (see `docs/reference.md`). If you need a secret's actual value to test something, ask me to paste it into the terminal/env directly — not into chat.
- If you hit something ambiguous (e.g. two components could reasonably own a piece of logic), stop and ask rather than picking one and running with it.
- **Keeping this file current:** at the end of every session, update this `CLAUDE.md` and `docs/reference.md` to reflect the current state — move ✅/⚠️ markers as things get finished, add new gotchas to `docs/reference.md` (not here), remove or update anything in "Open questions" that got answered, re-order "Current priorities" if things shipped. Edit sections in place — don't append a session log or dated notes. Keep this core file lean: if something is reference detail rather than "what to do next," it belongs in `docs/reference.md`, not here.
- **Always state the commit hash** when on staging so Moni knows exactly which version to test.

---

## Business context

Tillageworx Pty Ltd — Perth, WA. I import and sell aftermarket tillage wear parts (disc blades, points, wings, shins) for European machinery brands (Horsch, Väderstad, Lemken, Amazone) to AU/NZ broad-acre cropping customers. I run the business largely solo.

**Why this portal exists:** Since adding prices + a quote cart to the public Webflow site, enquiries dropped — visitors see prices and leave without contacting us. The portal gates pricing behind a free customer account signup.

**Brand language:** "Customer Accounts" — never "trade accounts" or "user accounts". CTA: "Create a customer account". Login button: "Customer login".

---

## Two repos, two jobs

| Repo | Purpose | Local path |
|---|---|---|
| `twx-order-app` | React/Vite customer portal (accounts, orders, invoices) | `C:\Users\61451\OneDrive - tillageworx.com\Desktop\Tillageworx\twx-order-app` |
| `twx26mon/webflow-footer-scripts` | Global JS/CSS injected into the public Webflow site — price gate, cart logic, site nav styling | `C:\Users\61451\OneDrive - tillageworx.com\Desktop\Tillageworx\Webflow Code\Github\webflow-footer-scripts` |

Full stack details, Supabase project info, Worker routes/env vars, file structure, and section maps → **`docs/reference.md`**.

---

## Current priorities (in order)

1. **Fix mobile nav regression** ⚠️ BLOCKING — latest staging commit is `dea06ae`. Current reported issues:
   - Nav reverted to old styles, cart icon missing from navbar
   - X close button unresponsive / won't close menu
   - Info header flashes on page load (see `docs/reference.md` gotchas — needs inline `<style>` in Webflow Head Code)
   - No Customer login / Create account links visible in mobile panel

   **First thing to check:** Are the Webflow head/body code jsDelivr URLs pointing to `dea06ae`? Is the updated `quote-cart-site-head-code.css` pasted into Webflow Site Settings → Head Code? Both are required for latest changes to take effect.

   **Then check:** Open browser DevTools on mobile (or device emulation) → Console tab for JS errors → Network tab to confirm the right JS/CSS files are loading.

2. **Deploy portal** ⚠️ — `Login.jsx` and `Signup.jsx` have local changes (`?return=` redirect logic) not yet built or deployed. After mobile nav is confirmed working: `npm run build` → drag `dist` to Cloudflare Pages.

3. **Migrate Orders, Invoices, Account to `TopNav`** — these three pages still use the old Sidebar layout. Swap in `<TopNav />`, remove the old sidebar+main flex row, match the `90rem`/`1.75rem` container pattern already used in Dashboard. Touches three files — worth doing on `staging` branch.

4. **Ship Webflow nav redesign** ⚠️ in progress — nav section in `global-styles.css` is on `staging` branch. Moni completing Webflow Designer tweaks. Next steps: (a) confirm staging looks right, (b) merge `staging` → `main` in webflow-footer-scripts, (c) update Cloudflare Worker `empty-cake-b32dtwx-assets` with new CSS content, (d) restore `<link>` in Webflow head code to worker URL.

5. **After step 3 verified live** — merge `global-footer.js` staging → main (price gate + cart guest/member mode) and publish in Webflow Designer.

6. **Backlog (not urgent):** attach sales order PDFs to order cards; order status progress bar; ability to leave order messages visible to customers; Invoices page visual polish to match Orders; tooltips/helper text on Account address fields.

---

## Open questions — still need answers

1. **Testing** — there's no automated test suite currently — verification is manual via localhost + live site check. Should we add basic tests as we go, or keep it manual for now given the size of the app?

---

## Reference doc index

`docs/reference.md` contains: tech stack & live URLs, Supabase project details, Cloudflare Worker routes/env vars, React app file structure, what's already built, Zoho custom fields, signup field mapping, key gotchas, `global-footer.js` section map, `global-styles.css` section map, credentials reference (names only). Open it when a task touches that area — no need to read it start-to-finish every session.
