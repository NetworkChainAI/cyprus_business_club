<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";

  export let data: any;

  type UserItem = {
    id: string;
    email: string;
    info: { name: string | null; photo: string | null; status: string | null } | null;
  };

  const following: UserItem[] = data?.following ?? [];

  function displayName(u: UserItem) {
    return u.info?.name ?? u.email;
  }

  function resolvePhoto(u: UserItem) {
    return photoSrc(u.info?.photo ?? null, 80);
  }

  let brokenPhotos: Record<string, boolean> = {};
  let unfollowing: Record<string, boolean> = {};

  async function unfollow(userId: string) {
    unfollowing[userId] = true;
    try {
      const res = await fetch("/api/member/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error("Unfollow error:", err);
    } finally {
      unfollowing[userId] = false;
    }
  }
</script>

<div class="card">
  <div class="head">
    <iconify-icon icon="lucide:user-plus" width="18"></iconify-icon>
    <span>{$t('profile.tabs.following')}</span>
    <span class="count">{following.length}</span>
  </div>

  {#if following.length === 0}
    <div class="empty">
      <iconify-icon icon="lucide:user-search" width="28"></iconify-icon>
      <div class="empty-text">{$t('profile.empty.noFollowing')}</div>
      <a href="/members" class="browse-btn">
        <iconify-icon icon="lucide:users" width="14"></iconify-icon>
        {$t('profile.following.browseMembers')}
      </a>
    </div>
  {:else}
    <div class="list">
      {#each following as user (user.id)}
        <div class="user-row">
          <a href="/members/{user.id}" class="user-link">
            <div class="avatar">
              {#if resolvePhoto(user) && !brokenPhotos[user.id]}
                <img src={resolvePhoto(user)} alt={displayName(user)} on:error={() => (brokenPhotos = { ...brokenPhotos, [user.id]: true })} />
              {:else}
                <div class="fallback">{displayName(user)[0].toUpperCase()}</div>
              {/if}
            </div>

            <div class="info">
              <div class="name">{displayName(user)}</div>
              <div class="status">{user.info?.status ?? $t('profile.header.defaultStatus')}</div>
            </div>
          </a>

          <button
            class="unfollow-btn"
            on:click={() => unfollow(user.id)}
            disabled={unfollowing[user.id]}
          >
            {#if unfollowing[user.id]}
              <iconify-icon icon="lucide:loader-2" width="13" class="spin"></iconify-icon>
            {:else}
              <iconify-icon icon="lucide:user-minus" width="13"></iconify-icon>
            {/if}
            {$t('profile.following.unfollow')}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 22px;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    margin-bottom: 16px;
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

  .empty {
    min-height: 180px;
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

  .empty-text {
    font-weight: 800;
    font-size: 14px;
    color: #94a3b8;
  }

  .browse-btn {
    margin-top: 4px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
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

  .list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .user-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px 6px 0;
    border-radius: 12px;
    transition: background 0.15s;
  }

  .user-row:hover {
    background: #f8fafc;
  }

  .user-link {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    text-decoration: none;
    padding: 4px 4px 4px 12px;
    border-radius: 12px;
  }

  .avatar {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    overflow: hidden;
    background: #f1f5f9;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fallback {
    font-weight: 900;
    color: #64748b;
    font-size: 16px;
  }

  .info {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .status {
    font-weight: 600;
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .unfollow-btn {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .unfollow-btn :global(iconify-icon) {
    color: #94a3b8;
  }

  .unfollow-btn:hover {
    border-color: #fca5a5;
    background: #fef2f2;
    color: #dc2626;
  }

  .unfollow-btn:hover :global(iconify-icon) {
    color: #dc2626;
  }

  .unfollow-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .unfollow-btn :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 480px) {
    .unfollow-btn span {
      display: none;
    }
  }
</style>
