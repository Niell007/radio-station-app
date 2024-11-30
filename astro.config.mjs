import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory'
  }),
  integrations: [
    react(),
    tailwind({
      // Disable the default base styles
      applyBaseStyles: false
    })
  ],
  vite: {
    build: {
      rollupOptions: {
        external: ['better-sqlite3']
      }
    }
  }
}); 