import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory',
    functionPerRoute: true,
    runtime: {
      mode: 'local',
      type: 'pages'
    }
  }),
  integrations: [react(), tailwind()],
  vite: {
    build: {
      rollupOptions: {
        external: ['crypto']
      }
    },
    ssr: {
      noExternal: ['@heroicons/*', 'flowbite-react', 'apexcharts', 'react-apexcharts', 'jose'],
      external: ['crypto']
    },
    resolve: {
      alias: {
        crypto: 'crypto-browserify'
      }
    },
    optimizeDeps: {
      include: ['jose']
    }
  }
}); 