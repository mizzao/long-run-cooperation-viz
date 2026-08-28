import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { capTimingWriteback } from './scripts/cap-timing-plugin.mjs';
export default defineConfig({ plugins: [tailwindcss(), sveltekit(), capTimingWriteback()] });
