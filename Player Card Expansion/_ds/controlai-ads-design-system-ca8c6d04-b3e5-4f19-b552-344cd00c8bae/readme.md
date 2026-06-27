# ControlAI — Ads Design System

A brand + ad-creative system for **CONTROL/AI**, an AI-safety advocacy organization.
The system exists to produce **campaign creatives** — paid-social and organic ads in
square (1:1) and vertical (9:16) formats — that are loud, confrontational, and
unmistakably on-brand.

> If a designer or agent picks this up, they should be able to ship a new ControlAI
> ad in minutes: pick a ground, set the headline, drop in the mint CTA and the
> CONTROL/AI sign-off.

## Sources provided
- **Fonts:** the full *Neue Haas Grotesk Display* optical family (XXThin → Black + italics), supplied as TTFs in `uploads/` and installed under `fonts/`.
- **Logos:** `Primary_*` (CONTROL/AI wordmark) and `BrandMark_*` (C/AI) lockups, light & dark, in `uploads/` → curated into `assets/`.
- **~90 finished ad creatives** in `uploads/` across several campaigns:
  - *Vintage poster* series — `Cards`, `Elevator`, `Toaster`, `ControlAI_Ad62–73` (terracotta/black grounds, retro illustration, all-caps shouts).
  - *Editorial* series — `ControlAI_Ad117–162`, `Ad1/Ad2_*Variation*` (calm black grounds, title-case headlines, cinematic AI imagery, mint pill CTAs).
- No codebase or Figma file was provided; understanding is derived from the finished creatives + brand assets. **There is no "app" product** — the product *is* the ad.

## What ControlAI is about
The messaging is single-minded: **AI is moving too fast and is dangerously
unregulated; tell governments to act.** Every ad ends in a call to action —
*Take Action* or *Sign for Control*. Recurring arguments: "your toaster has more
safety regulations than AI", "even elevators need permits — why not AI?",
"billionaires are programming AI to maintain their power", "do you feel in control?".

---

## CONTENT FUNDAMENTALS — how ControlAI writes

- **Voice:** urgent, plain-spoken, a little confrontational. It speaks to *you* (second person) and points at *them* (governments, billionaires, "the AI labs"). It is an activist organizer's voice, not a tech company's.
- **Tense & mood:** present-tense statements of fact ("Billionaires **are** programming AI…") and direct rhetorical questions ("Do you feel in control?", "Feeling lucky?").
- **Casing — two registers:**
  - *Poster register:* **ALL CAPS**, often italic for the punchline. Loud.
  - *Editorial register:* **Sentence case** ("Do you feel in control?"). Calmer, more credible.
- **Headline length:** short and punchy — 3–8 words, broken across multiple tight lines. The last word is often the gut-punch (`AI?`, `AI`, `POWER`).
- **Always a CTA, always a verb:** "Take Action", "Sign for Control", "Tell the government to stop the AI madness". CTAs are imperative.
- **Supporting line:** one muted sentence under the headline that states the stakes ("Uncontrolled AI may end all life on earth", "Tell the government to stop the AI madness").
- **No emoji. No hashtags in the art. No jargon.** Numbers/stats are used sparingly and only when they land a punch — avoid data-slop.
- **Punctuation as drama:** question marks and the slash in CONTROL/AI are part of the identity. Apostrophes kept ("Don't", "humanity's").

Example copy lifted from the campaigns:
> **EVEN ELEVATORS NEED PERMITS — WHY NOT *AI?*** · "Take Action"
> **Do you feel in control?** — *Tell the government to stop the AI madness.* · "Sign for Control"
> **YOUR TOASTER has more SAFETY REGULATIONS than AI** · "Take Action"

---

## VISUAL FOUNDATIONS

