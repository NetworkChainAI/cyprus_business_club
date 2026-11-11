<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";

  export let data: any;

  const ROLES = ["USER", "PARTNER", "RESIDENT", "ADMIN"] as const;

  const roleBadgeColors: Record<string, { bg: string; color: string }> = {
    USER: { bg: "#f1f5f9", color: "#64748b" },
    PARTNER: { bg: "#eef2ff", color: "#4f46e5" },
    RESIDENT: { bg: "#ecfdf5", color: "#059669" },
    ADMIN: { bg: "#fef2f2", color: "#dc2626" },
  };

  let searchInput = data.q ?? "";
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let busyUserId: string | null = null;

  function onSearchInput() {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const q = searchInput.trim();
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      goto(`/platform-admin/users?${params.toString()}`, { replaceState: true });
    }, 400);
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (data.q) params.set("q", data.q);
    if (p > 1) params.set("page", String(p));
    goto(`/platform-admin/users?${params.toString()}`);
  }

  async function changeRole(userId: string, newRole: string) {
    if (busyUserId) return;
    busyUserId = userId;

    const prevUsers = [...data.users];
    data.users = data.users.map((u: any) =>
      u.id === userId ? { ...u, info: { ...u.info, role: newRole } } : u
    );

    try {
      const res = await fetch("/api/platform-admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (!res.ok) {
        data.users = prevUsers;
        const msg = await res.text();
        alert(msg || $t('admin.platformAdmin.failedUpdate'));
      }
    } catch {
      data.users = prevUsers;
      alert($t('admin.platformAdmin.networkError'));
    } finally {
      busyUserId = null;
    }
  }

  let brokenPhotos: Record<string, boolean> = {};

  $: totalPages = Math.ceil(data.total / data.pageSize);
</script>

<div class="page-head">
  <h1>{$t('admin.platformAdmin.users')}</h1>
  <span class="user-count">{data.total} {$t('admin.platformAdmin.total')}</span>
</div>

<div class="search-bar">
  <div class="search-wrap">
    <iconify-icon icon="lucide:search" width="16" height="16"></iconify-icon>
    <input
      type="text"
      placeholder={$t('admin.platformAdmin.searchUsers')}
      bind:value={searchInput}
      on:input={onSearchInput}
    />
  </div>
</div>

{#if data.users.length === 0}
  <div class="empty">
    <iconify-icon icon="lucide:users" width="32" height="32"></iconify-icon>
    <div class="empty-text">{$t('admin.platformAdmin.noUsersFound')}</div>
  </div>
{:else}
  <div class="user-list">
    {#each data.users as user (user.id)}
      <div class="user-row" class:busy={busyUserId === user.id}>
        <div class="user-avatar">
          {#if user.info?.photo && !brokenPhotos[user.id]}
            <img src={photoSrc(user.info.photo, 80)} alt="" on:error={() => (brokenPhotos = { ...brokenPhotos, [user.id]: true })} />
          {:else}
            <div class="avatar-fallback">
              {(user.info?.name || user.email || "?")[0].toUpperCase()}
            </div>
          {/if}
        </div>

        <div class="user-info">
          <div class="user-name">{user.info?.name || $t('admin.platformAdmin.noName')}</div>
          <div class="user-email">{user.email}</div>
        </div>

        <div class="user-status">
          <span class="status-label">{user.info?.status || $t('admin.platformAdmin.member')}</span>
        </div>

        <div class="user-role">
          <select
            value={user.info?.role ?? "USER"}
            on:change={(e) => changeRole(user.id, e.currentTarget.value)}
            disabled={busyUserId !== null}
            style="border-color: {roleBadgeColors[user.info?.role ?? 'USER']?.bg}"
          >
            {#each ROLES as r}
              <option value={r}>{r}</option>
            {/each}
          </select>
          <span
            class="role-badge"
            style="background: {roleBadgeColors[user.info?.role ?? 'USER']?.bg}; color: {roleBadgeColors[user.info?.role ?? 'USER']?.color}"
          >
            {user.info?.role ?? "USER"}
          </span>
        </div>
      </div>
    {/each}
  </div>

  {#if totalPages > 1}
    <div class="pagination">
      <button
        class="page-btn"
        disabled={data.page <= 1}
        on:click={() => goToPage(data.page - 1)}
      >
        <iconify-icon icon="lucide:chevron-left" width="16" height="16"></iconify-icon>
      </button>

      <span class="page-info">{$t('admin.platformAdmin.page')} {data.page} {$t('admin.platformAdmin.of')} {totalPages}</span>

      <button
        class="page-btn"
        disabled={data.page >= totalPages}
        on:click={() => goToPage(data.page + 1)}
      >
        <iconify-icon icon="lucide:chevron-right" width="16" height="16"></iconify-icon>
      </button>
    </div>
  {/if}
{/if}

<style>
  .page-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .page-head h1 {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  .user-count {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 8px;
  }

  /* Search */
  .search-bar {
    margin-bottom: 16px;
  }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 0 14px;
    max-width: 400px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .search-wrap:focus-within {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .search-wrap :global(iconify-icon) {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .search-wrap input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    font-weight: 400;
    color: #0f172a;
    padding: 10px 0;
    width: 100%;
    font-family: inherit;
  }

  .search-wrap input::placeholder {
    color: #94a3b8;
  }

  /* Empty */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 48px 16px;
    color: #94a3b8;
  }

  .empty-text {
    font-size: 15px;
    font-weight: 700;
    color: #64748b;
  }

  /* User list */
  .user-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
  }

  .user-row {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    transition: background 0.1s;
  }

  .user-row:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }

  .user-row:hover {
    background: #f8fafc;
  }

  .user-row.busy {
    opacity: 0.6;
    pointer-events: none;
  }

  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .avatar-fallback {
    width: 100%;
    height: 100%;
    background: #4f46e5;
    color: #fff;
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 15px;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-email {
    font-size: 12px;
    color: #94a3b8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .user-status {
    flex-shrink: 0;
  }

  .status-label {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 4px 10px;
    border-radius: 8px;
  }

  .user-role {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .user-role select {
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }

  .user-role select:focus {
    border-color: #4f46e5;
  }

  .role-badge {
    display: none;
  }

  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
  }

  .page-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }

  .page-btn:hover:not(:disabled) {
    background: #f1f5f9;
    color: #0f172a;
  }

  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
  }

  @media (max-width: 640px) {
    .user-row {
      flex-wrap: wrap;
      gap: 8px;
    }

    .user-status {
      display: none;
    }

    .user-role select {
      display: none;
    }

    .role-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 6px;
    }
  }
</style>
