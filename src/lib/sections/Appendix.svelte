<script lang="ts">
  import { appendix } from '$lib/content/appendix';
</script>

<section class="border-t border-hairline">
  <div class="mx-auto max-w-4xl px-6 py-24">
    <p class="font-sans text-xs uppercase tracking-widest text-muted">{appendix.kicker}</p>
    <h2 class="font-serif text-3xl sm:text-4xl text-ink">{appendix.title}</h2>
    <p class="mt-4 max-w-2xl font-serif text-lg leading-relaxed text-muted">{appendix.lead}</p>
    <div class="mt-10 grid gap-6 sm:grid-cols-2">
      {#each appendix.notes as note}
        <div class="rounded border border-hairline bg-card p-6">
          <p class="font-sans text-xs uppercase tracking-widest text-muted">{note.title}</p>
          {#if 'items' in note}
            <ul class="mt-4 space-y-2.5">
              {#each note.items as item}
                <li class="flex gap-3 font-serif text-base leading-relaxed text-ink">
                  <span class="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-hairline"></span>
                  <span>{item}</span>
                </li>
              {/each}
            </ul>
          {:else}
            <p class="mt-4 font-serif text-base leading-relaxed text-ink">{note.text}</p>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</section>
