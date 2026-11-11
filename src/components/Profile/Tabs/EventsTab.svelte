<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import { formatDate as fmtDate, formatTime as fmtTime } from "$lib/utils/dateLocale";

  export let data: any;

  type EventItem = {
    id: string;
    title: string;
    date: string;
    location: string;
    photo: string | null;
    price: number | null;
    chatId?: string | null;
    categories?: { id: string; name: string }[];
  };

  const upcoming: EventItem[] = data?.upcomingEvents ?? [];
  const visited: EventItem[] = data?.visitedEvents ?? [];
  const created: EventItem[] = data?.createdEvents ?? [];

  const total = upcoming.length + visited.length + created.length;

  function formatEventDate(d: string) {
    return fmtDate(d, { month: "short", day: "numeric", year: "numeric" });
  }

  function formatEventTime(d: string) {
    return fmtTime(d, { hour: "2-digit", minute: "2-digit" });
  }

  function isPast(d: string) {
    return new Date(d) < new Date();
  }
</script>

<div class="events">
  {#if total === 0}
    <div class="card empty">
      <iconify-icon icon="lucide:calendar-x" width="32"></iconify-icon>
      <div class="empty-title">{$t('profile.empty.noEvents')}</div>
      <div class="empty-sub">{$t('profile.events.registerOrCreate')}</div>
      <a href="/events" class="browse-btn">
        <iconify-icon icon="lucide:compass" width="15"></iconify-icon>
        {$t('profile.events.browseEvents')}
      </a>
    </div>
  {:else}
    <!-- Upcoming -->
    {#if upcoming.length > 0}
      <div class="section-head">
        <iconify-icon icon="lucide:calendar-check" width="18"></iconify-icon>
        <span>{$t('profile.events.upcoming')}</span>
        <span class="count">{upcoming.length}</span>
      </div>
      <div class="grid">
        {#each upcoming as ev (ev.id)}
          <a href="/events/{ev.id}" class="event-card">
            <div class="event-img">
              {#if ev.photo}
                <img src={photoSrc(ev.photo)} alt={ev.title} />
              {:else}
                <div class="event-img-placeholder">
                  <iconify-icon icon="lucide:calendar-days" width="28"></iconify-icon>
                </div>
              {/if}
              {#if ev.price}
                <span class="price-tag">${ev.price}</span>
              {:else}
                <span class="price-tag free">{$t('profile.events.free')}</span>
              {/if}
            </div>
            <div class="event-body">
              <div class="event-title-row">
                <div class="event-title">{ev.title}</div>
                {#if ev.chatId}
                  <a href="/chat/{ev.chatId}" class="chat-icon" title={$t('profile.events.openEventChat')} on:click|stopPropagation>
                    <iconify-icon icon="lucide:message-square" width="14"></iconify-icon>
                  </a>
                {/if}
              </div>
              <div class="event-meta">
                <span class="meta-item">
                  <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                  {formatEventDate(ev.date)}
                </span>
                <span class="meta-item">
                  <iconify-icon icon="lucide:clock" width="12"></iconify-icon>
                  {formatEventTime(ev.date)}
                </span>
              </div>
              <div class="event-location">
                <iconify-icon icon="lucide:map-pin" width="12"></iconify-icon>
                {ev.location}
              </div>
              {#if ev.categories && ev.categories.length > 0}
                <div class="event-tags">
                  {#each ev.categories.slice(0, 2) as cat}
                    <span class="tag">{cat.name}</span>
                  {/each}
                </div>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}

    <!-- Visited -->
    {#if visited.length > 0}
      <div class="section-head past">
        <iconify-icon icon="lucide:history" width="18"></iconify-icon>
        <span>{$t('profile.events.visited')}</span>
        <span class="count">{visited.length}</span>
      </div>
      <div class="grid">
        {#each visited as ev (ev.id)}
          <a href="/events/{ev.id}" class="event-card past">
            <div class="event-img">
              {#if ev.photo}
                <img src={photoSrc(ev.photo)} alt={ev.title} />
              {:else}
                <div class="event-img-placeholder">
                  <iconify-icon icon="lucide:calendar-days" width="28"></iconify-icon>
                </div>
              {/if}
              <span class="attended-badge">
                <iconify-icon icon="lucide:check-circle" width="12"></iconify-icon>
                {$t('profile.events.attended')}
              </span>
            </div>
            <div class="event-body">
              <div class="event-title-row">
                <div class="event-title">{ev.title}</div>
                {#if ev.chatId}
                  <a href="/chat/{ev.chatId}" class="chat-icon" title={$t('profile.events.openEventChat')} on:click|stopPropagation>
                    <iconify-icon icon="lucide:message-square" width="14"></iconify-icon>
                  </a>
                {/if}
              </div>
              <div class="event-meta">
                <span class="meta-item">
                  <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                  {formatEventDate(ev.date)}
                </span>
              </div>
              <div class="event-location">
                <iconify-icon icon="lucide:map-pin" width="12"></iconify-icon>
                {ev.location}
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    <!-- Created -->
    {#if created.length > 0}
      <div class="section-head created">
        <iconify-icon icon="lucide:plus-circle" width="18"></iconify-icon>
        <span>{$t('profile.events.createdByYou')}</span>
        <span class="count">{created.length}</span>
      </div>
      <div class="grid">
        {#each created as ev (ev.id)}
          <a href="/events/{ev.id}" class="event-card">
            <div class="event-img">
              {#if ev.photo}
                <img src={photoSrc(ev.photo)} alt={ev.title} />
              {:else}
                <div class="event-img-placeholder">
                  <iconify-icon icon="lucide:calendar-days" width="28"></iconify-icon>
                </div>
              {/if}
              <span class="owner-badge">
                <iconify-icon icon="lucide:crown" width="12"></iconify-icon>
                {$t('profile.events.organizer')}
              </span>
            </div>
            <div class="event-body">
              <div class="event-title-row">
                <div class="event-title">{ev.title}</div>
                {#if ev.chatId}
                  <a href="/chat/{ev.chatId}" class="chat-icon" title={$t('profile.events.openEventChat')} on:click|stopPropagation>
                    <iconify-icon icon="lucide:message-square" width="14"></iconify-icon>
                  </a>
                {/if}
              </div>
              <div class="event-meta">
                <span class="meta-item">
                  <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                  {formatEventDate(ev.date)}
                </span>
                <span class="meta-item">
                  <iconify-icon icon="lucide:clock" width="12"></iconify-icon>
                  {formatEventTime(ev.date)}
                </span>
              </div>
              <div class="event-location">
                <iconify-icon icon="lucide:map-pin" width="12"></iconify-icon>
                {ev.location}
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .events {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  /* ===== Empty ===== */
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 22px;
  }

  .empty {
    min-height: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #94a3b8;
  }

  .empty :global(iconify-icon) { color: #cbd5e1; }

  .empty-title {
    font-weight: 900;
    font-size: 16px;
    color: #64748b;
  }

  .empty-sub {
    font-weight: 600;
    font-size: 13px;
    color: #94a3b8;
  }

  .browse-btn {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 18px;
    border-radius: 10px;
    background: #4f46e5;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
    transition: background 0.15s;
  }

  .browse-btn:hover { background: #4338ca; }
  .browse-btn :global(iconify-icon) { color: #fff; }

  /* ===== Section head ===== */
  .section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    padding: 2px 0;
  }

  .section-head :global(iconify-icon) { color: #4f46e5; }
  .section-head.past :global(iconify-icon) { color: #94a3b8; }
  .section-head.created :global(iconify-icon) { color: #f59e0b; }

  .count {
    margin-left: auto;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 800;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 8px;
  }

  /* ===== Grid ===== */
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  @media (max-width: 640px) {
    .grid { grid-template-columns: 1fr; }
  }

  /* ===== Event Card ===== */
  .event-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
    text-decoration: none;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  }

  .event-card:hover {
    border-color: #c7d2fe;
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.08);
    transform: translateY(-2px);
  }

  .event-card.past {
    opacity: 0.75;
  }

  .event-card.past:hover {
    opacity: 1;
  }

  /* ===== Image ===== */
  .event-img {
    position: relative;
    width: 100%;
    height: 140px;
    background: #f1f5f9;
    overflow: hidden;
  }

  .event-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .event-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
  }

  .price-tag {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.75);
    color: #fff;
    font-weight: 800;
    font-size: 12px;
    backdrop-filter: blur(4px);
  }

  .price-tag.free {
    background: rgba(22, 163, 74, 0.85);
  }

  .attended-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(22, 163, 74, 0.85);
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    backdrop-filter: blur(4px);
  }

  .attended-badge :global(iconify-icon) { color: #fff; }

  .owner-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(245, 158, 11, 0.9);
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    backdrop-filter: blur(4px);
  }

  .owner-badge :global(iconify-icon) { color: #fff; }

  /* ===== Body ===== */
  .event-body {
    padding: 12px 14px 14px;
  }

  .event-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .event-title {
    flex: 1;
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .chat-icon {
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 8px;
    background: #4f46e5;
    color: #fff;
    display: grid;
    place-items: center;
    text-decoration: none;
    transition: background 0.15s;
  }
  .chat-icon:hover { background: #4338ca; }
  .chat-icon :global(iconify-icon) { color: #fff; }

  .event-meta {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    color: #64748b;
    font-weight: 600;
    font-size: 12px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .meta-item :global(iconify-icon) { color: #94a3b8; }

  .event-location {
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
    color: #94a3b8;
    font-weight: 600;
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-location :global(iconify-icon) { color: #cbd5e1; }

  .event-tags {
    margin-top: 8px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag {
    padding: 2px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    font-weight: 700;
    font-size: 11px;
    color: #64748b;
  }
</style>
