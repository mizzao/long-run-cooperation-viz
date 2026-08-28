<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import RichText from '$lib/components/RichText.svelte';
  import CapId from '$lib/components/CapId.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { tune, tw } from '$lib/dev/tuning.svelte';
  import { scaleLinear } from 'd3-scale';
  import type { SimulationData } from '$lib/data/simulation';
  import { itworks } from '$lib/content/itworks';

  let { sim, empirical }: { sim: SimulationData; empirical: number[][] } = $props();

  // strategy palette after Mao et al. Fig 5 (jet ramp): T1 dark red -> T10 blue; CC = gold (resilient, site convention)
  const COLORS = ['#7E1717', '#C62828', '#EF5A28', '#F59A23', '#EDC72B', '#9DBE3A', '#4CAE58', '#1FA88C', '#22A0C8', '#2E6FBE', '#C79008'];
  const BEATS = { draw: [0.02, 0.14], collapse: [0.44, 0.5], phase: [0.66, 0.72], welfare: [0.88, 0.92] } as const;

  let width = $state(1100);
  let height = $state(620);
  const mobile = $derived(width < 640);
  const sw = $derived(mobile ? 9 : 13);  // legend swatch width
  const reduced = prefersReducedMotion();

  function stacked(shares: number[][], x0: number, x1: number, y0: number, y1: number) {
    const n = shares.length;
    const xs = (i: number) => x0 + (i / (n - 1)) * (x1 - x0);
    const ys = (v: number) => y1 - v * (y1 - y0);
    const paths: string[] = [];
    let lower = shares.map(() => 0);
    const nb = shares.length ? shares[0].length : 0;
    for (let b = 0; b < nb; b++) {
      const upper = lower.map((v, i) => v + shares[i][b]);
      const top = upper.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xs(i)} ${ys(v)}`).join(' ');
      const bottom = [...lower].reverse().map((v, i) => `L ${xs(n - 1 - i)} ${ys(v)}`).join(' ');
      paths.push(`${top} ${bottom} Z`);
      lower = upper;
    }
    return paths;
  }

  interface TipLine { text: string; color?: string }
  let tip = $state<{ x: number; y: number; lines: TipLine[] } | null>(null);
  const GROUP_LABELS = ['defect round 1', 'defect round 2', 'defect round 3', 'defect round 4', 'defect round 5', 'defect round 6', 'defect round 7', 'defect round 8', 'defect round 9', 'defect round 10', 'cooperate always'];

  function tipAt(e: MouseEvent, lines: TipLine[]) {
    const svg = (e.currentTarget as SVGGraphicsElement).ownerSVGElement;
    if (!svg) return;
    const r = svg.getBoundingClientRect();
    tip = { x: e.clientX - r.left, y: e.clientY - r.top, lines };
  }
  function sharesTip(e: MouseEvent, shares: number[][], x0: number, w: number, unit: string, title: string) {
    const r = (e.currentTarget as SVGGraphicsElement).ownerSVGElement!.getBoundingClientRect();
    const rel = (e.clientX - r.left - x0) / w;
    const idx = Math.max(0, Math.min(shares.length - 1, Math.round(rel * (shares.length - 1))));
    const row = shares[idx];
    const lines: TipLine[] = [{ text: `${title} - ${unit} ${idx + 1}` }];
    for (let b = row.length - 1; b >= 0; b--) {
      if (row[b] < 0.005) continue;
      lines.push({ text: `${GROUP_LABELS[b]}: ${Math.round(row[b] * 100)}%`, color: COLORS[b] });
    }
    tipAt(e, lines);
  }

  function frame(p: number) {
    if (reduced) p = 1;
    return {
      draw: beat(p, ...BEATS.draw),
      labelIn: beat(p, 0.13, 0.18),
      collapse: beat(p, ...BEATS.collapse),
      phaseT: beat(p, ...BEATS.phase),
      welfareT: beat(p, ...BEATS.welfare),
      panelsOpacity: reduced ? 0 : 1 - beat(p, 0.62, 0.66),
      phaseOpacity: reduced ? 0 : Math.min(beat(p, 0.66, 0.72), 1 - beat(p, 0.87, 0.9)),
      welfareOpacity: reduced ? 1 : beat(p, 0.88, 0.92)
    };
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 800} captions={itworks.captions}>
  {#snippet children({ progress })}
    {@const f = frame(progress)}
    {@const m = mobile ? { top: 72, right: 24, bottom: 56, left: 40 } : { top: 78, right: 64, bottom: 64, left: 64 }}
    {@const plotW = width - m.left - m.right}
    {@const panelW = mobile ? plotW : (plotW - 48) / 2}
    {@const panelH = height - m.top - m.bottom - (mobile ? 140 : 0)}
    {@const rightX = mobile ? m.left : m.left + panelW + 48}
    {@const clipRight = m.left + panelW * f.draw}
    {@const clipRight2 = rightX + panelW * f.draw}
    {@const xPh = scaleLinear().domain([0, 1]).range([m.left + plotW * 0.18, m.left + plotW * 0.82])}
    {@const yPh = scaleLinear().domain([1, 10]).range([height - m.bottom - 22, m.top + 14])}
    <div class="relative mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-12">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{itworks.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{itworks.title}</h2>
      <div class="relative mt-2 min-h-72 grow" bind:clientWidth={width} bind:clientHeight={height}>
        <svg class="absolute inset-0" {width} {height} role="img" aria-label="Learning-model results: strategy shares, phase transition, and welfare comparison">
          <defs>
            <clipPath id="iw-clip-l"><rect x="0" y="0" width={clipRight} height={height} /></clipPath>
            <clipPath id="iw-clip-r"><rect x="0" y="0" width={clipRight2} height={height} /></clipPath>
          </defs>

          <g opacity={f.panelsOpacity}>
            <g opacity={Math.min(1, f.draw * 2)}>
              {#each COLORS as col, b}
                <rect x={m.left + b * sw} y={m.top - 54} width={sw - 0.5} height="7" fill={col} opacity="0.9" />
              {/each}
              <text x={m.left} y={m.top - 33} class="font-sans" font-size="10" fill="#6E6759">defect round 1</text>
              <text x={m.left + 9 * sw + sw / 2} y={m.top - 33} text-anchor="middle" class="font-sans" font-size="10" fill="#6E6759">10</text>
              <text x={m.left + 11 * sw + 8} y={m.top - 44} class="font-sans" font-size="10" fill="#6E6759">cooperate always</text>
              <g transform="translate({m.left - 38} {m.top + panelH / 2}) rotate(-90)"><text text-anchor="middle" class="font-sans" font-size="12" fill="#6E6759">{itworks.chart.yTitle}</text></g>
            </g>

            {#each [0, 0.5, 1] as t}
              <line x1={m.left} x2={m.left + panelW} y1={m.top + panelH * (1 - t)} y2={m.top + panelH * (1 - t)} stroke="#DFD8C8" stroke-width="1" opacity="0.9" />
              <text x={m.left - 8} y={m.top + panelH * (1 - t) + 4} text-anchor="end" class="font-mono" font-size="11" fill="#6E6759">{Math.round(t * 100)}%</text>
            {/each}
            <text x={m.left} y={m.top - 8} class="font-sans" font-size="13" fill="#211E19">{itworks.chart.leftTitle}</text>
            <g clip-path="url(#iw-clip-l)">
              {#each stacked(empirical, m.left, m.left + panelW, m.top, m.top + panelH) as pth, b}
                <path d={pth} fill={COLORS[b]} opacity="0.82" />
              {/each}
            </g>
            <rect x={m.left} y={m.top} width={panelW} height={panelH} fill="none" stroke="#DFD8C8" />
            <text x={m.left} y={m.top + panelH + 18} class="font-mono" font-size="11" fill="#6E6759">day 1</text>
            <text x={m.left + panelW} y={m.top + panelH + 18} text-anchor="end" class="font-mono" font-size="11" fill="#6E6759">day 20</text>
            <text x={m.left + panelW * 0.6} y={m.top + panelH * 0.22} class="font-sans" font-size="12" fill="#211E19" opacity={0.85 * f.labelIn}>cooperate always &#8776; 40%</text>

            {#if !mobile || true}
              {@const ry = mobile ? m.top + panelH + 60 : m.top}
              <text x={rightX} y={ry - 8} class="font-sans" font-size="13" fill="#211E19">{f.collapse > 0.5 ? itworks.chart.rightTitle0 : itworks.chart.rightTitle40}</text>
              <g clip-path="url(#iw-clip-r)">
                <g opacity={1 - f.collapse}>
                  {#each stacked(sim.shares40, rightX, rightX + panelW, ry, ry + panelH) as pth, b}
                    <path d={pth} fill={COLORS[b]} opacity="0.82" />
                  {/each}
                </g>
                <g opacity={f.collapse}>
                  {#each stacked(sim.shares0, rightX, rightX + panelW, ry, ry + panelH) as pth, b}
                    <path d={pth} fill={COLORS[b]} opacity="0.82" />
                  {/each}
                </g>
              </g>
              <rect x={rightX} y={ry} width={panelW} height={panelH} fill="none" stroke="#DFD8C8" />
              <text x={rightX} y={ry + panelH + 18} class="font-mono" font-size="11" fill="#6E6759">game 1</text>
              <text x={rightX + panelW} y={ry + panelH + 18} text-anchor="end" class="font-mono" font-size="11" fill="#6E6759">game 400</text>
              <text x={rightX + panelW * 0.55} y={ry + panelH * 0.22} class="font-sans" font-size="12" fill="#211E19" opacity={0.85 * f.labelIn * (1 - f.collapse)}>fixed 40% resilient</text>
              <text x={rightX + panelW * 0.55} y={ry + panelH * 0.6} class="font-sans" font-size="12" fill="#FBF8F1" opacity={0.9 * f.collapse}>everyone defects from round 1</text>
            {/if}
          </g>

          {#if f.panelsOpacity > 0.5}
            <rect x={m.left} y={m.top} width={panelW} height={panelH} role="presentation" fill="transparent" style="pointer-events: all"
              onmousemove={(e) => sharesTip(e, empirical, m.left, panelW, 'day', 'the experiment')}
              onmouseleave={() => (tip = null)} />
            <rect x={rightX} y={mobile ? m.top + panelH + 60 : m.top} width={panelW} height={panelH} role="presentation" fill="transparent" style="pointer-events: all"
              onmousemove={(e) => sharesTip(e, f.collapse > 0.5 ? sim.shares0 : sim.shares40, rightX, panelW, 'game', f.collapse > 0.5 ? 'model, 0% resilient' : 'model, 40% resilient')}
              onmouseleave={() => (tip = null)} />
          {/if}
          {#if f.phaseOpacity > 0.01}
            <g opacity={f.phaseOpacity}>
              {#each [1, 4, 7, 10] as t}
                <line x1={xPh.range()[0]} x2={xPh.range()[1]} y1={yPh(t)} y2={yPh(t)} stroke="#DFD8C8" stroke-width="1" />
                <text x={xPh.range()[0] - 8} y={yPh(t) + 4} text-anchor="end" class="font-mono" font-size="11" fill="#6E6759">{t}</text>
              {/each}
              {#each [0, 0.25, 0.5, 0.75, 1] as a}
                <text x={xPh(a)} y={yPh.range()[0] + 18} text-anchor="middle" class="font-mono" font-size="11" fill="#6E6759">{Math.round(a * 100)}%</text>
              {/each}
              <rect x={xPh(0.05)} y={yPh(10)} width={xPh(0.15) - xPh(0.05)} height={yPh(1) - yPh(10)} fill="#D64A22" opacity="0.07" />
              <text x={xPh(0.1)} y={yPh(10) - 8} text-anchor="middle" class="font-sans" font-size="11" fill="#A32D2D">{itworks.chart.critical}</text>
              <path d={sim.phase.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${xPh(pt.alpha)} ${yPh(pt.r)}`).join(' ')} fill="none" stroke="#211E19" stroke-width="2" stroke-linejoin="round" opacity={Math.min(1, f.phaseT * 1.5)} />
              {#each sim.phase as pt}
                <circle cx={xPh(pt.alpha)} cy={yPh(pt.r)} r="2.4" fill="#211E19" opacity={Math.min(1, f.phaseT * 1.5)} />
              {/each}
              {#if f.phaseT > 0.6}
                <text x={xPh(0.07)} y={yPh(1) - 14} class="font-sans" font-size="11" fill="#6E6759">no minority: collapse to round 1</text>
                <circle cx={xPh(sim.experiment.alpha)} cy={yPh(sim.experiment.r)} r="6" fill="#C79008" stroke="#FFFFFF" stroke-width="1.5" />
                <text x={xPh(sim.experiment.alpha) + 12} y={yPh(sim.experiment.r) + 4} class="font-sans" font-size="12" fill="#C79008">{itworks.chart.expPoint}</text>
              {/if}
              <text x={(xPh.range()[0] + xPh.range()[1]) / 2} y={yPh.range()[0] + 40} text-anchor="middle" class="font-sans" font-size="12" fill="#6E6759">{itworks.chart.phaseX}</text>
              <text x={xPh.range()[0] - 8} y={yPh(10) - 26} text-anchor="start" class="font-sans" font-size="12" fill="#6E6759">{itworks.chart.phaseY}</text>
            </g>
          {/if}

          {#if f.phaseOpacity > 0.5}
            <rect x={xPh.range()[0]} y={yPh(10)} width={xPh.range()[1] - xPh.range()[0]} height={yPh(1) - yPh(10)} role="presentation" fill="transparent" style="pointer-events: all"
              onmousemove={(e) => {
                const r = (e.currentTarget as SVGGraphicsElement).ownerSVGElement!.getBoundingClientRect();
                const rel = (e.clientX - r.left - xPh.range()[0]) / (xPh.range()[1] - xPh.range()[0]);
                const i = Math.max(0, Math.min(sim.phase.length - 1, Math.round(rel * (sim.phase.length - 1))));
                const pt = sim.phase[i];
                tipAt(e, [{ text: `${Math.round(pt.alpha * 100)}% resilient` }, { text: `unravelling stops at round ${pt.r.toFixed(1)}`, color: '#211E19' }]);
              }}
              onmouseleave={() => (tip = null)} />
          {/if}
          {#if f.welfareOpacity > 0.01}
            {@const vals = [sim.welfare.a0.all, sim.welfare.a40.all, sim.welfare.a40.rational, sim.welfare.a40.resilient ?? 0]}
            {@const bw = Math.min(150, plotW / 6)}
            {@const bx0 = m.left + plotW / 2 - (bw * 4 + 36 * 3) / 2}
            {@const yW = scaleLinear().domain([0, 5]).range([height - m.bottom + 24, m.top + 160])}
            <g opacity={f.welfareOpacity}>
              <text x={m.left + plotW / 2} y={m.top + 120} text-anchor="middle" class="font-sans" font-size="13" fill="#211E19">{itworks.chart.welfareTitle}</text>
              <text x={m.left + plotW / 2} y={m.top + 138} text-anchor="middle" class="font-sans" font-size="11" fill="#6E6759">simulation, per agent - scale starts at zero</text>
              {#each itworks.chart.welfareBars as bar, i}
                {@const bx = bx0 + i * (bw + 36)}
                {@const bh = (yW(0) - yW(vals[i])) * f.welfareT}
                <rect x={bx} y={yW(0) - bh} width={bw} height={bh} role="presentation" rx="4" fill={bar.color} opacity={i === 0 ? 0.55 : 0.85} style="pointer-events: all"
                  onmousemove={(e) => tipAt(e, [{ text: bar.label.replace(' - ', ': ') }, { text: `${vals[i].toFixed(2)} points per round`, color: bar.color }, ...(i > 0 ? [{ text: `vs ${vals[0].toFixed(2)} with no minority` }] : [])])}
                  onmouseleave={() => (tip = null)} />
                <text x={bx + bw / 2} y={yW(0) - bh - 8} text-anchor="middle" class="font-mono" font-size="13" fill={bar.color}>{vals[i].toFixed(2)}</text>
                {#each bar.label.split(' - ') as ln, li}
                  <text x={bx + bw / 2} y={yW(0) + 18 + li * 15} text-anchor="middle" class="font-sans" font-size="11" fill="#6E6759">{ln}</text>
                {/each}
              {/each}
              <line x1={bx0 - 20} x2={bx0 + 4 * bw + 3 * 36 + 20} y1={yW(0)} y2={yW(0)} stroke="#B4B2A9" stroke-width="1" />
            </g>
          {/if}
        </svg>
        {#if tip && (f.panelsOpacity > 0.5 || f.phaseOpacity > 0.3 || f.welfareOpacity > 0.3)}
          <div class="pointer-events-none absolute z-20 rounded border border-hairline bg-card p-2 font-sans text-xs text-ink" style="left: {Math.min(tip.x + 14, width - 220)}px; top: {tip.y + 12}px; min-width: 150px">
            {#each tip.lines as l, li}
              <div class="flex items-center gap-1.5 {li === 0 ? 'font-medium' : ''}">
                {#if l.color}<span class="inline-block h-2 w-2 rounded-full" style="background: {l.color}"></span>{/if}
                <span>{l.text}</span>
              </div>
            {/each}
          </div>
        {/if}
        <div class="pointer-events-none absolute inset-x-6 top-4 z-10 mx-auto grid w-full max-w-xl">
          {#each itworks.captions.filter((c) => tune(c).at >= 0.9) as cap}
            <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
               style="opacity: {windowEnv(progress, ...tw(cap))}">
              <CapId id={cap.id} />
              <RichText text={cap.text} />
            </p>
          {/each}
        </div>
      </div>
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each itworks.captions as cap}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink"><CapId id={cap.id} /><RichText text={cap.text} /></p>
          {/each}
        </div>
      {:else}
        <div class="relative -mt-6 h-36 shrink-0">
          <div class="pointer-events-none absolute inset-x-6 top-2 z-10 mx-auto grid w-full max-w-xl">
            {#each itworks.captions.filter((c) => tune(c).at < 0.9) as cap}
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
