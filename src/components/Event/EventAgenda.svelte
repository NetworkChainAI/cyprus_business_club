<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;
  const event = data?.event;

  type AgendaItem = {
    start: string;
    end?: string;
    title: string;
    description?: string;
  };

  function timeToMin(t: string) {
    const [h, m] = String(t).split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  function normalizeAgenda(raw: any): AgendaItem[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x: any) => ({
        start: String(x?.start ?? "").trim(),
        end: x?.end ? String(x.end).trim() : undefined,
        title: String(x?.title ?? "").trim(),
        description: x?.description ? String(x.description).trim() : undefined,
      }))
      .filter((it) => it.start && it.title)
      .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  }

  $: agendaItems = normalizeAgenda(event?.agenda);
</script>

{#if agendaItems.length}
  <section class="card">
    <div class="head">
      <iconify-icon icon="lucide:calendar-clock" width="18" height="18"></iconify-icon>
      <span>{$t('events.detail.agenda')}</span>
      <span class="count">{agendaItems.length}</span>
    </div>

    <div class="list">
      {#each agendaItems as it}
        <article class="item">
          <div class="time-col">
            <span class="time-pill">{it.start}</span>
            {#if it.end}
              <span class="time-sep">—</span>
              <span class="time-pill ghost">{it.end}</span>
            {/if}
          </div>

          <div class="content">
            <div class="title">{it.title}</div>
            {#if it.description}
              <div class="desc">{it.description}</div>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  </section>
{/if}

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
  }

  .head :global(iconify-icon) {
    color: #4f46e5;
  }

  .count {
    margin-left: auto;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 800;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 8px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item {
    position: relative;
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 14px;
    padding: 14px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: background 0.15s, border-color 0.15s;
  }

  .item::before {
    content: "";
    position: absolute;
    left: 0;
    top: 12px;
    bottom: 12px;
    width: 3px;
    border-radius: 3px;
    background: #4f46e5;
  }

  .item:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .time-col {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    padding-left: 8px;
  }

  .time-pill {
    display: inline-flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    color: #4f46e5;
    line-height: 1;
    white-space: nowrap;
  }

  .time-pill.ghost {
    background: #fff;
    border-color: #e2e8f0;
    color: #0f172a;
  }

  .time-sep {
    color: #94a3b8;
    font-size: 12px;
  }

  .content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .title {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  .desc {
    color: #64748b;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  @media (max-width: 640px) {
    .item {
      grid-template-columns: 1fr;
    }

    .item::before {
      left: 12px;
      top: 0;
      bottom: auto;
      height: 3px;
      width: calc(100% - 24px);
    }
  }
</style>
