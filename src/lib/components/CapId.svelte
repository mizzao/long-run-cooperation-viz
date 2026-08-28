<script lang="ts">
  // Dev-only caption badge for pinpointing copy (P4C2 = part 4, caption 2).
  // Visible in `pnpm dev`, or anywhere with ?capids in the URL. The query check
  // runs after mount: the page is prerendered, so the URL is unknowable at build time.
  import { onMount } from 'svelte';
  import { dev } from '$app/environment';

  let { id }: { id?: string } = $props();
  let visible = $state(dev);
  onMount(() => {
    if (!dev && new URLSearchParams(location.search).has('capids')) visible = true;
  });
</script>

{#if id && visible}
  <span class="pointer-events-none absolute right-2 top-1 z-10 font-mono text-[10px] text-muted opacity-60">{id}</span>
{/if}
