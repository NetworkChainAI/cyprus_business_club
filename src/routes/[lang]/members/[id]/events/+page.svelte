<script lang="ts">
  import { photoSrc } from "$lib/utils/photo";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";

  export let data: any;

  const upcoming = data?.upcomingEvents ?? [];
  const visited = data?.visitedEvents ?? [];
  const created = data?.createdEvents ?? [];
  const total = upcoming.length + visited.length + created.length;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
</script>

<div class="events">
  {#if total === 0}
    <div class="card empty">
      <iconify-icon icon="lucide:calendar-x" width="32"></iconify-icon>
      <div class="empty-title">{$t('admin.memberDetail.noEventsYet')}</div>
    </div>
  {:else}
    {#if upcoming.length > 0}
      <div class="section-head">
        <iconify-icon icon="lucide:calendar-check" width="18"></iconify-icon>
        <span>{$t('admin.memberDetail.upcoming')}</span>
        <span class="count">{upcoming.length}</span>
      </div>
      <div class="grid">
        {#each upcoming as ev (ev.id)}
          <a href={withLang(`/events/${ev.id}`)} class="ev-card">
            <div class="ev-img">
              {#if ev.photo}
                <img src={photoSrc(ev.photo)} alt={ev.title} />
              {:else}
                <div class="ev-img-ph"><iconify-icon icon="lucide:calendar-days" width="28"></iconify-icon></div>
              {/if}
              {#if ev.price}<span class="price">${ev.price}</span>{:else}<span class="price free">{$t('admin.memberDetail.free')}</span>{/if}
            </div>
            <div class="ev-body">
              <div class="ev-title">{ev.title}</div>
              <div class="ev-meta">
                <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                {formatDate(ev.date)} &middot; {formatTime(ev.date)}
              </div>
              <div class="ev-loc">
                <iconify-icon icon="lucide:map-pin" width="12"></iconify-icon>
                {ev.location}
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    {#if visited.length > 0}
      <div class="section-head past">
        <iconify-icon icon="lucide:history" width="18"></iconify-icon>
        <span>{$t('admin.memberDetail.visited')}</span>
        <span class="count">{visited.length}</span>
      </div>
      <div class="grid">
        {#each visited as ev (ev.id)}
          <a href={withLang(`/events/${ev.id}`)} class="ev-card past">
            <div class="ev-img">
              {#if ev.photo}
                <img src={photoSrc(ev.photo)} alt={ev.title} />
              {:else}
                <div class="ev-img-ph"><iconify-icon icon="lucide:calendar-days" width="28"></iconify-icon></div>
              {/if}
              <span class="badge green"><iconify-icon icon="lucide:check-circle" width="12"></iconify-icon> {$t('admin.memberDetail.attended')}</span>
            </div>
            <div class="ev-body">
              <div class="ev-title">{ev.title}</div>
              <div class="ev-meta"><iconify-icon icon="lucide:calendar" width="12"></iconify-icon> {formatDate(ev.date)}</div>
              <div class="ev-loc"><iconify-icon icon="lucide:map-pin" width="12"></iconify-icon> {ev.location}</div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    {#if created.length > 0}
      <div class="section-head created">
        <iconify-icon icon="lucide:plus-circle" width="18"></iconify-icon>
        <span>{$t('admin.memberDetail.created')}</span>
        <span class="count">{created.length}</span>
      </div>
      <div class="grid">
        {#each created as ev (ev.id)}
          <a href={withLang(`/events/${ev.id}`)} class="ev-card">
            <div class="ev-img">
              {#if ev.photo}
                <img src={photoSrc(ev.photo)} alt={ev.title} />
              {:else}
                <div class="ev-img-ph"><iconify-icon icon="lucide:calendar-days" width="28"></iconify-icon></div>
              {/if}
              <span class="badge amber"><iconify-icon icon="lucide:crown" width="12"></iconify-icon> {$t('admin.memberDetail.organizer')}</span>
            </div>
            <div class="ev-body">
              <div class="ev-title">{ev.title}</div>
              <div class="ev-meta"><iconify-icon icon="lucide:calendar" width="12"></iconify-icon> {formatDate(ev.date)} &middot; {formatTime(ev.date)}</div>
              <div class="ev-loc"><iconify-icon icon="lucide:map-pin" width="12"></iconify-icon> {ev.location}</div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .events { display: flex; flex-direction: column; gap: 14px; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; }
  .empty { min-height: 200px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; }
  .empty :global(iconify-icon) { color: #cbd5e1; }
  .empty-title { font-weight: 900; font-size: 16px; color: #64748b; }
  .section-head { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 15px; color: #0f172a; }
  .section-head :global(iconify-icon) { color: #4f46e5; }
  .section-head.past :global(iconify-icon) { color: #94a3b8; }
  .section-head.created :global(iconify-icon) { color: #f59e0b; }
  .count { margin-left: auto; background: #eef2ff; color: #4f46e5; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 8px; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
  .ev-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; text-decoration: none; transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
  .ev-card:hover { border-color: #c7d2fe; box-shadow: 0 8px 24px rgba(79, 70, 229, 0.08); transform: translateY(-2px); }
  .ev-card.past { opacity: 0.75; }
  .ev-card.past:hover { opacity: 1; }
  .ev-img { position: relative; width: 100%; height: 140px; background: #f1f5f9; overflow: hidden; }
  .ev-img img { width: 100%; height: 100%; object-fit: cover; }
  .ev-img-ph { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #cbd5e1; }
  .price { position: absolute; top: 10px; right: 10px; padding: 4px 10px; border-radius: 8px; background: rgba(15, 23, 42, 0.75); color: #fff; font-weight: 800; font-size: 12px; backdrop-filter: blur(4px); }
  .price.free { background: rgba(22, 163, 74, 0.85); }
  .badge { position: absolute; top: 10px; right: 10px; display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 8px; color: #fff; font-weight: 700; font-size: 11px; backdrop-filter: blur(4px); }
  .badge :global(iconify-icon) { color: #fff; }
  .badge.green { background: rgba(22, 163, 74, 0.85); }
  .badge.amber { background: rgba(245, 158, 11, 0.9); }
  .ev-body { padding: 12px 14px 14px; }
  .ev-title { font-weight: 800; font-size: 14px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ev-meta { margin-top: 6px; display: flex; align-items: center; gap: 4px; color: #64748b; font-weight: 600; font-size: 12px; }
  .ev-meta :global(iconify-icon) { color: #94a3b8; }
  .ev-loc { margin-top: 4px; display: flex; align-items: center; gap: 4px; color: #94a3b8; font-weight: 600; font-size: 12px; }
  .ev-loc :global(iconify-icon) { color: #cbd5e1; }
</style>
