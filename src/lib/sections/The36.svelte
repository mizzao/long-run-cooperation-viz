<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { gridPos, columnPos, lerpPos, type Area } from '$lib/viz/peopleLayout';
  import { GROUP_ORDER, groupCounts, type PlayerStrategy } from '$lib/data/strategies';
  import { the36 } from '$lib/content/the36';

  let { players }: { players: PlayerStrategy[] } = $props();

  const BEATS = { appear: [0, 0.1], early: [0.16, 0.28], drift: [0.46, 0.58], ignite: [0.72, 0.84], stat: [0.88, 1] } as const;
  const GOLD = '#C79008';
  const NEUTRAL = '#8B8474';

  let width = $state(1100);
  let height = $state(620);
  const mobile = $derived(width < 640);
  const margin = $derived(mobile ? { top: 36, right: 20, bottom: 96, left: 20 } : { top: 44, right: 56, bottom: 140, left: 56 });
  const area = $derived<Area>({
    x: margin.left,
    y: margin.top + 40,
    w: width - margin.left - margin.right,
    h: height - margin.top - margin.bottom - 40
  });
  const gridArea = $derived<Area>({
    x: area.x + area.w * 0.12,
    y: area.y + 24,
    w: area.w * 0.76,
    h: area.h * 0.88 - 24
  });
  const perRow = $derived(mobile ? 3 : 4);
  const spacing = $derived(Math.min((width - margin.left - margin.right) / 5 / (perRow + 1), 30));
  const counts = $derived(groupCounts(players));
  const reduced = prefersReducedMotion();

  function litCount(c: number) {
    if (c <= 0) return 0;
    let n = 0;
    for (let r = 0; r < counts.CC; r++) {
      const t = beat(c, 0.1 + 0.75 * (r / Math.max(1, counts.CC - 1)), 0.25 + 0.75 * (r / Math.max(1, counts.CC - 1)));
      if (t > 0.5) n++;
    }
    return n;
  }

  const ranks = $derived.by(() => {
    const seen: Record<string, number> = { CC: 0, T10: 0, T9: 0, T8: 0, earlier: 0 };
    return players.map((p) => seen[p.group]++);
  });
  const earlyRanks = $derived.by(() => {
    const seen: Record<string, number> = { CC: 0, T10: 0, T9: 0, T8: 0, earlier: 0 };
    return players.map((p) => seen[p.earlyGroup]++);
  });
  const earlyCounts = $derived.by(() => {
    const c: Record<string, number> = { CC: 0, T10: 0, T9: 0, T8: 0, earlier: 0 };
    for (const p of players) c[p.earlyGroup] += 1;
    return c;
  });

  // deterministic shuffle: the crowd must look random, not pre-sorted
  const gridSlot = $derived.by(() => {
    const idx = Array.from({ length: players.length }, (_, i) => i);
    let s = 42;
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
      a: beat(p, ...BEATS.appear),
      e: beat(p, ...BEATS.early),
      m: beat(p, ...BEATS.drift),
      c: beat(p, ...BEATS.ignite),
      d: beat(p, ...BEATS.stat)
    };
  }

  function iconPos(i: number, e: number, m: number) {
    const g = gridPos(gridSlot[i], players.length, mobile ? 10 : 14, gridArea);
    const egi = GROUP_ORDER.indexOf(players[i].earlyGroup);
    const early = columnPos(egi, earlyRanks[i], perRow, spacing, area);
    const sgi = GROUP_ORDER.indexOf(players[i].group);
    const stable = columnPos(sgi, ranks[i], perRow, spacing, area);
    return lerpPos(lerpPos(g, early, e), stable, m);
  }

  function colCenterX(gi: number) {
    return area.x + (gi + 0.5) * area.w / 5;
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 620}>
  {#snippet children({ progress })}
    {@const f = frame(progress)}
    {@const baseY = area.y + area.h}
    {@const colW = area.w / 5}
    {@const boxTopH = 10.5 * spacing + 78}
    {@const thrEnv = reduced ? 0 : windowEnv(progress, 0.6, 0.7)}
    {@const thrGrow = reduced ? 1 : beat(progress, 0.6, 0.66)}
    {@const ccEnv = reduced ? 0 : windowEnv(progress, 0.72, 0.86)}
    {@const ccGrow = reduced ? 1 : beat(progress, 0.72, 0.78)}
    <div class="relative mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-12">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{the36.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{the36.title}</h2>
      <div class="relative mt-6 min-h-72 grow" bind:clientWidth={width} bind:clientHeight={height}>
        <svg class="absolute inset-0" {width} {height} role="img" aria-label="94 player icons sorting into strategy columns; 36 resilient cooperators highlighted in gold">
          {#if thrEnv > 0.01}
            <rect x={area.x + colW * 1.04} y={baseY + 64 - boxTopH * thrGrow} width={colW * 3.92} height={boxTopH * thrGrow} rx="8" fill="#211E19" opacity={0.05 * thrEnv} />
          {/if}
          {#if ccEnv > 0.01}
            <rect x={area.x + colW * 0.04} y={baseY + 64 - boxTopH * ccGrow} width={colW * 0.92} height={boxTopH * ccGrow} rx="8" fill="#C79008" opacity={0.08 * ccEnv} />
          {/if}
          {#each players as pl, i}
            {@const pos = iconPos(i, f.e, f.m)}
            {@const appear = beat(f.a, (i / players.length) * 0.7, (i / players.length) * 0.7 + 0.3)}
            {@const litT = pl.group === 'CC' ? beat(f.c, 0.1 + 0.75 * (ranks[i] / Math.max(1, counts.CC - 1)), 0.25 + 0.75 * (ranks[i] / Math.max(1, counts.CC - 1))) : 0}
            {@const fill = litT > 0.5 ? GOLD : NEUTRAL}
            {@const dim = pl.group === 'CC' ? 1 : 1 - 0.4 * f.c}
            {@const pop = 1 + 0.16 * Math.sin(Math.min(1, litT) * Math.PI)}
            <g transform="translate({pos.x} {pos.y}) scale({pop})" opacity={appear * dim}>
              <circle cx="0" cy={-0.2 * spacing} r={0.16 * spacing} {fill} />
              <rect x={-0.26 * spacing} y={-0.04 * spacing} width={0.52 * spacing} height={0.36 * spacing} rx={0.18 * spacing} {fill} />
            </g>
          {/each}
          {#if f.e > 0.95}
            <g opacity={beat(f.e, 0.95, 1)}>
              {#each GROUP_ORDER as gname, gi}
                {@const gx = colCenterX(gi)}
                <line x1={gx - area.w / 12} x2={gx + area.w / 12} y1={baseY + 0.55 * spacing} y2={baseY + 0.55 * spacing} stroke="#DFD8C8" stroke-width="1" />
                <text x={gx} y={baseY + 0.55 * spacing + 18} text-anchor="middle" class="font-sans" font-size="12" fill={gname === 'CC' && f.c > 0.9 ? GOLD : '#6E6759'}>{mobile ? the36.chart.groupLabelsShort[gname] : the36.chart.groupLabels[gname]}</text>
                <text x={gx} y={baseY + 0.55 * spacing + 36} text-anchor="middle" class="font-mono" font-size="13" fill={gname === 'CC' && f.c > 0.9 ? GOLD : '#211E19'}>{f.m < 0.5 ? earlyCounts[gname] : gname === 'CC' && f.c > 0 && f.c < 1 ? litCount(f.c) : counts[gname]}</text>
              {/each}
            </g>
          {/if}
          {#if !mobile}
            <g opacity={f.d}>
              <text x={colCenterX(0)} y={area.y - 34} text-anchor="middle" class="font-serif" font-size="34" fill={GOLD}>{the36.chart.stat}</text>
              <text x={colCenterX(0)} y={area.y - 12} text-anchor="middle" class="font-sans" font-size="12" fill="#6E6759">{the36.chart.statSub}</text>
            </g>
          {/if}
        </svg>
      </div>
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each the36.captions as cap, ci}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink"><span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P6C{the36.captions.indexOf(cap) + 1}</span>{cap.text}</p>
          {/each}
        </div>
      {:else}
        <div class="pointer-events-none absolute inset-x-6 top-24 z-10 mx-auto grid w-full max-w-xl">
          {#each the36.captions as cap, ci}
            <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
               style="opacity: {windowEnv(progress, cap.at, cap.until)}">
              <span class="absolute right-2 top-1 font-mono text-[11px] text-muted opacity-60">P6C{the36.captions.indexOf(cap) + 1}</span>
              {cap.text}
            </p>
          {/each}
        </div>
      {/if}
    </div>
  {/snippet}
</ScrollScene>
