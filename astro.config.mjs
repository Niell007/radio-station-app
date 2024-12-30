import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import prisma from '@astrojs/prisma';

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
  integrations: [cloudflare(), react(), tailwind(), prisma()],
  vite: {
    build: {
      target: 'esnext',
      minify: 'esbuild'
    },
    ssr: {
      noExternal: ['@heroicons/*', 'flowbite-react', 'jose', 'prisma']
    },
    optimizeDeps: {
      exclude: ['@node-rs/argon2']
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
  }
});
