<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { gameScale, rateScale, positionScale, type ChartBox } from '$lib/viz/scales';
  import { roundLinePath, heartbeatPath } from '$lib/viz/paths';
  import { dayBoundaries, type CooperationData, type Heartbeat } from '$lib/data/cooperation';
  import { unravelling } from '$lib/content/unravelling';

  let { coop, heartbeat }: { coop: CooperationData; heartbeat: Heartbeat } = $props();

  const BEATS = {
    draw: [0, 0.28],
    compress: [0.28, 0.36],
    reveal: [0.36, 0.86],
    annotate: [0.86, 1]
  } as const;
  const HB_MIN_SCALE = 0.05;
  const HB_MIN_OPACITY = 0.25;
  const GHOST_FADE: readonly [number, number] = [0.36, 0.46];
  const TIP_LABELS_FROM = 0.05;

  let width = $state(1100);
  let height = $state(620);
  const box = $derived<ChartBox>({
    width,
    height,
    margin: width < 640
      ? { top: 40, right: 44, bottom: 52, left: 40 }
      : { top: 48, right: 78, bottom: 56, left: 56 }
  });
  const mobile = $derived(width < 640);

  const xG = $derived(gameScale(box));
  const xP = $derived(positionScale(box));
  const y = $derived(rateScale(box));

  const ROUND_KEYS = ['1', '8', '9', '10'] as const;
  const ROUND_COLORS: Record<(typeof ROUND_KEYS)[number], string> = {
    '1': '#15735B',
    '8': '#7A8A5A',
    '9': '#A8642F',
    '10': '#D64A22'
  };

  const hbPath = $derived(heartbeatPath(heartbeat['1'], xP, y));
  const curvePaths = $derived(
    ROUND_KEYS.map((k) => ({ k, color: ROUND_COLORS[k], d: roundLinePath(coop.rounds[k], xG, y) }))
  );
  const dayStarts = $derived(dayBoundaries(coop.dayOfGame));
  const reduced = prefersReducedMotion();

  const dipPos = 30;
  const restartPos = 31;
  const dipVal = $derived(heartbeat['1'][dipPos - 1] ?? 0.6);
  const restartVal = $derived(heartbeat['1'][restartPos - 1] ?? 0.88);

  function frame(p: number) {
    if (reduced) p = 1;
    const a = beat(p, ...BEATS.draw);
    const b = beat(p, ...BEATS.compress);
    const c = beat(p, ...BEATS.reveal);
    const d = beat(p, ...BEATS.annotate);
    const ghostOut = beat(p, ...GHOST_FADE);
    const innerW = box.width - box.margin.left - box.margin.right;
    return {
      a, b, c, d,
      hbClip: box.margin.left + innerW * a,
      hbScale: 1 - (1 - HB_MIN_SCALE) * b,
      hbOpacity: (1 - (1 - HB_MIN_OPACITY) * b) * (1 - ghostOut),
      curveClip: box.margin.left + innerW * (HB_MIN_SCALE * b + (1 - HB_MIN_SCALE) * c),
      curveOpacity: b,
      dayRuleOpacity: Math.min(1, c * 2),
      annotOpacity: d
    };
  }

  const TIP_SMOOTH = 40;
  function tip(k: (typeof ROUND_KEYS)[number], clipX: number) {
    const innerW = box.width - box.margin.left - box.margin.right;
    let g = Math.floor(1 + ((clipX - box.margin.left) / innerW) * 399);
    g = Math.max(1, Math.min(400, g));
    const pts = coop.rounds[k];
    const window: number[] = [];
    for (let i = g - 1; i >= 0 && window.length < TIP_SMOOTH; i--) {
      const r = pts[i].rate;
      if (r !== null) window.push(r);
    }
    if (window.length === 0) return null;
    const mean = window.reduce((s, v) => s + v, 0) / window.length;
    return { x: clipX, y: y(mean) };
  }

  const calloutX = $derived(xG(358));
  const calloutY = $derived(y(0.1));
  const leaderTopY = $derived(y(0.22));
  const showCallout = $derived(width >= 1180);
  const dayLabels = [1, 5, 10, 15, 20];
</script>

