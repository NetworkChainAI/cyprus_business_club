<script lang="ts">
  import { photoSrc } from "$lib/utils/photo";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";

  export let data: any;
  const followers = data?.followers ?? [];

  function displayName(u: any) { return u?.info?.name ?? u?.email ?? "User"; }
  function resolvePhoto(u: any) { return photoSrc(u?.info?.photo ?? null, 80); }
  let brokenPhotos: Record<string, boolean> = {};
</script>

<div class="card">
  <div class="head">
    <iconify-icon icon="lucide:users" width="18"></iconify-icon>
    <span>{$t('admin.memberDetail.followers')}</span>
    <span class="count">{followers.length}</span>
  </div>

  {#if followers.length === 0}
    <div class="empty">
      <iconify-icon icon="lucide:user-x" width="28"></iconify-icon>
      <div class="empty-text">{$t('admin.memberDetail.noFollowersYet')}</div>
    </div>
  {:else}
    <div class="list">
      {#each followers as user (user.id)}
        <a href={withLang(`/members/${user.id}`)} class="user-row">
          <div class="avatar">
            {#if resolvePhoto(user) && !brokenPhotos[user.id]}
              <img src={resolvePhoto(user)} alt={displayName(user)} on:error={() => (brokenPhotos = { ...brokenPhotos, [user.id]: true })} />
            {:else}
              <div class="fb">{displayName(user)[0].toUpperCase()}</div>
            {/if}
          </div>
          <div class="info">
            <div class="name">{displayName(user)}</div>
            <div class="status">{user.info?.status ?? "Member"}</div>
          </div>
          <iconify-icon icon="lucide:chevron-right" width="16" class="arrow"></iconify-icon>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 22px; }
  .head { display: flex; align-items: center; gap: 8px; font-weight: 900; font-size: 15px; color: #0f172a; margin-bottom: 16px; }
  .head :global(iconify-icon) { color: #4f46e5; }
  .count { margin-left: auto; background: #eef2ff; color: #4f46e5; font-weight: 800; font-size: 12px; padding: 2px 8px; border-radius: 8px; }
  .empty { min-height: 140px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #94a3b8; }
  .empty :global(iconify-icon) { color: #cbd5e1; }
  .empty-text { font-weight: 800; font-size: 14px; color: #94a3b8; }
  .list { display: flex; flex-direction: column; gap: 4px; }
  .user-row { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; text-decoration: none; transition: background 0.15s; }
  .user-row:hover { background: #f8fafc; }
  .avatar { width: 44px; height: 44px; border-radius: 999px; overflow: hidden; background: #f1f5f9; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .fb { font-weight: 900; color: #64748b; font-size: 16px; }
  .info { flex: 1; min-width: 0; }
  .name { font-weight: 800; font-size: 14px; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .status { font-weight: 600; font-size: 12px; color: #94a3b8; margin-top: 2px; }
  .user-row :global(.arrow) { color: #cbd5e1; flex-shrink: 0; transition: color 0.15s, transform 0.15s; }
  .user-row:hover :global(.arrow) { color: #4f46e5; transform: translateX(2px); }
</style>
