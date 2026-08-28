<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import RichText from '$lib/components/RichText.svelte';
  import CapId from '$lib/components/CapId.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { tune, tw } from '$lib/dev/tuning.svelte';
  import { gridPos, type Area } from '$lib/viz/peopleLayout';
  import { W, H, TG, colX } from '$lib/viz/tangleGeom';
  import MonthCanvas from '$lib/viz/MonthCanvas.svelte';
  import { experiment } from '$lib/content/experiment';
  import type { Tangle } from '$lib/data/tangle';

  const { tangle }: { tangle: Tangle } = $props();

  let vw = $state(1100);
  let vh = $state(620);
  let mw = $state(800);
  let monthReady = $state(false);

  const NEUTRAL = '#8B8474';
  const INK = '#211E19';
  const MUTED = '#6E6759';
  const COOP = '#15735B';
  const DEFECT = '#D64A22';
  // identity color per player (slide convention): stable muted pastel per person,
  // desaturated so the semantic palette (coop green / defect red / gold) stays unique
  const playerTone = (i: number) => `hsl(${Math.round((i * 137.508) % 360)} 42% 68%)`;

  const N = 94;
  const COLS = 16;

  const reduced = prefersReducedMotion();

  // ---------------- stage A: people + calendar
  const iconArea: Area = { x: 250, y: 56, w: 740, h: 200 };
  const order = (() => {
    const idx = Array.from({ length: N }, (_, i) => i);
    let seed = 20150804;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    for (let i = N - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  })();

  const CAL = { x: W / 2 - 154, y: 330, cw: 44, ch: 36 };

  // ---------------- stage B: the tangle (real day-1 session); geometry shared
  // with the month zoom-out canvas via tangleGeom
  interface CellR { x: number; y: number; f: string }
  interface Layout {
    cols: { x: number; cells: CellR[] }[];
    gaps: { d: string; tone: string }[][];
    followD: string;
    big: { ca: (0 | 1 | null)[]; cb: (0 | 1 | null)[] };
    bigIdx: number;
    bigTarget: { x: number; y: number };
  }

  const cellFill = (v: 0 | 1 | null) => (v === null ? INK : v === 1 ? COOP : DEFECT);

  const L: Layout = (() => {
    const cols: Layout['cols'] = [];
    const rowOf: Map<number, number>[] = []; // wave -> player -> y center
    for (let wi = 0; wi < 20; wi++) {
      const wave = tangle.waves[wi];
      const x = colX(wi);
      const yOff = TG.y0 + ((28 - wave.pairs.length) * TG.pitchY) / 2;
      const cells: CellR[] = [];
      const rmap = new Map<number, number>();
      wave.pairs.forEach((pr, pi) => {
        const py = yOff + pi * TG.pitchY;
        rmap.set(pr.a, py + TG.rowH / 2);
        rmap.set(pr.b, py + TG.rowH + TG.rowGap + TG.rowH / 2);
        for (let r = 0; r < 10; r++) {
          cells.push({ x: x + r * (TG.sw / 10), y: py, f: cellFill(pr.ca[r]) });
          cells.push({ x: x + r * (TG.sw / 10), y: py + TG.rowH + TG.rowGap, f: cellFill(pr.cb[r]) });
        }
      });
      cols.push({ x, cells });
      rowOf.push(rmap);
    }
    const gaps: Layout['gaps'] = [];
    for (let g = 0; g < 19; g++) {
      const seg: { d: string; tone: string }[] = [];
      const x1 = colX(g) + TG.sw;
      const x2 = colX(g + 1);
      const mx = (x1 + x2) / 2;
      for (let u = 0; u < tangle.nPlayers; u++) {
        const y1 = rowOf[g].get(u);
        const y2 = rowOf[g + 1].get(u);
        if (y1 === undefined || y2 === undefined) continue;
        seg.push({ d: `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`, tone: playerTone(u) });
      }
      gaps.push(seg);
    }
    // follow path
    const u = tangle.followIdx;
    let d = '';
    for (let wi = 0; wi < 20; wi++) {
      const y = rowOf[wi].get(u)!;
      const xs = colX(wi);
      d += (wi === 0 ? `M ${xs} ${y}` : '') + ` L ${xs + TG.sw} ${y}`;
      if (wi < 19) {
        const y2 = rowOf[wi + 1].get(u)!;
        const mx = (xs + TG.sw + colX(wi + 1)) / 2;
        d += ` C ${mx} ${y}, ${mx} ${y2}, ${colX(wi + 1)} ${y2}`;
      }
    }
    // featured intro game: cooperative opening + real end-game defection
    const prs = tangle.waves[0].pairs;
    const big =
      prs.find(
        (pr) =>
          pr.ca.slice(0, 7).every((v) => v === 1) &&
          pr.cb.slice(0, 7).every((v) => v === 1) &&
          (pr.ca.slice(7).includes(0) || pr.cb.slice(7).includes(0))
      ) ??
      prs.find((pr) => [...pr.ca, ...pr.cb].every((v) => v === 1)) ??
      prs[0];
    const bigIdx = prs.indexOf(big);
    const w1yOff = TG.y0 + ((28 - prs.length) * TG.pitchY) / 2;
    const bigTarget = { x: colX(0), y: w1yOff + bigIdx * TG.pitchY };
    return { cols, gaps, followD: d, big: { ca: big.ca, cb: big.cb }, bigIdx, bigTarget };
  })();

  // big intro strip geometry
  const BIG = { x: W / 2 - 190, y: 200, cw: 38, ch: 32, gap: 5 };

  function frame(p: number) {
    const q = Math.min(p / 0.7, 1); // stages A+B live in p 0-0.7; the zoom-out owns the rest
    const people = beat(q, 0.02, 0.1);
    const cal = beat(q, 0.14, 0.22);
    const dealEnv = windowEnv(q, 0.41, 0.54);
    const stageA = 1 - beat(q, 0.54, 0.58);
    const stageB = beat(q, 0.56, 0.6);
    const singleT = beat(q, 0.58, 0.64);
    const fly = beat(q, 0.665, 0.715);          // featured strip flies to its wave-1 slot
    const singleFade = 1 - beat(q, 0.66, 0.69); // labels/annotations fade as flight starts
    const strip = 1 - beat(q, 0.72, 0.732);     // flown strip hands off to the column's copy
    const col1T = beat(q, 0.72, 0.78);
    const followT = beat(q, 0.935, 0.985);
    const colT = (i: number) => (i === 0 ? col1T : beat(q, 0.78 + (i - 1) * 0.004, 0.78 + (i - 1) * 0.004 + 0.012));
    const gapT = (g: number) => beat(q, 0.78 + g * 0.004, 0.78 + g * 0.004 + 0.011);
    const axT = beat(q, 0.865, 0.895);
    const xf = reduced ? 0 : beat(p, 0.7, 0.73); // SVG session -> canvas month crossfade
    return { people, cal, dealEnv, stageA, stageB, singleT, fly, singleFade, strip, col1T, followT, colT, gapT, axT, xf };
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 1150} captions={experiment.captions}>
  {#snippet children({ progress }: { progress: number })}
    {@const f = frame(reduced ? 1 : progress)}
    {@const stageA = reduced ? 0 : f.stageA}
    {@const stageB = reduced ? 1 : f.stageB}
    <div class="mx-auto flex h-full w-full max-w-7xl flex-col px-6 pb-6 pt-10">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{experiment.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{experiment.title}</h2>

      <div class="relative min-h-[26rem] grow" bind:clientWidth={vw} bind:clientHeight={vh}>
        <svg viewBox="0 0 {W} {H}" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet"
             style="opacity: {(1 - 0.35 * f.dealEnv) * (1 - f.xf)}" role="img"
             aria-label="One real session of the experiment: 20 games of 26-28 pairs, players randomly re-matched between games">

          <!-- ============ stage A: people + calendar ============ -->
          {#if stageA > 0.01}
            <g opacity={stageA}>
              {#each Array.from({ length: N }) as _, i}
                {@const pos = gridPos(i, N, COLS, iconArea)}
                {@const t = beat(f.people, (order[i] / N) * 0.75, (order[i] / N) * 0.75 + 0.25)}
                <g transform="translate({pos.x} {pos.y}) scale({1 + 0.16 * Math.sin(t * Math.PI)})" opacity={t}>
                  <circle cx="0" cy="-6.5" r="5" fill={NEUTRAL} />
                  <rect x="-8" y="-1" width="16" height="10.6" rx="5.3" fill={NEUTRAL} />
                </g>
              {/each}

              <g opacity={f.cal * (1 - f.dealEnv)} transform="translate(0 {(1 - f.cal) * 12})">
                <text x={W / 2} y={CAL.y - 30} text-anchor="middle" class="font-sans" font-size="12" fill={MUTED} letter-spacing="2">{experiment.calendar.month.toUpperCase()}</text>
                {#each experiment.calendar.header as h, ci}
                  <text x={CAL.x + ci * CAL.cw + CAL.cw / 2} y={CAL.y - 6} text-anchor="middle" class="font-sans" font-size="10" fill={MUTED}>{h}</text>
                {/each}
                {#each experiment.calendar.weeks as week, wi}
                  {#each week as day, ci}
                    {#if day !== null}
                      {@const isRun = !(experiment.calendar.nonDays as readonly number[]).includes(day)}
                      {@const t = beat(f.cal, (wi * 7 + ci) / 35, (wi * 7 + ci) / 35 + 0.2)}
                      {#if isRun}
                        <rect x={CAL.x + ci * CAL.cw + 3} y={CAL.y + wi * CAL.ch} width={CAL.cw - 6} height={CAL.ch - 6} rx="5" fill="white" stroke="#DFD8C8" opacity={t} />
                      {/if}
                      <text x={CAL.x + ci * CAL.cw + CAL.cw / 2} y={CAL.y + wi * CAL.ch + 19.5} text-anchor="middle" class="font-serif" font-size="14" fill={isRun ? INK : '#B9B2A4'} opacity={t * (isRun ? 1 : 0.7)}>{day}</text>
                    {/if}
                  {/each}
                {/each}
                <text x={W / 2} y={CAL.y + 5 * CAL.ch + 16} text-anchor="middle" class="font-sans" font-size="12" fill={MUTED}>{experiment.calendar.sub}</text>
              </g>
            </g>
          {/if}

          <!-- ============ stage B: the session tangle ============ -->
          <!-- unmounted once the canvas fully owns the frame: 10.8k rects are not free -->
          {#if stageB > 0.01 && (reduced || progress < 0.745)}
            <g opacity={stageB}>
              <!-- big single-game strip: draws large, then FLIES to its real wave-1 slot -->
              {#if !reduced && f.singleT > 0 && f.strip > 0.01}
                {@const kx = 1 + ((TG.sw / 10) / BIG.cw - 1) * f.fly}
                {@const ky = 1 + (TG.rowH / BIG.ch - 1) * f.fly}
                {@const fx = BIG.x + (L.bigTarget.x - BIG.x) * f.fly}
                {@const fy = BIG.y + (L.bigTarget.y - BIG.y) * f.fly}
                <g opacity={f.strip} transform="translate({fx} {fy}) scale({kx} {ky})">
                  {#each Array.from({ length: 10 }) as _, r}
                    {@const t = beat(f.singleT, r * 0.07, r * 0.07 + 0.3)}
                    <rect x={r * BIG.cw} y="0" width={BIG.cw - 3} height={BIG.ch} rx="3" fill={cellFill(L.big.ca[r])} opacity={t * 0.92} />
                    <rect x={r * BIG.cw} y={BIG.ch + BIG.gap} width={BIG.cw - 3} height={BIG.ch} rx="3" fill={cellFill(L.big.cb[r])} opacity={t * 0.92} />
                  {/each}
                </g>
                <g opacity={f.singleFade * Math.min(1, f.singleT * 3)}>
                  <text x={W / 2} y={BIG.y - 42} text-anchor="middle" class="font-sans" font-size="13" fill={MUTED} letter-spacing="2">{experiment.tangle.single.toUpperCase()}</text>
                  {#each Array.from({ length: 10 }) as _, r}
                    {@const t = beat(f.singleT, r * 0.07, r * 0.07 + 0.3)}
                    <text x={BIG.x + r * BIG.cw + BIG.cw / 2} y={BIG.y - 12} text-anchor="middle" class="font-mono" font-size="11" fill={MUTED} opacity={t}>{r + 1}</text>
                  {/each}
                  <text x={BIG.x - 14} y={BIG.y + BIG.ch / 2 + 4} text-anchor="end" class="font-sans" font-size="11" fill={MUTED}>player A</text>
                  <text x={BIG.x - 14} y={BIG.y + BIG.ch * 1.5 + BIG.gap + 4} text-anchor="end" class="font-sans" font-size="11" fill={MUTED}>player B</text>
                </g>
              {/if}

              <!-- 20 columns -->
              {#each L.cols as col, ci}
                {@const t = reduced ? 1 : f.colT(ci)}
                {#if t > 0.01}
                  <g opacity={ci === 0 ? 1 : t}>
                    {#each col.cells as cell, k}
                      {@const pi = Math.floor(k / 20)}
                      {@const o = ci !== 0 ? 1 : pi === L.bigIdx ? 1 - f.strip : beat(t, (pi / 28) * 0.7, (pi / 28) * 0.7 + 0.3)}
                      {#if o > 0.01}
                        <rect x={cell.x} y={cell.y} width={TG.sw / 10 - 0.7} height={TG.rowH} fill={cell.f} opacity={o} />
                      {/if}
                    {/each}
                  </g>
                {/if}
              {/each}

              <!-- rematching curves -->
              {#each L.gaps as seg, g}
                {@const t = reduced ? 1 : f.gapT(g)}
                {#if t > 0.01}
                  <g opacity={t * 0.55}>
                    {#each seg as c}
                      <path d={c.d} fill="none" stroke={c.tone} stroke-width="1.4" />
                    {/each}
                  </g>
                {/if}
              {/each}

              <!-- follow path -->
              {#if reduced || f.followT > 0.01}
                <path d={L.followD} fill="none" stroke={INK} stroke-width="2.2" opacity="0.85"
                      pathLength="1" stroke-dasharray="1 1" stroke-dashoffset={reduced ? 0 : 1 - f.followT} />
              {/if}

              <!-- axis labels -->
              {#if reduced || f.colT(19) > 0.5}
                {@const axT = reduced ? 1 : f.axT}
                <text x={TG.x0} y={TG.y0 + 28 * TG.pitchY + 24} class="font-mono" font-size="12" fill={MUTED} opacity={axT}>{experiment.tangle.gameOne}</text>
                <text x={Math.min(TG.x1 + TG.sw, W - 4)} y={TG.y0 + 28 * TG.pitchY + 24} text-anchor="end" class="font-mono" font-size="12" fill={MUTED} opacity={axT}>{experiment.tangle.gameTwenty}</text>
                <text x={W / 2} y={TG.y0 + 28 * TG.pitchY + 46} text-anchor="middle" class="font-sans" font-size="12" fill={MUTED} opacity={axT}>{experiment.tangle.axis}</text>
              {/if}
            </g>
          {/if}
        </svg>

        <!-- month zoom-out: the canvas takes over from the session SVG at the crossfade -->
        {#if !reduced}
          <div class="pointer-events-none absolute inset-0" style="opacity: {monthReady ? f.xf : 0}">
            <MonthCanvas {progress} width={vw} height={vh} bind:ready={monthReady} />
          </div>
        {/if}

        <!-- incentive card -->
        {#if !reduced && f.dealEnv > 0.01}
          <div class="pointer-events-none absolute inset-x-0 top-[54%] mx-auto max-w-xl px-6 text-center"
               style="opacity: {f.dealEnv}; transform: translateY(calc(-50% + {(1 - f.dealEnv) * 12}px))">
            <CapId id={experiment.rules.devId} />
            <p class="font-sans text-xs uppercase tracking-[0.22em] text-muted">{experiment.rules.title}</p>
            <div class="mx-auto mt-3 h-px w-8 bg-hairline"></div>
            <ul class="mt-4 space-y-2.5">
              {#each experiment.rules.items as item}
                <li class="font-serif text-base leading-relaxed text-ink">{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      {#if reduced}
        <div class="relative mx-auto my-4 w-full max-w-3xl" style="aspect-ratio: 1240 / 660" bind:clientWidth={mw}>
          <MonthCanvas progress={1} width={mw} height={(mw * 660) / 1240} />
        </div>
      {/if}

      <!-- caption band -->
      <div class="{reduced ? 'relative' : 'relative h-28 shrink-0'}">
        {#if reduced}
          <div class="relative mx-auto mb-3 max-w-lg rounded border border-hairline bg-card p-6">
            <CapId id={experiment.rules.devId} />
            <p class="text-center font-sans text-xs uppercase tracking-widest text-muted">{experiment.rules.title}</p>
            <ul class="mt-3 space-y-2">
              {#each experiment.rules.items as item}
                <li class="flex gap-3 font-serif text-[15px] leading-relaxed text-ink">
                  <span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hairline"></span>
                  <span>{item}</span>
                </li>
              {/each}
            </ul>
          </div>
        {/if}
        {#each experiment.captions as c}
          {@const env = reduced ? 1 : windowEnv(progress, ...tw(c), 0.025)}
          {#if reduced || env > 0.01}
            <div class="{reduced ? 'relative mb-3' : tune(c).at >= 0.75 ? 'absolute inset-x-0 top-4' : 'absolute inset-x-0 -top-14'} mx-auto max-w-2xl rounded border border-hairline bg-card/95 px-6 py-4 text-center"
                 style={reduced ? '' : `opacity: ${env}; transform: translateY(${(1 - env) * 10}px)`}>
              
              <CapId id={c.id} />
              
              <p class="font-serif text-[15px] leading-relaxed text-ink"><RichText text={c.text} /></p>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/snippet}
</ScrollScene>
