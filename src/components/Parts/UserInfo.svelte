<script lang="ts">
  import { onMount } from "svelte";
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { withLang } from "$lib/utils/withLang";

  export let user: {
    id: string;
    email?: string;
    info?: {
      name?: string | null;
      photo?: string | null;
      status?: string | null;
      role?: string | null;
      trustScore?: number | null;
    } | null;
  };

  let open = false;
  let rootEl: HTMLDivElement | null = null;
  let loading = false;
  let errorMsg = "";

  $: photo = photoSrc(user?.info?.photo ?? null);
  $: name = user?.info?.name?.trim() || user?.email || "User";
  $: initial = name[0]?.toUpperCase() ?? "U";

  // Read social data from $page.data (top-level, not inside user)
  $: trustScore = user?.info?.trustScore ?? $page.data.trustScore ?? 0;
  $: socialCapital = $page.data.socialCapital ?? 0;
  $: socialRank = $page.data.socialRank ?? "Explorer";

  // Trust score color logic (same as ProfileSidebar)
  function trustColor(score: number): string {
    if (score >= 70) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  function trustBg(score: number): string {
    if (score >= 70) return "rgba(34,197,94,0.08)";
    if (score >= 40) return "rgba(245,158,11,0.08)";
    return "rgba(239,68,68,0.08)";
  }

  function trustLabel(score: number): string {
    if (score >= 80) return $t('common.user.highlyTrusted');
    if (score >= 60) return $t('common.user.trusted');
    if (score >= 30) return $t('common.user.verified');
    return $t('common.user.new');
  }

  function toggle() {
    open = !open;
    errorMsg = "";
  }

  function close() {
    open = false;
  }

  function onMenuClick(e: MouseEvent) {
    const t = e.target as HTMLElement | null;
    if (!t) return;
    if (t.closest("a,button")) close();
  }

  async function nav(path: string) {
    close();
    await goto(withLang(path));
  }

  async function logout() {
    if (loading) return;
    loading = true;
    errorMsg = "";

    try {
      const res = await fetch("/api/logout", { method: "POST" });
      if (!res.ok) throw new Error(`Logout failed: ${res.status}`);

      close();
      await goto(withLang("/login"), { invalidateAll: true });
    } catch (e) {
      console.error(e);
      errorMsg = $t('common.user.logoutError');
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // Re-fetch layout data to ensure fresh user info
    invalidateAll();

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!rootEl || !target) return;
      if (!rootEl.contains(target)) close();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("click", onDocClick, true);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("click", onDocClick, true);
      document.removeEventListener("keydown", onKey);
    };
  });

  $: profileLinks = [
    { href: "/profile", label: $t('common.user.myProfile'), icon: "lucide:user" },
    { href: "/profile/events", label: $t('common.user.myEvents'), icon: "lucide:calendar-days" },
    { href: "/profile/achievements", label: $t('common.user.achievements'), icon: "lucide:award" },
    { href: "/profile/settings", label: $t('common.user.settings'), icon: "lucide:settings" },
  ];
</script>

