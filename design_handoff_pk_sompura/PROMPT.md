Paste this into Claude Code as your first message:

---

Build the P.K. Sompura website in this folder.

Read these first, in order:
1. `plan.md`: the source of truth for facts, stack, section order and hard rules. Don't change any of them.
2. `README.md`: the handoff summary, rules, components, state and build phases.
3. `design/Handoff.dc.html`: design tokens, type scale, grid, component inventory, and a ready tailwind.config (§10). Read it as HTML source; the values are in the markup and in the logic class at the bottom.
4. The screen boards in `design/`: Home, Register, Project, Contact Nav 404, Posters. They are HTML design references, so rebuild them and don't copy them.

Stack: Astro + React islands + Tailwind, React Bits components as named on the boards, three.js for the two 3D scenes (loaded behind the poster gating), GSAP/Lenis for scroll.

Work in the phases listed in README.md. Stop after each phase, tell me what you built, and let me check it at 360 px and 1440 px before you continue. Use only the facts in plan.md §2, with no dates anywhere. Mark any photo that's still missing with a labelled placeholder. Start with phase 1.
