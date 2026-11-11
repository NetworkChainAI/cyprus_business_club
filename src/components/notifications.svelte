<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";
  import { withLang } from "$lib/utils/withLang";

  type Notification = {
    id: string;
    emoji?: string;
    textKey: string;
    link?: string;
    isRead: boolean;
    type?: string;
    createdAt: string;
  };

  let notifications: Notification[] = [];
  let unreadCount = 0;
  let open = false;

  let dropdownRef: HTMLDivElement | null = null;
  let bellBtnRef: HTMLButtonElement | null = null;

  const typeIcons: Record<string, string> = {
    event_registration: "lucide:calendar-check",
    new_participant: "lucide:user-plus",
    new_follower: "lucide:heart",
    community_join_request: "lucide:inbox",
    community_accepted: "lucide:check-circle",
    community_rejected: "lucide:x-circle",
    community_request_sent: "lucide:send",
    community_post: "lucide:newspaper",
  };

  function iconForType(n: Notification): string {
    if (n.type && typeIcons[n.type]) return typeIcons[n.type];
    return "lucide:bell";
  }

  function timeAgo(dateStr: string): string {
    const now = Date.now();
    const d = new Date(dateStr).getTime();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return t.get('common.time.justNow');
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t.get('common.time.minutesAgo')}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t.get('common.time.hoursAgo')}`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ${t.get('common.time.daysAgo')}`;
    return new Date(dateStr).toLocaleDateString(getDateLocale(), { month: "short", day: "numeric" });
  }

  async function loadNotifications() {
    try {
      const res = await fetch("/api/user/notifications?unread=true");
      if (res.ok) {
        const data = await res.json();
        notifications = data.notifications ?? [];
        unreadCount = notifications.length;
      }
    } catch {}
  }

  async function markAllAsRead() {
    await fetch("/api/user/notifications/read-all", { method: "POST" });
    notifications = [];
    unreadCount = 0;
  }

  async function openNotification(n: Notification) {
    fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    notifications = notifications.filter((x) => x.id !== n.id);
    unreadCount = notifications.length;
    open = false;
    if (n.link) goto(withLang(n.link));
  }

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Node;
    if (!open) return;
    if (dropdownRef && dropdownRef.contains(target)) return;
    if (bellBtnRef && bellBtnRef.contains(target)) return;
    open = false;
  }

  onMount(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    document.addEventListener("click", handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener("click", handleClickOutside);
    };
  });
</script>

