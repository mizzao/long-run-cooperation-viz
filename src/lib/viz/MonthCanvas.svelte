<script lang="ts">
  import { onMount } from 'svelte';
  import { beat } from '$lib/scroll/progress';
  import RichText from '$lib/components/RichText.svelte';
  import { parseMonth, type MonthSession } from '$lib/data/month';
  import { W, H, TG, SW, SH, colX, waveYOff, CELL } from '$lib/viz/tangleGeom';
  import { panelPos, camera, viewport, hitTest } from '$lib/viz/monthCamera';
  import { resolvePois, projector, type ResolvedPoi } from '$lib/viz/monthPoi';

  let {
    progress,
    width,
    height,
    ready = $bindable(false)
  }: { progress: number; width: number; height: number; ready?: boolean } = $props();

  interface Panel { x: number; y: number; waves: string[][]; mips: { scale: number; img: HTMLCanvasElement }[] }
  let canvas: HTMLCanvasElement;
  let panels: Panel[] = [];
  let rev = $state(0); // bumped as tiles arrive so the effect redraws
  let mouse = $state<{ x: number; y: number } | null>(null);
  let lensOn = $state(false);
  // smoothed lens position (css px); deliberately non-reactive - the tick loop owns it
  let lens: { x: number; y: number } | null = null;

  // marked points of interest; resolved once the month data is in
  let pois: ResolvedPoi[] = [];
  let hovered = $state<ResolvedPoi | null>(null);
  let opened = $state<ResolvedPoi | null>(null);
  let anchor = $state<{ x: number; y: number } | null>(null);
  let cardH = $state(260); // measured; a wave card is much taller than a game card

  // the magnifier is available once the camera has settled on the full month
  const settled = $derived(beat(progress, 0.73, 1) >= 0.86);
  const canHover = $derived(settled && !opened);
  const LENS_R = 105; // css px
  const ZOOM = 7;
  const FOLLOW = 9; // damping rate (1/s) - the lens trails the cursor
  const GOLD = '#C79008';
  const MARK_R = 7.5; // css px; markers are screen-sized so they stay legible
  const TAU = Math.PI * 2;

  const dpr = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);

  function drawCells(ctx: CanvasRenderingContext2D, waves: string[][]) {
    // draws one session's cells at the current transform, origin = panel top-left
    for (let wi = 0; wi < 20; wi++) {
      const x = colX(wi) - TG.x0;
      const yOff = waveYOff(waves[wi].length) - TG.y0;
      for (let pi = 0; pi < waves[wi].length; pi++) {
        const pair = waves[wi][pi];
        const py = yOff + pi * TG.pitchY;
        for (let r = 0; r < 10; r++) {
          ctx.fillStyle = CELL[pair[r] as keyof typeof CELL];
          ctx.fillRect(x + r * (TG.sw / 10), py, TG.sw / 10 - 0.7, TG.rowH);
          ctx.fillStyle = CELL[pair[10 + r] as keyof typeof CELL];
          ctx.fillRect(x + r * (TG.sw / 10), py + TG.rowH + TG.rowGap, TG.sw / 10 - 0.7, TG.rowH);
        }
      }
    }
  }

  function rasterSession(s: MonthSession, scale: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = Math.ceil(SW * scale);
    c.height = Math.ceil(SH * scale);
    const ctx = c.getContext('2d')!;
    ctx.scale(scale, scale);
    drawCells(ctx, s.waves);
    return c;
  }

  const nextFrame = () => new Promise(requestAnimationFrame);

  onMount(() => {
    let dead = false;
    (async () => {
      const raw = await fetch('/data/month_grid.json').then((r) => r.json());
      if (dead) return;
      const month = parseMonth(raw);
      panels = month.sessions.map((s) => ({ ...panelPos(s.day, s.slot), waves: s.waves, mips: [] }));
      pois = resolvePois(month.sessions);
      // hi scale so the day-1 tile is ~1:1 with its on-screen size at the crossfade
      const hi = Math.min(2, Math.max(1, dpr() * viewport(width, height).s0));
      const MIPS = [0.5, 0.25, 0.125, 0.0625];
      for (let i = 0; i < month.sessions.length; i++) {
        if (dead) return;
        const scales = i < 2 ? [hi, ...MIPS] : MIPS;
        panels[i].mips = scales.map((sc) => ({ scale: sc, img: rasterSession(month.sessions[i], sc) }));
        if (i === 0) ready = true;
        rev++;
        await nextFrame();
      }
    })();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { dead = true; window.removeEventListener('keydown', onKey); };
  });

  function pickMip(p: Panel, s: number): HTMLCanvasElement {
    let best = p.mips[0];
    for (const m of p.mips) if (m.scale >= s && m.scale < best.scale) best = m;
    return best.img;
  }

  // ---- marked points -------------------------------------------------------

  type Proj = (xw: number, yw: number) => { x: number; y: number };

  /** Where a marker's ring sits: on the game itself, or just above a wave column. */
  function ringAt(p: ResolvedPoi, proj: Proj) {
    const c = proj(p.cx, p.cy);
    if (p.kind === 'game') return c;
    return { x: c.x, y: proj(p.cx, p.rect.y).y - 13 };
  }

  function poiAt(proj: Proj, x: number, y: number): ResolvedPoi | null {
    let best: ResolvedPoi | null = null;
    let bestD = 15; // css px
    for (const p of pois) {
      const r = ringAt(p, proj);
      const d = Math.hypot(x - r.x, y - r.y);
      if (d < bestD) { bestD = d; best = p; }
      if (p.kind === 'wave') {
        const a = proj(p.rect.x, p.rect.y);
        const b = proj(p.rect.x + p.rect.w, p.rect.y + p.rect.h);
        if (x > a.x - 6 && x < b.x + 6 && y > a.y - 6 && y < b.y + 6 && bestD >= 15) best = p;
      }
    }
    return best;
  }

  function drawMarkers(ctx: CanvasRenderingContext2D, d: number, proj: Proj, alpha: number) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = alpha;
    for (const p of pois) {
      const hot = hovered?.id === p.id || opened?.id === p.id;
      if (p.kind === 'wave') {
        const a = proj(p.rect.x, p.rect.y);
        const b = proj(p.rect.x + p.rect.w, p.rect.y + p.rect.h);
        ctx.beginPath();
        ctx.rect((a.x - 3) * d, (a.y - 3) * d, (b.x - a.x + 6) * d, (b.y - a.y + 6) * d);
        ctx.strokeStyle = GOLD;
        ctx.globalAlpha = alpha * (hot ? 1 : 0.55);
        ctx.lineWidth = (hot ? 2 : 1.25) * d;
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }
      const { x, y } = ringAt(p, proj);
      const r = (hot ? MARK_R + 2.5 : MARK_R) * d;
      if (hot) {
        ctx.beginPath();
        ctx.arc(x * d, y * d, r + 6 * d, 0, TAU);
        ctx.fillStyle = 'rgba(199, 144, 8, 0.2)';
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(x * d, y * d, r, 0, TAU);
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3.5 * d;
      ctx.stroke();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.75 * d;
      ctx.stroke();
      if (p.kind === 'game') {
        ctx.beginPath();
        ctx.arc(x * d, y * d, r * 0.4, 0, TAU);
        ctx.fillStyle = GOLD;
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function open(p: ResolvedPoi, proj: Proj) {
    opened = p;
    anchor = ringAt(p, proj);
    mouse = null;
    lens = null;
  }

  function close() {
    opened = null;
    anchor = null;
  }

  /** Card position: below-right of the marker where there is room, else flipped. */
  const card = $derived.by(() => {
    const w = Math.min(400, Math.max(240, width - 32));
    if (!anchor) return { x: 16, y: 16, w };
    let x = anchor.x + 22;
    let y = anchor.y + 18;
    if (x + w > width - 16) x = anchor.x - 22 - w;
    if (y + cardH > height - 12) y = anchor.y - 18 - cardH;
    return {
      x: Math.max(16, Math.min(x, width - w - 16)),
      y: Math.max(12, Math.min(y, Math.max(12, height - cardH - 12))),
      w
    };
  });

  // ---- lens ----------------------------------------------------------------

  function drawLens(ctx: CanvasRenderingContext2D, d: number, s0: number, ox: number, oy: number, cam: { k: number; cx: number; cy: number }, m: { x: number; y: number }): boolean {
    const S = d * s0 * cam.k;
    const xw = cam.cx + ((m.x - ox) / s0 - W / 2) / cam.k;
    const yw = cam.cy + ((m.y - oy) / s0 - H / 2) / cam.k;
    const hit = hitTest(xw, yw);
    if (!hit) return false;
    const R = LENS_R * d;
    const cx = m.x * d;
    const cy = m.y * d;
    const SL = S * ZOOM;
    const rw = R / SL; // lens radius in world units

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#FBF8F1';
    ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // magnified world, redrawn from the data so it stays crisp at any zoom
    ctx.setTransform(SL, 0, 0, SL, cx - SL * xw, cy - SL * yw);
    const x0 = xw - rw;
    const x1 = xw + rw;
    const y0 = yw - rw;
    const y1 = yw + rw;
    for (const pnl of panels) {
      if (!pnl.mips.length || pnl.x > x1 || pnl.x + SW < x0 || pnl.y > y1 || pnl.y + SH < y0) continue;
      for (let wi = 0; wi < 20; wi++) {
        const wx = pnl.x + colX(wi) - TG.x0;
        if (wx > x1 || wx + TG.sw < x0) continue;
        const wv = pnl.waves[wi];
        const yOff = pnl.y + waveYOff(wv.length) - TG.y0;
        for (let pi = 0; pi < wv.length; pi++) {
          const py = yOff + pi * TG.pitchY;
          if (py > y1 || py + 2 * TG.rowH + TG.rowGap < y0) continue;
          const pair = wv[pi];
          for (let r = 0; r < 10; r++) {
            ctx.fillStyle = CELL[pair[r] as keyof typeof CELL];
            ctx.fillRect(wx + r * (TG.sw / 10), py, TG.sw / 10 - 0.7, TG.rowH);
            ctx.fillStyle = CELL[pair[10 + r] as keyof typeof CELL];
            ctx.fillRect(wx + r * (TG.sw / 10), py + TG.rowH + TG.rowGap, TG.sw / 10 - 0.7, TG.rowH);
          }
        }
      }
    }
    // ring the marked game inside the lens, so the caption has something to point at
    if (hovered) {
      const rc = hovered.rect;
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2 / SL;
      ctx.strokeRect(rc.x - 1.5, rc.y - 1.5, rc.w + 3, rc.h + 3);
    }
    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.arc(cx, cy, R + d, 0, Math.PI * 2);
    ctx.strokeStyle = hovered ? GOLD : '#FFFFFF';
    ctx.lineWidth = 4 * d;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R + 3 * d, 0, Math.PI * 2);
    ctx.strokeStyle = '#DFD8C8';
    ctx.lineWidth = d;
    ctx.stroke();

    const label = hovered ? hovered.title : `day ${hit.day} - ${hit.slot === '1pm' ? '13:00' : '15:00'}`;
    const hint = hovered ? 'click to read' : '';
    ctx.font = `${11 * d}px 'Inter Variable', system-ui, sans-serif`;
    const tw = ctx.measureText(label).width;
    ctx.font = `${9 * d}px 'Inter Variable', system-ui, sans-serif`;
    const hw = hint ? ctx.measureText(hint).width : 0;
    const chW = Math.max(tw, hw) + 20 * d;
    const chH = (hint ? 34 : 22) * d;
    const chX = cx - chW / 2;
    const chY = cy + R + 10 * d;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(chX, chY, chW, chH, 5 * d);
    else ctx.rect(chX, chY, chW, chH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = hovered ? GOLD : '#DFD8C8';
    ctx.lineWidth = d;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#211E19';
    ctx.font = `${11 * d}px 'Inter Variable', system-ui, sans-serif`;
    ctx.fillText(label, cx, chY + (hint ? 13 : 11) * d);
    if (hint) {
      ctx.fillStyle = GOLD;
      ctx.font = `${9 * d}px 'Inter Variable', system-ui, sans-serif`;
      ctx.fillText(hint, cx, chY + 25 * d);
    }
    return true;
  }

  function draw() {
    const cw = width;
    const ch = height;
    if (!canvas || cw < 10 || ch < 10) return;
    const d = dpr();
    const bw = Math.round(cw * d);
    const bh = Math.round(ch * d);
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    if (!panels.length || progress < 0.66) return; // invisible until just before the crossfade

    const { s0, ox, oy } = viewport(cw, ch);
    const t = beat(progress, 0.73, 1);
    const cam = camera(t);
    const S = d * s0 * cam.k;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(S, 0, 0, S, d * (ox + s0 * (W / 2 - cam.k * cam.cx)), d * (oy + s0 * (H / 2 - cam.k * cam.cy)));

    // world-space view bounds for culling
    const x0w = cam.cx + ((0 - ox) / s0 - W / 2) / cam.k;
    const x1w = cam.cx + ((cw - ox) / s0 - W / 2) / cam.k;
    const y0w = cam.cy + ((0 - oy) / s0 - H / 2) / cam.k;
    const y1w = cam.cy + ((ch - oy) / s0 - H / 2) / cam.k;
    const otherA = beat(t, 0.02, 0.15); // the rest of the month materializes as the camera recedes

    for (let i = 0; i < panels.length; i++) {
      const pnl = panels[i];
      if (!pnl.mips.length) continue;
      const a = i === 0 ? 1 : otherA;
      if (a <= 0) continue;
      if (pnl.x > x1w || pnl.x + SW < x0w || pnl.y > y1w || pnl.y + SH < y0w) continue;
      ctx.globalAlpha = a;
      ctx.drawImage(pickMip(pnl, S), pnl.x, pnl.y, SW, SH);
    }
    ctx.globalAlpha = 1;

    const markA = beat(t, 0.86, 0.94);
    if (markA > 0.01 && pois.length) drawMarkers(ctx, d, projector(cam, { s0, ox, oy }, W, H), markA);

    const on = t >= 0.86 && !opened && lens !== null && drawLens(ctx, d, s0, ox, oy, cam, lens);
    if (on !== lensOn) lensOn = on;
  }

  // one shared frame loop: draws on demand, and keeps running while the damped
  // lens is still catching up to the cursor
  let raf = 0;
  let lastT = 0;
  function tick(now: number) {
    raf = 0;
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
    lastT = now;
    let settling = false;
    if (canHover && mouse) {
      if (!lens) {
        lens = { x: mouse.x, y: mouse.y };
      } else {
        const a = 1 - Math.exp(-FOLLOW * dt);
        lens.x += (mouse.x - lens.x) * a;
        lens.y += (mouse.y - lens.y) * a;
        settling = Math.hypot(mouse.x - lens.x, mouse.y - lens.y) > 0.3;
      }
    } else {
      lens = null;
    }
    draw();
    if (settling) raf = requestAnimationFrame(tick);
    else lastT = 0;
  }

  function localPoint(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function currentProj(): Proj {
    const view = viewport(width, height);
    return projector(camera(beat(progress, 0.73, 1)), view, W, H);
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const p = localPoint(e);
    if (settled && pois.length) hovered = poiAt(currentProj(), p.x, p.y);
    if (opened) return;
    mouse = p;
  }

  function onDown(e: PointerEvent) {
    if (!settled || !pois.length) return;
    const p = localPoint(e);
    const proj = currentProj();
    const hit = poiAt(proj, p.x, p.y);
    if (hit) {
      hovered = hit;
      open(hit, proj);
    } else if (opened) {
      close();
    }
  }

  // a resize invalidates the anchor the card was placed against
  let lastSize = '';
  $effect(() => {
    const size = `${width}x${height}`;
    if (lastSize && size !== lastSize) close();
    lastSize = size;
  });

  $effect(() => {
    void progress;
    void width;
    void height;
    void mouse;
    void rev;
    void hovered;
    void opened;
    if (!raf) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 h-full w-full"
        style="pointer-events: {settled ? 'auto' : 'none'}; cursor: {hovered ? 'pointer' : lensOn ? 'none' : 'default'}"
        onpointermove={onMove} onpointerdown={onDown} onpointerleave={() => { mouse = null; hovered = null; }}
  >All 374,251 decisions of the experiment: 40 session panels arranged as a five-by-four grid of days</canvas>

{#if opened}
  {@const poi = opened}
  <div bind:clientHeight={cardH}
       class="pointer-events-auto absolute z-20 rounded-lg border border-hairline bg-card p-5 shadow-xl"
       style="left: {card.x}px; top: {card.y}px; width: {card.w}px">
    <button onclick={close} aria-label="Close"
            class="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded text-muted transition hover:bg-paper hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M1 1 L11 11 M11 1 L1 11" /></svg>
    </button>

    <p class="font-mono text-[10px] uppercase tracking-[0.14em] text-resilient">{poi.rarity}</p>
    <h3 class="mt-1 pr-6 font-serif text-xl leading-tight text-ink">{poi.title}</h3>
    <p class="mt-1 font-mono text-[10px] text-muted">
      {poi.address}{poi.kind === 'game' ? ' · one pair' : ` · ${poi.pairs.length} pairs at once`}
    </p>

    {#if poi.kind === 'game'}
      {@const g = poi.pairs[0]}
      <div class="mt-4">
        <div class="grid grid-cols-[3.4rem_repeat(10,1fr)] gap-[3px]">
          <span></span>
          {#each Array.from({ length: 10 }) as _, r}
            <span class="text-center font-mono text-[9px] text-muted">{r + 1}</span>
          {/each}
        </div>
        {#each [{ label: 'player A', from: 0 }, { label: 'player B', from: 10 }] as row}
          <div class="mt-[3px] grid grid-cols-[3.4rem_repeat(10,1fr)] items-center gap-[3px]">
            <span class="text-right font-sans text-[10px] text-muted">{row.label}</span>
            {#each Array.from({ length: 10 }) as _, r}
              <span class="h-6 rounded-[3px]" style="background: {CELL[g[row.from + r] as keyof typeof CELL]}"></span>
            {/each}
          </div>
        {/each}
      </div>
    {:else}
      <div class="mt-4">
        <div class="flex flex-col gap-[2px]">
          {#each poi.pairs as pair}
            <div class="flex flex-col gap-px">
              {#each [0, 10] as from}
                <div class="grid grid-cols-10 gap-px">
                  {#each Array.from({ length: 10 }) as _, r}
                    <span class="h-[2px]" style="background: {CELL[pair[from + r] as keyof typeof CELL]}"></span>
                  {/each}
                </div>
              {/each}
            </div>
          {/each}
        </div>
        <div class="mt-1.5 grid grid-cols-10 gap-px">
          {#each Array.from({ length: 10 }) as _, r}
            <span class="text-center font-mono text-[8px] text-muted">{r + 1}</span>
          {/each}
        </div>
      </div>
    {/if}

    <p class="mt-4 font-serif text-[15px] leading-relaxed text-ink"><RichText text={poi.text} /></p>
  </div>
{/if}
