<script lang="ts">
  import { photoSrc } from "$lib/utils/photo";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";

  export let data: any;

  $: communities = data?.ownedCommunities ?? [];

  function formatDate(d: any) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  let brokenLogos: Record<string, boolean> = {};
</script>

<div class="communities-admin">
  <div class="section-header">
    <h2>{$t('admin.communities.title')}</h2>
    <span class="count">{communities.length} {$t('admin.communities.count')}</span>
  </div>

  {#if communities.length === 0}
    <div class="empty">
      <iconify-icon icon="lucide:users" width="36"></iconify-icon>
      <p>{$t('admin.communities.noCommunities')}</p>
      <a href={withLang("/admin/create-community")} class="create-btn">
        <iconify-icon icon="lucide:plus" width="16"></iconify-icon>
        {$t('admin.communities.createCommunity')}
      </a>
    </div>
  {:else}
    <div class="community-list">
      {#each communities as community (community.id)}
        <div class="community-card">
          <div class="community-logo">
            {#if community.logoUrl && !brokenLogos[community.id]}
              <img
                src={photoSrc(community.logoUrl, 200)}
                alt={community.name}
                on:error={() => (brokenLogos = { ...brokenLogos, [community.id]: true })}
              />
            {:else}
              <div class="logo-placeholder">
                <iconify-icon icon="lucide:users" width="24"></iconify-icon>
              </div>
            {/if}
          </div>

          <div class="community-info">
            <div class="community-title">{community.name}</div>
            <div class="community-meta">
              <span class="privacy-badge" class:private={community.isPrivate}>
                <iconify-icon icon={community.isPrivate ? "lucide:lock" : "lucide:globe"} width="13"></iconify-icon>
                {community.isPrivate ? $t('admin.communities.private') : $t('admin.communities.public')}
              </span>
              <span>
                <iconify-icon icon="lucide:calendar-days" width="13"></iconify-icon>
                {formatDate(community.createdAt)}
              </span>
              <span>
                <iconify-icon icon="lucide:users" width="13"></iconify-icon>
                {community._count?.members ?? 0} {$t('admin.communities.members')}
              </span>
              <span>
                <iconify-icon icon="lucide:calendar" width="13"></iconify-icon>
                {community._count?.events ?? 0} {$t('admin.communities.events')}
              </span>
            </div>
          </div>

          <div class="community-actions">
            <a href={withLang(`/admin/communities/${community.id}/edit`)} class="edit-btn">
              <iconify-icon icon="lucide:pencil" width="14"></iconify-icon>
              {$t('admin.communities.edit')}
            </a>
            <a href={withLang(`/communities/${encodeURIComponent(community.name)}`)} class="view-btn">
              <iconify-icon icon="lucide:external-link" width="14"></iconify-icon>
              {$t('admin.communities.view')}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
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

  .community-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .community-card {
    display: flex;
    gap: 16px;
    align-items: center;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px;
  }

  .community-logo {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    flex: 0 0 auto;
    background: #f1f5f9;
  }
  .community-logo img { width: 100%; height: 100%; object-fit: cover; }
  .logo-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: #cbd5e1;
  }

  .community-info { flex: 1; min-width: 0; }
  .community-title {
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .community-meta {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: #64748b;
    font-weight: 700;
    font-size: 12px;
  }
  .community-meta span { display: inline-flex; align-items: center; gap: 4px; }

  .privacy-badge { color: #22c55e; }
  .privacy-badge.private { color: #f59e0b; }

  .community-actions {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
  }

  .edit-btn, .view-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    font-weight: 700;
    font-size: 12px;
    text-decoration: none;
    transition: all 0.15s;
  }
  .edit-btn { color: #4f46e5; }
  .edit-btn:hover { background: #f8fafc; border-color: #4f46e5; }
  .view-btn { color: #64748b; }
  .view-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

  @media (max-width: 640px) {
    .community-card { flex-direction: column; align-items: stretch; }
    .community-logo { width: 100%; height: 160px; }
    .community-actions { flex-direction: row; justify-content: flex-end; align-items: center; }
  }
</style>
