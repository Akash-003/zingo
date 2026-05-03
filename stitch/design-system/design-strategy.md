# Design System Strategy: The Editorial Sanctuary

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Atelier."** 

We are moving away from the "utility-first" look of standard social apps and toward a high-end, editorial experience. This system treats every quote as a piece of curated art and every screen as a page in a bespoke literary journal. We achieve this through **Intentional Asymmetry**—breaking the rigid 12-column grid to allow for poetic white space—and **Tonal Depth**, where we replace harsh lines with soft, atmospheric transitions. The goal is a digital environment that feels as tactile and premium as a heavy-weight cotton cardstock invitation.

---

### 2. Colors: The Palette of Warmth
Our color strategy relies on "vibe-centric" layering. We avoid cold grays and stark blacks in favor of a palette rooted in earth and sunlight.

*   **The Primary "Heart" (`#9d3d2c`):** This terracotta should be used as a signature, not a utility. Reserve it for moments of connection and celebration.
*   **The "No-Line" Rule:** Standard 1px borders are strictly prohibited for sectioning. To separate content, you must use background color shifts (e.g., a `surface-container-low` card resting on a `surface` background). If a boundary is needed for accessibility, use a **Ghost Border**: `outline-variant` at 15% opacity.
*   **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of fine paper. 
    *   **Level 0 (Background):** `surface` (`#fcf9f4`)
    *   **Level 1 (Sections):** `surface-container-low` (`#f6f3ee`)
    *   **Level 2 (Cards):** `surface-container-lowest` (`#ffffff`) for a bright, "pop" effect.
*   **Signature Textures:** Use subtle linear gradients for CTAs, transitioning from `primary` (`#9d3d2c`) to `primary-container` (`#bd5541`). This adds a "lithographic" depth that flat colors lack.
*   **Glassmorphism:** For floating navigation or overlays, use `surface` with a 70% opacity and a `20px` backdrop-blur. This keeps the UI feeling airy and integrated.

---

### 3. Typography: The Editorial Voice
We use a high-contrast pairing to balance emotional resonance with functional clarity.

*   **Display & Headlines (Noto Serif):** Our "Thoughtful" voice. Use `display-lg` for quote text to make it feel authoritative and beautiful. The serif should always have generous leading (1.2–1.4x) to allow the words to breathe.
*   **UI & Body (Plus Jakarta Sans):** Our "Friendly" voice. This sans-serif provides a modern, geometric counterpoint to the serif. Use `title-md` for interactive elements to maintain a premium feel.
*   **Intentional Hierarchy:** Never center-align body text next to left-aligned headlines. Embrace the "Editorial Offset"—where titles might be left-aligned while the quote itself is slightly inset or centered, creating a more dynamic, less "templated" layout.

---

### 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "software-like" for this brand. We use light and tone to create dimension.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-highest` element placed on a `surface-container` provides enough visual contrast to imply elevation without a single pixel of shadow.
*   **Ambient Shadows:** When a card must "float" (e.g., a shared quote card), use an extra-diffused shadow. 
    *   *Spec:* `Y: 8px, Blur: 24px, Color: on-surface @ 6% opacity`.
*   **Glass & Depth:** Use semi-transparent `surface-container-lowest` for cards containing high-quality imagery. The subtle bleed-through of the background neutrals makes the imagery feel like it's part of the page, not stuck on top of it.

---

### 5. Components: The Physicality of UI

*   **The Stationery Card:** Forbid divider lines. Separate card metadata (author, date) from the quote using vertical whitespace (`spacing-md`) or a subtle `surface-variant` background for the footer section of the card. Use a `1rem` (16px) or `1.5rem` (24px) corner radius to reinforce the "rounded stationery" feel.
*   **Buttons:** 
    *   **Primary:** A gradient of `primary` to `primary-container`. Fully rounded (`full`) or `md`. 
    *   **Secondary:** No background. Use a `label-md` weight with a "Ghost Border" of `outline-variant`.
*   **Input Fields:** Use `surface-container-low` as the field background. On focus, transition to `surface-container-lowest` with a subtle `primary` ghost border. Do not use underline-only inputs; they feel too "form-like" and not "app-like."
*   **Chips:** Use `secondary-container` (`#dbe3c5`) for success/active states. They should feel like small, soft pebbles—high rounding and low-contrast text.
*   **Success States:** Use the "Sage" accent (`secondary`) sparingly. It should feel like a "stamp of approval" on a letter.

---

### 6. Do's and Don'ts

#### Do:
*   **Use Asymmetric Margins:** Let a quote card sit 24px from the left but 40px from the right to create editorial tension.
*   **Embrace Large Radii:** Stick to the `1.5rem` (24px) "md" scale for major containers to maintain the friendly, premium vibe.
*   **Prioritize Image Quality:** Quotes should be paired with grain-textured backgrounds or soft-focus photography.

#### Don't:
*   **Don't use 100% Black:** Always use `on-surface` (`#1c1c19`) for text to keep the heat in the neutrals.
*   **Don't use Dividers:** If you feel the need to add a line, use 32px of white space instead.
*   **Don't Over-Shadow:** If a layout feels flat, change the background color of the section (`surface-container-low`) before reaching for a shadow.
*   **Don't use Default Grids:** Avoid perfectly symmetrical 2-column grids for quote feeds; vary card heights to create a "scrapbook" rhythm.
