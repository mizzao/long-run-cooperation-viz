<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { gridPos, type Area } from '$lib/viz/peopleLayout';
  import { experiment } from '$lib/content/experiment';
  import type { Tangle } from '$lib/data/tangle';

  const { tangle }: { tangle: Tangle } = $props();

  const NEUTRAL = '#8B8474';
  const INK = '#211E19';
  const MUTED = '#6E6759';
  const COOP = '#15735B';
  const DEFECT = '#D64A22';
  // identity color per player (slide convention): stable muted pastel per person,
  // desaturated so the semantic palette (coop green / defect red / gold) stays unique
  const playerTone = (i: number) => `hsl(${Math.round((i * 137.508) % 360)} 42% 68%)`;

  const W = 1240;
  const H = 660;
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

  const CAL = { x: W / 2 - 110, y: 330, cw: 44, ch: 36 };

  // ---------------- stage B: the tangle (real day-1 session)
  const TG = { x0: 14, x1: 1226, y0: 66, sw: 30, pitchY: 17.2, rowH: 7, rowGap: 1.6 };
  const colX = (i: number) => TG.x0 + (i * (TG.x1 - TG.x0 - TG.sw)) / 19;

  interface CellR { x: number; y: number; f: string }
  interface Layout {
    cols: { x: number; cells: CellR[] }[];
    gaps: { d: string; tone: string }[][];
    followD: string;
    big: { ca: (0 | 1 | null)[]; cb: (0 | 1 | null)[] };
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
    return { cols, gaps, followD: d, big: { ca: big.ca, cb: big.cb } };
  })();

  // big intro strip geometry
  const BIG = { x: W / 2 - 190, y: 200, cw: 38, ch: 32, gap: 5 };

  function frame(p: number) {
    const people = beat(p, 0.02, 0.1);
    const cal = beat(p, 0.14, 0.22);
    const dealEnv = windowEnv(p, 0.4, 0.52);
    const stageA = 1 - beat(p, 0.54, 0.58);
    const stageB = beat(p, 0.56, 0.6);
    const singleEnv = windowEnv(p, 0.58, 0.68);
    const singleT = beat(p, 0.58, 0.64);
    const col1T = beat(p, 0.68, 0.74);
    const followT = beat(p, 0.91, 0.96);
    const colT = (i: number) => (i === 0 ? col1T : beat(p, 0.76 + (i - 1) * 0.0064, 0.76 + (i - 1) * 0.0064 + 0.015));
    const gapT = (g: number) => beat(p, 0.758 + g * 0.0064, 0.758 + g * 0.0064 + 0.012);
    return { people, cal, dealEnv, stageA, stageB, singleEnv, singleT, col1T, followT, colT, gapT };
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 780}>
  {#snippet children({ progress }: { progress: number })}
    {@const f = frame(reduced ? 1 : progress)}
    {@const stageA = reduced ? 0 : f.stageA}
    {@const stageB = reduced ? 1 : f.stageB}
    <div class="mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-10">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{experiment.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{experiment.title}</h2>

      <div class="relative min-h-[26rem] grow">
        <svg viewBox="0 0 {W} {H}" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet"
             style="opacity: {1 - 0.55 * f.dealEnv}" role="img"
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

              <g opacity={f.cal} transform="translate(0 {(1 - f.cal) * 12})">
                <text x={W / 2} y={CAL.y - 30} text-anchor="middle" class="font-sans" font-size="12" fill={MUTED} letter-spacing="2">{experiment.calendar.month.toUpperCase()}</text>
                {#each experiment.calendar.header as h, ci}
                  <text x={CAL.x + ci * CAL.cw + CAL.cw / 2} y={CAL.y - 6} text-anchor="middle" class="font-sans" font-size="10" fill={MUTED}>{h}</text>
                {/each}
                {#each experiment.calendar.weeks as week, wi}
                  {#each week as day, ci}
                    {#if day !== null}
                      {@const isRun = !(experiment.calendar.nonDays as readonly number[]).includes(day)}
                      {@const t = beat(f.cal, (wi * 5 + ci) / 30, (wi * 5 + ci) / 30 + 0.2)}
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
          {#if stageB > 0.01}
            <g opacity={stageB}>
              <!-- big single-game strip -->
              {#if !reduced && f.singleEnv > 0.01}
                <g opacity={f.singleEnv}>
                  <text x={W / 2} y={BIG.y - 42} text-anchor="middle" class="font-sans" font-size="13" fill={MUTED} letter-spacing="2">{experiment.tangle.single.toUpperCase()}</text>
                  {#each Array.from({ length: 10 }) as _, r}
                    {@const t = beat(f.singleT, r * 0.07, r * 0.07 + 0.3)}
                    <text x={BIG.x + r * BIG.cw + BIG.cw / 2} y={BIG.y - 12} text-anchor="middle" class="font-mono" font-size="11" fill={MUTED} opacity={t}>{r + 1}</text>
                    <rect x={BIG.x + r * BIG.cw} y={BIG.y} width={BIG.cw - 3} height={BIG.ch} rx="3" fill={cellFill(L.big.ca[r])} opacity={t * 0.92} />
                    <rect x={BIG.x + r * BIG.cw} y={BIG.y + BIG.ch + BIG.gap} width={BIG.cw - 3} height={BIG.ch} rx="3" fill={cellFill(L.big.cb[r])} opacity={t * 0.92} />
                  {/each}
                  <text x={BIG.x - 14} y={BIG.y + BIG.ch / 2 + 4} text-anchor="end" class="font-sans" font-size="11" fill={MUTED}>player A</text>
                  <text x={BIG.x - 14} y={BIG.y + BIG.ch * 1.5 + BIG.gap + 4} text-anchor="end" class="font-sans" font-size="11" fill={MUTED}>player B</text>
                </g>
              {/if}

              <!-- 20 columns -->
              {#each L.cols as col, ci}
                {@const t = reduced ? 1 : f.colT(ci)}
                {#if t > 0.01}
                  <g opacity={t}>
                    {#each col.cells as cell}
                      <rect x={cell.x} y={cell.y} width={TG.sw / 10 - 0.7} height={TG.rowH} fill={cell.f} />
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
                {@const axT = reduced ? 1 : beat(progress, 0.9, 0.93)}
                <text x={TG.x0} y={TG.y0 + 28 * TG.pitchY + 24} class="font-mono" font-size="12" fill={MUTED} opacity={axT}>{experiment.tangle.gameOne}</text>
                <text x={Math.min(TG.x1 + TG.sw, W - 4)} y={TG.y0 + 28 * TG.pitchY + 24} text-anchor="end" class="font-mono" font-size="12" fill={MUTED} opacity={axT}>{experiment.tangle.gameTwenty}</text>
                <text x={W / 2} y={TG.y0 + 28 * TG.pitchY + 46} text-anchor="middle" class="font-sans" font-size="12" fill={MUTED} opacity={axT}>{experiment.tangle.axis}</text>
              {/if}
            </g>
          {/if}
        </svg>

        <!-- incentive card -->
        {#if !reduced && f.dealEnv > 0.01}
          <div class="absolute inset-x-0 top-1/2 mx-auto max-w-lg rounded border border-hairline bg-card p-6 shadow-sm"
               style="opacity: {f.dealEnv}; transform: translateY(calc(-50% + {(1 - f.dealEnv) * 14}px))">
            <span class="absolute right-3 top-2 font-mono text-[11px] text-muted opacity-60">{experiment.rules.devId}</span>
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
      </div>

      <!-- caption band -->
      <div class="{reduced ? 'relative' : 'relative h-36 shrink-0'}">
        {#if reduced}
          <div class="relative mx-auto mb-3 max-w-lg rounded border border-hairline bg-card p-6">
            <span class="absolute right-3 top-2 font-mono text-[11px] text-muted opacity-60">{experiment.rules.devId}</span>
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
          {@const env = reduced ? 1 : windowEnv(progress, c.at, c.until)}
          {#if reduced || env > 0.01}
            <div class="{reduced ? 'relative mb-3' : 'absolute inset-x-0 top-0'} mx-auto max-w-2xl rounded border border-hairline bg-card/95 px-6 py-4 text-center"
                 style={reduced ? '' : `opacity: ${env}; transform: translateY(${(1 - env) * 10}px)`}>
              <span class="absolute right-2 top-1 font-mono text-[10px] text-muted opacity-60">{c.id}</span>
              <p class="font-serif text-[15px] leading-relaxed text-ink">{c.text}</p>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/snippet}
</ScrollScene>
