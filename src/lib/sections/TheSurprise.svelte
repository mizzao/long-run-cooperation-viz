<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import RichText from '$lib/components/RichText.svelte';
  import CapId from '$lib/components/CapId.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { tw } from '$lib/dev/tuning.svelte';
  import type { WelfareData } from '$lib/data/welfare';
  import { thesurprise } from '$lib/content/thesurprise';

  let { welfare }: { welfare: WelfareData } = $props();

  const COOP = '#15735B';
  const DEFECT = '#D64A22';
  const INK = '#211E19';
  const MUTED = '#6E6759';

  let width = $state(1100);
  let height = $state(620);
  const mobile = $derived(width < 640);
  const reduced = prefersReducedMotion();

  const frac = $derived(welfare.overallWelfare);
  const pts = $derived(welfare.meanPayoffPerRound);

  function frame(p: number) {
    if (reduced) p = 1;
    return {
      scaleT: beat(p, 0.04, 0.13),
      fill: beat(p, 0.2, 0.42),
      numEnv: reduced ? 1 : beat(p, 0.18, 0.24),
      whyEnv: reduced ? 1 : beat(p, 0.56, 0.66)
    };
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 420} captions={thesurprise.captions}>
  {#snippet children({ progress })}
    {@const f = frame(progress)}
    {@const x0 = mobile ? 28 : width * 0.12}
    {@const x1 = width - x0}
    {@const ty = height * 0.6}
    {@const mx = x0 + (x1 - x0) * frac * f.fill}
    <div class="relative mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-12">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{thesurprise.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{thesurprise.title}</h2>
      <div class="relative mt-2 min-h-72 grow" bind:clientWidth={width} bind:clientHeight={height}>

        <div class="absolute inset-x-0 top-[10%] text-center" style="opacity: {f.numEnv}">
          <p class="font-serif text-ink" style="font-size: {mobile ? 88 : 148}px; line-height: 1">
            {Math.round(frac * 100 * f.fill)}%
          </p>
          <p class="mx-auto mt-3 max-w-md font-sans text-sm text-muted">{thesurprise.numberSub}</p>
        </div>

        <svg class="absolute inset-0" {width} {height} role="img"
             aria-label="A scale from mutual defection (3 points per round) to full cooperation (5 points), with a marker showing where this population landed">
          <g opacity={f.scaleT}>
            <line x1={x0} x2={x1} y1={ty} y2={ty} stroke="#DFD8C8" stroke-width="2" />
            <line x1={x0} x2={x0} y1={ty - 10} y2={ty + 10} stroke={DEFECT} stroke-width="2.5" />
            <line x1={x1} x2={x1} y1={ty - 10} y2={ty + 10} stroke={COOP} stroke-width="2.5" />
            <text x={x0} y={ty + 30} class="font-mono" font-size="14" fill={DEFECT}>{thesurprise.chart.floorValue}</text>
            <text x={x0} y={ty + 48} class="font-sans" font-size={mobile ? 10 : 12} fill={INK}>{thesurprise.chart.floorLabel}</text>
            <text x={x0} y={ty + 64} class="font-sans" font-size={mobile ? 10 : 11} fill={MUTED}>{thesurprise.chart.floorNote}</text>
            <text x={x1} y={ty + 30} text-anchor="end" class="font-mono" font-size="14" fill={COOP}>{thesurprise.chart.ceilValue}</text>
            <text x={x1} y={ty + 48} text-anchor="end" class="font-sans" font-size={mobile ? 10 : 12} fill={INK}>{thesurprise.chart.ceilLabel}</text>
            <text x={x1} y={ty + 64} text-anchor="end" class="font-sans" font-size={mobile ? 10 : 11} fill={MUTED}>{thesurprise.chart.ceilNote}</text>
            <text x={(x0 + x1) / 2} y={ty + 64} text-anchor="middle" class="font-sans" font-size="11" fill={MUTED} opacity={mobile ? 0 : 1}>{thesurprise.chart.unit}</text>
          </g>
          {#if f.fill > 0}
            <line x1={x0} x2={mx} y1={ty} y2={ty} stroke={INK} stroke-width="3.5" stroke-linecap="round" />
            <circle cx={mx} cy={ty} r="7" fill={INK} stroke="#FBF8F1" stroke-width="2" />
            {#if f.fill > 0.985}
              <text x={mx} y={ty - 34} text-anchor="middle" class="font-mono" font-size="15" fill={INK}>{pts.toFixed(2)}</text>
              <text x={mx} y={ty - 18} text-anchor="middle" class="font-sans" font-size="11" fill={MUTED}>{thesurprise.chart.markerLabel}</text>
            {/if}
          {/if}
        </svg>

        <div class="absolute inset-x-0 top-[72%] text-center" style="opacity: {f.whyEnv}">
          <p class="font-serif italic text-ink" style="font-size: {mobile ? 44 : 64}px; line-height: 1">{thesurprise.why}</p>
        </div>
      </div>
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each thesurprise.captions as cap}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink"><CapId id={cap.id} /><RichText text={cap.text} /></p>
          {/each}
        </div>
      {:else}
        <div class="relative h-36 shrink-0">
          <div class="pointer-events-none absolute inset-x-6 top-2 z-10 mx-auto grid w-full max-w-xl">
            {#each thesurprise.captions as cap}
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
