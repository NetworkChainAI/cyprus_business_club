<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import Notifications from "./notifications.svelte";
  import LocaleSwitcher from "./Parts/LocaleSwitcher.svelte";
  import { withLang } from "$lib/utils/withLang";

  let menuOpen = false;
  let userMenuOpen = false;
  let user: any;
  let unreadChat = 0;
  let logoutLoading = false;

  $: user = $page.data.user;
  $: path = $page.url.pathname.replace(/^\/[a-z]{2}(\/|$)/, '/') || '/';
  $: isChatRoute = path.startsWith("/chat");
  $: userRole = user?.info?.role ?? "USER";

  $: photo = photoSrc(user?.info?.photo ?? null);
  $: userName = user?.info?.name?.trim() || user?.email || "User";
  $: userInitial = userName[0]?.toUpperCase() ?? "U";
  $: socialCapital = $page.data.socialCapital ?? 0;
  $: socialRank = $page.data.socialRank ?? "Explorer";

  $: links = [
    { href: withLang("/events"),      label: $t('common.nav.events'),      icon: "lucide:calendar-days" },
    { href: withLang("/partners"),    label: $t('common.nav.partners'),    icon: "lucide:handshake" },
    { href: withLang("/communities"), label: $t('common.nav.communities'), icon: "lucide:users" },
    { href: withLang("/members"),     label: $t('common.nav.people'),      icon: "lucide:user" },
    { href: withLang("/calendar"),    label: $t('common.nav.calendar'),    icon: "lucide:calendar" },
    { href: withLang("/referral"),    label: $t('common.nav.referral'),    icon: "lucide:gift" },
  ];

  $: profileLinks = [
    { href: "/profile",              label: $t('common.user.myProfile'),    icon: "lucide:user-circle" },
    { href: "/profile/events",       label: $t('common.user.myEvents'),     icon: "lucide:calendar-days" },
    { href: "/profile/achievements", label: $t('common.user.achievements'), icon: "lucide:award" },
    { href: "/profile/settings",     label: $t('common.user.settings'),     icon: "lucide:settings" },
  ];

  function isActive(href: string) {
    const stripped = href.replace(/^\/[a-z]{2}(\/|$)/, '/') || '/';
    return path.startsWith(stripped);
  }

  function closeMenu() { menuOpen = false; }
  function toggleMenu() { menuOpen = !menuOpen; }
  function closeUserMenu() { userMenuOpen = false; }
  function toggleUserMenu() { userMenuOpen = !userMenuOpen; }

  function lockBodyScroll(lock: boolean) {
    if (!browser) return;
    document.documentElement.style.overflow = lock ? "hidden" : "";
    document.body.style.overflow = lock ? "hidden" : "";
  }

  $: if (browser) lockBodyScroll(menuOpen);

  async function fetchUnreadChat() {
    try {
      const res = await fetch("/api/chat/unread");
      if (res.ok) {
        const data = await res.json();
        unreadChat = data.unread ?? 0;
      }
    } catch {}
  }

  async function logout() {
    if (logoutLoading) return;
    logoutLoading = true;
    try {
      await fetch("/api/logout", { method: "POST" });
      closeMenu();
      await goto(withLang("/login"), { invalidateAll: true });
    } catch {
      logoutLoading = false;
    }
  }

  onMount(() => {
    const onResize = () => {
      if (window.innerWidth > 900 && menuOpen) menuOpen = false;
    };
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeMenu(); closeUserMenu(); }
    };

    const onClickOutside = (e: MouseEvent) => {
      if (userMenuOpen) {
        const target = e.target as Element;
        if (!target.closest(".user-menu-wrap")) closeUserMenu();
      }
    };

    document.addEventListener("click", onClickOutside, true);

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeydown);
    fetchUnreadChat();
    const chatInterval = setInterval(fetchUnreadChat, 10000);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeydown);
      document.removeEventListener("click", onClickOutside, true);
      clearInterval(chatInterval);
      lockBodyScroll(false);
    };
  });
</script>

