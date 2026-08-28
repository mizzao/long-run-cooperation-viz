<script lang="ts">
  import '../app.css';
  import '@fontsource/newsreader/400.css';
  import '@fontsource/newsreader/500.css';
  import '@fontsource-variable/inter';
  import '@fontsource/jetbrains-mono/400.css';
  import favicon from '$lib/assets/favicon.svg';
  import { onMount } from 'svelte';
  import { initLenis } from '$lib/scroll/lenis';
  import { dev } from '$app/environment';
  import { injectAnalytics } from '@vercel/analytics/sveltekit';

  injectAnalytics({ mode: dev ? 'development' : 'production' });

  let { children } = $props();

  // Caption timing editor. Gated in the script rather than the markup so the
  // `dev === false` branch folds away and the panel chunk is never emitted.
  type TunerComponent = typeof import('$lib/dev/CapTuner.svelte').default;
  let Tuner = $state<TunerComponent | null>(null);

  onMount(() => {
    if (dev) import('$lib/dev/CapTuner.svelte').then((m) => (Tuner = m.default));
    return initLenis();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if Tuner}
  <Tuner />
{/if}
