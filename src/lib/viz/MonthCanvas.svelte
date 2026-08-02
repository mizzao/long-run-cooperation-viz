<script lang="ts">
  import { onMount } from 'svelte';
  import { beat } from '$lib/scroll/progress';
  import { parseMonth, type MonthSession } from '$lib/data/month';
  import { W, H, TG, SW, SH, colX, waveYOff, CELL } from '$lib/viz/tangleGeom';
  import { panelPos, camera, viewport } from '$lib/viz/monthCamera';

  let {
    progress,
    width,
    height,
    ready = $bindable(false)
  }: { progress: number; width: number; height: number; ready?: boolean } = $props();

  interface Panel { x: number; y: number; mips: { scale: number; img: HTMLCanvasElement }[] }
  let canvas: HTMLCanvasElement;
  let panels: Panel[] = [];
  let rev = $state(0); // bumped as tiles arrive so the effect redraws

  const dpr = () => Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2);

  function rasterSession(s: MonthSession, scale: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = Math.ceil(SW * scale);
    c.height = Math.ceil(SH * scale);
    const ctx = c.getContext('2d')!;
    ctx.scale(scale, scale);
    ctx.translate(-TG.x0, -TG.y0);
    for (let wi = 0; wi < 20; wi++) {
      const x = colX(wi);
      const yOff = waveYOff(s.waves[wi].length);
      for (let pi = 0; pi < s.waves[wi].length; pi++) {
        const pair = s.waves[wi][pi];
        const py = yOff + pi * TG.pitchY;
        for (let r = 0; r < 10; r++) {
          ctx.fillStyle = CELL[pair[r] as keyof typeof CELL];
          ctx.fillRect(x + r * (TG.sw / 10), py, TG.sw / 10 - 0.7, TG.rowH);
          ctx.fillStyle = CELL[pair[10 + r] as keyof typeof CELL];
          ctx.fillRect(x + r * (TG.sw / 10), py + TG.rowH + TG.rowGap, TG.sw / 10 - 0.7, TG.rowH);
        }
      }
    }
    return c;
  }

  const nextFrame = () => new Promise(requestAnimationFrame);

  onMount(() => {
    let dead = false;
    (async () => {
      const raw = await fetch('/data/month_grid.json').then((r) => r.json());
      if (dead) return;
      const month = parseMonth(raw);
      panels = month.sessions.map((s) => ({ ...panelPos(s.day, s.slot), mips: [] }));
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

  function draw(p: number, cw: number, ch: number) {
    if (!canvas || cw < 10 || ch < 10) return;
    const d = dpr();
    const bw = Math.round(cw * d);
    const bh = Math.round(ch * d);
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, bw, bh);
    if (!panels.length || p < 0.66) return; // invisible until just before the crossfade

    const { s0, ox, oy } = viewport(cw, ch);
    const t = beat(p, 0.73, 1);
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
  }

  let raf = 0;
  $effect(() => {
    const p = progress;
    const cw = width;
    const ch = height;
    void rev;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => draw(p, cw, ch));
    return () => cancelAnimationFrame(raf);
  });
</script>

<canvas bind:this={canvas} class="absolute inset-0 h-full w-full"
  >All 374,251 decisions of the experiment: 40 session panels arranged as a five-by-four grid of days</canvas>