<div class="bell-wrap">
  <button
    class="bell-btn"
    bind:this={bellBtnRef}
    on:click|stopPropagation={() => (open = !open)}
    aria-label="Notifications"
  >
    <iconify-icon icon="lucide:bell" width="20" height="20"></iconify-icon>
    {#if unreadCount > 0}
      <span class="badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
    {/if}
  </button>

  {#if open}
    <div class="dropdown" bind:this={dropdownRef}>
      <div class="dd-header">
        <div class="dd-title">
          <iconify-icon icon="lucide:bell" width="16" height="16"></iconify-icon>
          {$t('notifications.title')}
          {#if unreadCount > 0}
            <span class="dd-count">{unreadCount}</span>
          {/if}
        </div>
        {#if unreadCount > 0}
          <button class="mark-all" on:click={markAllAsRead}>
            <iconify-icon icon="lucide:check-check" width="14" height="14"></iconify-icon>
            {$t('notifications.markAllRead')}
          </button>
        {/if}
      </div>

      {#if notifications.length === 0}
        <div class="empty">
          <iconify-icon icon="lucide:bell-off" width="32" height="32"></iconify-icon>
          <div class="empty-title">{$t('notifications.empty')}</div>
          <div class="empty-sub">{$t('notifications.caughtUp')}</div>
        </div>
      {:else}
        <div class="notif-list">
          {#each notifications as n (n.id)}
            <button
              class="notif-item unread"
              on:click={() => openNotification(n)}
            >
              <div class="notif-icon unread">
                <iconify-icon icon={iconForType(n)} width="18" height="18"></iconify-icon>
              </div>
              <div class="notif-body">
                <div class="notif-text">{n.textKey}</div>
                <div class="notif-time">{timeAgo(n.createdAt)}</div>
              </div>
              <div class="notif-dot"></div>
            </button>
          {/each}
        </div>
      {/if}

      <a class="dd-footer" href={withLang('/profile/notifications')} on:click={() => (open = false)}>
        <iconify-icon icon="lucide:history" width="14" height="14"></iconify-icon>
        {$t('notifications.viewAll')}
      </a>
    </div>
  {/if}
</div>

<style>
  .bell-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .bell-btn {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: #64748b;
    transition: all 0.15s;
  }

  .bell-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #0f172a;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    background: #ef4444;
    color: #fff;
    font-size: 10px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    border: 2px solid #fff;
    line-height: 1;
  }

  /* ===== Dropdown ===== */
  .dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 360px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.10), 0 2px 6px rgba(15, 23, 42, 0.06);
    z-index: 5000;
    overflow: hidden;
    animation: ddIn 0.15s ease-out;
  }

  @keyframes ddIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dd-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  .dd-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .dd-title :global(iconify-icon) {
    color: #4f46e5;
  }

  .dd-count {
    font-size: 11px;
    font-weight: 800;
    color: #4f46e5;
    background: rgba(79, 70, 229, 0.08);
    padding: 2px 8px;
    border-radius: 6px;
  }

  .mark-all {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: none;
    padding: 0;
    color: #4f46e5;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .mark-all:hover {
    opacity: 0.7;
  }

  /* ===== Empty ===== */
  .empty {
    padding: 32px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
    color: #94a3b8;
  }

  .empty-title {
    font-weight: 800;
    font-size: 14px;
    color: #64748b;
  }

  .empty-sub {
    font-weight: 600;
    font-size: 12px;
    color: #94a3b8;
  }

  /* ===== List ===== */
  .notif-list {
    max-height: 360px;
    overflow-y: auto;
    padding: 6px;
  }

  .notif-list::-webkit-scrollbar {
    width: 4px;
  }

  .notif-list::-webkit-scrollbar-track {
    background: transparent;
  }

  .notif-list::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
  }

  /* ===== Item ===== */
  .notif-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    font-family: inherit;
    transition: background 0.12s;
  }

  .notif-item:hover {
    background: #f8fafc;
  }

  .notif-item.unread {
    background: rgba(79, 70, 229, 0.04);
  }

  .notif-item.unread:hover {
    background: rgba(79, 70, 229, 0.07);
  }

  /* ===== Icon ===== */
  .notif-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #f1f5f9;
    display: grid;
    place-items: center;
    color: #64748b;
    flex: 0 0 auto;
  }

  .notif-icon.unread {
    background: rgba(79, 70, 229, 0.10);
    color: #4f46e5;
  }

  /* ===== Body ===== */
  .notif-body {
    flex: 1;
    min-width: 0;
  }

  .notif-text {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
  }

  .notif-item.unread .notif-text {
    font-weight: 700;
  }

  .notif-time {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* ===== Footer link ===== */
  .dd-footer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 16px;
    border-top: 1px solid #f1f5f9;
    color: #4f46e5;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: background 0.12s;
  }

  .dd-footer:hover {
    background: #f8fafc;
  }

  /* ===== Dot ===== */
  .notif-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4f46e5;
    flex: 0 0 auto;
    margin-top: 6px;
  }

  /* ===== Responsive ===== */
  @media (max-width: 520px) {
    .dropdown {
      position: fixed;
      top: 72px;
      left: 12px;
      right: 12px;
      width: auto;
      max-height: calc(100dvh - 84px);
      border-radius: 14px;
    }

    .notif-list {
      max-height: calc(100dvh - 180px);
    }
  }
</style>