<header class="topbar">
  <div class="topbar-inner">

    <!-- Logo -->
    <a class="brand" href={withLang("/")} aria-label="Go to home">
      <span class="brand-icon">N</span>
    </a>

    <!-- Desktop nav -->
    <nav class="nav desktop" aria-label="Primary">
      {#each links as l}
        <a class="nav-link" class:active={isActive(l.href)} href={l.href}>
          <iconify-icon icon={l.icon} width="18"></iconify-icon>
          <span>{l.label}</span>
        </a>
      {/each}
    </nav>

    <!-- Actions -->
    <div class="actions">
      <LocaleSwitcher />

      {#if user}
        <!-- Chat -->
        <a
          class="icon-btn hide-mobile"
          class:active={isActive("/chat")}
          href={withLang("/chat")}
          aria-label={$t('common.nav.chat')}
          title={$t('common.nav.chat')}
        >
          <iconify-icon icon="lucide:message-circle" width="20" height="20"></iconify-icon>
          {#if unreadChat > 0 && !isChatRoute}
            <span class="icon-badge">{unreadChat > 9 ? "9+" : unreadChat}</span>
          {/if}
        </a>

        <!-- Wallet -->
        <a
          class="icon-btn hide-mobile"
          class:active={isActive("/wallet")}
          href={withLang("/wallet")}
          aria-label={$t('common.nav.wallet')}
          title={$t('common.nav.wallet')}
        >
          <iconify-icon icon="lucide:wallet" width="20" height="20"></iconify-icon>
        </a>

        <!-- Notifications -->
        <div class="notif-wrap"><Notifications /></div>

        <!-- Admin icon (desktop only) -->
        {#if userRole === "ADMIN"}
          <a
            class="icon-btn admin-btn hide-mobile"
            class:active={isActive("/platform-admin")}
            href={withLang("/platform-admin")}
            aria-label={$t('common.nav.admin')}
            title={$t('common.nav.admin')}
          >
            <iconify-icon icon="lucide:shield" width="20" height="20"></iconify-icon>
          </a>
        {/if}

        <!-- User avatar + dropdown (desktop) -->
        <div class="user-menu-wrap hide-mobile">
          <button class="user-avatar-btn" on:click={toggleUserMenu} title={userName} aria-expanded={userMenuOpen}>
            {#if photo}
              <img class="avatar-img" src={photo} alt={userName} />
            {:else}
              <span class="avatar-fallback">{userInitial}</span>
            {/if}
          </button>

          {#if userMenuOpen}
            <div class="user-dropdown">
              <!-- User info head -->
              <div class="ud-head">
                <div class="ud-avatar">
                  {#if photo}
                    <img src={photo} alt={userName} />
                  {:else}
                    <span>{userInitial}</span>
                  {/if}
                </div>
                <div class="ud-info">
                  <div class="ud-name">{userName}</div>
                  {#if user?.email}
                    <div class="ud-email">{user.email}</div>
                  {/if}
                  <div class="ud-chips">
                    <span class="ud-chip ud-chip-sc">
                      <iconify-icon icon="lucide:trophy" width="11"></iconify-icon>
                      {socialCapital}
                    </span>
                    <span class="ud-chip ud-chip-rank">
                      {socialRank}
                    </span>
                  </div>
                </div>
              </div>

              <div class="ud-divider"></div>

              <!-- Profile links -->
              <div class="ud-links">
                {#each profileLinks as pl}
                  <a class="ud-link" href={withLang(pl.href)} on:click={closeUserMenu}>
                    <iconify-icon icon={pl.icon} width="16"></iconify-icon>
                    <span>{pl.label}</span>
                  </a>
                {/each}
              </div>

              <div class="ud-divider"></div>

              <button class="ud-link ud-logout" on:click={logout} disabled={logoutLoading}>
                <iconify-icon icon="lucide:log-out" width="16"></iconify-icon>
                <span>{logoutLoading ? $t('common.user.loggingOut') : $t('common.user.logout')}</span>
              </button>
            </div>
          {/if}
        </div>

      {:else}
        <a class="btn btn-ghost hide-mobile" href={withLang("/login")}>{$t('common.btn.login')}</a>
      {/if}

      <!-- Burger -->
      <button
        class="burger"
        on:click={toggleMenu}
        aria-label={$t('common.drawer.toggle')}
        aria-expanded={menuOpen}
      >
        <span class="line" class:open={menuOpen}></span>
        <span class="line" class:open={menuOpen}></span>
        <span class="line" class:open={menuOpen}></span>
      </button>
    </div>

  </div>

  <!-- Overlay -->
  {#if menuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <div class="overlay" on:click={closeMenu} aria-hidden="true"></div>
  {/if}

  <!-- Drawer -->
  <div class="drawer" class:open={menuOpen} aria-label={$t('common.drawer.title')}>

    <!-- Drawer header with user card -->
    <div class="drawer-head">
      {#if user}
        <div class="drawer-user">
          {#if photo}
            <img class="drawer-avatar-img" src={photo} alt={userName} />
          {:else}
            <span class="drawer-avatar-fallback">{userInitial}</span>
          {/if}
          <div class="drawer-user-info">
            <div class="drawer-user-name">{userName}</div>
            <div class="drawer-rank">
              <iconify-icon icon="lucide:trophy" width="11"></iconify-icon>
              {socialCapital} · {socialRank}
            </div>
          </div>
        </div>
      {:else}
        <div class="drawer-title">{$t('common.drawer.title')}</div>
      {/if}
      <button class="drawer-close" type="button" on:click={closeMenu} aria-label={$t('common.drawer.close')}>
        <iconify-icon icon="lucide:x" width="18"></iconify-icon>
      </button>
    </div>

    <!-- Drawer body -->
    <div class="drawer-body">

      <!-- Main nav -->
      <div class="drawer-section">
        {#each links as l}
          <a class="drawer-link" class:active={isActive(l.href)} href={l.href} on:click={closeMenu}>
            <iconify-icon icon={l.icon} width="18"></iconify-icon>
            <span>{l.label}</span>
          </a>
        {/each}
      </div>

      {#if user}
        <!-- Chat + Wallet -->
        <div class="drawer-divider"></div>
        <div class="drawer-section">
          <a class="drawer-link" class:active={isActive("/chat")} href={withLang("/chat")} on:click={closeMenu}>
            <iconify-icon icon="lucide:message-circle" width="18"></iconify-icon>
            <span>{$t('common.nav.chat')}</span>
            {#if unreadChat > 0 && !isChatRoute}
              <span class="drawer-badge">{unreadChat > 9 ? "9+" : unreadChat}</span>
            {/if}
          </a>
          <a class="drawer-link" class:active={isActive("/wallet")} href={withLang("/wallet")} on:click={closeMenu}>
            <iconify-icon icon="lucide:wallet" width="18"></iconify-icon>
            <span>{$t('common.nav.wallet')}</span>
          </a>
        </div>

        <!-- Admin -->
        {#if userRole === "ADMIN"}
          <div class="drawer-divider"></div>
          <div class="drawer-section">
            <a class="drawer-link admin-link" class:active={isActive("/platform-admin")} href={withLang("/platform-admin")} on:click={closeMenu}>
              <iconify-icon icon="lucide:shield" width="18"></iconify-icon>
              <span>{$t('common.nav.admin')}</span>
              <span class="admin-tag">Admin</span>
            </a>
          </div>
        {/if}

        <!-- Profile links -->
        <div class="drawer-divider"></div>
        <div class="drawer-section">
          {#each profileLinks as pl}
            <a class="drawer-link" class:active={isActive(pl.href)} href={withLang(pl.href)} on:click={closeMenu}>
              <iconify-icon icon={pl.icon} width="18"></iconify-icon>
              <span>{pl.label}</span>
            </a>
          {/each}
        </div>

        <!-- Logout -->
        <div class="drawer-divider"></div>
        <div class="drawer-section">
          <button class="drawer-link danger-link" on:click={logout} disabled={logoutLoading}>
            <iconify-icon icon="lucide:log-out" width="18"></iconify-icon>
            <span>{logoutLoading ? $t('common.user.loggingOut') : $t('common.user.logout')}</span>
          </button>
        </div>

      {:else}
        <div class="drawer-divider"></div>
        <div class="drawer-section">
          <a class="drawer-link" href={withLang("/login")} on:click={closeMenu}>
            <iconify-icon icon="lucide:log-in" width="18"></iconify-icon>
            <span>{$t('common.btn.login')}</span>
          </a>
        </div>
      {/if}

    </div>
  </div>
</header>

<style>
.topbar {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
}

.topbar-inner {
  height: 64px;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 18px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

/* ===== Brand ===== */
.brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  flex: 0 0 auto;
}

.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #4f46e5;
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 16px;
  font-weight: 900;
  transition: transform 0.15s;
}

.brand:hover .brand-icon { transform: scale(1.05); }

/* ===== Desktop nav ===== */
.nav.desktop {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
  overflow: hidden;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 11px;
  border-radius: 10px;
  text-decoration: none;
  color: #64748b;
  font-weight: 700;
  font-size: 13px;
  white-space: nowrap;
  flex: 0 0 auto;
  transition: all 0.15s;
}

.nav-link:hover { background: #f1f5f9; color: #0f172a; }
.nav-link.active { color: #4f46e5; background: rgba(79,70,229,0.08); font-weight: 800; }

/* ===== Actions ===== */
.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  height: 38px;
  padding: 0 16px;
  border-radius: 12px;
  text-decoration: none;
  font-weight: 800;
  font-size: 13px;
  border: 1px solid transparent;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-ghost { background: #fff; color: #0f172a; border-color: #e2e8f0; }
.btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }

/* ===== Icon buttons ===== */
.icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.15s;
  text-decoration: none;
  flex: 0 0 auto;
}

.icon-btn :global(iconify-icon) {
  display: block;
  flex-shrink: 0;
}

.icon-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.icon-btn.active { background: rgba(79,70,229,0.08); border-color: rgba(79,70,229,0.2); color: #4f46e5; }

.admin-btn {
  border-color: rgba(79,70,229,0.3);
  color: #4f46e5;
  background: rgba(79,70,229,0.05);
}
.admin-btn:hover { background: rgba(79,70,229,0.1); border-color: rgba(79,70,229,0.4); color: #4338ca; }
.admin-btn.active { background: rgba(79,70,229,0.12); }

.icon-badge {
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

/* ===== User menu wrap + avatar ===== */
.user-menu-wrap {
  position: relative;
  flex: 0 0 auto;
}

.user-avatar-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  flex: 0 0 auto;
  transition: all 0.15s;
  display: block;
  cursor: pointer;
  padding: 0;
  background: none;
}

.user-avatar-btn:hover { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

.avatar-img { width: 40px; height: 40px; object-fit: cover; display: block; }

.avatar-fallback {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4f46e5;
  color: #fff;
  font-weight: 900;
  font-size: 14px;
}

/* ===== User dropdown ===== */
.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 260px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(15,23,42,0.12);
  z-index: 900;
  overflow: hidden;
  animation: dropIn 0.15s ease-out;
}

@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.ud-head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
}

.ud-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
}

.ud-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.ud-avatar span {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #4f46e5;
  color: #fff;
  font-weight: 900;
  font-size: 16px;
}

.ud-info { min-width: 0; flex: 1; }

.ud-name {
  font-size: 14px;
  font-weight: 900;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ud-email {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 600;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ud-chips {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.ud-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
}

.ud-chip-sc { background: rgba(79,70,229,0.08); color: #4f46e5; }
.ud-chip-rank { background: rgba(15,23,42,0.06); color: #475569; }

.ud-divider { height: 1px; background: #e2e8f0; margin: 0; }

.ud-links {
  padding: 6px 8px;
}

.ud-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
  background: transparent;
  border: none;
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all 0.12s;
}

.ud-link:hover { background: #f1f5f9; color: #0f172a; }
.ud-link :global(iconify-icon) { flex-shrink: 0; color: #94a3b8; }

.ud-logout {
  display: flex;
  width: 100%;
  margin: 0;
  padding: 10px 18px;
  color: #dc2626;
}

.ud-logout:hover { background: rgba(220,38,38,0.05); color: #dc2626; }
.ud-logout:disabled { opacity: 0.5; cursor: not-allowed; }

/* ===== Burger ===== */
.burger {
  display: none;
  width: 40px;
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  gap: 5px;
  flex-direction: column;
  flex: 0 0 auto;
  transition: all 0.15s;
}

.burger:hover { background: #f8fafc; border-color: #cbd5e1; }

.line { width: 16px; height: 2px; background: #0f172a; border-radius: 2px; transition: 0.2s; }

/* ===== Overlay ===== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2,6,23,0.4);
  backdrop-filter: blur(4px);
  z-index: 500;
  animation: fadeIn 0.18s ease-out;
}

/* ===== Drawer ===== */
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100dvh;
  width: min(340px, calc(100vw - 48px));
  background: #fff;
  border-left: 1px solid #e2e8f0;
  box-shadow: -16px 0 48px rgba(15,23,42,0.12);
  z-index: 600;
  transform: translateX(110%);
  transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer.open { transform: translateX(0); }

/* Drawer head */
.drawer-head {
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-shrink: 0;
}

.drawer-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.drawer-avatar-img,
.drawer-avatar-fallback {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
}

.drawer-avatar-img { object-fit: cover; border: 1px solid #e2e8f0; }

.drawer-avatar-fallback {
  display: grid;
  place-items: center;
  background: #4f46e5;
  color: #fff;
  font-weight: 900;
  font-size: 16px;
}

.drawer-user-info { min-width: 0; flex: 1; }

.drawer-user-name {
  font-weight: 900;
  font-size: 14px;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-rank {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 3px;
  font-size: 11px;
  font-weight: 700;
  color: #4f46e5;
  background: rgba(79,70,229,0.07);
  padding: 2px 7px;
  border-radius: 6px;
}

.drawer-title { font-weight: 900; font-size: 16px; color: #0f172a; }

.drawer-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: #64748b;
  transition: all 0.15s;
  flex-shrink: 0;
}

.drawer-close:hover { background: #f1f5f9; color: #0f172a; }

/* Drawer body */
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 10px 24px;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.drawer-divider { height: 1px; background: #e2e8f0; margin: 6px 2px; }

.drawer-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  text-decoration: none;
  color: #475569;
  font-weight: 700;
  font-size: 14px;
  background: transparent;
  border: none;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.12s;
  min-height: 44px;
  width: 100%;
  text-align: left;
}

.drawer-link:hover { background: #f1f5f9; color: #0f172a; }
.drawer-link.active { background: rgba(79,70,229,0.08); color: #4f46e5; font-weight: 800; }
.drawer-link :global(iconify-icon) { flex-shrink: 0; }

.admin-link { color: #4f46e5; }
.admin-link:hover { background: rgba(79,70,229,0.08); }

.admin-tag {
  margin-left: auto;
  font-size: 10px;
  font-weight: 800;
  background: rgba(79,70,229,0.1);
  color: #4f46e5;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.drawer-badge {
  margin-left: auto;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.danger-link { color: #dc2626; }
.danger-link:hover { background: rgba(220,38,38,0.06); color: #dc2626; }

.hide-mobile { display: flex; }

/* Notifications wrapper — transparent to flex layout, hidden on mobile */
.notif-wrap { display: contents; }


@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ===== Responsive ===== */
@media (max-width: 1220px) {
  .nav.desktop { display: none; }
  .burger { display: inline-flex; }
}

@media (max-width: 900px) {
  .topbar-inner { padding: 0 12px; gap: 10px; }
}

/* На мобилке всё — через drawer */
@media (max-width: 600px) {
  .hide-mobile { display: none !important; }
  .notif-wrap { display: none; }
  .burger { display: inline-flex; }
}
</style>
