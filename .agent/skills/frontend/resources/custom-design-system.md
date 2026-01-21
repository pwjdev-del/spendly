# Custom Design System: "Refined Chaos"

This design system is built to stand out. It mixes strict typographic scales with playful, fluid spacing and colors.

## 1. Color Palette: "Electric Noir"
A high-contrast dark mode palette with vibrant, radioactive accents.

| Variable | Tailwind | Hex | Usage |
| :--- | :--- | :--- | :--- |
| `bg-void` | `bg-[#050505]` | `#050505` | Main background (darker than black) |
| `bg-surface` | `bg-[#121212]` | `#121212` | Cards / Panels |
| `text-primary`| `text-[#ececec]`| `#ececec` | Main text (soft white) |
| `text-muted` | `text-[#888888]` | `#888888` | Secondary text |
| `accent-acid` | `bg-[#ccff00]` | `#ccff00` | Primary Actions (Acid Green) |
| `accent-neon` | `bg-[#7a1bfa]` | `#7a1bfa` | Secondary Highlights (Electric Purple) |
| `border-raw` | `border-[#333]` | `#333333` | Structural borders |

## 2. Typography: "Editorial Tech"

**Headings: `Syne` or `Clash Display`**
- Variable width fonts that feel distinct and weird.
- Usage: `font-display`

**Body: `Space Grotesk` or `Satoshi`**
- Clean sans-serifs with unique "ink traps" or quirky characters.
- Usage: `font-body`

**Code/Tags: `JetBrains Mono`**
- Technical, precise.

## 3. Spacing System
Move away from linear 4/8/12px. Use a **Fluid Scale**.
- `gap-xs` (4px)
- `gap-md` (16px)
- `gap-xl` (64px) - *Go huge with whitespace for drama*
- `gap-mega` (128px)

## 4. Visual Tokens

**"The Glow"**
Use drop-shadows *colored* with the element's background.
`shadow-[0_0_20px_rgba(204,255,0,0.3)]` (Acid green glow)

**"The Glass"**
`backdrop-blur-xl bg-white/5 border border-white/10`

**"The Border"**
1px solid borders are boring. Use **Gradient Borders**.
`border-double border-4 border-transparent bg-origin-border`
