<script lang="ts">
  import Unravelling from '$lib/sections/Unravelling.svelte';
  import Playable from '$lib/sections/Playable.svelte';
  import { parseCooperation, parseHeartbeat } from '$lib/data/cooperation';
  import { parseDefection } from '$lib/data/defection';
  import ItStops from '$lib/sections/ItStops.svelte';
  import The36 from '$lib/sections/The36.svelte';
  import { parseStrategies } from '$lib/data/strategies';
  import { parsePayoffs } from '$lib/data/payoffs';
  import TheCost from '$lib/sections/TheCost.svelte';
  import ItWorks from '$lib/sections/ItWorks.svelte';
  import TheCoda from '$lib/sections/TheCoda.svelte';
  import { parseWelfare } from '$lib/data/welfare';
  import { parseSimulation, parseEmpiricalShares } from '$lib/data/simulation';
  import type { PageProps } from './$types';
  let { data }: PageProps = $props();
  const coop = $derived(parseCooperation(data.coopRaw));
  const heartbeat = $derived(parseHeartbeat(data.hbRaw));
  const defection = $derived(parseDefection(data.defRaw));
  const players = $derived(parseStrategies(data.stratRaw));
  const payoffs = $derived(parsePayoffs(data.payoffsRaw));
  const sim = $derived(parseSimulation(data.simRaw));
  const empiricalShares = $derived(parseEmpiricalShares(data.distRaw));
  const welfareData = $derived(parseWelfare(data.welfareRaw));
</script>

<svelte:head>
  <title>The Resilient 40% - a visual essay on cooperation</title>
  <meta name="description" content="94 people played the Prisoner's Dilemma for 20 consecutive days - 374,263 real decisions. A scroll-driven visual essay on the minority who kept cooperation alive." />
</svelte:head>

<main class="bg-paper text-ink">
  <header class="relative flex min-h-[85vh] flex-col items-center justify-center px-6 text-center">
    <p class="font-sans text-xs uppercase tracking-[0.25em] text-muted">A visual essay</p>
    <h1 class="mt-4 font-serif text-5xl sm:text-7xl text-ink">The Resilient 40%</h1>
    <p class="mt-6 max-w-2xl font-serif text-xl leading-relaxed text-muted">
      374,263 decisions. 94 people. 20 consecutive weekdays of the Prisoner&#8217;s Dilemma.
      One question: does cooperation survive experience?
    </p>
    <p class="mt-8 font-sans text-xs text-muted">
      Based on Mao, Dworkin, Suri &amp; Watts &#183; <span class="italic">Nature Communications</span> 8:13800 (2017)
    </p>
    <p class="absolute bottom-8 animate-bounce font-sans text-xs uppercase tracking-widest text-muted motion-reduce:animate-none">Scroll</p>
  </header>

  <Playable />

  <Unravelling {coop} {heartbeat} />

  <ItStops {coop} {defection} />

  <The36 {players} />

  <TheCost {payoffs} />

  <ItWorks {sim} empirical={empiricalShares} />

  <TheCoda welfare={welfareData} {players} />

  <footer class="h-[12vh]"></footer>
</main>
