<script lang="ts">
  import { prefersReducedMotion } from '$lib/scroll/progress';
  import type { Heartbeat } from '$lib/data/cooperation';
  import { hero } from '$lib/content/hero';

  const { heartbeat }: { heartbeat: Heartbeat } = $props();

  const reduced = prefersReducedMotion();

  const W = 1240;
  const H = 700;
  const COLSN = 5;
  const MW = 216;
  const MH = 130;
  const GX = (W - COLSN * MW) / (COLSN + 1);
  const GY = (H - 4 * MH - 40) / 5;

  const COOP = [21, 115, 91];
  const DEFECT = [214, 74, 34];
  const cellFill = (rate: number | null): string => {
    if (rate === null) return '#DFD8C8';
    const t = 1 - rate;
    const c = COOP.map((v, i) => Math.round(v + (DEFECT[i] - v) * t));
    return `rgb(${c[0]} ${c[1]} ${c[2]})`;
  };

  interface Mini {
    x: number;
    y: number;
    day: number;
    cells: { x: number; y: number; f: string }[];
  }

  const minis: Mini[] = (() => {
    const out: Mini[] = [];
    for (let d = 1; d <= 20; d++) {
      const row = Math.floor((d - 1) / COLSN);
      const col = (d - 1) % COLSN;
      const x = GX + col * (MW + GX);
      const y = GY + row * (MH + GY) + 20;
      const rates = heartbeat[String(d) as keyof Heartbeat] as (number | null)[];
      const cells: Mini['cells'] = [];
      const cw = MW / 20;
      const ch = MH / 10;
      for (let g = 0; g < 20; g++) {
        for (let r = 0; r < 10; r++) {
          cells.push({ x: x + g * cw, y: y + r * ch, f: cellFill(rates[g * 10 + r] ?? null) });
        }
      }
      out.push({ x, y, day: d, cells });
    }
    return out;
  })();
</script>

<header class="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
  <svg viewBox="0 0 {W} {H}" class="absolute inset-0 h-full w-full opacity-[0.17]" preserveAspectRatio="xMidYMid slice"
       role="img" aria-label={hero.aria}>
    {#each minis as m}
      <g style={reduced ? '' : `animation: hero-day-in 1.15s ease ${(m.day - 1) * 0.12}s both`}>
        {#each m.cells as cell}
          <rect x={cell.x} y={cell.y} width={MW / 20 - 1.6} height={MH / 10 - 1.6} rx="1" fill={cell.f} />
        {/each}
      </g>
    {/each}
  </svg>
  <div class="pointer-events-none absolute inset-0"
       style="background: radial-gradient(ellipse 62% 52% at 50% 46%, #FBF8F1F2 0%, #FBF8F1B0 55%, #FBF8F100 100%)"></div>
  <div class="pointer-events-none absolute inset-0"
       style="background: linear-gradient(to bottom, #FBF8F100 0%, #FBF8F100 72%, #FBF8F1 100%)"></div>

  <div class="relative" style={reduced ? '' : 'animation: hero-day-in 1.1s ease 0.25s both'}>
    <p class="font-sans text-xs uppercase tracking-[0.25em] text-muted">{hero.kicker}</p>
    <h1 class="mt-4 font-serif text-5xl sm:text-7xl text-ink">{hero.title}</h1>
    <p class="mx-auto mt-6 max-w-2xl font-serif text-xl leading-relaxed text-muted">{hero.subtitle}</p>
    <p class="mt-8 font-sans text-xs text-muted">{hero.citation}</p>
    <p class="mt-1 font-sans text-xs text-muted">{hero.citationSource}</p>
  </div>

  <div class="absolute bottom-16 flex flex-col items-center gap-1.5 text-muted motion-reduce:animate-none animate-bounce" style={reduced ? '' : 'animation: hero-day-in 1s ease 2.2s both, bounce 1s infinite 2.2s'}>
    <span class="font-sans text-xs uppercase tracking-widest">{hero.scroll}</span>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5 v13 M6 12 l6 6 6 -6" /></svg>
  </div>
</header>

<style>
  @keyframes -global-hero-day-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
