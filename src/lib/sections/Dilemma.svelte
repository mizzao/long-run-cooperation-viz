<script lang="ts">
  import ScrollScene from '$lib/scroll/ScrollScene.svelte';
  import RichText from '$lib/components/RichText.svelte';
  import CapId from '$lib/components/CapId.svelte';
  import { beat, windowEnv, prefersReducedMotion } from '$lib/scroll/progress';
  import { dilemma } from '$lib/content/dilemma';

  const READER = '#2D5192';
  const NEUTRAL = '#8B8474';
  const COOP = '#15735B';
  const DEFECT = '#D64A22';
  const INK = '#211E19';
  const MUTED = '#6E6759';

  const W = 1240;
  const H = 660;
  const THEM_X = 430;
  const YOU_X = 810;
  const STAGE_Y = 320;
  const CARD_Y = 196;

  // the three outcomes acted on stage before the matrix summarizes them
  const OUTCOMES = [
    { start: 0.1, until: 0.23, you: COOP, them: COOP, py: 5, pt: 5 },
    { start: 0.24, until: 0.37, you: DEFECT, them: COOP, py: 7, pt: 1 },
    { start: 0.38, until: 0.51, you: DEFECT, them: DEFECT, py: 3, pt: 3 }
  ] as const;

  // matrix cells: [you cooperate/defect] x [they cooperate/defect]; payoffs you/them
  const CELLS = [
    { row: 0, col: 0, you: COOP, them: COOP, py: 5, pt: 5, acted: true },
    { row: 1, col: 0, you: DEFECT, them: COOP, py: 7, pt: 1, acted: true },
    { row: 1, col: 1, you: DEFECT, them: DEFECT, py: 3, pt: 3, acted: true },
    { row: 0, col: 1, you: COOP, them: DEFECT, py: 1, pt: 7, acted: false }
  ] as const;
  const CELL_W = 200;
  const CELL_H = 96;
  const cellX = (col: number) => 620 + (col === 0 ? -114 : 114);
  const cellY = (row: number) => 292 + (row === 0 ? -62 : 62);

  const reduced = prefersReducedMotion();

  function frame(p: number) {
    if (reduced) {
      return { stage: 0, note: 0, gather: 1, matrix: 1, hd: 1, dom: 1, war: 0, warT: 0, hand: 0, pulse: 0 };
    }
    const gatherIn = beat(p, 0.515, 0.545);
    return {
      stage: Math.min(beat(p, 0.02, 0.06), 1 - beat(p, 0.5, 0.53)),
      note: Math.min(beat(p, 0.04, 0.075), 1 - beat(p, 0.09, 0.11)),
      gather: beat(p, 0.515, 0.56),
      matrix: gatherIn * (1 - beat(p, 0.7, 0.73)),
      hd: beat(p, 0.56, 0.585),
      dom: beat(p, 0.6, 0.63),
      war: windowEnv(p, 0.72, 0.9),
      warT: beat(p, 0.735, 0.875),
      hand: beat(p, 0.91, 0.95),
      pulse: beat(p, 0.95, 0.99)
    };
  }

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const ease = (t: number) => t * t * (3 - 2 * t);

  // price war: phases 0-3, (their price, your price, their profit, your profit)
  const WAR = [
    ['$9', '$9', 5, 5],
    ['$7', '$9', 6, 3],
    ['$7', '$7', 4, 4],
    ['$5', '$5', 3, 3]
  ] as const;
  const warPhase = (t: number) => (t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3);
</script>

