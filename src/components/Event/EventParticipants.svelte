<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";

  export let data: any;

  const attendees: any[] = data?.attendees ?? [];
  const attendeesCount: number = data?.attendeesCount ?? 0;

  const SHOW_LIMIT = 8;
  let showAll = false;

  $: visible = showAll ? attendees : attendees.slice(0, SHOW_LIMIT);
  $: hasMore = attendees.length > SHOW_LIMIT;

  function displayName(u: any) {
    return u?.info?.name ?? u?.email ?? t.get('events.detail.userFallback');
  }

  function userPhoto(u: any) {
    return photoSrc(u?.info?.photo ?? null);
  }

  function userRole(u: any) {
    return u?.info?.status ?? "member";
  }
</script>

{#if attendeesCount > 0}
  <section class="card">
    <div class="head">
      <div class="head-left">
        <iconify-icon icon="lucide:users" width="18" height="18"></iconify-icon>
        <span>{$t('events.detail.participants')}</span>
      </div>
      <span class="pill">{attendeesCount}</span>
    </div>

    <div class="list">
      {#each visible as u (u.id)}
        <a class="row" href={`/members/${u.id}`}>
          <div class="av">
            {#if userPhoto(u)}
              <img src={userPhoto(u)} alt={displayName(u)} loading="lazy" decoding="async" />
            {:else}
              <span class="av-fb">{displayName(u)[0].toUpperCase()}</span>
            {/if}
          </div>
          <div class="info">
            <div class="name">{displayName(u)}</div>
            <div class="role">{userRole(u)}</div>
          </div>
        </a>
      {/each}
    </div>

    {#if hasMore}
      <button class="show-more" on:click={() => (showAll = !showAll)}>
        {#if showAll}
          {$t('events.detail.showLess')}
        {:else}
          {$t('events.detail.showAllParticipants')} ({attendeesCount})
        {/if}
      </button>
    {/if}
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
    justify-content: space-between;
  }

  .head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
  }

  .head-left :global(iconify-icon) {
    color: #4f46e5;
  }

  .pill {
    background: #eef2ff;
    color: #4f46e5;
    border-radius: 999px;
    padding: 4px 12px;
    font-weight: 800;
    font-size: 12px;
    flex-shrink: 0;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 10px;
    text-decoration: none;
    transition: background 0.12s;
    min-width: 0;
  }

  .row:hover {
    background: #f8fafc;
  }

  .av {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    overflow: hidden;
    background: #f1f5f9;
    border: 2px solid #e2e8f0;
    position: relative;
  }

  .av img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .av-fb {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 13px;
    color: #64748b;
  }

  .info {
    min-width: 0;
    flex: 1;
  }

  .name {
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .role {
    font-weight: 600;
    font-size: 11px;
    color: #94a3b8;
    text-transform: lowercase;
    margin-top: 1px;
  }

  .show-more {
    width: 100%;
    padding: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
    cursor: pointer;
    transition: all 0.15s;
  }

  .show-more:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }
</style>
