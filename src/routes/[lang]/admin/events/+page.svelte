<script lang="ts">
  import { photoSrc } from "$lib/utils/photo";
  import { invalidateAll } from "$app/navigation";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";

  export let data: any;

  $: events = data?.events ?? [];

  let toggling: Record<string, boolean> = {};

  async function toggleActive(eventId: string, current: boolean) {
    if (toggling[eventId]) return;
    toggling[eventId] = true;

    try {
      const fd = new FormData();
      fd.append("isActive", String(!current));

      const res = await fetch(`/api/events/${eventId}`, { method: "PATCH", body: fd });
      if (res.ok) {
        await invalidateAll();
      }
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      toggling[eventId] = false;
    }
  }

  function formatDate(d: any) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<div class="events-admin">
  <div class="section-header">
    <h2>{$t('admin.events.title')}</h2>
    <span class="count">{events.length} {$t('admin.events.count')}</span>
  </div>

  {#if events.length === 0}
    <div class="empty">
      <iconify-icon icon="lucide:calendar-x" width="36"></iconify-icon>
      <p>{$t('admin.events.noEvents')}</p>
      <a href={withLang("/admin/create-event")} class="create-btn">
        <iconify-icon icon="lucide:plus" width="16"></iconify-icon>
        {$t('admin.events.createEvent')}
      </a>
    </div>
  {:else}
    <div class="event-list">
      {#each events as event (event.id)}
        <div class="event-card" class:inactive={!event.isActive}>
          <div class="event-photo">
            {#if event.photo}
              <img src={photoSrc(event.photo, 200)} alt={event.title} />
            {:else}
              <div class="photo-placeholder">
                <iconify-icon icon="lucide:image" width="24"></iconify-icon>
              </div>
            {/if}
          </div>

          <div class="event-info">
            <div class="event-title">{event.title}</div>
            <div class="event-meta">
              <span>
                <iconify-icon icon="lucide:calendar" width="13"></iconify-icon>
                {formatDate(event.date)}
              </span>
              <span>
                <iconify-icon icon="lucide:map-pin" width="13"></iconify-icon>
                {event.location}
              </span>
              <span>
                <iconify-icon icon="lucide:users" width="13"></iconify-icon>
                {event.registrationsCount} {$t('admin.events.registered')}
              </span>
              {#if event.price}
                <span>
                  <iconify-icon icon="lucide:banknote" width="13"></iconify-icon>
                  ${event.price}
                </span>
              {:else}
                <span class="free-badge">{$t('admin.events.free')}</span>
              {/if}
            </div>
            {#if event.categories.length > 0}
              <div class="event-cats">
                {#each event.categories as cat}
                  <span class="cat-chip">{cat.name}</span>
                {/each}
              </div>
            {/if}
          </div>

          <div class="event-actions">
            <div class="switch-row">
              <span class="switch-label" class:active-label={event.isActive} class:inactive-label={!event.isActive}>
                {event.isActive ? $t('admin.events.active') : $t('admin.events.inactive')}
              </span>
              <button
                class="switch"
                class:on={event.isActive}
                disabled={toggling[event.id]}
                on:click={() => toggleActive(event.id, event.isActive)}
              >
                <span class="switch-thumb"></span>
              </button>
            </div>
            <a href={withLang(`/admin/events/${event.id}/edit`)} class="edit-btn">
              <iconify-icon icon="lucide:pencil" width="14"></iconify-icon>
              {$t('admin.events.edit')}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .events-admin { }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .section-header h2 {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }
  .count {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
  }

  .empty {
    text-align: center;
    padding: 60px 20px;
    color: #94a3b8;
  }
  .empty p { font-weight: 700; margin-top: 10px; }
  .create-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 10px 20px;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
  }
  .create-btn:hover { background: #4338ca; }

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .event-card {
    display: flex;
    gap: 16px;
    align-items: center;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px;
    transition: opacity 0.2s;
  }
  .event-card.inactive { opacity: 0.55; }

  .event-photo {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    flex: 0 0 auto;
    background: #f1f5f9;
  }
  .event-photo img { width: 100%; height: 100%; object-fit: cover; }
  .photo-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: #cbd5e1;
  }

  .event-info { flex: 1; min-width: 0; }
  .event-title {
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .event-meta {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: #64748b;
    font-weight: 700;
    font-size: 12px;
  }
  .event-meta span { display: inline-flex; align-items: center; gap: 4px; }
  .free-badge { color: #22c55e; font-weight: 800; }

  .event-cats {
    margin-top: 8px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .cat-chip {
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
    font-weight: 700;
    font-size: 11px;
  }

  .event-actions {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }

  .switch-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .switch-label {
    font-size: 12px;
    font-weight: 800;
  }
  .active-label { color: #22c55e; }
  .inactive-label { color: #94a3b8; }

  .switch {
    position: relative;
    width: 44px;
    height: 24px;
    border-radius: 999px;
    border: none;
    background: #cbd5e1;
    cursor: pointer;
    padding: 0;
    transition: background 0.2s;
  }
  .switch.on { background: #22c55e; }
  .switch:disabled { opacity: 0.6; cursor: not-allowed; }

  .switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: transform 0.2s;
  }
  .switch.on .switch-thumb { transform: translateX(20px); }

  .edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #4f46e5;
    font-weight: 700;
    font-size: 12px;
    text-decoration: none;
    transition: all 0.15s;
  }
  .edit-btn:hover { background: #f8fafc; border-color: #4f46e5; }

  @media (max-width: 640px) {
    .event-card { flex-direction: column; align-items: stretch; }
    .event-photo { width: 100%; height: 160px; }
    .event-actions { flex-direction: row; justify-content: space-between; align-items: center; }
  }
</style>
