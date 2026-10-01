import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  // The site's public address: canonical URLs, link previews and structured data are built from it. Change it here
  // when the custom domain is set up.
  site: 'https://pk-sompura.vercel.app',
  integrations: [react()],
});