{#snippet person(fill: string)}
  <circle cx="0" cy="-40" r="20" fill={fill} />
  <rect x="-32" y="-12" width="64" height="46" rx="23" fill={fill} />
{/snippet}

{#snippet cardBack()}
  <rect x="-17" y="-23" width="34" height="46" rx="5" fill="#FFFFFF" stroke="#DFD8C8" stroke-width="1.5" />
  <text y="7" text-anchor="middle" class="font-serif" font-size="20" fill={MUTED}>?</text>
{/snippet}

{#snippet cardFace(color: string)}
  <rect x="-17" y="-23" width="34" height="46" rx="5" fill={color} />
{/snippet}

<ScrollScene heightVh={reduced ? 100 : 820} caps={dilemma.captions.map((c) => (c.at + c.until) / 2)}>
  {#snippet children({ progress }: { progress: number })}
    {@const f = frame(reduced ? 1 : progress)}
    <div class="mx-auto flex h-full w-full max-w-7xl flex-col px-6 pb-6 pt-10">
      <p class="font-sans text-xs uppercase tracking-widest text-muted">{dilemma.kicker}</p>
      <h2 class="font-serif text-3xl sm:text-4xl text-ink">{dilemma.title}</h2>

      <div class="relative min-h-[26rem] grow">
        <svg viewBox="0 0 {W} {H}" class="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" role="img"
             aria-label="The Prisoner's Dilemma acted out: two people choose in secret, the four outcomes assemble into a payoff table, and a price war shows the same trap in the real world">

          <!-- ============ stage: two strangers + outcomes ============ -->
          {#if f.stage > 0.01}
            <g opacity={f.stage}>
              <g transform="translate({THEM_X} {STAGE_Y}) scale(1.25)">{@render person(NEUTRAL)}</g>
              <g transform="translate({YOU_X} {STAGE_Y}) scale(1.25)">{@render person(READER)}</g>
              <text x={THEM_X} y={STAGE_Y + 105} text-anchor="middle" class="font-sans" font-size="13" fill={MUTED}>{dilemma.stage.them}</text>
              <text x={YOU_X} y={STAGE_Y + 105} text-anchor="middle" class="font-sans" font-size="13" fill={READER}>{dilemma.stage.you}</text>
              <text x="620" y="150" text-anchor="middle" class="font-serif" font-size="15" font-style="italic" fill={MUTED} opacity={f.note}>{dilemma.stage.reveal}</text>

              <!-- face-down cards before the first outcome -->
              {#if !reduced}
                {@const facedown = Math.min(1, f.stage) * (1 - beat(progress, 0.105, 0.125))}
                {#if facedown > 0.01}
                  <g opacity={facedown}>
                    <g transform="translate({THEM_X} {CARD_Y})">{@render cardBack()}</g>
                    <g transform="translate({YOU_X} {CARD_Y})">{@render cardBack()}</g>
                  </g>
                {/if}

                <!-- the three acted outcomes, one at a time on the same stage -->
                {#each OUTCOMES as o}
                  {@const env = windowEnv(progress, o.start, o.until)}
                  {#if env > 0.01}
                    {@const on = progress >= o.start + 0.02}
                    {@const numDelay = 320 + Math.max(o.pt, o.py) * 70 + 120}
                    <g opacity={env}>
                      <g transform="translate({THEM_X} {CARD_Y})">
                        {#if on}<g class="fold">{@render cardBack()}</g><g class="unfold">{@render cardFace(o.them)}</g>{:else}{@render cardBack()}{/if}
                      </g>
                      <g transform="translate({YOU_X} {CARD_Y})">
                        {#if on}<g class="fold">{@render cardBack()}</g><g class="unfold">{@render cardFace(o.you)}</g>{:else}{@render cardBack()}{/if}
                      </g>
                      {#if on}
                        <g transform="translate(540 430)">
                          {#each Array.from({ length: o.pt }) as _, i}
                            <rect class="chip-in" style="animation-delay: {320 + i * 70}ms" x="-17" y={-(i + 1) * 15} width="34" height="11" rx="3" fill={o.them} />
                          {/each}
                        </g>
                        <g transform="translate(700 430)">
                          {#each Array.from({ length: o.py }) as _, i}
                            <rect class="chip-in" style="animation-delay: {320 + i * 70}ms" x="-17" y={-(i + 1) * 15} width="34" height="11" rx="3" fill={o.you} />
                          {/each}
                        </g>
                        <text class="num-in font-mono" style="animation-delay: {numDelay}ms" x="492" y="400" text-anchor="end" font-size="34" fill={o.them}>+{o.pt}</text>
                        <text class="num-in font-mono" style="animation-delay: {numDelay}ms" x="748" y="400" font-size="34" fill={o.you}>+{o.py}</text>
                      {/if}
                    </g>
                  {/if}
                {/each}
              {/if}
            </g>
          {/if}

          <!-- ============ the matrix, assembled from the scenes ============ -->
          {#if f.matrix > 0.01}
            <g opacity={f.matrix}>
              {#each CELLS as cell, ci}
                {@const t = ease(beat(f.gather, ci * 0.06, ci * 0.06 + 0.55))}
                {#if t > 0.01}
                  {@const cx = cell.acted ? lerp(620, cellX(cell.col), t) : cellX(cell.col)}
                  {@const cy = cell.acted ? lerp(320, cellY(cell.row), t) : cellY(cell.row)}
                  {@const s = cell.acted ? lerp(1.35, 1, t) : lerp(0.85, 1, t)}
                  <g transform="translate({cx} {cy}) scale({s})" opacity={t}>
                    <rect x={-CELL_W / 2} y={-CELL_H / 2} width={CELL_W} height={CELL_H} rx="8" fill="#FFFFFF" stroke="#DFD8C8" />
                    <circle cx="-58" cy="-8" r="9" fill={cell.you} />
                    <text x="-40" y="0" class="font-mono" font-size="24" fill={cell.you}>{cell.py}</text>
                    <text x="0" y="0" text-anchor="middle" class="font-sans" font-size="14" fill={MUTED}>/</text>
                    <circle cx="22" cy="-8" r="9" fill={cell.them} />
                    <text x="40" y="0" class="font-mono" font-size="24" fill={cell.them}>{cell.pt}</text>
                    <text y="30" text-anchor="middle" class="font-sans" font-size="11" fill={MUTED}>you / them</text>
                  </g>
                {/if}
              {/each}

              {#if f.hd > 0.01}
                <g opacity={f.hd}>
                  <text x={cellX(0)} y="176" text-anchor="middle" class="font-sans" font-size="13" fill={COOP}>{dilemma.matrix.colThem[0]}</text>
                  <text x={cellX(1)} y="176" text-anchor="middle" class="font-sans" font-size="13" fill={DEFECT}>{dilemma.matrix.colThem[1]}</text>
                  <text x="392" y={cellY(0) + 4} text-anchor="end" class="font-sans" font-size="13" fill={COOP}>{dilemma.matrix.rowYou[0]}</text>
                  <text x="392" y={cellY(1) + 4} text-anchor="end" class="font-sans" font-size="13" fill={DEFECT}>{dilemma.matrix.rowYou[1]}</text>
                </g>
              {/if}

              {#if f.dom > 0.01}
                <rect x="280" y={cellY(1) - CELL_H / 2 - 8} width="570" height={CELL_H + 16} rx="10"
                      fill={DEFECT} opacity={0.07 * f.dom} />
                <text x={cellX(0)} y="446" text-anchor="middle" class="font-mono" font-size="17" fill={DEFECT} opacity={f.dom}>{dilemma.matrix.dominance[0]}</text>
                <text x={cellX(1)} y="446" text-anchor="middle" class="font-mono" font-size="17" fill={DEFECT} opacity={f.dom}>{dilemma.matrix.dominance[1]}</text>
                <text x="620" y="470" text-anchor="middle" class="font-sans" font-size="12" fill={MUTED} opacity={f.dom}>{dilemma.matrix.dominanceNote}</text>
              {/if}
            </g>
          {/if}

          <!-- ============ price war vignette ============ -->
          {#if f.war > 0.01}
            {@const ph = warPhase(f.warT)}
            <g opacity={f.war}>
              {#each [{ x: THEM_X, tone: NEUTRAL, price: WAR[ph][0], profit: WAR[ph][2], label: dilemma.shops.a, cutAt: [1, 3] }, { x: YOU_X, tone: READER, price: WAR[ph][1], profit: WAR[ph][3], label: dilemma.shops.b, cutAt: [2, 3] }] as shop}
                {@const justCut = shop.cutAt.includes(ph)}
                <g transform="translate({shop.x} 310)">
                  <rect x="-55" y="-10" width="110" height="80" fill="#FFFFFF" stroke="#DFD8C8" />
                  {#each Array.from({ length: 5 }) as _, si}
                    <rect x={-55 + si * 22} y="-30" width="22" height="20" fill={si % 2 === 0 ? shop.tone : '#FFFFFF'} stroke="#DFD8C8" stroke-width="0.5" />
                  {/each}
                  <rect x="-12" y="30" width="24" height="40" rx="2" fill={shop.tone} opacity="0.55" />
                  <g transform="translate(0 -78)">
                    <rect x="-32" y="-19" width="64" height="38" rx="5" fill="#FFFFFF" stroke={justCut ? DEFECT : '#DFD8C8'} stroke-width={justCut ? 1.5 : 1} />
                    <text y="7" text-anchor="middle" class="font-mono" font-size="19" fill={justCut ? DEFECT : INK}>{shop.price}</text>
                  </g>
                  <text y="100" text-anchor="middle" class="font-sans" font-size="12" fill={MUTED}>{shop.label}</text>
                  <g transform="translate(0 180)">
                    {#each Array.from({ length: shop.profit }) as _, pi}
                      <rect x="-13" y={-(pi + 1) * 13} width="26" height="9" rx="3" fill={shop.tone} />
                    {/each}
                    <text y="20" text-anchor="middle" class="font-sans" font-size="11" fill={MUTED}>{dilemma.shops.profit}</text>
                  </g>
                </g>
              {/each}
            </g>
          {/if}

          <!-- ============ handoff: back to the two of you ============ -->
          {#if f.hand > 0.01}
            <g opacity={f.hand}>
              <g transform="translate({THEM_X} {STAGE_Y}) scale(1.25)">{@render person(NEUTRAL)}</g>
              <g transform="translate({YOU_X} {STAGE_Y}) scale({1.25 * (1 + 0.08 * Math.sin(f.pulse * Math.PI))})">{@render person(READER)}</g>
              <g transform="translate({THEM_X} {CARD_Y})">{@render cardBack()}</g>
              <g transform="translate({YOU_X} {CARD_Y})">{@render cardBack()}</g>
              <text x={YOU_X} y={STAGE_Y + 105} text-anchor="middle" class="font-sans" font-size="13" fill={READER}>{dilemma.stage.you}</text>
            </g>
          {/if}
        </svg>
      </div>

      <!-- caption band -->
      {#if reduced}
        <div class="mx-auto w-full max-w-xl space-y-3 pb-8 pt-4">
          {#each dilemma.captions as cap}
            <p class="relative rounded border border-hairline bg-card/90 p-4 font-serif text-lg text-ink"><CapId id={cap.id} /><RichText text={cap.text} /></p>
          {/each}
        </div>
      {:else}
        <div class="relative h-36 shrink-0">
          <div class="pointer-events-none absolute inset-x-6 top-2 z-10 mx-auto grid w-full max-w-xl">
            {#each dilemma.captions as cap}
              <p class="relative col-start-1 row-start-1 rounded border border-hairline bg-card/95 p-4 text-center font-serif text-lg text-ink"
                 style="opacity: {windowEnv(progress, cap.at, cap.until, 0.03)}">
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

<style>
  /* intra-beat flourishes run on time once a beat starts, so nothing hangs
     half-built when the reader stops scrolling */
  .fold,
  .unfold {
    transform-box: fill-box;
    transform-origin: center;
  }
  .fold {
    animation: fold 0.22s ease both;
  }
  .unfold {
    animation: unfold 0.22s ease 0.22s both;
  }
  .chip-in {
    animation: chip 0.3s ease both;
  }
  .num-in {
    animation: num 0.35s ease both;
  }
  @keyframes fold {
    from { transform: scaleX(1); opacity: 1; }
    to { transform: scaleX(0.02); opacity: 0; }
  }
  @keyframes unfold {
    from { transform: scaleX(0.02); }
    to { transform: scaleX(1); }
  }
  @keyframes chip {
    from { opacity: 0; transform: translateY(26px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes num {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
