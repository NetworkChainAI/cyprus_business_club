<script lang="ts">
  import { goto } from "$app/navigation";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";

  export let data: any;

  $: filters = [
    { value: "PENDING", label: $t('admin.platformAdmin.pending'), icon: "lucide:clock" },
    { value: "ACTIVE", label: $t('admin.platformAdmin.active'), icon: "lucide:check-circle" },
    { value: "DISABLED", label: $t('admin.platformAdmin.disabled'), icon: "lucide:x-circle" },
  ] as const;

  function switchFilter(f: string) {
    goto(`/platform-admin/communities?filter=${f}`, { replaceState: true });
  }

  let busyId: string | null = null;

  async function updateStatus(communityId: string, newStatus: string) {
    if (busyId) return;
    busyId = communityId;

    const prev = [...data.communities];
    data.communities = data.communities.map((c: any) =>
      c.id === communityId ? { ...c, status: newStatus } : c
    );

    try {
      const res = await fetch("/api/platform-admin/communities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId, status: newStatus }),
      });
      if (!res.ok) {
        data.communities = prev;
        const msg = await res.json().catch(() => null);
        alert(msg?.error || $t('admin.platformAdmin.failedToUpdate'));
      } else {
        if (newStatus !== data.filter) {
          data.communities = data.communities.filter((c: any) => c.id !== communityId);
          data.counts[data.filter]--;
          data.counts[newStatus]++;
          data.counts = { ...data.counts };
        }
      }
    } catch {
      data.communities = prev;
      alert($t('admin.platformAdmin.networkError'));
    } finally {
      busyId = null;
    }
  }

  function formatDate(d: any) {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function ownerName(c: any) {
    const o = c.owners?.[0];
    return o?.info?.name || o?.email || "Unknown";
  }

  let brokenLogos: Record<string, boolean> = {};
  let brokenOwnerPhotos: Record<string, boolean> = {};
</script>

<div class="page-head">
  <h1>{$t('admin.platformAdmin.communityRequests')}</h1>
</div>

<div class="filters">
  {#each filters as f}
    <button
      class="filter-btn"
      class:active={data.filter === f.value}
      on:click={() => switchFilter(f.value)}
    >
      <iconify-icon icon={f.icon} width="15"></iconify-icon>
      {f.label}
      <span class="filter-count">{data.counts[f.value] ?? 0}</span>
    </button>
  {/each}
</div>

{#if data.communities.length === 0}
  <div class="empty">
    <iconify-icon icon="lucide:inbox" width="36"></iconify-icon>
    <div class="empty-text">
      {#if data.filter === "PENDING"}
        {$t('admin.platformAdmin.noPendingCommunities')}
      {:else if data.filter === "ACTIVE"}
        {$t('admin.platformAdmin.noActiveCommunities')}
      {:else}
        {$t('admin.platformAdmin.noDisabledCommunities')}
      {/if}
    </div>
  </div>
{:else}
  <div class="community-list">
    {#each data.communities as community (community.id)}
      <div class="community-card" class:busy={busyId === community.id}>
        <div class="community-header">
          <div class="community-logo">
            {#if community.logoUrl && !brokenLogos[community.id]}
              <img
                src={photoSrc(community.logoUrl, 120)}
                alt={community.name}
                on:error={() => (brokenLogos = { ...brokenLogos, [community.id]: true })}
              />
            {:else}
              <div class="logo-fallback">
                <iconify-icon icon="lucide:users" width="20"></iconify-icon>
              </div>
            {/if}
          </div>

          <div class="community-info">
            <div class="community-name">{community.name}</div>
            <div class="community-meta">
              <span class="privacy-badge" class:private={community.isPrivate}>
                <iconify-icon icon={community.isPrivate ? "lucide:lock" : "lucide:globe"} width="12"></iconify-icon>
                {community.isPrivate ? $t('admin.platformAdmin.private') : $t('admin.platformAdmin.public')}
              </span>
              <span>
                <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                {formatDate(community.createdAt)}
              </span>
              <span>
                <iconify-icon icon="lucide:users" width="12"></iconify-icon>
                {community._count?.members ?? 0} {$t('admin.platformAdmin.members')}
              </span>
              <span>
                <iconify-icon icon="lucide:calendar-days" width="12"></iconify-icon>
                {community._count?.events ?? 0} {$t('admin.platformAdmin.events')}
              </span>
            </div>
          </div>

          <div class="community-owner">
            {#each community.owners.slice(0, 2) as owner, i}
              <div class="owner-chip">
                <div class="owner-avatar">
                  {#if owner.info?.photo && !brokenOwnerPhotos[community.id + "_" + i]}
                    <img
                      src={photoSrc(owner.info.photo, 60)}
                      alt=""
                      on:error={() => (brokenOwnerPhotos = { ...brokenOwnerPhotos, [community.id + "_" + i]: true })}
                    />
                  {:else}
                    <div class="owner-fallback">{(owner.info?.name || owner.email || "?")[0].toUpperCase()}</div>
                  {/if}
                </div>
                <div class="owner-details">
                  <div class="owner-name">{owner.info?.name || "Unknown"}</div>
                  <div class="owner-email">{owner.email}</div>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <div class="community-actions">
          {#if data.filter === "PENDING"}
            <button class="action-btn approve" on:click={() => updateStatus(community.id, "ACTIVE")} disabled={busyId !== null}>
              <iconify-icon icon="lucide:check" width="15"></iconify-icon>
              {$t('admin.platformAdmin.approve')}
            </button>
            <button class="action-btn reject" on:click={() => updateStatus(community.id, "DISABLED")} disabled={busyId !== null}>
              <iconify-icon icon="lucide:x" width="15"></iconify-icon>
              {$t('admin.platformAdmin.reject')}
            </button>
          {:else if data.filter === "ACTIVE"}
            <button class="action-btn reject" on:click={() => updateStatus(community.id, "DISABLED")} disabled={busyId !== null}>
              <iconify-icon icon="lucide:ban" width="15"></iconify-icon>
              {$t('admin.platformAdmin.disable')}
            </button>
          {:else}
            <button class="action-btn approve" on:click={() => updateStatus(community.id, "ACTIVE")} disabled={busyId !== null}>
              <iconify-icon icon="lucide:check" width="15"></iconify-icon>
              {$t('admin.platformAdmin.reactivate')}
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  .page-head { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .page-head h1 { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; }

  .filters { display: flex; gap: 6px; margin-bottom: 20px; flex-wrap: wrap; }

  .filter-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 10px; border: 1px solid #e2e8f0;
    background: #fff; color: #64748b; font-family: inherit;
    font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.15s;
  }
  .filter-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .filter-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }
  .filter-btn.active :global(iconify-icon) { color: #fff; }
  .filter-btn :global(iconify-icon) { color: #94a3b8; }

  .filter-count {
    font-size: 11px; font-weight: 800; padding: 1px 7px; border-radius: 6px;
    background: rgba(0,0,0,0.06);
  }
  .filter-btn.active .filter-count { background: rgba(255,255,255,0.2); color: #fff; }

  .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 16px; color: #94a3b8; }
  .empty-text { font-size: 15px; font-weight: 700; color: #64748b; }

  .community-list { display: flex; flex-direction: column; gap: 12px; }

  .community-card {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
    padding: 18px; transition: opacity 0.15s;
  }
  .community-card.busy { opacity: 0.5; pointer-events: none; }

  .community-header { display: flex; gap: 14px; align-items: flex-start; }

  .community-logo {
    width: 56px; height: 56px; border-radius: 12px; overflow: hidden;
    flex: 0 0 auto; background: #f1f5f9;
  }
  .community-logo img { width: 100%; height: 100%; object-fit: cover; }
  .logo-fallback { width: 100%; height: 100%; display: grid; place-items: center; color: #cbd5e1; }

  .community-info { flex: 1; min-width: 0; }
  .community-name { font-size: 16px; font-weight: 900; color: #0f172a; margin-bottom: 4px; }

  .community-meta {
    display: flex; flex-wrap: wrap; gap: 10px;
    font-size: 12px; font-weight: 600; color: #64748b;
  }
  .community-meta span { display: inline-flex; align-items: center; gap: 4px; }
  .community-meta :global(iconify-icon) { color: #94a3b8; }

  .privacy-badge { color: #22c55e; }
  .privacy-badge.private { color: #f59e0b; }

  .community-owner {
    display: flex; flex-direction: column; gap: 6px; flex: 0 0 auto;
  }

  .owner-chip {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; background: #f8fafc; border-radius: 10px;
  }

  .owner-avatar {
    width: 32px; height: 32px; border-radius: 8px; overflow: hidden; flex: 0 0 auto;
  }
  .owner-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .owner-fallback {
    width: 100%; height: 100%; background: #4f46e5; color: #fff;
    display: grid; place-items: center; font-weight: 800; font-size: 13px;
  }

  .owner-name { font-size: 13px; font-weight: 800; color: #0f172a; }
  .owner-email { font-size: 11px; color: #94a3b8; }

  .community-actions {
    display: flex; gap: 8px; margin-top: 14px;
    padding-top: 14px; border-top: 1px solid #f1f5f9;
  }

  .action-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px; border-radius: 10px; border: none;
    font-family: inherit; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
  }
  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .action-btn.approve { background: #ecfdf5; color: #059669; }
  .action-btn.approve:hover:not(:disabled) { background: #d1fae5; }
  .action-btn.reject { background: #fef2f2; color: #dc2626; }
  .action-btn.reject:hover:not(:disabled) { background: #fee2e2; }

  @media (max-width: 768px) {
    .community-header { flex-wrap: wrap; }
    .community-owner { width: 100%; }
  }
</style>
