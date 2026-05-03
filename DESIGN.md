# Kindred Script — Design System

> **Creative North Star: "The Digital Atelier"**
> An editorial, high-end experience that treats every quote as curated art and every screen as a page in a bespoke literary journal.

---

## Theme Settings

| Property | Value |
|----------|-------|
| Color Mode | Light |
| Color Variant | Fidelity |
| Roundness | Full (pill / fully rounded) |
| Spacing Scale | 3 |
| Display / Headline Font | Noto Serif |
| Body / UI Font | Plus Jakarta Sans |
| Label Font | Plus Jakarta Sans |

---

## Color Palette

### Brand Overrides

| Role | Hex |
|------|-----|
| Primary | `#D66853` |
| Secondary | `#848C72` |
| Tertiary | `#F4EBD9` |
| Neutral | `#FAF7F2` |

### Full Named Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#9d3d2c` | Signature terracotta — moments of connection & celebration |
| `primary_container` | `#bd5541` | CTA gradient endpoint |
| `primary_fixed` | `#ffdad3` | |
| `primary_fixed_dim` | `#ffb4a5` | |
| `on_primary` | `#ffffff` | |
| `on_primary_container` | `#fffbff` | |
| `on_primary_fixed` | `#3f0400` | |
| `on_primary_fixed_variant` | `#802919` | |
| `secondary` | `#5a614a` | "Sage" — success/approval stamp |
| `secondary_container` | `#dbe3c5` | Chips (active/success state) |
| `secondary_fixed` | `#dee6c8` | |
| `secondary_fixed_dim` | `#c2caad` | |
| `on_secondary` | `#ffffff` | |
| `on_secondary_container` | `#5e664e` | |
| `on_secondary_fixed` | `#171e0b` | |
| `on_secondary_fixed_variant` | `#424a33` | |
| `tertiary` | `#615c4e` | |
| `tertiary_container` | `#7a7465` | |
| `tertiary_fixed` | `#eae2d0` | |
| `tertiary_fixed_dim` | `#cec6b5` | |
| `on_tertiary` | `#ffffff` | |
| `on_tertiary_container` | `#fffbff` | |
| `on_tertiary_fixed` | `#1f1b10` | |
| `on_tertiary_fixed_variant` | `#4b4639` | |
| `surface` | `#fcf9f4` | Level 0 — page background |
| `surface_bright` | `#fcf9f4` | |
| `surface_dim` | `#dcdad5` | |
| `surface_container_low` | `#f6f3ee` | Level 1 — sections & input fields |
| `surface_container` | `#f0ede9` | |
| `surface_container_high` | `#ebe8e3` | |
| `surface_container_highest` | `#e5e2dd` | |
| `surface_container_lowest` | `#ffffff` | Level 2 — cards ("pop" effect) |
| `surface_variant` | `#e5e2dd` | Card footer backgrounds |
| `surface_tint` | `#a03f2e` | |
| `on_surface` | `#1c1c19` | **Primary text — never use pure black** |
| `on_surface_variant` | `#56423e` | Secondary text |
| `on_background` | `#1c1c19` | |
| `background` | `#fcf9f4` | |
| `outline` | `#89726d` | |
| `outline_variant` | `#ddc0bb` | Ghost borders (use at 15% opacity) |
| `inverse_surface` | `#31302d` | |
| `inverse_on_surface` | `#f3f0eb` | |
| `inverse_primary` | `#ffb4a5` | |
| `error` | `#ba1a1a` | |
| `error_container` | `#ffdad6` | |
| `on_error` | `#ffffff` | |
| `on_error_container` | `#93000a` | |

---

## Typography

### Pairing Rationale
High-contrast duo: **emotional resonance** (serif) + **functional clarity** (sans-serif).

| Role | Font | Notes |
|------|------|-------|
| Display / Quote text | **Noto Serif** | "Thoughtful" voice. `display-lg` for quotes. Leading 1.2–1.4×. |
| Headlines | **Noto Serif** | Authoritative and beautiful. Left-aligned. |
| Body / UI | **Plus Jakarta Sans** | "Friendly" voice. `title-md` for interactive elements. |
| Labels | **Plus Jakarta Sans** | Geometric, modern counterpoint to serif. |

### Hierarchy Rules
- **Editorial Offset:** Titles left-aligned; quote body slightly inset or centered — avoids "templated" layouts.
- Never center-align body text next to a left-aligned headline.
- Serif always gets generous leading to let words breathe.

---

## Surface Hierarchy — "Stacked Paper" Model

Treat the UI as stacked sheets of fine paper. Depth comes from background color shifts, **never from divider lines**.

| Level | Token | Hex | Usage |
|-------|-------|-----|-------|
| 0 | `surface` | `#fcf9f4` | Page / screen background |
| 1 | `surface_container_low` | `#f6f3ee` | Sections, input field backgrounds |
| 2 | `surface_container_lowest` | `#ffffff` | Cards — bright "pop" against Level 1 |

> **The No-Line Rule:** Standard 1px borders for sectioning are **prohibited**. Use background color shifts to separate content. If a boundary is required for accessibility, use a **Ghost Border**: `outline_variant` at 15% opacity.

---

## Elevation & Depth

Traditional drop shadows are too "software-like". Use tonal layering instead.

| Technique | Spec |
|-----------|------|
| **Tonal layering** | Place `surface_container_highest` on `surface_container` — visual contrast implies elevation without any shadow |
| **Ambient float shadow** (quote share cards only) | `Y: 8px, Blur: 24px, Color: on-surface @ 6% opacity` |
| **Glassmorphism** (nav overlays) | `surface` at 70% opacity + `backdrop-blur: 20px` |
| **Glass cards** (imagery) | `surface_container_lowest` semi-transparent — background neutrals bleed through |

---

## Components

### Buttons

| Type | Spec |
|------|------|
| **Primary CTA** | Gradient `primary` → `primary_container`. Roundness: `full` or `md`. |
| **Secondary** | No background fill. `label-md` weight. Ghost border using `outline_variant`. |

### Input Fields
- Background: `surface_container_low`
- On focus: transition to `surface_container_lowest` + subtle `primary` ghost border
- **No underline-only inputs** — use filled/outlined style

### Cards ("The Stationery Card")
- Corner radius: `1rem` (16px) or `1.5rem` (24px)
- No divider lines inside cards
- Separate metadata (author, date) from quote body using `spacing-md` vertical whitespace, or a `surface_variant` footer section background

### Chips
- Active/success state: `secondary_container` (`#dbe3c5`)
- High rounding, low-contrast text — "soft pebbles"

### Success States
- Use `secondary` ("Sage") sparingly — should feel like a stamp of approval on a letter

---

## Layout

### Asymmetric Margins
Break the rigid 12-column grid to create **editorial tension**.
- Example: quote card `24px` from left, `40px` from right

### Feed / Grid
- **Avoid** perfectly symmetrical 2-column grids for quote feeds
- Vary card heights to create a "scrapbook" rhythm

### CTA Gradients
Linear gradient from `primary` (`#9d3d2c`) → `primary_container` (`#bd5541`) for a "lithographic" depth effect.

---

## Do's and Don'ts

### Do
- Use asymmetric margins for editorial tension
- Stick to `1.5rem` (24px) radius on major containers
- Pair quotes with grain-textured backgrounds or soft-focus photography
- Use `surface` color shifts before reaching for a shadow

### Don't
- **Don't use 100% black** — always use `on_surface` (`#1c1c19`) for text
- **Don't use dividers** — use 32px of white space instead
- **Don't over-shadow** — change section background color first
- **Don't use default symmetric grids** for quote feeds