<div class="user" bind:this={rootEl}>
  <button
    class="user-btn"
    type="button"
    on:click|stopPropagation={toggle}
    aria-haspopup="menu"
    aria-expanded={open}
  >
    {#if photo}
      <img class="avatar-img" src={photo} alt="User photo" />
    {:else}
      <span class="avatar" aria-hidden="true">{initial}</span>
    {/if}

    <span class="info">
      <span class="name" title={name}>{name}</span>
      <span class="sub">{user?.info?.status ?? $t('common.user.member')}</span>
    </span>

    <span class="chev" class:open aria-hidden="true">▾</span>
  </button>

  {#if open}
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div class="menu" role="menu" on:click|capture={onMenuClick}>
      <div class="menu-head">
        <div class="menu-head-row">
          {#if photo}
            <img class="menu-avatar-img" src={photo} alt="" />
          {:else}
            <span class="menu-avatar">{initial}</span>
          {/if}
          <div class="menu-head-text">
            <div class="menu-title">{name}</div>
            <div class="menu-meta">{user.email}</div>
          </div>
        </div>

        <div class="score-row">
          <div class="score-chip social" title="Social Capital — {socialRank}">
            <iconify-icon icon="lucide:trophy" width="12"></iconify-icon>
            <span class="score-val">{socialCapital}</span>
            <span class="score-label">{socialRank}</span>
          </div>
          <div
            class="score-chip"
            title="Trust Score — {trustLabel(trustScore)}"
            style="background:{trustBg(trustScore)}; color:{trustColor(trustScore)};"
          >
            <iconify-icon icon="lucide:shield-check" width="12"></iconify-icon>
            <span class="score-val">{trustScore}</span>
            <span class="score-label">{trustLabel(trustScore)}</span>
          </div>
        </div>
      </div>

      <div class="sep"></div>

      {#each profileLinks as link}
        <button
          class="item"
          type="button"
          on:click={() => nav(link.href)}
          role="menuitem"
        >
          <span class="ico"><iconify-icon icon={link.icon} width="16"></iconify-icon></span>
          <span>{link.label}</span>
        </button>
      {/each}

      <div class="sep"></div>

      <button
        class="item danger"
        type="button"
        on:click={logout}
        disabled={loading}
        role="menuitem"
      >
        <span class="ico"><iconify-icon icon="lucide:log-out" width="16"></iconify-icon></span>
        <span>{loading ? $t('common.user.loggingOut') : $t('common.user.logout')}</span>
      </button>

      {#if errorMsg}
        <div class="err" role="status">{errorMsg}</div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .user {
    position: relative;
    display: inline-flex;
    align-items: center;
    z-index: 1200;
  }

  .user-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 42px;
    padding: 0 12px 0 6px;
    border-radius: 12px;
    background: #fff;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    cursor: pointer;
    transition: all 0.15s;
  }

  .user-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .avatar,
  .avatar-img {
    width: 32px;
    height: 32px;
    border-radius: 10px;
  }

  .avatar {
    display: grid;
    place-items: center;
    background: #4f46e5;
    color: #fff;
    font-weight: 900;
    font-size: 13px;
  }

  .avatar-img {
    object-fit: cover;
    border: 1px solid #e2e8f0;
    background: #f1f5f9;
  }

  .info {
    display: grid;
    line-height: 1.15;
    text-align: left;
    min-width: 120px;
  }

  .name {
    font-weight: 800;
    font-size: 13px;
    color: #0f172a;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sub {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 700;
    margin-top: 1px;
  }

  .chev {
    font-size: 11px;
    color: #94a3b8;
    margin-left: 2px;
    transition: transform 0.15s;
  }

  .chev.open {
    transform: rotate(180deg);
  }

  /* ===== Dropdown Menu ===== */
  .menu {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 280px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 12px 36px rgba(15, 23, 42, 0.1), 0 2px 8px rgba(15, 23, 42, 0.04);
    padding: 8px;
    z-index: 1300;
    animation: menuIn 0.12s ease-out;
  }

  @keyframes menuIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .menu::before {
    content: "";
    position: absolute;
    right: 16px;
    top: -6px;
    width: 10px;
    height: 10px;
    background: #fff;
    border-left: 1px solid #e2e8f0;
    border-top: 1px solid #e2e8f0;
    transform: rotate(45deg);
  }

  /* ===== Menu head ===== */
  .menu-head {
    padding: 10px 10px 8px;
  }

  .menu-head-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .menu-avatar, .menu-avatar-img {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    flex: 0 0 auto;
  }

  .menu-avatar {
    display: grid;
    place-items: center;
    background: #4f46e5;
    color: #fff;
    font-weight: 900;
    font-size: 15px;
  }

  .menu-avatar-img {
    object-fit: cover;
    border: 1px solid #e2e8f0;
    background: #f1f5f9;
  }

  .menu-head-text {
    min-width: 0;
    flex: 1;
  }

  .menu-title {
    font-weight: 900;
    font-size: 14px;
    color: #0f172a;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu-meta {
    margin-top: 2px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* ===== Score chips ===== */
  .score-row {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }

  .score-chip {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
  }

  .score-chip.social {
    background: rgba(79, 70, 229, 0.06);
    color: #4f46e5;
  }

  .score-chip :global(iconify-icon) {
    flex: 0 0 auto;
  }

  .score-val {
    font-weight: 900;
    font-size: 12px;
  }

  .score-label {
    font-weight: 600;
    opacity: 0.7;
    font-size: 10px;
  }

  .sep {
    height: 1px;
    background: #e2e8f0;
    margin: 6px 8px;
  }

  .item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 10px;
    text-decoration: none;
    background: transparent;
    border: none;
    text-align: left;
    color: #0f172a;
    font-weight: 700;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.12s;
  }

  .item:hover {
    background: #f1f5f9;
  }

  .item:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ico {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    color: #64748b;
    flex: 0 0 auto;
  }

  .item:hover .ico {
    color: #4f46e5;
  }

  .danger {
    color: #dc2626;
  }

  .danger .ico {
    color: #dc2626;
  }

  .danger:hover {
    background: rgba(220, 38, 38, 0.06);
  }

  .danger:hover .ico {
    color: #dc2626;
  }

  .err {
    margin: 6px 8px 4px;
    padding: 8px 10px;
    border-radius: 10px;
    background: rgba(220, 38, 38, 0.06);
    color: #dc2626;
    font-weight: 700;
    font-size: 12px;
  }

  @media (max-width: 900px) {
    .info {
      min-width: 100px;
    }
    .name {
      max-width: 130px;
    }
  }

  @media (max-width: 480px) {
    .info {
      display: none;
    }
    .user-btn {
      padding: 0 8px;
    }
    .chev {
      display: none;
    }
  }
</style>
