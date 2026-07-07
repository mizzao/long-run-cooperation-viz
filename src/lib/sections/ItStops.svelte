<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { gameScale, rateScale, type ChartBox } from '$lib/viz/scales';
  import { roundLinePath } from '$lib/viz/paths';
  import { rollingMean, dailyMeans, slopePerDay, type CooperationData } from '$lib/data/cooperation';
  import { binFractions, type DefectionBins } from '$lib/data/defection';
  import { itstops } from '$lib/content/itstops';

  let { coop, defection }: { coop: CooperationData; defection: DefectionBins[] } = $props();

  const BEATS = { marker: [0, 0.1], band: [0.1, 0.28], trend: [0.3, 0.54], hist: [0.58, 0.74] } as const;
  const DAY7_GAME = 121;
  const TREND_WINDOW = 20;

  let width = $state(1100);
  let height = $state(620);
  const box = $derived<ChartBox>({
    width, height,
    margin: width < 640 ? { top: 40, right: 44, bottom: 52, left: 40 } : { top: 48, right: 78, bottom: 56, left: 56 }
  });
  const mobile = $derived(width < 640);
  const xG = $derived(gameScale(box));
  const y = $derived(rateScale(box));

  const ROUND_KEYS = ['1', '8', '9', '10'] as const;
  const ROUND_COLORS: Record<(typeof ROUND_KEYS)[number], string> = {
    '1': '#15735B', '8': '#7A8A5A', '9': '#A8642F', '10': '#D64A22'
  };
  const curvePaths = $derived(ROUND_KEYS.map((k) => ({ k, color: ROUND_COLORS[k], d: roundLinePath(coop.rounds[k], xG, y) })));
  const trendPaths = $derived((['9', '10'] as const).map((k) => ({ k, color: ROUND_COLORS[k], d: roundLinePath(rollingMean(coop.rounds[k], TREND_WINDOW), xG, y) })));
  const meansR10 = $derived(dailyMeans(coop.rounds['10'], coop.dayOfGame));
  const slopeBefore = $derived(slopePerDay(meansR10, 1, 7) * 100);
  const slopeAfter = $derived(slopePerDay(meansR10, 7, 20) * 100);
  const reduced = prefersReducedMotion();

  function frame(p: number) {
    if (reduced) p = 1;
    const a = beat(p, ...BEATS.marker);
    const b = beat(p, ...BEATS.band);
    const c = beat(p, ...BEATS.trend);
    const h = beat(p, ...BEATS.hist);
    return {
      chartOpacity: Math.min(1, a * 2),
      markerScale: a,
      bandWidthT: b,
      jaggedDim: 1 - 0.65 * c,
      trendClip: box.margin.left + (box.width - box.margin.left - box.margin.right) * c,
      trendOpacity: c > 0 ? 1 : 0,
      slopeOpacity: beat(c, 0.55, 1),
      histT: h
    };
  }

  const HIST_COLORS: Record<string, string> = { early: '#6E6759', r8: '#7A8A5A', r9: '#A8642F', r10: '#D64A22', none: '#15735B' };
  const HIST_COLOR_LIST = [HIST_COLORS.early, HIST_COLORS.r8, HIST_COLORS.r9, HIST_COLORS.r10, HIST_COLORS.none];
  const histGroups = $derived(defection.map((d) => {
    const fr = binFractions(d);
    return [fr.slice(0, 7).reduce((s, v) => s + v, 0), fr[7], fr[8], fr[9], fr[10]];
  }));
  function day7LabelOpacity(p: number) {
    if (reduced) return 0;
    return 1 - beat(p, 0.56, 0.62);
  }

  interface TipLine { text: string; color?: string }
  let tip = $state<{ x: number; y: number; lines: TipLine[] } | null>(null);
  function tipAt(e: MouseEvent, lines: TipLine[]) {
    const svg = (e.currentTarget as SVGGraphicsElement).ownerSVGElement;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    tip = { x: e.clientX - r.left, y: e.clientY - r.top, lines };
  }
  function histTip(e: MouseEvent, panelLeft: number, cellW: number) {
    const el = (e.currentTarget as SVGGraphicsElement).ownerSVGElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const di = Math.max(0, Math.min(19, Math.floor((e.clientX - rect.left - panelLeft) / cellW)));
    const fr = histGroups[di];
    const lines: TipLine[] = [{ text: `day ${di + 1} - first defection` }];
    for (let bi = 0; bi < 5; bi++) {
      lines.push({ text: `${itstops.chart.legend[bi].label}: ${Math.round(fr[bi] * 100)}%`, color: HIST_COLOR_LIST[bi] });
    }
    tipAt(e, lines);
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 660}>
  {#snippet children({ progress })}
    {@const f = frame(progress)}
    {@const plotRight = width - box.margin.right}
    {@const plotBottom = height - box.margin.bottom}
    {@const day7Env = reduced ? 0 : windowEnv(progress, 0.03, 0.17)}
    {@const day7Grow = reduced ? 1 : beat(progress, 0.03, 0.09)}
    {@const histFocus = reduced ? 0 : windowEnv(progress, 0.76, 0.895)}
    <div class="relative mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-12">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{itstops.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{itstops.title}</h2>
      <div class="relative mt-6 min-h-72 grow" bind:clientWidth={width} bind:clientHeight={height}>
        <svg class="absolute inset-0" {width} {height} role="img" aria-label="Cooperation curves with day-7 stabilization marker and first-defection histograms" opacity={f.chartOpacity}>
          <defs>
            <clipPath id="trend-clip"><rect x="0" y="0" width={f.trendClip} height={height} /></clipPath>
          </defs>
          {#each [0, 0.25, 0.5, 0.75, 1] as t}
            <line x1={box.margin.left} x2={plotRight} y1={y(t)} y2={y(t)} stroke="#DFD8C8" stroke-width="1" />
            <text x={box.margin.left - 8} y={y(t) + 4} text-anchor="end" class="font-mono" font-size="11" fill="#6E6759">{Math.round(t * 100)}%</text>
          {/each}
          <rect x={xG(DAY7_GAME)} y={box.margin.top} width={Math.max(0, (plotRight - xG(DAY7_GAME)) * f.bandWidthT)} height={plotBottom - box.margin.top} fill="#211E19" opacity="0.04" />
          {#if day7Env > 0.01}
            <rect x={xG(DAY7_GAME)} y={plotBottom - (plotBottom - box.margin.top) * day7Grow} width={xG(141) - xG(DAY7_GAME)} height={(plotBottom - box.margin.top) * day7Grow} rx="4" fill="#211E19" opacity={0.055 * day7Env} />
          {/if}
          {#if f.bandWidthT > 0.6 && f.histT < 0.5}
            <text opacity={1 - 2 * f.histT} x={xG(DAY7_GAME) + 10} y={plotBottom - 8} class="font-sans" font-size="12" fill="#6E6759">{itstops.chart.band}</text>
          {/if}
          <g opacity={f.jaggedDim * (1 - 0.35 * histFocus)}>
            {#each curvePaths as c}
              <path d={c.d} fill="none" stroke={c.color} stroke-width="1.75" stroke-linejoin="round" />
            {/each}
          </g>
          {#each curvePaths as c}
            {@const last = coop.rounds[c.k].filter((pt) => pt.rate !== null).at(-1)}
            {#if last}
              <text x={xG(400) + 8} y={y(last.rate as number) + 4} class="font-sans" font-size="12" fill={c.color}>{mobile ? `R${c.k}` : `Round ${c.k}`}</text>
            {/if}
          {/each}
          <g opacity={f.trendOpacity * (1 - 0.3 * histFocus)} clip-path="url(#trend-clip)">
            {#each trendPaths as t}
              <path d={t.d} fill="none" stroke={t.color} stroke-width="3" stroke-linejoin="round" />
            {/each}
          </g>
          <g transform="translate({xG(DAY7_GAME)} 0) scale(1 {f.markerScale}) translate({-xG(DAY7_GAME)} 0)">
            <line x1={xG(DAY7_GAME)} x2={xG(DAY7_GAME)} y1={box.margin.top} y2={plotBottom} stroke="#211E19" stroke-width="1.5" stroke-dasharray="5 4" />
          </g>
          {#if f.markerScale > 0.9}
            <text x={xG(DAY7_GAME)} y={box.margin.top - 8} text-anchor="middle" class="font-mono" font-size="12" fill="#211E19" opacity={day7LabelOpacity(progress)}>{itstops.chart.day7}</text>
          {/if}
          {#if !mobile}
            <g opacity={f.slopeOpacity}>
              <rect x={xG(60) - 96} y={y(0.62) - 30} width="192" height="44" rx="6" fill="#FFFFFF" opacity="0.95" stroke="#DFD8C8" />
              <text x={xG(60)} y={y(0.62) - 12} text-anchor="middle" class="font-sans" font-size="11" fill="#6E6759">{itstops.chart.slopeBeforeTitle}</text>
              <text x={xG(60)} y={y(0.62) + 7} text-anchor="middle" class="font-sans" font-size="12" fill="#D64A22">&#8722;{Math.abs(slopeBefore).toFixed(1)} {itstops.chart.slopeUnit}</text>
              <rect x={xG(300) - 96} y={y(0.4) - 30} width="192" height="44" rx="6" fill="#FFFFFF" opacity="0.95" stroke="#DFD8C8" />
              <text x={xG(300)} y={y(0.4) - 12} text-anchor="middle" class="font-sans" font-size="11" fill="#6E6759">{itstops.chart.slopeAfterTitle}</text>
              <text x={xG(300)} y={y(0.4) + 7} text-anchor="middle" class="font-sans" font-size="12" fill="#211E19">&#8722;{Math.abs(slopeAfter).toFixed(1)} {itstops.chart.slopeUnit}</text>
            </g>
          {/if}
          {#if f.histT > 0 && !mobile}
            {@const panelH = (plotBottom - box.margin.top) * 0.36}
            {@const panelY = plotBottom - panelH * f.histT}
            {@const innerW = plotRight - box.margin.left}
            {@const cellW = innerW / 20}
            {@const barsTop = 46}
            {@const greenFocus = reduced ? 0 : windowEnv(progress, 0.905, 1)}
            <g>
              <rect x={box.margin.left} y={panelY} width={innerW} height={panelH * f.histT} fill="#FBF8F1" opacity="0.97" />
              <line x1={box.margin.left} x2={plotRight} y1={panelY} y2={panelY} stroke="#DFD8C8" stroke-width="1" />
              {#if f.histT > 0.12}
                <text x={box.margin.left + 8} y={panelY + 17} class="font-sans" font-size="12" fill="#211E19">{itstops.chart.histTitle}</text>
                <text x={plotRight - 8} y={panelY + 17} text-anchor="end" class="font-sans" font-size="11" fill="#6E6759">{itstops.chart.histSameAxis} &#8593;</text>
                {#each itstops.chart.legend as lg, li}
                  {@const lx = box.margin.left + 8 + li * 132}
                  <rect x={lx} y={panelY + 25} width="9" height="9" rx="2" fill={HIST_COLORS[lg.key]} opacity={lg.key === 'none' ? 0.9 : 0.75} />
                  <text x={lx + 13} y={panelY + 33} class="font-sans" font-size="11" fill="#6E6759">{lg.label}</text>
                {/each}
              {/if}
              {#each histGroups as fr, di}
                {@const cx = box.margin.left + di * cellW}
                {@const visible = f.histT >= (di + 1) / 22}
                {#if visible}
                  {#if di >= 6}
                    <rect x={cx} y={panelY + barsTop - 6} width={cellW} height={Math.max(0, panelH * f.histT - barsTop - 8)} fill="#211E19" opacity={0.05 + 0.045 * histFocus} />
                  {/if}
                  {#if di > 0}
                    <line x1={cx} x2={cx} y1={panelY + barsTop - 6} y2={panelY + panelH * f.histT - 14} stroke="#DFD8C8" stroke-width="0.5" />
                  {/if}
                  {#each fr as v, bi}
                    {@const barW = (cellW - 12) / 5}
                    {@const barH = Math.max(1, Math.min(1, v / 0.6) * (panelH - barsTop - 26) * f.histT)}
                    <rect x={cx + 6 + bi * barW} y={panelY + panelH * f.histT - 16 - barH} width={Math.max(1, barW - 2)} height={barH} fill={HIST_COLOR_LIST[bi]} opacity={bi === 4 ? 0.9 : 0.75 * (1 - 0.5 * greenFocus)} />
                  {/each}
                  <text x={cx + cellW / 2} y={panelY + panelH * f.histT - 4} text-anchor="middle" class="font-mono" font-size="11" fill="#6E6759">{di + 1}</text>
                {/if}
              {/each}
            </g>
            {#if f.histT > 0.5}
              <rect x={box.margin.left} y={panelY} width={innerW} height={panelH * f.histT} role="presentation" fill="transparent" style="pointer-events: all" onmousemove={(e) => histTip(e, box.margin.left, cellW)} onmouseleave={() => (tip = null)} />
            {/if}
          {/if}
        </svg>
        {#if tip && f.histT > 0.5}
          <div class="pointer-events-none absolute z-20 rounded border border-hairline bg-card p-2 font-sans text-xs text-ink" style="left: {Math.min(tip.x + 14, width - 220)}px; top: {tip.y + 12}px; min-width: 150px">
            {#each tip.lines as l, li}
              <div class="flex items-center gap-1.5 {li === 0 ? 'font-medium' : ''}">
                {#if l.color}<span class="inline-block h-2 w-2 rounded-full" style="background: {l.color}"></span>{/if}
                <span>{l.text}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each itstops.captions as cap, ci}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink"><span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P5C{itstops.captions.indexOf(cap) + 1}</span>{cap.text}</p>
          {/each}
        </div>
      {:else}
        <div class="pointer-events-none absolute inset-x-6 bottom-20 z-10 mx-auto grid w-full max-w-xl">
          {#each itstops.captions.filter((c) => c.at < 0.7) as cap, ci}
            <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
               style="opacity: {windowEnv(progress, cap.at, cap.until)}">
              <span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P5C{itstops.captions.indexOf(cap) + 1}</span>
              {cap.text}
            </p>
          {/each}
        </div>
        <div class="pointer-events-none absolute inset-x-6 top-28 z-10 mx-auto grid w-full max-w-xl">
          {#each itstops.captions.filter((c) => c.at >= 0.7) as cap, ci}
            <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
               style="opacity: {windowEnv(progress, cap.at, cap.until)}">
              <span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P5C{itstops.captions.indexOf(cap) + 1}</span>
              {cap.text}
            </p>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</ScrollScene>
