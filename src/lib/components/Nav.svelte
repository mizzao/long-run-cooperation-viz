<script lang="ts">
  import { onMount } from 'svelte';
  import { scrollToY } from '$lib/scroll/lenis';

  // Waypoints = every caption position across the story (plus the top of scenes
  // that have no captions). Sections expose their caption progress via data-caps.
  let waypoints = $state<number[]>([]);
  let showTop = $state(false);

  function collect() {
    const main = document.querySelector('main');
    if (!main) return;
    const vh = window.innerHeight;
    const ys: number[] = [];
    for (const el of Array.from(main.children) as HTMLElement[]) {
      if (el.tagName === 'FOOTER') continue;
      const top = el.offsetTop;
      const caps = el.getAttribute('data-caps');
      if (caps) {
        const scrollable = Math.max(0, el.offsetHeight - vh);
        for (const s of caps.split(',')) {
          const at = parseFloat(s);
          if (!Number.isNaN(at)) ys.push(Math.round(top + at * scrollable));
        }
      } else {
        ys.push(top);
      }
    }
    ys.sort((a, b) => a - b);
    const out: number[] = [];
    for (const y of ys) if (!out.length || y - out[out.length - 1] > 24) out.push(y);
    waypoints = out;
  }

  function onScroll() {
    showTop = window.scrollY > window.innerHeight * 0.6;
  }

  onMount(() => {
    collect();
    onScroll();
    const rc = () => collect();
    window.addEventListener('resize', rc);
    window.addEventListener('scroll', onScroll, { passive: true });
    const t = setTimeout(collect, 800); // re-measure after fonts/layout settle
    return () => {
      window.removeEventListener('resize', rc);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(t);
    };
  });

  function next() {
    const y = window.scrollY;
    const nx = waypoints.find((w) => w > y + 12);
    scrollToY(nx ?? document.body.scrollHeight);
  }
  function prev() {
    const y = window.scrollY;
    let pv = 0;
    for (const w of waypoints) {
      if (w < y - 12) pv = w;
      else break;
    }
    scrollToY(pv);
  }
  function toTop() {
    scrollToY(0);
  }
</script>

<div class="fixed bottom-6 right-6 z-30 flex flex-col items-center gap-3 print:hidden">
  {#if showTop}
    <button
      onclick={toTop}
      aria-label="Back to top"
      title="Back to top"
      class="grid h-11 w-11 place-items-center rounded-full border border-hairline bg-card/95 text-ink shadow-sm backdrop-blur transition hover:border-accent hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <line x1="6" y1="5" x2="18" y2="5" />
        <path d="M12 20 V10" />
        <path d="M7 14 l5 -5 5 5" />
      </svg>
    </button>
  {/if}

  <div class="flex flex-col overflow-hidden rounded-full border border-hairline bg-card/95 shadow-sm backdrop-blur">
    <button
      onclick={prev}
      aria-label="Previous"
      title="Previous step"
      class="grid h-11 w-11 place-items-center text-ink transition hover:bg-paper hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15 l6 -6 6 6" /></svg>
    </button>
    <div class="mx-2.5 h-px shrink-0 bg-hairline"></div>
    <button
      onclick={next}
      aria-label="Next"
      title="Next step"
      class="grid h-11 w-11 place-items-center text-ink transition hover:bg-paper hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9 l6 6 6 -6" /></svg>
    </button>
  </div>
</div>
