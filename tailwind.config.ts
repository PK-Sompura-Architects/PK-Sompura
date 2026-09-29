import type { Config } from 'tailwindcss';

// Tokens from design_handoff_pk_sompura/design/Handoff.dc.html §10, unchanged.
// colors sits in theme (not extend) so Tailwind's own stone/slate/sky scales are replaced [A12].
export default {
  content: ['./src/**/*.{astro,ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent', current: 'currentColor',
      sand: '#F4EFE6', stone: '#E7DFD2', navy: '#262654', night: '#0E0E1F',
      slate: { DEFAULT: '#798A96', deep: '#52606B' },
      saffron: { DEFAULT: '#CD8841', text: '#985A1F' },
      sky: '#AFD9EB',
    },
    fontFamily: {
      display: ['"Libre Caslon Display"', 'Georgia', 'serif'],
      sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
    },
    screens: { md: '768px', lg: '1024px', xl: '1280px' },
    extend: {
      fontSize: {
        'display-xl': ['clamp(62px, 37.33px + 6.852vw, 136px)', { lineHeight: '0.92', letterSpacing: '-0.01em' }],
        display: ['clamp(54px, 30.67px + 6.481vw, 124px)', { lineHeight: '0.94', letterSpacing: '-0.01em' }],
        stat: ['clamp(88px, 58.67px + 8.148vw, 176px)', { lineHeight: '0.86' }],
        h2: ['clamp(44px, 26.67px + 4.815vw, 96px)', { lineHeight: '0.96' }],
        h3: ['clamp(38px, 26.67px + 3.148vw, 72px)', { lineHeight: '1' }],
        h4: ['clamp(30px, 21.33px + 2.407vw, 56px)', { lineHeight: '1' }],
        statement: ['clamp(30px, 22.67px + 2.037vw, 52px)', { lineHeight: '1.2' }],
        contact: ['clamp(28px, 24.00px + 1.111vw, 40px)', { lineHeight: '1.1' }],
        title: ['clamp(24px, 20.00px + 1.111vw, 36px)', { lineHeight: '1.05' }],
        lead: ['clamp(17px, 16.00px + 0.278vw, 20px)', { lineHeight: '1.55' }],
        body: ['clamp(16px, 15.00px + 0.278vw, 19px)', { lineHeight: '1.6' }],
        caption: ['clamp(12px, 11.67px + 0.093vw, 13px)', { lineHeight: '1.5', letterSpacing: '0.08em' }],
        tag: ['12px', { lineHeight: '1', letterSpacing: '0.08em' }],
      },
      spacing: { 18: '72px', 22: '88px', 44: '176px' },
      maxWidth: { content: '1280px' },
      boxShadow: {
        tablet: 'inset 0 1px 0 rgb(244 239 230 / .6), inset 0 -1px 0 rgb(38 38 84 / .15)',
        plate: '0 -24px 48px rgb(14 14 31 / .5)',
        sheet: '0 -24px 48px rgb(14 14 31 / .18)',
        relief: '3px 5px 8px rgb(38 38 84 / .35), -1px -1px 0 rgb(244 239 230 / .8)',
        glow: '0 0 14px 3px rgb(205 136 65 / .55)',
      },
      dropShadow: { cut: '0 1px 0 rgb(244 239 230 / .85)' },
      backgroundImage: {
        'sand-tex': "url('/tex/sand.webp')", 'stone-tex': "url('/tex/stone.webp')",
        cut: "url('/tex/cut.webp')", 'night-grain': "url('/tex/grain-night.webp')",
      },
    },
  },
} satisfies Config;
