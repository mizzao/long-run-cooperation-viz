<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import RichText from '$lib/components/RichText.svelte';
  import CapId from '$lib/components/CapId.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { tw } from '$lib/dev/tuning.svelte';
  import { gridPos } from '$lib/viz/peopleLayout';
  import type { PlayerStrategy } from '$lib/data/strategies';
  import { thecoda } from '$lib/content/thecoda';

  let { players }: { players: PlayerStrategy[] } = $props();

  const GOLD = '#C79008';
  const NEUTRAL = '#8B8474';

  let width = $state(1100);
  let height = $state(620);
  const mobile = $derived(width < 640);
  const reduced = prefersReducedMotion();

  const gridSlot = $derived.by(() => {
    const idx = Array.from({ length: players.length }, (_, i) => i);
    let s = 7;
    const rnd = () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });

  function frame(p: number) {
    if (reduced) p = 1;
    return {
      crowd: beat(p, 0.04, 0.16),
      gold: beat(p, 0.2, 0.28),
      crowdEnv: reduced ? 0 : Math.min(beat(p, 0.04, 0.1), 1 - 0.85 * beat(p, 0.32, 0.4), 1 - beat(p, 0.56, 0.64)),
      stmtEnv: reduced ? 1 : Math.min(beat(p, 0.36, 0.44), 1 - beat(p, 0.56, 0.64)),
      cavEnv: reduced ? 1 : Math.min(beat(p, 0.68, 0.74), 1 - beat(p, 0.84, 0.88)),
      credEnv: reduced ? 1 : beat(p, 0.89, 0.95)
    };
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 480} captions={thecoda.captions}>
  {#snippet children({ progress })}
    {@const f = frame(progress)}
    {@const spacing = mobile ? 24 : 34}
    {@const area = { x: width / 2 - (mobile ? 5 : 7) * spacing, y: height * 0.16, w: (mobile ? 10 : 14) * spacing, h: height * 0.52 }}
    <div class="relative mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-12">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{thecoda.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{thecoda.title}</h2>
      <div class="relative mt-2 min-h-72 grow" bind:clientWidth={width} bind:clientHeight={height}>

        <div class="absolute inset-x-0 top-[30%] z-10 text-center" style="opacity: {f.stmtEnv}">
          <p class="mx-auto max-w-3xl font-serif text-ink" style="font-size: {mobile ? 38 : 64}px; line-height: 1.14">{thecoda.statement}</p>
          <p class="mx-auto mt-6 max-w-md font-sans text-sm text-muted">{thecoda.statementSub}</p>
        </div>

        <svg class="absolute inset-0" {width} {height} style="opacity: {f.crowdEnv}" role="img" aria-label="The 94 participants; the 36 resilient cooperators highlighted in gold">
          {#each players as pl, i}
            {@const pos = gridPos(gridSlot[i], players.length, mobile ? 10 : 14, area)}
            {@const appear = beat(f.crowd, (i / players.length) * 0.7, (i / players.length) * 0.7 + 0.3)}
            {@const isGold = pl.resilient && f.gold > 0.5}
            <g transform="translate({pos.x} {pos.y})" opacity={appear * (pl.resilient ? 1 : 1 - 0.45 * f.gold)}>
              <circle cx="0" cy={-0.2 * spacing} r={0.16 * spacing} fill={isGold ? GOLD : NEUTRAL} />
              <rect x={-0.26 * spacing} y={-0.04 * spacing} width={0.52 * spacing} height={0.36 * spacing} rx={0.18 * spacing} fill={isGold ? GOLD : NEUTRAL} />
            </g>
          {/each}
        </svg>

        <div class="absolute inset-x-0 top-[12%] mx-auto max-w-lg rounded border border-hairline bg-card/97 p-6" style="opacity: {f.cavEnv}">
          <p class="relative font-sans text-xs uppercase tracking-widest text-muted">
            {thecoda.caveats.title}
            <CapId id={thecoda.caveats.devId} />
          </p>
          <ul class="mt-4 space-y-3">
            {#each thecoda.caveats.items as item}
              <li class="flex gap-3 font-serif text-base text-ink"><span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-hairline"></span>{item}</li>
            {/each}
          </ul>
          <p class="mt-4 font-sans text-sm text-muted">{thecoda.caveats.note}</p>
        </div>

        <div class="absolute inset-x-0 top-[14%] mx-auto max-w-lg text-center" style="opacity: {f.credEnv}">
          <p class="font-serif text-3xl text-ink">{thecoda.credits.title}</p>
          <p class="mx-auto mt-6 max-w-md font-sans text-sm leading-relaxed text-muted">{thecoda.credits.based}</p>
          <p class="mt-5 font-sans text-sm">
            <a class="text-accent underline decoration-hairline underline-offset-4" href={thecoda.credits.paperUrl} target="_blank" rel="noopener">{thecoda.credits.paperLabel}</a>
            <span class="mx-3 text-hairline">|</span>
            <a class="text-accent underline decoration-hairline underline-offset-4" href={thecoda.credits.dataUrl} target="_blank" rel="noopener">{thecoda.credits.dataLabel}</a>
          </p>
          <p class="mx-auto mt-6 max-w-md font-sans text-xs leading-relaxed text-muted">{thecoda.credits.method}</p>
        </div>
      </div>
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each thecoda.captions as cap}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink"><CapId id={cap.id} /><RichText text={cap.text} /></p>
          {/each}
        </div>
      {:else}
        <div class="relative h-36 shrink-0">
          <div class="pointer-events-none absolute inset-x-6 top-2 z-10 mx-auto grid w-full max-w-xl">
            {#each thecoda.captions as cap}
              <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
                 style="opacity: {windowEnv(progress, ...tw(cap))}">
                <CapId id={cap.id} />
                <RichText text={cap.text} />
              </p>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/snippet}
</ScrollScene>
