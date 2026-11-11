<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import { formatDate as fmtDate, formatTime as fmtTime } from "$lib/utils/dateLocale";

  export let data: any;

  type TicketEvent = {
    id: string;
    title: string;
    date: string;
    location: string;
    photo: string | null;
    price: number | null;
    categories?: { id: string; name: string }[];
  };

  const upcomingEvents: TicketEvent[] = data?.upcomingEvents ?? [];
  const visitedEvents: TicketEvent[] = data?.visitedEvents ?? [];

  function formatTicketDate(d: string) {
    return fmtDate(d, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  function formatTicketTime(d: string) {
    return fmtTime(d, { hour: "2-digit", minute: "2-digit" });
  }

  let downloading: Record<string, boolean> = {};

  async function downloadTicket(event: TicketEvent) {
    downloading[event.id] = true;
    try {
      const res = await fetch(`/api/ticket/${event.id}/pdf`);
      if (!res.ok) throw new Error("Failed to generate ticket");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${event.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      downloading[event.id] = false;
    }
  }
</script>

<div class="tickets">
  {#if upcomingEvents.length === 0 && visitedEvents.length === 0}
    <div class="card empty">
      <iconify-icon icon="lucide:ticket" width="32"></iconify-icon>
      <div class="empty-title">{$t('profile.empty.noTickets')}</div>
      <div class="empty-sub">{$t('profile.tickets.registerToSee')}</div>
      <a href="/events" class="browse-btn">
        <iconify-icon icon="lucide:compass" width="15"></iconify-icon>
        {$t('profile.events.browseEvents')}
      </a>
    </div>
  {:else}
    {#if upcomingEvents.length > 0}
      <div class="section-head">
        <iconify-icon icon="lucide:calendar-check" width="18"></iconify-icon>
        <span>{$t('profile.events.upcoming')}</span>
        <span class="count">{upcomingEvents.length}</span>
      </div>

      <div class="list">
        {#each upcomingEvents as ev (ev.id)}
          <div class="ticket">
            <div class="ticket-left">
              {#if ev.photo}
                <div class="ticket-photo">
                  <img src={photoSrc(ev.photo)} alt={ev.title} />
                </div>
              {:else}
                <div class="ticket-photo placeholder">
                  <iconify-icon icon="lucide:calendar-days" width="24"></iconify-icon>
                </div>
              {/if}
            </div>

            <div class="ticket-body">
              <a href="/events/{ev.id}" class="ticket-title">{ev.title}</a>

              <div class="ticket-meta">
                <span class="meta-item">
                  <iconify-icon icon="lucide:calendar" width="13"></iconify-icon>
                  {formatTicketDate(ev.date)}
                </span>
                <span class="meta-item">
                  <iconify-icon icon="lucide:clock" width="13"></iconify-icon>
                  {formatTicketTime(ev.date)}
                </span>
                <span class="meta-item">
                  <iconify-icon icon="lucide:map-pin" width="13"></iconify-icon>
                  {ev.location}
                </span>
              </div>

              {#if ev.categories && ev.categories.length > 0}
                <div class="ticket-tags">
                  {#each ev.categories as cat}
                    <span class="tag">{cat.name}</span>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="ticket-actions">
              {#if ev.price}
                <div class="price">${ev.price}</div>
              {:else}
                <div class="price free">{$t('profile.events.free')}</div>
              {/if}

              <button
                class="download-btn"
                on:click={() => downloadTicket(ev)}
                disabled={downloading[ev.id]}
              >
                {#if downloading[ev.id]}
                  <iconify-icon icon="lucide:loader-2" width="15" class="spin"></iconify-icon>
                {:else}
                  <iconify-icon icon="lucide:download" width="15"></iconify-icon>
                {/if}
                PDF
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if visitedEvents.length > 0}
      <div class="section-head past">
        <iconify-icon icon="lucide:history" width="18"></iconify-icon>
        <span>{$t('profile.tickets.pastEvents')}</span>
        <span class="count">{visitedEvents.length}</span>
      </div>

      <div class="list">
        {#each visitedEvents as ev (ev.id)}
          <div class="ticket past">
            <div class="ticket-left">
              {#if ev.photo}
                <div class="ticket-photo">
                  <img src={photoSrc(ev.photo)} alt={ev.title} />
                </div>
              {:else}
                <div class="ticket-photo placeholder">
                  <iconify-icon icon="lucide:calendar-days" width="24"></iconify-icon>
                </div>
              {/if}
            </div>

            <div class="ticket-body">
              <a href="/events/{ev.id}" class="ticket-title">{ev.title}</a>

              <div class="ticket-meta">
                <span class="meta-item">
                  <iconify-icon icon="lucide:calendar" width="13"></iconify-icon>
                  {formatTicketDate(ev.date)}
                </span>
                <span class="meta-item">
                  <iconify-icon icon="lucide:map-pin" width="13"></iconify-icon>
                  {ev.location}
                </span>
              </div>
            </div>

            <div class="ticket-actions">
              <span class="attended-badge">
                <iconify-icon icon="lucide:check-circle" width="14"></iconify-icon>
                {$t('profile.events.attended')}
              </span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .tickets {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

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

  .empty :global(iconify-icon) {
    color: #cbd5e1;
  }

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

  .browse-btn:hover {
    background: #4338ca;
  }

  .browse-btn :global(iconify-icon) {
    color: #fff;
  }

  .section-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    padding: 4px 0;
  }

  .section-head :global(iconify-icon) {
    color: #4f46e5;
  }

  .section-head.past :global(iconify-icon) {
    color: #94a3b8;
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

  .ticket {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    gap: 14px;
    align-items: center;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .ticket:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 16px rgba(79, 70, 229, 0.06);
  }

  .ticket.past {
    opacity: 0.7;
  }

  .ticket.past:hover {
    opacity: 1;
  }

  .ticket-left {
    flex-shrink: 0;
  }

  .ticket-photo {
    width: 72px;
    height: 72px;
    border-radius: 12px;
    overflow: hidden;
    background: #f1f5f9;
  }

  .ticket-photo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ticket-photo.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
  }

  .ticket-body {
    flex: 1;
    min-width: 0;
  }

  .ticket-title {
    font-weight: 800;
    font-size: 15px;
    color: #0f172a;
    text-decoration: none;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ticket-title:hover {
    color: #4f46e5;
  }

  .ticket-meta {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: #64748b;
    font-weight: 600;
    font-size: 12px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .meta-item :global(iconify-icon) {
    color: #94a3b8;
  }

  .ticket-tags {
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

  .ticket-actions {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .price {
    font-weight: 900;
    font-size: 16px;
    color: #0f172a;
  }

  .price.free {
    color: #22c55e;
    font-size: 13px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    padding: 2px 10px;
    border-radius: 8px;
  }

  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #4f46e5;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .download-btn:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .download-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .download-btn :global(iconify-icon) {
    color: #4f46e5;
  }

  .download-btn :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .attended-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 8px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #22c55e;
    font-weight: 700;
    font-size: 12px;
  }

  .attended-badge :global(iconify-icon) {
    color: #22c55e;
  }

  @media (max-width: 580px) {
    .ticket {
      flex-wrap: wrap;
    }

    .ticket-photo {
      width: 56px;
      height: 56px;
    }

    .ticket-actions {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid #f1f5f9;
    }
  }
</style>
