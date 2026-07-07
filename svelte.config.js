import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  // Site is fully prerendered; pin the function runtime so the adapter doesn't
  // try to infer it from Vercel's build Node (24), which it doesn't support.
  kit: { adapter: adapter({ runtime: 'nodejs20.x' }) }
};
