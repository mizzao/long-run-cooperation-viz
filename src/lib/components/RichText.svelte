<script lang="ts">
  // Inline caption markup: [c]cooperate[/] green · [d]defect[/] red · [g]resilient[/] gold
  // · [b]bold[/] · [k]84%[/] boxed data chip. Unknown tags render as plain text.
  let { text }: { text: string } = $props();
  interface Seg { t: string; tag?: string }
  const segs = $derived.by((): Seg[] => {
    const out: Seg[] = [];
    const re = /\[([a-z]+)\]([\s\S]*?)\[\/\]/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) out.push({ t: text.slice(last, m.index) });
      out.push({ t: m[2], tag: m[1] });
      last = m.index + m[0].length;
    }
    if (last < text.length) out.push({ t: text.slice(last) });
    return out;
  });
  const CLS: Record<string, string> = {
    c: 'text-coop font-medium',
    d: 'text-defect font-medium',
    g: 'text-resilient font-medium',
    b: 'font-semibold',
    k: 'mx-[1px] inline-block rounded-[3px] border border-hairline bg-card px-1 py-px font-mono text-[0.82em] text-ink'
  };
</script>{#each segs as s}{#if s.tag}<span class={CLS[s.tag] ?? ''}>{s.t}</span>{:else}{s.t}{/if}{/each}
