# PK Sompura — Design System

> **Superseded. The source of truth is `CLAUDE.md` at the repository root.**
>
> This file predates `CLAUDE.md` and duplicated the palette and contrast table.
> Two files each claiming to be authoritative is exactly the drift the bible
> exists to prevent, so the duplicated sections were removed rather than left to
> fall out of step.
>
> - Palette and measured contrast ratios → `CLAUDE.md` §2.1, §2.2
> - Typography → `CLAUDE.md` §2.3
> - Spacing, radius, motion → `CLAUDE.md` §2.4, §3
> - Stack facts and traps → `CLAUDE.md` §4, §5
> - Component inventory → `CLAUDE.md` §7

## Why the tokens are named the way they are

The colour tokens were once `--color-gold*`, from an earlier marigold palette.
When the palette moved to indigo those names actively lied about their values,
so they are now `--color-primary*`, named for the job rather than the colour.
If the palette shifts again, the names still hold. This is the one piece of
history worth keeping, because it explains a naming choice that otherwise looks
arbitrary.

## What was removed from this file, and why

Roughly a hundred lines of guidance here had gone stale and was actively
misdirecting work — the same failure as the `AGENTS.md` that once told agents to
read Next.js documentation this project does not have. Verified before deleting:

- A marigold palette, peacock-tinted dark surfaces, and "51 components
  reference `--color-gold`". `--color-gold` now appears **0 times** in
  `global.css`.
- A `--dur-fast | base | slow` motion scale, deleted in favour of the single
  `--dur-hover | move | enter` scale in `CLAUDE.md` §3.1. Two scales was how the
  site ended up fast in one component and slow in the next.
- Notes on `ChromaGrid`, `HeroNav`, `ProfileCard`, `LineageSection`,
  `ModelViewer.jsx` and `AdminPage.css`. **None of these files exist.**
- A 9.7 MB `public/indian-temple/` GLB source asset. **The folder does not
  exist.**
- Warnings about Tailwind class names left in components, and about the `motion`
  package. Both situations are gone; the live rules are in `CLAUDE.md` §4.

If something here contradicts `CLAUDE.md`, `CLAUDE.md` wins and this file is
wrong.
