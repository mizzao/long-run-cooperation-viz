<script lang="ts">
  import { onMount } from 'svelte';
  import { beat } from '$lib/scroll/progress';
  import { parseMonth, type MonthSession } from '$lib/data/month';
  import { W, H, TG, SW, SH, colX, waveYOff, CELL } from '$lib/viz/tangleGeom';
  import { panelPos, camera, viewport, hitTest } from '$lib/viz/monthCamera';

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

  // the magnifier is available once the camera has settled on the full month
  const canHover = $derived(beat(progress, 0.73, 1) >= 0.86);
  const LENS_R = 105; // css px
  const ZOOM = 7;
  const FOLLOW = 9; // damping rate (1/s) - the lens trails the cursor

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
    return () => { dead = true; };
  });

  function pickMip(p: Panel, s: number): HTMLCanvasElement {
    let best = p.mips[0];
    for (const m of p.mips) if (m.scale >= s && m.scale < best.scale) best = m;
    return best.img;
  }

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
    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.arc(cx, cy, R + d, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4 * d;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, R + 3 * d, 0, Math.PI * 2);
    ctx.strokeStyle = '#DFD8C8';
    ctx.lineWidth = d;
    ctx.stroke();

    const label = `day ${hit.day} - ${hit.slot === '1pm' ? '13:00' : '15:00'}`;
    ctx.font = `${11 * d}px 'Inter Variable', system-ui, sans-serif`;
    const tw = ctx.measureText(label).width;
    const chW = tw + 20 * d;
    const chH = 22 * d;
    const chX = cx - chW / 2;
    const chY = cy + R + 10 * d;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(chX, chY, chW, chH, 5 * d);
    else ctx.rect(chX, chY, chW, chH);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#DFD8C8';
    ctx.lineWidth = d;
    ctx.stroke();
    ctx.fillStyle = '#211E19';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, chY + chH / 2);
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

    const on = t >= 0.86 && lens !== null && drawLens(ctx, d, s0, ox, oy, cam, lens);
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

  function onMove(e: PointerEvent) {
    if (e.pointerType !== 'mouse') return;
    const r = canvas.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  $effect(() => {
    void progress;
    void width;
    void height;
    void mouse;
    void rev;
    if (!raf) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 h-full w-full"
        style="pointer-events: {canHover ? 'auto' : 'none'}; cursor: {lensOn ? 'none' : 'default'}"
        onpointermove={onMove} onpointerleave={() => (mouse = null)}
  >All 374,251 decisions of the experiment: 40 session panels arranged as a five-by-four grid of days</canvas>
