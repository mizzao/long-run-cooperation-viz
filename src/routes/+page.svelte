<script lang="ts">
  import Unravelling from '$lib/sections/Unravelling.svelte';
  import Hero from '$lib/sections/Hero.svelte';
  import Playable from '$lib/sections/Playable.svelte';
  import Theory from '$lib/sections/Theory.svelte';
  import Experiment from '$lib/sections/Experiment.svelte';
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
  import { parseTangle } from '$lib/data/tangle';
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
  const tangle = $derived(parseTangle(data.tangleRaw));
</script>

<svelte:head>
  <title>The Resilient 40% - a visual essay on cooperation</title>
  <meta name="description" content="94 people played the Prisoner's Dilemma for 20 consecutive days - 374,251 real decisions. A scroll-driven visual essay on the minority who kept cooperation alive." />
</svelte:head>

<main class="bg-paper text-ink">
  <Hero {heartbeat} />

  <Playable />

  <Theory />

  <Experiment {tangle} />

  <Unravelling {coop} {heartbeat} />

  <ItStops {coop} {defection} />

  <The36 {players} />

  <TheCost {payoffs} />

  <ItWorks {sim} empirical={empiricalShares} />

  <TheCoda welfare={welfareData} {players} />

  <footer class="h-[12vh]"></footer>
</main>
