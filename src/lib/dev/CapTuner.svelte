<script lang="ts">
  /**
   * Dev-only caption timing editor.
   *
   * Drag the bars to retime the captions of whichever scene is currently
   * pinned, then either write the values straight back into
   * `src/lib/content/*.ts` ("Save to source", via the cap-timing Vite dev
   * middleware) or copy them out as JSON.
   *
   * Mounted lazily from +layout.svelte behind `{#if dev}`, so it never reaches
   * the production bundle.
   */
  import { onMount } from 'svelte';
  import { scrollToY } from '$lib/scroll/lenis';
  import {
    scenes, tune, setWindow, resetCap, resetAll, isTuned, changes, clearPersisted,
    type CapWindow, type SceneEntry
  } from './tuning.svelte';

  const SNAP = 0.005;
  const MIN_DUR = 0.01;

  let open = $state(false);
  let frame = $state(0);
  let selected = $state<string | null>(null);
  let status = $state('');
  let statusTone = $state<'ok' | 'err' | ''>('');

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
  const f3 = (n: number) => n.toFixed(3);

  interface Placement { scene: SceneEntry; p: number; top: number; scrollable: number }

  const active = $derived.by((): Placement | null => {
    frame; // re-measure whenever the page scrolls or resizes
    if (typeof window === 'undefined' || !scenes.length) return null;
    const vh = window.innerHeight;
    const y = window.scrollY;
    let best: Placement | null = null;
    let bestScore = Infinity;
    for (const scene of scenes) {
      const top = scene.el.offsetTop;
      const scrollable = Math.max(1, scene.el.offsetHeight - vh);
      const p = clamp01((y - top) / scrollable);
      const pinned = y >= top && y <= top + scrollable;
      const score = pinned ? 0 : Math.abs(y - (top + scrollable / 2));
      if (score < bestScore) {
        bestScore = score;
        best = { scene, p, top, scrollable };
      }
    }
    return best;
  });

  const dirty = $derived.by(() => {
    frame;
    return changes();
  });

  function scrollToProgress(place: Placement, p: number, immediate = false) {
    scrollToY(Math.round(place.top + clamp01(p) * place.scrollable), immediate);
  }

  // ---- dragging -----------------------------------------------------------

  type Mode = 'at' | 'until' | 'move' | 'scrub';
  let drag = $state<{ id: string; mode: Mode; x0: number; at0: number; until0: number; w: number; left: number } | null>(null);

  function trackOf(e: PointerEvent): HTMLElement | null {
    return (e.currentTarget as HTMLElement).closest('[data-track]');
  }

  function startDrag(e: PointerEvent, cap: CapWindow, mode: Mode) {
    if (!cap.id) return;
    const track = trackOf(e);
    if (!track) return;
    const r = track.getBoundingClientRect();
    const t = tune(cap);
    selected = cap.id;
    drag = { id: cap.id, mode, x0: e.clientX, at0: t.at, until0: t.until, w: r.width, left: r.left };
    document.body.style.userSelect = 'none';
    e.preventDefault();
    e.stopPropagation();
  }

  function startScrub(e: PointerEvent) {
    const track = trackOf(e);
    if (!track || !active) return;
    const r = track.getBoundingClientRect();
    drag = { id: '', mode: 'scrub', x0: e.clientX, at0: 0, until0: 0, w: r.width, left: r.left };
    document.body.style.userSelect = 'none';
    scrollToProgress(active, (e.clientX - r.left) / r.width, true);
    e.preventDefault();
  }

  function moveDrag(e: PointerEvent) {
    if (!drag) return;
    if (drag.mode === 'scrub') {
      if (active) scrollToProgress(active, (e.clientX - drag.left) / drag.w, true);
      return;
    }
    const snap = (v: number) => (e.altKey ? v : Math.round(v / SNAP) * SNAP);
    let d = (e.clientX - drag.x0) / drag.w;
    if (e.shiftKey) d *= 0.25; // fine adjust
    const { at0, until0 } = drag;
    let at = at0;
    let until = until0;
    if (drag.mode === 'at') at = Math.min(clamp01(snap(at0 + d)), until0 - MIN_DUR);
    else if (drag.mode === 'until') until = Math.max(clamp01(snap(until0 + d)), at0 + MIN_DUR);
    else {
      const dur = until0 - at0;
      at = Math.min(Math.max(snap(at0 + d), 0), 1 - dur);
      until = at + dur;
    }
    setWindow(drag.id, at, until);
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    document.body.style.userSelect = '';
  }

  // ---- keyboard -----------------------------------------------------------

  function nudge(id: string, cap: CapWindow, dAt: number, dUntil: number) {
    const t = tune(cap);
    const at = clamp01(t.at + dAt);
    const until = clamp01(t.until + dUntil);
    if (until - at < MIN_DUR) return;
    setWindow(id, at, until);
  }

  function onKey(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    if (!typing && e.key.toLowerCase() === 't' && e.shiftKey) {
      toggle();
      return;
    }
    if (typing || !open || !selected || !active) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const cap = active.scene.captions.find((c) => c.id === selected);
    if (!cap) return;
    const step = (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 0.001 : SNAP);
    if (e.altKey) nudge(selected, cap, 0, step);
    else if (e.metaKey || e.ctrlKey) nudge(selected, cap, step, 0);
    else nudge(selected, cap, step, step);
    e.preventDefault();
  }

  function toggle() {
    open = !open;
    try {
      localStorage.setItem('capTiming.open', open ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  // ---- save / export ------------------------------------------------------

  function flash(msg: string, tone: 'ok' | 'err') {
    status = msg;
    statusTone = tone;
    setTimeout(() => {
      if (status === msg) {
        status = '';
        statusTone = '';
      }
    }, 4000);
  }

  async function save() {
    const updates = dirty;
    if (!updates.length) return flash('nothing changed', 'err');
    // Drop the persisted copy first: the write triggers an HMR reload, and a
    // stale localStorage entry would then mask the new source values.
    clearPersisted();
    try {
      const res = await fetch('/__cap-timing', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ updates })
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? res.statusText);
      flash(`wrote ${json.written.length} caption${json.written.length === 1 ? '' : 's'} to ${json.files.join(', ')}`, 'ok');
      resetAll();
    } catch (err) {
      flash(`save failed: ${err instanceof Error ? err.message : String(err)}`, 'err');
    }
  }

  async function copyJson() {
    const map: Record<string, { at: number; until: number }> = {};
    for (const c of dirty) map[c.id] = { at: c.at, until: c.until };
    if (!dirty.length) return flash('nothing changed', 'err');
    try {
      await navigator.clipboard.writeText(JSON.stringify(map, null, 2));
      flash(`copied ${dirty.length} change${dirty.length === 1 ? '' : 's'}`, 'ok');
    } catch {
      flash('clipboard blocked', 'err');
    }
  }

  onMount(() => {
    try {
      open = localStorage.getItem('capTiming.open') === '1';
    } catch {
      /* ignore */
    }
    let raf = 0;
    let lastY = -1;
    const loop = () => {
      if (window.scrollY !== lastY) {
        lastY = window.scrollY;
        frame++;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const bump = () => frame++;
    window.addEventListener('resize', bump);
    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', bump);
      window.removeEventListener('pointermove', moveDrag);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
      window.removeEventListener('keydown', onKey);
    };
  });

  const preview = (cap: CapWindow) =>
    (cap.text ?? cap.title ?? '').replace(/\[\/?[a-z]?\]/g, '').slice(0, 70);
</script>

{#if !open}
  <button
    onclick={toggle}
    title="Caption timing (Shift+T)"
    class="fixed bottom-4 left-4 z-50 rounded-full border border-zinc-700 bg-zinc-900/95 px-3 py-1.5 font-mono text-[11px] text-zinc-300 shadow-lg backdrop-blur transition hover:border-amber-400 hover:text-amber-300"
  >
    timing{#if active}<span class="text-zinc-500"> · {active.scene.label} {f3(active.p)}</span>{/if}{#if dirty.length}<span class="text-amber-400"> · {dirty.length}*</span>{/if}
  </button>
{:else}
  <div
    data-lenis-prevent
    class="fixed bottom-4 left-4 z-50 flex max-h-[78vh] w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900/97 font-mono text-[11px] text-zinc-300 shadow-2xl backdrop-blur"
  >
    <!-- header -->
    <div class="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
      <span class="font-semibold text-zinc-100">caption timing</span>
      {#if active}
        <span class="text-zinc-500">{active.scene.label}</span>
        <span class="ml-auto tabular-nums text-amber-300">{f3(active.p)}</span>
      {:else}
        <span class="ml-auto text-zinc-600">no scene</span>
      {/if}
      <button onclick={toggle} class="rounded px-1.5 py-0.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200" title="Close (Shift+T)">×</button>
    </div>

    <!-- scene jump -->
    <div class="flex flex-wrap gap-1 border-b border-zinc-800 px-3 py-2">
      {#each scenes as s (s.key)}
        <button
          onclick={() => scrollToY(s.el.offsetTop + 4)}
          class="rounded px-1.5 py-0.5 transition {active?.scene.key === s.key ? 'bg-amber-400 text-zinc-900' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}"
        >{s.label}</button>
      {/each}
    </div>

    {#if active}
      {@const place = active}
      <div class="flex-1 overflow-y-auto px-3 py-2">
        <!-- scrubber -->
        <div class="mb-3">
          <div class="mb-1 flex justify-between text-[9px] text-zinc-600"><span>0.0 — drag to scrub —</span><span>1.0</span></div>
          <div
            data-track
            role="presentation"
            onpointerdown={startScrub}
            class="relative h-4 cursor-ew-resize rounded bg-zinc-800"
          >
            {#each [0.25, 0.5, 0.75] as t}
              <div class="absolute inset-y-0 w-px bg-zinc-700" style="left: {t * 100}%"></div>
            {/each}
            <div class="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-amber-400" style="left: {place.p * 100}%"></div>
          </div>
        </div>

        <!-- caption rows -->
        {#each place.scene.captions as cap (cap.id)}
          {@const t = tune(cap)}
          {@const id = cap.id ?? ''}
          {@const sel = selected === id}
          {@const live = place.p >= t.at && place.p <= t.until}
          <div class="mb-1.5 rounded px-1 py-1 {sel ? 'bg-zinc-800/70' : ''}">
            <div class="flex items-center gap-2">
              <button
                onclick={() => (selected = sel ? null : id)}
                class="w-11 shrink-0 text-left {live ? 'text-amber-300' : 'text-zinc-500'} {isTuned(id) ? 'underline decoration-amber-400 decoration-dotted underline-offset-2' : ''}"
              >{id}</button>
              <div
                data-track
                role="presentation"
                onpointerdown={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  scrollToProgress(place, (e.clientX - r.left) / r.width);
                }}
                class="relative h-5 flex-1 cursor-crosshair rounded bg-zinc-800"
              >
                <div class="pointer-events-none absolute inset-y-0 w-px bg-amber-400/70" style="left: {place.p * 100}%"></div>
                <div
                  role="presentation"
                  onpointerdown={(e) => startDrag(e, cap, 'move')}
                  class="absolute inset-y-0 cursor-grab rounded {live ? 'bg-amber-400/80' : 'bg-sky-500/60'} {isTuned(id) ? 'ring-1 ring-amber-300' : ''}"
                  style="left: {t.at * 100}%; width: {(t.until - t.at) * 100}%"
                >
                  <div role="presentation" onpointerdown={(e) => startDrag(e, cap, 'at')} class="absolute inset-y-0 -left-1 w-2.5 cursor-ew-resize rounded-l bg-zinc-100/70 hover:bg-white"></div>
                  <div role="presentation" onpointerdown={(e) => startDrag(e, cap, 'until')} class="absolute inset-y-0 -right-1 w-2.5 cursor-ew-resize rounded-r bg-zinc-100/70 hover:bg-white"></div>
                </div>
              </div>
              <span class="w-24 shrink-0 text-right tabular-nums text-zinc-500">{f3(t.at)}→{f3(t.until)}</span>
            </div>

            {#if sel}
              <div class="mt-1.5 flex flex-wrap items-center gap-1.5 pl-13">
                <label class="flex items-center gap-1 text-zinc-500">at
                  <input type="number" step="0.005" min="0" max="1" value={t.at}
                    onchange={(e) => setWindow(id, +e.currentTarget.value, Math.max(+e.currentTarget.value + MIN_DUR, t.until))}
                    class="w-16 rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5 text-zinc-200 tabular-nums" />
                </label>
                <label class="flex items-center gap-1 text-zinc-500">until
                  <input type="number" step="0.005" min="0" max="1" value={t.until}
                    onchange={(e) => setWindow(id, Math.min(t.at, +e.currentTarget.value - MIN_DUR), +e.currentTarget.value)}
                    class="w-16 rounded border border-zinc-700 bg-zinc-950 px-1 py-0.5 text-zinc-200 tabular-nums" />
                </label>
                <button onclick={() => setWindow(id, place.p, Math.max(place.p + MIN_DUR, t.until))} title="start here" class="rounded bg-zinc-800 px-1.5 py-0.5 hover:bg-zinc-700">⇤ now</button>
                <button onclick={() => setWindow(id, Math.min(t.at, place.p - MIN_DUR), place.p)} title="end here" class="rounded bg-zinc-800 px-1.5 py-0.5 hover:bg-zinc-700">now ⇥</button>
                <span class="text-zinc-600">dur {f3(t.until - t.at)}</span>
                {#if isTuned(id)}
                  <button onclick={() => resetCap(id)} class="rounded bg-zinc-800 px-1.5 py-0.5 text-amber-300 hover:bg-zinc-700" title="revert to source">↺</button>
                {/if}
              </div>
              <p class="mt-1 pl-13 text-[10px] leading-snug text-zinc-500">{preview(cap)}…</p>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <div class="flex-1 px-3 py-6 text-center text-zinc-600">scroll to a scene with captions</div>
    {/if}

    <!-- footer -->
    <div class="border-t border-zinc-800 px-3 py-2">
      <div class="flex items-center gap-1.5">
        <button onclick={save} disabled={!dirty.length}
          class="rounded bg-amber-400 px-2 py-1 font-semibold text-zinc-900 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600">save to source</button>
        <button onclick={copyJson} disabled={!dirty.length}
          class="rounded bg-zinc-800 px-2 py-1 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-600">copy json</button>
        <button onclick={resetAll} disabled={!dirty.length}
          class="rounded bg-zinc-800 px-2 py-1 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:text-zinc-600">reset all</button>
        <span class="ml-auto tabular-nums {dirty.length ? 'text-amber-300' : 'text-zinc-600'}">{dirty.length} changed</span>
      </div>
      {#if status}
        <p class="mt-1.5 {statusTone === 'err' ? 'text-red-400' : 'text-emerald-400'}">{status}</p>
      {:else}
        <p class="mt-1.5 text-[10px] text-zinc-600">drag bar to move · edges to resize · shift = fine · alt = no snap · ←/→ nudge selected</p>
      {/if}
    </div>
  </div>
{/if}
