# Tillageworx brand sheet

_One source of truth for look and wording. Same file lives in `docs/brand.md` in both the portal and website repos. If you change one, change the other. Values marked (confirm) were inferred from existing code or notes, not from a final brand kit. Canva brand kit: `kAFwHtx_Qc4`._

## Colour
| Use | Value | Notes |
|---|---|---|
| Brand gold (primary accent) | `#C2934A` | Buttons, highlights, nav accents, sale badge. Used throughout portal `TopNav`. |
| Black background | `#0E0E0E` (nav), `#050505`, `#1A1A1A`, `#1E1E1E`, `#2A2A2A` for panels/borders | Dark surfaces are the default look (confirm exact page background). |
| Muted grey text | `#686868` | Secondary text on dark. |
| White | `#FFFFFF` | Main text on dark, cards on light pages. |

Rules: one gold accent, never a second brand colour. Gold-filled button = the main action on a screen; only one per area. Don't tint gold or invent new golds.

## Fonts (confirm which are loaded where)
- Headings / nav: Oswald (portal TopNav) - website brand fonts per notes: Ethnocentric (logo/display only), League Spartan, Anton, Montserrat, Poppins.
- Body: Arial / system sans fallback.
- Portal's `src/index.css` is still the Vite starter template (purple accent `#aa3bff`, system fonts). Treat it as unused leftover; do NOT copy colours from it.

## Wording
- Say **"Customer Accounts"**. Never "trade accounts" or "user accounts".
- Sign-up CTA: **"Create a customer account"**. Login button: **"Customer login"**.
- Greeting: "G'day {first name}".
- Spelling: Australian English (colour, organise, tyre not applicable, "centre").
- Prices: AUD, shown ex-GST with GST line separate unless the screen says otherwise.
- Tone: plain, practical, farmer-to-farmer. No hype, no jargon, no emoji in customer-facing UI.
- Contact details used in error/help text: phone 08 6185 1944, sales@tillageworx.com.

## Do / Don't
- DO reuse existing classes/components before making new styling.
- DO keep mobile (390px) working: buttons reachable, nothing clipped.
- DON'T add new fonts, new colours or drop shadows without asking.
- DON'T show prices to anonymous website visitors (price gate is deliberate).
