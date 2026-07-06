<script lang="ts">
  import { playable } from '$lib/content/playable';

  const READER = '#2D5192';
  const NEUTRAL = '#8B8474';
  const COOP = '#15735B';
  const DEFECT = '#D64A22';

  type Move = 0 | 1; // 1 = cooperate
  type Phase = 'intro' | 'playing' | 'between' | 'reveal';

  let phase = $state<Phase>('intro');
  let game = $state(0); // 0 | 1
  let round = $state(1);
  let you = $state<Move[]>([]);
  let bot = $state<Move[]>([]);
  let totals = $state({ you: 0, bot: 0 });
  let lastOutcome = $state<string | null>(null);
  let lastTone = $state<string>('#211E19');
  let g1 = $state<{ you: Move[]; bot: Move[] } | null>(null);
  let firstDefection = $state<(number | null)[]>([null, null]);

  function botMove(g: number, r: number, yourHistory: Move[]): Move {
    const provoked = yourHistory.includes(0);
    if (g === 0) return provoked ? 0 : 1; // CC: punish once you defect first
    if (r >= 9 || provoked) return 0;    // T9: defect from round 9, earlier if provoked
    return 1;
  }

  function pay(a: Move, b: Move): [number, number] {
    if (a === 1 && b === 1) return [5, 5];
    if (a === 1 && b === 0) return [1, 7];
    if (a === 0 && b === 1) return [7, 1];
    return [3, 3];
  }

  function choose(m: Move) {
    const b = botMove(game, round, you);
    const [py, pb] = pay(m, b);
    you = [...you, m];
    bot = [...bot, b];
    totals = { you: totals.you + py, bot: totals.bot + pb };
    lastOutcome = m === 1 && b === 1 ? playable.outcome.cc : m === 1 ? playable.outcome.cd : b === 1 ? playable.outcome.dc : playable.outcome.dd;
    lastTone = m === 1 && b === 1 ? COOP : m === 0 && b === 0 ? '#6E6759' : DEFECT;
    if (m === 0 && firstDefection[game] === null && !bot.slice(0, -1).includes(0)) {
      const fd = [...firstDefection];
      fd[game] = round;
      firstDefection = fd;
    }
    if (round === 10) {
      phase = game === 0 ? 'between' : 'reveal';
    } else {
      round += 1;
    }
  }

  function startGame(g: number) {
    if (g === 1) g1 = { you, bot };
    game = g;
    round = 1;
    you = [];
    bot = [];
    lastOutcome = null;
    if (g === 0) totals = { you: 0, bot: 0 };
    phase = 'playing';
  }

  function skip() {
    phase = 'reveal';
  }

  const earliest = $derived(firstDefection.filter((f) => f !== null).length ? Math.min(...(firstDefection.filter((f) => f !== null) as number[])) : null);
</script>