<ScrollScene heightVh={reduced ? 100 : 680}>
  {#snippet children({ progress })}
    {@const f = frame(progress)}
    {@const plotBottom = height - box.margin.bottom}
    {@const day1Env = reduced ? 0 : windowEnv(progress, 0.3, 0.47)}
    {@const day1Grow = reduced ? 1 : beat(progress, 0.3, 0.36)}
    {@const foc = reduced ? { '1': 0, '8': 0, '9': 0, '10': 0 } : { '1': windowEnv(progress, 0.85, 1), '8': 0, '9': windowEnv(progress, 0.66, 0.82), '10': windowEnv(progress, 0.48, 0.65) }}
    {@const maxFoc = Math.max(foc['1'], foc['9'], foc['10'])}
    {@const morningEnv = reduced ? 0 : windowEnv(progress, 0.52, 0.78)}
    {@const day2Rate = coop.rounds['10'][20].rate ?? 0.5}
    <div class="relative mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-12">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{unravelling.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{unravelling.title}</h2>
      <div class="relative mt-6 min-h-72 grow" bind:clientWidth={width} bind:clientHeight={height}>
        <svg class="absolute inset-0" {width} {height} role="img" aria-label="Cooperation by round across 400 games over 20 days">
          <defs>
            <clipPath id="hb-clip"><rect x="0" y="0" width={f.hbClip} height={height} /></clipPath>
            <clipPath id="curve-clip"><rect x="0" y="0" width={f.curveClip} height={height} /></clipPath>
          </defs>

          {#each [0, 0.25, 0.5, 0.75, 1] as t}
            <line x1={box.margin.left} x2={width - box.margin.right} y1={y(t)} y2={y(t)} stroke="#DFD8C8" stroke-width="1" />
            <text x={box.margin.left - 8} y={y(t) + 4} text-anchor="end" class="font-mono" font-size="11" fill="#6E6759">{Math.round(t * 100)}%</text>
          {/each}

          <text x={box.margin.left} y={box.margin.top - 24} class="font-sans" font-size="12" fill="#6E6759">{unravelling.chart.yTitle}</text>

          <g opacity={1 - f.b}>
            <text x={(box.margin.left + width - box.margin.right) / 2} y={height - 10} text-anchor="middle" class="font-sans" font-size="12" fill="#6E6759">{mobile ? unravelling.chart.xTitleDayShort : unravelling.chart.xTitleDay}</text>
          </g>
          <g opacity={f.b}>
            <text x={(box.margin.left + width - box.margin.right) / 2} y={height - 10} text-anchor="middle" class="font-sans" font-size="12" fill="#6E6759">{mobile ? unravelling.chart.xTitleAllShort : unravelling.chart.xTitleAll}</text>
          </g>

          <g opacity={(f.a > 0.08 ? 1 : 0) * (1 - f.b)}>
            <path d="M {xP(1)} {height - box.margin.bottom + 8} v 5 H {xP(10)} v -5" fill="none" stroke="#6E6759" stroke-width="1" />
            <text x={mobile ? xP(1) : (xP(1) + xP(10)) / 2} y={height - box.margin.bottom + 26} text-anchor={mobile ? "start" : "middle"} class="font-sans" font-size="11" fill="#6E6759">{unravelling.chart.bracket}</text>
          </g>

          {#if f.hbClip > xP(dipPos) + 12}
            <g opacity={1 - f.b}>
              <line x1={xP(dipPos)} y1={y(dipVal) + 6} x2={xP(dipPos)} y2={y(dipVal - 0.17)} stroke="#211E19" stroke-width="1" stroke-dasharray="3 3" />
              {#each (mobile ? unravelling.chart.dipNoteShort : unravelling.chart.dipNote) as ln, i}
                <text x={xP(dipPos)} y={y(dipVal - 0.2) + 14 + i * 15} text-anchor="middle" class="font-sans" font-size="12" fill="#211E19">{ln}</text>
              {/each}
            </g>
          {/if}
          {#if !mobile && f.hbClip > xP(restartPos + 22) + 12}
            <g opacity={1 - f.b}>
              <line x1={xP(restartPos)} y1={y(restartVal) - 6} x2={xP(restartPos + 2.5)} y2={y(0.955)} stroke="#15735B" stroke-width="1" stroke-dasharray="3 3" />
              {#each unravelling.chart.restartNote as ln, i}
                <text x={xP(restartPos + 4)} y={y(0.97) + i * 15} text-anchor="start" class="font-sans" font-size="12" fill="#15735B">{ln}</text>
              {/each}
            </g>
          {/if}

          {#if day1Env > 0.01}
            <rect x={xG(1)} y={plotBottom - (plotBottom - box.margin.top) * day1Grow} width={xG(21) - xG(1)} height={(plotBottom - box.margin.top) * day1Grow} rx="4" fill="#211E19" opacity={0.055 * day1Env} />
          {/if}
          <g opacity={f.dayRuleOpacity}>
            {#each dayStarts as g, i}
              {#if i > 0 && xG(g) <= f.curveClip}
                <line x1={xG(g)} x2={xG(g)} y1={box.margin.top} y2={height - box.margin.bottom} stroke="#DFD8C8" stroke-width="1" stroke-dasharray="2 4" />
              {/if}
            {/each}
            {#each dayLabels as d}
              {@const gx = xG(dayStarts[d - 1] ?? 1)}
              {#if gx <= f.curveClip}
                <text x={gx + (d === 1 ? 2 : 4)} y={height - box.margin.bottom + 16} class="font-mono" font-size="11" fill="#6E6759">day {d}</text>
              {/if}
            {/each}
          </g>

          {#if f.hbOpacity > 0.005}
            <g transform="translate({box.margin.left} 0) scale({f.hbScale} 1) translate({-box.margin.left} 0)" opacity={f.hbOpacity}>
              <path d={hbPath} fill="none" stroke="#211E19" stroke-width="1.25" stroke-linejoin="round" clip-path="url(#hb-clip)" />
            </g>
          {/if}

          <g opacity={f.curveOpacity} clip-path="url(#curve-clip)">
            {#each curvePaths as c}
              <path d={c.d} fill="none" stroke={c.color} stroke-width={1.75 + 1.1 * (foc[c.k] ?? 0)} stroke-linejoin="round" opacity={1 - 0.45 * (maxFoc - (foc[c.k] ?? 0))} />
            {/each}
          </g>

          {#if f.c > TIP_LABELS_FROM}
            <g opacity={f.curveOpacity}>
              {#each curvePaths as c}
                {@const t = tip(c.k, f.curveClip)}
                {#if t}
                  <text x={t.x + 6} y={t.y + 4} class="font-sans" font-size="12" fill={c.color}>{mobile ? `R${c.k}` : `Round ${c.k}`}</text>
                {/if}
              {/each}
            </g>
          {/if}

          {#if !mobile && morningEnv > 0.01}
            <g opacity={morningEnv}>
              <line x1={xG(21)} y1={y(0.73) + 60} x2={xG(21)} y2={y(day2Rate) - 6} stroke="#211E19" stroke-width="1" stroke-dasharray="3 3" />
              <rect x={xG(21) - 6} y={y(0.73)} width="196" height="56" rx="6" fill="#FFFFFF" opacity="0.96" stroke="#DFD8C8" />
              {#each unravelling.chart.morningNote as ln, i}
                <text x={xG(21) + 4} y={y(0.73) + 16 + i * 15} text-anchor="start" class="font-sans" font-size="12" fill="#211E19">{ln}</text>
              {/each}
            </g>
          {/if}
          <g opacity={f.annotOpacity}>
            {#if showCallout}
              <line x1={calloutX} x2={calloutX} y1={calloutY - 28} y2={leaderTopY} stroke="#D64A22" stroke-width="1" stroke-dasharray="3 3" />
              <rect x={calloutX - 112} y={calloutY - 28} width="224" height="46" rx="6" fill="#FFFFFF" opacity="0.94" stroke="#DFD8C8" />
              <text x={calloutX} y={calloutY - 10} text-anchor="middle" class="font-sans" font-size="12" fill="#211E19">Round 10 never recovers</text>
              <text x={calloutX} y={calloutY + 8} text-anchor="middle" class="font-mono" font-size="12" fill="#D64A22">51% on day 1 &#8594; 26% by day 20</text>
            {/if}
          </g>
        </svg>
      </div>
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each unravelling.captions as cap, ci}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink"><span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P4C{unravelling.captions.indexOf(cap) + 1}</span>{cap.text}</p>
          {/each}
        </div>
      {:else}
        <div class="pointer-events-none absolute inset-x-6 bottom-20 z-10 mx-auto grid w-full max-w-xl">
          {#each unravelling.captions as cap, ci}
            <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
               style="opacity: {windowEnv(progress, cap.at, cap.until)}">
              <span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P4C{unravelling.captions.indexOf(cap) + 1}</span>
              {cap.text}
            </p>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</ScrollScene>
