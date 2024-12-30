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
  integrations: [cloudflare(), react(), tailwind()],
  vite: {
    build: {
      target: 'esnext',
      minify: 'esbuild'
    },
    ssr: {
      noExternal: ['@heroicons/*', 'flowbite-react', 'jose']
    },
    optimizeDeps: {
      exclude: ['@node-rs/argon2']
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
  }
});