{#snippet person(fill: string, size: number)}
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="10" r="6" {fill} />
    <rect x="6" y="18" width="20" height="12" rx="6" {fill} />
  </svg>
{/snippet}

{#snippet trail(moves: Move[], label: string)}
  <div class="flex items-center gap-2">
    <span class="w-14 text-right font-sans text-xs text-muted">{label}</span>
    <div class="flex gap-1.5">
      {#each Array.from({ length: 10 }) as _, i}
        <span class="inline-block h-3 w-3 rounded-full border border-hairline"
              style="background: {moves[i] === undefined ? 'transparent' : moves[i] === 1 ? COOP : DEFECT}"></span>
      {/each}
    </div>
  </div>
{/snippet}

<section class="relative flex min-h-screen flex-col">
  <div class="mx-auto flex w-full max-w-7xl grow flex-col px-6 pt-12">
    <p class="font-sans text-xs uppercase tracking-widest text-muted">{playable.kicker}</p>
    <h2 class="font-serif text-3xl sm:text-4xl text-ink">{playable.title}</h2>

    <div class="flex grow items-center justify-center py-8">
      {#if phase === 'intro'}
        <div class="w-full max-w-2xl rounded border border-hairline bg-card/95 p-8 text-center">
          <p class="mx-auto max-w-lg font-serif text-lg leading-relaxed text-ink">{playable.intro.lead}</p>
          <div class="mx-auto mt-6 grid w-fit grid-cols-[auto_auto_auto] items-center gap-x-4 gap-y-2 font-mono text-sm">
            <span></span><span class="font-sans text-xs text-muted">they cooperate</span><span class="font-sans text-xs text-muted">they defect</span>
            <span class="font-sans text-xs text-muted">you cooperate</span>
            <span class="rounded border border-hairline px-3 py-1.5" style="color: {COOP}">5 / 5</span>
            <span class="rounded border border-hairline px-3 py-1.5" style="color: {DEFECT}">1 / 7</span>
            <span class="font-sans text-xs text-muted">you defect</span>
            <span class="rounded border border-hairline px-3 py-1.5" style="color: {DEFECT}">7 / 1</span>
            <span class="rounded border border-hairline px-3 py-1.5 text-muted">3 / 3</span>
          </div>
          <p class="mx-auto mt-5 max-w-md font-sans text-sm text-muted">{playable.intro.matrixNote}</p>
          <div class="mt-7 flex items-center justify-center gap-4">
            <button class="rounded border border-hairline bg-paper px-6 py-3 font-sans text-sm text-ink transition-colors hover:border-ink" onclick={() => startGame(0)}>{playable.intro.start}</button>
            <button class="px-3 py-3 font-sans text-xs text-muted underline decoration-hairline underline-offset-4 hover:text-ink" onclick={skip}>{playable.intro.skip}</button>
          </div>
          <p class="mt-6 font-sans text-[11px] uppercase tracking-widest text-muted">{playable.intro.disclaimer}</p>
        </div>

      {:else if phase === 'playing'}
        <div class="w-full max-w-2xl rounded border border-hairline bg-card/95 p-8">
          <div class="flex items-baseline justify-between">
            <p class="font-sans text-xs uppercase tracking-widest text-muted">{playable.games[game].label} &#183; {playable.games[game].partner}</p>
            <p class="font-mono text-sm text-ink">round {round} / 10</p>
          </div>
          <p class="mt-1 font-sans text-[11px] text-muted">{playable.games[game].hint}</p>

          <div class="mt-6 flex items-center justify-center gap-10">
            <div class="flex flex-col items-center gap-1">
              {@render person(NEUTRAL, 44)}
              <span class="font-sans text-xs text-muted">them</span>
            </div>
            <div class="h-px w-16 bg-hairline"></div>
            <div class="flex flex-col items-center gap-1">
              {@render person(READER, 44)}
              <span class="font-sans text-xs text-muted">you</span>
            </div>
          </div>

          <div class="mt-6 flex items-center justify-center gap-4">
            <button class="rounded border-2 px-7 py-3.5 font-sans text-sm transition-colors hover:bg-paper" style="border-color: {COOP}; color: {COOP}" onclick={() => choose(1)}>{playable.buttons.coop}</button>
            <button class="rounded border-2 px-7 py-3.5 font-sans text-sm transition-colors hover:bg-paper" style="border-color: {DEFECT}; color: {DEFECT}" onclick={() => choose(0)}>{playable.buttons.defect}</button>
          </div>

          <p class="mt-5 h-5 text-center font-sans text-sm" style="color: {lastTone}">{lastOutcome ?? ''}</p>

          <div class="mt-4 space-y-2">
            {@render trail(you, 'you')}
            {@render trail(bot, 'them')}
          </div>
          <p class="mt-4 text-center font-mono text-sm text-muted">you {totals.you} &#183; them {totals.bot}</p>
        </div>

      {:else if phase === 'between'}
        <div class="w-full max-w-2xl rounded border border-hairline bg-card/95 p-8 text-center">
          <p class="font-sans text-xs uppercase tracking-widest text-muted">{playable.between.title}</p>
          <p class="mt-4 font-serif text-lg text-ink">{playable.reveal.scores(totals.you, totals.bot)}</p>
          <div class="mt-3 space-y-2">
            {@render trail(you, 'you')}
            {@render trail(bot, 'them')}
          </div>
          <button class="mt-7 rounded border border-hairline bg-paper px-6 py-3 font-sans text-sm text-ink transition-colors hover:border-ink" onclick={() => startGame(1)}>{playable.between.next}</button>
        </div>

      {:else}
        <div class="relative w-full max-w-2xl rounded border border-hairline bg-card/95 p-8 text-center">
          <span class="absolute right-3 top-2 font-mono text-[11px] text-muted opacity-60">{playable.reveal.devId}</span>
          <p class="font-sans text-xs uppercase tracking-widest text-muted">{playable.reveal.title}</p>
          {#if g1}
            <div class="mx-auto mt-5 grid w-fit grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2">
              <div class="space-y-2">
                <p class="font-sans text-[11px] uppercase tracking-widest text-muted">game 1</p>
                {@render trail(g1.you, 'you')}
                {@render trail(g1.bot, 'them')}
              </div>
              <div class="space-y-2">
                <p class="font-sans text-[11px] uppercase tracking-widest text-muted">game 2</p>
                {@render trail(you, 'you')}
                {@render trail(bot, 'them')}
              </div>
            </div>
          {/if}
          <p class="mx-auto mt-5 max-w-lg font-serif text-lg leading-relaxed text-ink">
            {you.length === 0 && !g1 ? playable.reveal.skipped : earliest === null ? playable.reveal.neverDefected : playable.reveal.defected(earliest)}
          </p>
          {#if you.length > 0}
            <p class="mt-4 font-sans text-sm text-muted">{playable.reveal.scores(totals.you, totals.bot)}</p>
          {/if}
          <p class="mt-7 font-sans text-xs uppercase tracking-widest text-muted">{playable.reveal.cta} &#8595;</p>
        </div>
      {/if}
    </div>
  </div>
</section>
