<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;

  type Notification = {
    id: string;
    emoji?: string;
    textKey: string;
    type?: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
  };

  $: notifications = (data.notifications ?? []) as Notification[];

  const typeIcons: Record<string, string> = {
    event_registration: "lucide:calendar-check",
    new_participant: "lucide:user-plus",
    new_follower: "lucide:heart",
    community_join_request: "lucide:inbox",
    community_accepted: "lucide:check-circle",
    community_rejected: "lucide:x-circle",
    community_request_sent: "lucide:send",
  };

  $: typeLabels = ({
    event_registration: $t('admin.notifications.event'),
    new_participant: $t('admin.notifications.event'),
    new_follower: $t('admin.notifications.follow'),
    community_join_request: $t('admin.notifications.community'),
    community_accepted: $t('admin.notifications.community'),
    community_rejected: $t('admin.notifications.community'),
    community_request_sent: $t('admin.notifications.community'),
  }) as Record<string, string>;

  function iconForType(n: Notification): string {
    if (n.type && typeIcons[n.type]) return typeIcons[n.type];
    return "lucide:bell";
  }

  function labelForType(n: Notification): string {
    if (n.type && typeLabels[n.type]) return typeLabels[n.type];
    return generalLabel;
  }

  $: generalLabel = $t('admin.notifications.general');
  $: todayLabel = $t('admin.notifications.today');
  $: yesterdayLabel = $t('admin.notifications.yesterday');

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return todayLabel + ", " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) {
      return yesterdayLabel + ", " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: diffDays > 365 ? "numeric" : undefined,
    }) + ", " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
    const groups: Map<string, Notification[]> = new Map();
    const now = new Date();
    const today = now.toDateString();
    const yesterday = new Date(now.getTime() - 86400000).toDateString();

    for (const n of items) {
      const d = new Date(n.createdAt).toDateString();
      let label: string;
      if (d === today) label = todayLabel;
      else if (d === yesterday) label = yesterdayLabel;
      else label = new Date(n.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(n);
    }

    return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
  }

  $: grouped = (() => { void todayLabel; void yesterdayLabel; return groupByDate(notifications); })();

  async function markAsRead(n: Notification) {
    if (n.isRead) return;
    await fetch("/api/user/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id }),
    });
    n.isRead = true;
    notifications = [...notifications];
  }

  async function markAllAsRead() {
    await fetch("/api/user/notifications/read-all", { method: "POST" });
    notifications = notifications.map((n) => ({ ...n, isRead: true }));
  }

  $: unreadCount = notifications.filter((n) => !n.isRead).length;
</script>

<div class="wrap">
  {#if unreadCount > 0}
    <div class="toolbar">
      <button class="mark-all-btn" on:click={markAllAsRead}>
        <iconify-icon icon="lucide:check-check" width="16" height="16"></iconify-icon>
        {$t('admin.notifications.markAllRead')}
        <span class="unread-badge">{unreadCount}</span>
      </button>
    </div>
  {/if}

  {#if notifications.length === 0}
    <div class="empty-card">
      <iconify-icon icon="lucide:bell-off" width="40" height="40"></iconify-icon>
      <div class="empty-title">{$t('admin.notifications.empty')}</div>
      <div class="empty-sub">{$t('admin.notifications.emptySub')}</div>
    </div>
  {:else}
    <div class="scroll-area">
      {#each grouped as group}
        <div class="date-label">{group.label}</div>
        <div class="notif-group">
          {#each group.items as n (n.id)}
            <a
              class="notif-row"
              class:unread={!n.isRead}
              href={n.link ?? "#"}
              on:click={() => markAsRead(n)}
            >
              <div class="notif-icon" class:unread={!n.isRead}>
                <iconify-icon icon={iconForType(n)} width="20" height="20"></iconify-icon>
              </div>
              <div class="notif-content">
                <div class="notif-text">{n.textKey}</div>
                <div class="notif-meta">
                  <span class="notif-type">{labelForType(n)}</span>
                  <span class="notif-time">{formatDate(n.createdAt)}</span>
                </div>
              </div>
              {#if !n.isRead}
                <div class="notif-dot"></div>
              {/if}
            </a>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .wrap {
    display: flex;
    flex-direction: column;
  }

  .scroll-area {
    max-height: calc(100vh - 320px);
    overflow-y: auto;
    padding-right: 4px;
  }

  .scroll-area::-webkit-scrollbar {
    width: 4px;
  }

  .scroll-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .scroll-area::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 2px;
  }

  .toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }

  .mark-all-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .mark-all-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .mark-all-btn :global(iconify-icon) {
    color: #4f46e5;
  }

  .unread-badge {
    font-size: 11px;
    font-weight: 800;
    color: #fff;
    background: #ef4444;
    padding: 1px 7px;
    border-radius: 6px;
  }

  /* ===== Date label ===== */
  .date-label {
    font-size: 12px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 4px;
    margin-bottom: 8px;
  }

  /* ===== Group ===== */
  .notif-group {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 16px;
  }

  /* ===== Row ===== */
  .notif-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    text-decoration: none;
    color: inherit;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.12s;
  }

  .notif-row:last-child {
    border-bottom: none;
  }

  .notif-row:hover {
    background: #f8fafc;
  }

  .notif-row.unread {
    background: rgba(79, 70, 229, 0.03);
  }

  .notif-row.unread:hover {
    background: rgba(79, 70, 229, 0.06);
  }

  /* ===== Icon ===== */
  .notif-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
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

  /* ===== Content ===== */
  .notif-content {
    flex: 1;
    min-width: 0;
  }

  .notif-text {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
  }

  .notif-row.unread .notif-text {
    font-weight: 700;
  }

  .notif-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
  }

  .notif-type {
    font-size: 11px;
    font-weight: 700;
    color: #4f46e5;
    background: rgba(79, 70, 229, 0.06);
    padding: 2px 8px;
    border-radius: 6px;
  }

  .notif-time {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
  }

  /* ===== Dot ===== */
  .notif-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #4f46e5;
    flex: 0 0 auto;
    margin-top: 8px;
  }

  /* ===== Empty ===== */
  .empty-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    color: #94a3b8;
  }

  .empty-title {
    font-weight: 800;
    font-size: 16px;
    color: #64748b;
  }

  .empty-sub {
    font-weight: 600;
    font-size: 13px;
    color: #94a3b8;
  }

  @media (max-width: 520px) {
    .notif-row {
      padding: 12px 12px;
    }
  }
</style>
