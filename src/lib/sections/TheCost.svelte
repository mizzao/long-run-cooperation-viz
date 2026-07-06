<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { scaleLinear } from 'd3-scale';
  import { parsePayoffs, stableGap, type DayPayoff } from '$lib/data/payoffs';
  import { thecost } from '$lib/content/thecost';

  let { payoffs }: { payoffs: DayPayoff[] } = $props();

  const BEATS = { axes: [0, 0.12], lines: [0.2, 0.5], gap: [0.5, 0.7], quote: [0.72, 1] } as const;
  const GOLD = '#C79008';
  const INK = '#211E19';

  let width = $state(1100);
  let height = $state(620);
  const mobile = $derived(width < 640);
  const margin = $derived(mobile ? { top: 64, right: 44, bottom: 64, left: 44 } : { top: 72, right: 200, bottom: 72, left: 64 });
  const x = $derived(scaleLinear().domain([1, 20]).range([margin.left, width - margin.right]));
  const y = $derived(scaleLinear().domain([4.4, 5.0]).range([height - margin.bottom, margin.top]));
  const reduced = prefersReducedMotion();

  const gap = $derived(stableGap(payoffs));
  const legendX = $derived(width - margin.right - (mobile ? 210 : 240));

  function linePath(key: 'cc' | 'threshold') {
    return payoffs.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(r.day)} ${y(r[key].mean)}`).join(' ');
  }
  function bandPath(key: 'cc' | 'threshold') {
    const up = payoffs.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(r.day)} ${y(r[key].mean + (r[key].se ?? 0))}`).join(' ');
    const down = [...payoffs].reverse().map((r) => `L ${x(r.day)} ${y(r[key].mean - (r[key].se ?? 0))}`).join(' ');
    return `${up} ${down} Z`;
  }
  function gapPath() {
    const stable = payoffs.slice(6);
    const up = stable.map((r, i) => `${i === 0 ? 'M' : 'L'} ${x(r.day)} ${y(r.threshold.mean)}`).join(' ');
    const down = [...stable].reverse().map((r) => `L ${x(r.day)} ${y(r.cc.mean)}`).join(' ');
    return `${up} ${down} Z`;
  }

  function frame(p: number) {
    if (reduced) p = 1;
    return {
      axes: beat(p, ...BEATS.axes),
      lines: beat(p, ...BEATS.lines),
      gapT: beat(p, ...BEATS.gap),
      day1Env: reduced ? 0 : windowEnv(p, 0.05, 0.2),
      gapEnv: reduced ? 1 : windowEnv(p, 0.52, 0.7),
      quoteEnv: reduced ? 1 : windowEnv(p, 0.74, 1)
    };
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 600}>
  {#snippet children({ progress })}
    {@const f = frame(progress)}
    {@const clipW = margin.left + (width - margin.left - margin.right) * f.lines}
    {@const plotBottom = height - margin.bottom}
    <div class="relative mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-12">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{thecost.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{thecost.title}</h2>
      <div class="relative mt-6 min-h-72 grow" bind:clientWidth={width} bind:clientHeight={height}>
        <svg class="absolute inset-0" {width} {height} role="img" aria-label="Average payoff per round: resilient cooperators earn less than threshold players every day after day 1" opacity={Math.min(1, f.axes * 2)}>
          <defs>
            <clipPath id="cost-clip"><rect x="0" y="0" width={clipW} height={height} /></clipPath>
          </defs>
          {#each [4.4, 4.6, 4.8, 5.0] as t}
            <line x1={margin.left} x2={width - margin.right} y1={y(t)} y2={y(t)} stroke="#DFD8C8" stroke-width="1" />
            <text x={margin.left - 8} y={y(t) + 4} text-anchor="end" class="font-mono" font-size="11" fill="#6E6759">{t.toFixed(1)}</text>
          {/each}
          <line x1={margin.left} x2={margin.left} y1={margin.top} y2={plotBottom} stroke="#B4B2A9" stroke-width="1" />
          {#each payoffs as r}
            {#if r.day > 1}
              <line x1={x(r.day)} x2={x(r.day)} y1={margin.top} y2={plotBottom} stroke="#DFD8C8" stroke-width="1" stroke-dasharray="2 4" />
            {/if}
          {/each}
          {#each [1, 5, 10, 15, 20] as d}
            <text x={x(d)} y={plotBottom + 18} text-anchor="middle" class="font-mono" font-size="11" fill="#6E6759">day {d}</text>
          {/each}
          <text x={margin.left} y={margin.top - 40} class="font-sans" font-size="12" fill="#6E6759">{thecost.chart.yTitle}</text>
          <text x={margin.left} y={margin.top - 24} class="font-sans" font-size="11" fill="#A8642F">{thecost.chart.yNote}</text>
          <text x={(margin.left + width - margin.right) / 2} y={height - 10} text-anchor="middle" class="font-sans" font-size="12" fill="#6E6759">{thecost.chart.xTitle}</text>

          {#if f.day1Env > 0.01}
            <rect x={x(1) - 5} y={margin.top} width="26" height={plotBottom - margin.top} rx="4" fill="#211E19" opacity={0.055 * f.day1Env} />
          {/if}

          {#if f.gapT > 0}
            <path d={gapPath()} fill="#D64A22" opacity={0.06 + 0.05 * f.gapEnv} clip-path="url(#cost-clip)" />
            {#if f.gapEnv > 0.3}
              <text x={x(13)} y={y((payoffs[12].threshold.mean + payoffs[12].cc.mean) / 2) + 4} text-anchor="middle" class="font-sans" font-size="12" fill="#A32D2D" opacity={f.gapEnv}>{thecost.chart.gapLabel}</text>
            {/if}
          {/if}

          <g opacity={Math.min(1, f.axes * 1.5)}>
            <circle cx={x(1)} cy={y(payoffs[0].threshold.mean)} r="2.6" fill={INK} />
            <circle cx={x(1)} cy={y(payoffs[0].cc.mean)} r="2.8" fill={GOLD} />
          </g>
          <g clip-path="url(#cost-clip)">
            <path d={bandPath('threshold')} fill={INK} opacity="0.08" />
            <path d={bandPath('cc')} fill={GOLD} opacity="0.14" />
            <path d={linePath('threshold')} fill="none" stroke={INK} stroke-width="2" stroke-linejoin="round" />
            <path d={linePath('cc')} fill="none" stroke={GOLD} stroke-width="2.5" stroke-linejoin="round" />
            {#each payoffs as r}
              <circle cx={x(r.day)} cy={y(r.threshold.mean)} r="2.4" fill={INK} />
              <circle cx={x(r.day)} cy={y(r.cc.mean)} r="2.6" fill={GOLD} />
            {/each}
          </g>

          <g opacity={Math.min(1, f.axes * 1.5)}>
            <line x1={legendX} x2={legendX + 22} y1={margin.top + 6} y2={margin.top + 6} stroke={GOLD} stroke-width="2.5" />
            <text x={legendX + 28} y={margin.top + 10} class="font-sans" font-size="12" fill={GOLD}>{thecost.chart.resilientLabel}</text>
            <line x1={legendX} x2={legendX + 22} y1={margin.top + 26} y2={margin.top + 26} stroke={INK} stroke-width="2" />
            <text x={legendX + 28} y={margin.top + 30} class="font-sans" font-size="12" fill={INK}>{thecost.chart.thresholdLabel}</text>
          </g>
        </svg>

        {#if !mobile}
          <div class="pointer-events-none absolute right-2 top-32 w-80 rounded border border-hairline bg-card/95 p-5" style="opacity: {f.quoteEnv}">
            <p class="font-serif text-base italic leading-relaxed text-ink">&#8220;{thecost.chart.quote}&#8221;</p>
            <p class="mt-3 font-sans text-xs text-muted">&#8212; {thecost.chart.quoteAttrib}</p>
          </div>
        {/if}
      </div>
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each thecost.captions as cap}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink">{cap.text}</p>
          {/each}
        </div>
      {:else}
        <div class="pointer-events-none absolute inset-x-6 bottom-20 z-10 mx-auto grid w-full max-w-xl">
          {#each thecost.captions as cap}
            <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
               style="opacity: {windowEnv(progress, cap.at, cap.until)}">
              <span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P7C{thecost.captions.indexOf(cap) + 1}</span>
              {cap.text}
            </p>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</ScrollScene>
