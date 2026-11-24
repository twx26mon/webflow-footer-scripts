# Tillageworx Website Scripts - Claude Code brief

> **Repo: `webflow-footer-scripts` (public website code). Folder: `C:\dev\webflow-footer-scripts`. Branches: `main` (live), `staging` (test).**
> Updated 24 Nov 2026. Detailed reference: `docs/reference.md`. Look and wording: `docs/brand.md`.

## Wrong-window check (do this first, every session)
This repo is ONLY the JS/CSS injected into the public Webflow site www.tillageworx.com.au: `global-footer.js`, `global-styles.css`.

It is NOT:
- the customer portal or its Worker (`twx-order-app` repo)
- the Worx inventory system (`twx-inventory-build` / `twx-build-track`)

If Moni's request is about portal pages, `worker.js`, Supabase, Zoho routes or Resend, or about Worx screens/Xero: **STOP. Say "this looks like it belongs in the [portal / Worx] window" and do nothing else.** Check the terminal path is `C:\dev\webflow-footer-scripts` before editing.

## How to work with Moni
- ADHD: short, clear, step-by-step. No unexplained jargon.
- Learning JavaScript/React: explain non-trivial changes in plain English (what and why).
- VS Code on Windows, PowerShell.
- **Ask before:** pushing, and before anything that makes code live. Never chain. Always confirm before committing; say whether it suits `staging` or `main`.
- Commit messages: you can write them. State the commit hash.
- **IMPORTANT: `main` IS LIVE.** A Cloudflare Worker serves `main` from raw GitHub, so a push to `main` is an instant deploy to real customers. Normal flow: commit to `staging`, test, then Moni approves merging to `main`.
- Testing `staging` on the Webflow preview: point the footer custom code (and the head CSS link, if CSS changed) at jsDelivr pinned to the exact commit hash (not a branch name, it caches), e.g. `https://cdn.jsdelivr.net/gh/twx26mon/webflow-footer-scripts@<hash>/global-footer.js`. Moni changes the Webflow code herself; remind her to put both back afterwards:
  - Head: `<link rel="stylesheet" href="https://empty-cake-b32dtwx-assets.monica-6b5.workers.dev/global-styles.css"/>`
  - Footer: `<script src="https://empty-cake-b32dtwx-assets.monica-6b5.workers.dev/global-footer.js"></script>`
- Never put secrets/keys in code or chat.
- Edit with Edit/Write tools, never shell redirection. Keep LF line endings (`git config core.autocrlf input`).
- At the end of a session update this file and `docs/reference.md` IN PLACE. No session logs.

## Business context
Tillageworx Pty Ltd, Perth WA. Aftermarket tillage wear parts for European machinery, AU/NZ. The site showed prices and enquiries dropped, so prices are now gated behind a free customer account (`GATING_ENABLED = true`). Anonymous visitors must not see prices.

## Where things are
- Local: `C:\dev\webflow-footer-scripts` (moved out of OneDrive Nov 2026; old copy is `-OLD`, don't use it).
- GitHub: `twx26mon/webflow-footer-scripts`.
- Webflow itself (Designer, CMS, publishing) is done by Moni in Webflow. Don't publish the site; ask.
- Scripts call the portal's Worker `https://twx-zoho-proxy.monica-6b5.workers.dev` (`/orders`, `/quotes`, `/contact-form`, newsletter).
- `global-footer.js` section map and `global-styles.css` section map are in `docs/reference.md`. Read the relevant section before editing.

## How this connects to the other repos
- **Portal**: owns the Worker and customer accounts. If a change needs a new/changed Worker route, say so and stop; the change is made in the portal window.
- **Worx** (inventory): later the website quote form will feed Worx "Website requests"/Leads instead of Zoho. Don't build that here yet.

## Design rules
Follow `docs/brand.md`: gold `#C2934A`, black backgrounds, "Customer Accounts" wording, Australian English. The nav is styled to match the portal `TopNav`. Mobile (390px) must work: hamburger, floating cart button.

## Do
- Escape any user-supplied text before putting it in HTML (a self-XSS in the greeting was fixed once).
- Keep honeypot fields wired on every form. Every form must post to the Worker; never re-enable Webflow's native "Send to" (bots post straight to Webflow and skip our JS).
- Use `textContent` carefully: it wipes child elements (known gotcha, see reference).
- Add `e.stopPropagation()` after `preventDefault()` on custom form submit handlers (Webflow handlers otherwise double-fire).
- Test on the `.webflow.io` preview before production.

## Don't
- Don't push to `main` without Moni's yes.
- Don't commit stray files (e.g. `ID 1000...` file, `*.patch`, key files). Check `git status` first.
- Don't trust client-side prices; the Worker re-resolves them.
- Don't edit portal or Worx files.
- Don't use the dead `code-embed-6`; cart panel is JS-created.

## Current priorities
1. Watch for spam now that Webflow form notifications are off. If spam arrives via Worker emails, add Cloudflare Turnstile (portal window). Portal follow-up: `/testimonial-form` should 400 on a malformed email instead of 500 (see reference gotchas).
2. Housekeeping: delete disabled `code-embed-6` in Webflow Designer; add inline `<style>` for the mobile info-header flash (see reference); delete old `ON SALE` Switch field on Parts CMS (Webflow refused: "used in bindings", look for a leftover in a Brands template code-embed); add `.gitignore`; remove stray file from folder.
3. Backlog: cart-abandonment alert (needs Cloudflare KV + Cron, design in portal `docs/reference.md`).

## Recently shipped (3-4 lines each)
- Testimonial page + all forms via Worker, 24 Nov 2026 (`ebdbdd0`). `/testimonial` embed (source `docs/embeds/testimonial-page-embed.html`), `initTestimonialFormSubmit()` → `/testimonial-form`, dealer popup live. Webflow Email Notifications + Zoho Flow removed from form "Send to" to stop bot spam that bypassed the page.
- Order confirmation pricing fix, 9 Sep 2026 (`computeCartPricing()` shared by both order screens).
- On Sale / New Price display, 9 Sep 2026 (member-only crossed-out price + gold badge).
- Nav redesign, price gating live, security pass, 19 Jul 2026.
