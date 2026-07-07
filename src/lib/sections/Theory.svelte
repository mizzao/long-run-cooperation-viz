<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import RichText from '$lib/components/RichText.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { theory } from '$lib/content/theory';

  const COOP = '#15735B';
  const DEFECT = '#D64A22';
  const INK = '#211E19';
  const MUTED = '#6E6759';

  const W = 1240;
  const H = 640;
  const SX = 64;
  const SY = 42;
  const R = 11;
  const MX = (W - 9 * SX) / 2;
  const MY = 158;

  const reduced = prefersReducedMotion();

  const colX = (j: number) => MX + (j - 1) * SX;
  const rowY = (i: number) => MY + (i - 1) * SY;

  // red iff col > 10 - row
  const isRed = (i: number, j: number) => j > 10 - i;

  // staircase frontier polyline
  const edgePts = (() => {
    const pts: string[] = [];
    for (let i = 1; i <= 10; i++) {
      const x = MX + (9.5 - i) * SX;
      pts.push(`${x},${rowY(i) - SY / 2}`);
      pts.push(`${x},${rowY(i) + SY / 2}`);
    }
    return pts.join(' ');
  })();

  function frame(p: number) {
    const appear = beat(p, 0.02, 0.08);
    const doom = beat(p, 0.1, 0.14);
    const edgeT = beat(p, 0.6, 0.66);
    const quoteEnv = windowEnv(p, 0.82, 0.95);
    // per-cell flip progress
    const flip = (i: number, j: number): number => {
      if (!isRed(i, j)) return 0;
      if (i === 1) return doom;
      const rs = 0.32 + (i - 2) * 0.03 + (10 - j) * 0.004;
      return beat(p, rs, rs + 0.024);
    };
    return { appear, doom, edgeT, quoteEnv, flip };
  }
</script>

<ScrollScene heightVh={reduced ? 100 : 680} caps={theory.captions.map((c) => (c.at + c.until) / 2)}>
  {#snippet children({ progress }: { progress: number })}
    {@const f = frame(reduced ? 1 : progress)}
    <div class="mx-auto flex h-full w-full max-w-7xl flex-col px-6 pt-10">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{theory.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{theory.title}</h2>

      <div class="relative min-h-[26rem] grow">
        <svg viewBox="0 0 {W} {H}" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet"
             style="opacity: {1 - 0.55 * f.quoteEnv}" role="img" aria-label="Backward-induction staircase: each step of reasoning turns one more round to defection">
          <!-- column headers -->
          <text x={colX(5.5) - SX / 2} y={MY - 64} text-anchor="middle" class="font-sans" font-size="12" fill={MUTED} opacity={f.appear}>{theory.grid.xTitle}</text>
          {#each Array.from({ length: 10 }) as _, jj}
            <text x={colX(jj + 1)} y={MY - 40} text-anchor="middle" class="font-mono" font-size="13" fill={MUTED} opacity={f.appear}>{jj + 1}</text>
          {/each}
          <!-- rotated y title + arrow -->
          <text x={MX - 74} y={MY + 4.5 * SY} text-anchor="middle" class="font-sans" font-size="12" fill={MUTED} opacity={f.appear}
                transform="rotate(-90 {MX - 74} {MY + 4.5 * SY})">{theory.grid.yTitle}</text>
          <line x1={MX - 56} y1={rowY(1)} x2={MX - 56} y2={rowY(10)} stroke={MUTED} stroke-width="1" opacity={f.appear * 0.7} />
          <path d="M {MX - 60} {rowY(10) - 7} L {MX - 56} {rowY(10)} L {MX - 52} {rowY(10) - 7}" fill="none" stroke={MUTED} stroke-width="1" opacity={f.appear * 0.7} />

          <!-- dots -->
          {#each Array.from({ length: 10 }) as _, ii}
            {@const i = ii + 1}
            {#each Array.from({ length: 10 }) as _, jj}
              {@const j = jj + 1}
              {@const t = f.flip(i, j)}
              {@const pop = 1 + 0.16 * Math.sin(t * Math.PI)}
              {@const rowIn = beat(f.appear, ii / 12, ii / 12 + 0.2)}
              <circle cx={colX(j)} cy={rowY(i)} r={R * pop} opacity={rowIn}
                      fill={t > 0.5 ? DEFECT : COOP} />
            {/each}
          {/each}

          <!-- staircase frontier -->
          <polyline points={edgePts} fill="none" stroke={INK} stroke-width="1.5"
                    pathLength="1" stroke-dasharray="1 1" stroke-dashoffset={1 - f.edgeT} opacity={f.edgeT > 0 ? 0.75 : 0} />
        </svg>

        <!-- quote card -->
        {#if !reduced && f.quoteEnv > 0.01}
          <div class="absolute inset-x-0 top-1/2 mx-auto max-w-xl rounded border border-hairline bg-card p-7 text-center shadow-sm"
               style="opacity: {f.quoteEnv}; transform: translateY(calc(-50% + {(1 - f.quoteEnv) * 14}px))">
            <span class="absolute right-3 top-2 font-mono text-[11px] text-muted opacity-60">P2Q</span>
            <p class="font-sans text-sm text-muted">{theory.quote.lead}</p>
            <p class="mt-3 font-serif text-xl italic leading-relaxed text-ink">&ldquo;{theory.quote.text}&rdquo;</p>
            <p class="mt-1 font-serif text-base text-muted">{theory.quote.tail}</p>
            <p class="mt-4 font-sans text-xs uppercase tracking-widest text-muted">{theory.quote.source}</p>
          </div>
        {/if}
      </div>

      <!-- caption band -->
      <div class="{reduced ? 'relative' : 'relative h-36 shrink-0'}">
        {#if reduced}
          <div class="relative mx-auto mb-3 max-w-2xl rounded border border-hairline bg-card p-6 text-center">
            <p class="font-sans text-sm text-muted">{theory.quote.lead}</p>
            <p class="mt-2 font-serif text-lg italic leading-relaxed text-ink">&ldquo;{theory.quote.text}&rdquo;</p>
            <p class="mt-1 font-serif text-base text-muted">{theory.quote.tail}</p>
            <p class="mt-3 font-sans text-xs uppercase tracking-widest text-muted">{theory.quote.source}</p>
          </div>
        {/if}
        {#each theory.captions as c}
          {@const env = reduced ? 1 : windowEnv(progress, c.at, c.until)}
          {#if reduced || env > 0.01}
            <div class="{reduced ? 'relative mb-3' : 'absolute inset-x-0 top-0'} mx-auto max-w-2xl rounded border border-hairline bg-card/95 px-6 py-4 text-center"
                 style={reduced ? '' : `opacity: ${env}; transform: translateY(${(1 - env) * 10}px)`}>
              <span class="absolute right-2 top-1 font-mono text-[10px] text-muted opacity-60">{c.id}</span>
              <p class="font-serif text-[15px] leading-relaxed text-ink"><RichText text={c.text} /></p>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {/snippet}
</ScrollScene>