- **Palette:** a hard, high-contrast system. **Electric mint-teal `#00DEB6`** is the single signature accent — it owns every CTA and the logo frame. **True black `#0A0A0A`/`#050505`** is the dominant ground. **White** type. **Alarm red `#FF5146`/`#F31111`** for danger words and offset shadows only. The vintage line adds a **terracotta `#D15137`** poster field with warm **orange `#FF8100`** / **yellow `#FFB600`** illustration accents. Mint is never used for body text or large fills beyond CTAs/frames.
- **Type:** one family, *Neue Haas Display*, doing everything. Headlines are **Black (900)**; editorial headlines are **Bold (700)** title-case; body/support is **Roman (400)**. Tracking is tight (`-0.02em`) and leading is tight (`0.9–1.0`) on headlines. Italic Black is the "punchline" style.
- **Backgrounds:** mostly flat black with a fine **halftone dot weave** (`.cai-halftone`), or a flat terracotta field with subtle **paper grain** (`.cai-grain`). Editorial ads use full-bleed cinematic/painterly AI imagery (robots, red earth, dystopian cities) with a **dark protection scrim** behind type. No bluish-purple gradients, ever.
- **Imagery vibe:** two modes — (1) retro/vintage **illustration** (cards, toaster, elevator, top-hatted billionaire) with a warm, slightly grainy, mid-century-poster feel; (2) **cinematic AI dread** — desaturated, high-contrast, red-accented robot hands, glowing eyes, painterly sci-fi. Both lean dark, ominous, and a little pulpy.
- **Drop-shadows:** type uses **hard offset echoes with NO blur** — a black echo (`--shadow-poster`) or a red echo (`--shadow-danger`) sitting a few px down-right. This is the "letterpress poster" look. Soft blurs are reserved for UI chrome only.
- **Marker highlight:** editorial headlines sometimes sit on a **smudged dark marker bar** behind a phrase (see "in control?").
- **Corners:** **square by default.** The brand is hard-edged. The *only* rounded shape is the **editorial CTA pill**. The poster CTA is a **skewed parallelogram** (−12°).
- **Frames & strokes:** the identity motif is a **hard rectangular frame** (6px) — around the logo wordmark and as the mint capsule outline. A small **mint tick tab** sits at the right edge of the brandmark.
- **CTAs:** mint ground, **black uppercase Neue Haas Bold** label. Pill for editorial, parallelogram for posters. Pressed state = subtle `scale(0.96)`.
- **Hover / press:** CTAs darken slightly to `--mint-600` on hover and shrink on press. There are no decorative looping animations; motion (where used) is a quick snap (`--ease-snap`, ~120–200ms).
- **Transparency & blur:** used only for **protection scrims** over photography (`--scrim-top/--scrim-bottom`) — a vertical black gradient so white type stays legible over busy art. No frosted-glass UI.
- **Layout rules:** headline anchored top or center; CTA + CONTROL/AI sign-off anchored **bottom-left** (posters) or bottom-left/centered (editorial). Generous outer margin (`--ad-margin`, 56px on a 1080 canvas). Everything aligns to a left edge.

---

## ICONOGRAPHY

ControlAI is **not** an icon-driven brand — there is no icon font, sprite, or UI
icon set in the supplied material. The visual interest comes from **illustration
and photography**, not pictograms. Specifically:

- **No emoji.** Never used in the creatives.
- **No unicode-glyph icons.** The only glyph with meaning is the **slash `/`** in CONTROL/AI and the **mint tick tab** on the brandmark — both are typographic/brand marks, not icons.
- **Brand mark:** the **C/AI** monogram (`assets/brandmark-*.png`) is the closest thing to an "icon" and is used as a compact stamp.
- **Imagery does the work:** retro illustrations (toaster, elevator, playing cards, top-hat billionaire) and cinematic AI imagery (robot hands, glowing-eye faces, red earth) carry meaning instead of icons.

**If a UI surface needs functional icons** (e.g. an internal tool built on this
system), use a thin/regular **Lucide** set from CDN as the closest neutral match
to the geometric Neue Haas letterforms — and flag it as a substitution, since the
brand itself ships none. Do **not** hand-draw illustration in SVG; commission or
place real artwork in the established vintage / cinematic styles.

---

## VISUAL ASSETS (`assets/`)
- `logo-primary-light.png` / `logo-primary-dark.png` — CONTROL/AI wordmark in its framed box, for light and dark grounds.
- `brandmark-light.png` / `brandmark-dark.png` — the C/AI monogram stamp.
- `ads/` — ten curated reference creatives spanning the poster and editorial styles, in square and vertical, for tone reference.

---

## INDEX — what's in this system

**Global CSS** (consumers link `styles.css`):
- `tokens/colors.css` · `tokens/typography.css` · `tokens/spacing.css` · `tokens/fonts.css` · `tokens/textures.css`

**Components** (`window.<Namespace>` — run `check_design_system` for the exact namespace):
- `components/brand/` — **CtaButton** (pill / parallelogram), **LogoMark** (framed CONTROL/AI mark)
- `components/typography/` — **PosterHeadline** (all-caps shout), **EditorialHeadline** (title-case), **Eyebrow** (sub / kicker)
- `components/layout/` — **AdCanvas** (fixed-ratio square / vertical / wide artboard with brand grounds)

**UI kit:**
- `ui_kits/ad-creatives/` — interactive **Ad Composer** recreating five real campaigns (Billionaires, Elevator, Toaster, Feel in control?, Decide your fate) across formats, composed entirely from the components.

**Foundations (Design System tab cards):** `guidelines/*.card.html` — color, type, spacing, effect & brand specimens.

**Other:** `SKILL.md` (Agent Skill manifest), `fonts/` (Neue Haas TTFs), `assets/` (logos + reference ads).

---

## CAVEATS / SUBSTITUTIONS
- **Fonts:** the supplied TTFs are the real *Neue Haas Display*; no substitution needed. `Light` (350) is mapped between Thin and Roman; `Medium` came from the mis-named `NeueHaasDisplayMediu.ttf`.
- **Illustrations are not isolated:** only fully-composed ad PNGs were provided, so the UI-kit recreations are faithful in **layout, type, color and CTA placement** but render on flat brand grounds rather than re-using the original hero artwork (which isn't available as a separate layer).
- **No icon set** ships with the brand — see ICONOGRAPHY.
