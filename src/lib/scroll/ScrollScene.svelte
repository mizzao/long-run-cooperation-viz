<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import { prefersReducedMotion } from './progress';
  import { registerScene, tune, type CapWindow } from '$lib/dev/tuning.svelte';

  let { heightVh = 300, captions, children }: { heightVh?: number; captions?: readonly CapWindow[]; children: Snippet<[{ progress: number }]> } = $props();
  let wrapper: HTMLElement;
  let progress = $state(0);
  const reducedMode = prefersReducedMotion();

  // Nav waypoints: the midpoint of each caption window, exposed as data-caps.
  const caps = $derived(
    captions?.map((c) => {
      const t = tune(c);
      return (t.at + t.until) / 2;
    })
  );

  onMount(() => {
    const unregister = registerScene(wrapper, captions);
    if (prefersReducedMotion()) {
      progress = 1;
      return unregister;
    }
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
    return () => { destroyed = true; ctx?.kill(); unregister(); };
  });
</script>

<section bind:this={wrapper} data-caps={caps?.join(',')} style={reducedMode ? '' : `height: ${heightVh}vh`} class="relative">
  <div class={reducedMode ? 'min-h-screen' : 'sticky top-0 h-screen overflow-hidden'}>
    {@render children({ progress })}
  </div>
</section>
