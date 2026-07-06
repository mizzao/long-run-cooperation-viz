<script lang="ts">
  import '../app.css';
  import '@fontsource/newsreader/400.css';
  import '@fontsource/newsreader/500.css';
  import '@fontsource-variable/inter';
  import '@fontsource/jetbrains-mono/400.css';
  import favicon from '$lib/assets/favicon.svg';
  import { onMount } from 'svelte';
  import { initLenis } from '$lib/scroll/lenis';
  let { children } = $props();
  onMount(() => initLenis());
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
