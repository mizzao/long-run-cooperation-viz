<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { prefersReducedMotion } from './progress';

  let { heightVh = 300, children }: { heightVh?: number; children: Snippet<[{ progress: number }]> } = $props();
  let wrapper: HTMLElement;
  let progress = $state(0);
  const reducedMode = prefersReducedMotion();

  onMount(() => {
    if (prefersReducedMotion()) { progress = 1; return; }
    let ctx: { kill: () => void } | undefined;
    let destroyed = false;
    (async () => {
      const gsap = (await import('gsap')).default;
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      if (destroyed) return;
      gsap.registerPlugin(ScrollTrigger);
      const st = ScrollTrigger.create({
        trigger: wrapper,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => { progress = self.progress; }
      });
      ctx = st;
    })();
    return () => { destroyed = true; ctx?.kill(); };
  });
</script>

<section bind:this={wrapper} style={reducedMode ? '' : `height: ${heightVh}vh`} class="relative">
  <div class={reducedMode ? 'min-h-screen' : 'sticky top-0 h-screen overflow-hidden'}>
    {@render children({ progress })}
  </div>
</section>
