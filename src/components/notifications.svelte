<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  type Notification = {
    id: string;
    emoji?: string;
    textKey: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
  };

  let notifications: Notification[] = [];
  let unreadCount = 0;
  let open = false;

  let dropdownRef: HTMLDivElement | null = null;
  let bellBtnRef: HTMLButtonElement | null = null;

  async function loadNotifications() {
    const res = await fetch("/api/user/notifications");
    if (res.ok) {
      const data = await res.json();
      notifications = data.notifications;
      unreadCount = notifications.filter((n) => !n.isRead).length;
    }
  }

  async function markAllAsRead() {
    await fetch("/api/user/notifications/read-all", { method: "POST" });

    notifications = notifications.map((n) => ({ ...n, isRead: true }));
    unreadCount = 0;
  }

  async function openNotification(n: Notification) {
    if (!n.isRead) {
      await fetch("/api/user/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });

      n.isRead = true;
      unreadCount = notifications.filter((n) => !n.isRead).length;
    }

    if (n.link) window.location.href = n.link;
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

    const interval = setInterval(loadNotifications, 1000);

    document.addEventListener("click", handleClickOutside);

    onDestroy(() => {
      clearInterval(interval);
      document.removeEventListener("click", handleClickOutside);
    });
  });
</script>
<div class="bell-container">
  <button
    class="bell-btn"
    bind:this={bellBtnRef}
    on:click|stopPropagation={() => (open = !open)}
    aria-label="Notifications"
  >
    <div class="icon-wrap">
      <ion-icon name="notifications-outline"></ion-icon>

      {#if unreadCount > 0}
        <span class="badge">{unreadCount}</span>
      {/if}
    </div>
  </button>

  {#if open}
    <div class="dropdown" bind:this={dropdownRef}>
      <div class="dropdown-header">
        <h4>Notifications</h4>

        {#if unreadCount > 0}
          <button class="read-all" on:click={markAllAsRead}>
            Mark all read
          </button>
        {/if}
      </div>

      {#if notifications.length === 0}
        <p class="empty">No notifications</p>
      {:else}
        <ul class="notif-list">
          {#each notifications as n}
            <li
              class="notif-item {n.isRead ? 'read' : 'unread'}"
              on:click={() => openNotification(n)}
            >
              <div class="emoji">{n.emoji ?? "🔔"}</div>

              <div class="text">
                <div class="msg">{n.textKey}</div>
                <small>
                  {new Date(n.createdAt).toLocaleString("ru-RU")}
                </small>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  {/if}
</div>


<style>
 /* ===== Container ===== */
.bell-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* ===== Button / Icon ===== */
.bell-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* иконка = chat / wallet */
.bell-btn ion-icon {
  width: 20px;
  height: 20px;
  color: #000;
  opacity: 0.85;
  transition:
    opacity 0.2s ease,
    transform 0.15s ease;
}

.bell-btn:hover ion-icon {
  opacity: 1;
  transform: scale(1.05);
}

/* ===== Badge (точно как chat) ===== */
.badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ===== Dropdown ===== */
.dropdown {
  position: absolute;
  right: 0;
  top: 38px;
  width: 320px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.12),
    0 2px 6px rgba(15, 23, 42, 0.08);
  z-index: 5000;
  padding: 1rem;
  animation: fadeIn 0.18s ease;
}

/* animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Header ===== */
.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0b3954;
}

/* ===== Mark all read ===== */
.read-all {
  background: none;
  border: none;
  padding: 0;
  color: #0b3954;
  font-size: 0.78rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s ease;
}

.read-all:hover {
  opacity: 1;
  text-decoration: underline;
}

/* ===== Empty ===== */
.empty {
  color: #7b8794;
  text-align: center;
  padding: 1rem 0;
  font-size: 0.85rem;
}

/* ===== List ===== */
.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
}

/* ===== Item ===== */
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.notif-item:hover {
  background: #eef6ff;
}

/* unread highlight */
.notif-item.unread {
  background: #eaf3ff;
  border-left: 3px solid #0b3954;
}

/* read */
.notif-item.read {
  opacity: 0.55;
}

/* ===== Emoji ===== */
.emoji {
  font-size: 1.2rem;
  margin-top: 3px;
  line-height: 1;
}

/* ===== Text ===== */
.text .msg {
  font-size: 0.92rem;
  color: #0b3954;
  line-height: 1.3;
}

.text small {
  display: block;
  margin-top: 2px;
  font-size: 0.75rem;
  color: #7b8794;
}
/* ===== Container ===== */
.bell-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* ===== Button / Icon ===== */
.bell-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.icon-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

/* иконка = chat / wallet */
.bell-btn ion-icon {
  width: 20px;
  height: 20px;
  color: #000;
  opacity: 0.85;
  transition:
    opacity 0.2s ease,
    transform 0.15s ease;
}

.bell-btn:hover ion-icon {
  opacity: 1;
  transform: scale(1.05);
}

/* ===== Badge (точно как chat) ===== */
.badge {
  position: absolute;
  top: -4px;
  right: -6px;
  background: #ef4444;
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

/* ===== Dropdown ===== */
.dropdown {
  position: absolute;
  right: 0;
  top: 38px;
  width: 320px;
  background: #ffffff;
  border-radius: 14px;
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.12),
    0 2px 6px rgba(15, 23, 42, 0.08);
  z-index: 5000;
  padding: 1rem;
  animation: fadeIn 0.18s ease;
}

/* animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== Header ===== */
.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0b3954;
}

/* ===== Mark all read ===== */
.read-all {
  background: none;
  border: none;
  padding: 0;
  color: #0b3954;
  font-size: 0.78rem;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.15s ease;
}

.read-all:hover {
  opacity: 1;
  text-decoration: underline;
}

/* ===== Empty ===== */
.empty {
  color: #7b8794;
  text-align: center;
  padding: 1rem 0;
  font-size: 0.85rem;
}

/* ===== List ===== */
.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 280px;
  overflow-y: auto;
}

/* ===== Item ===== */
.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 0.6rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.notif-item:hover {
  background: #eef6ff;
}

/* unread highlight */
.notif-item.unread {
  background: #eaf3ff;
  border-left: 3px solid #0b3954;
}

/* read */
.notif-item.read {
  opacity: 0.55;
}

/* ===== Emoji ===== */
.emoji {
  font-size: 1.2rem;
  margin-top: 3px;
  line-height: 1;
}

/* ===== Text ===== */
.text .msg {
  font-size: 0.92rem;
  color: #0b3954;
  line-height: 1.3;
}

.text small {
  display: block;
  margin-top: 2px;
  font-size: 0.75rem;
  color: #7b8794;
}

</style>
