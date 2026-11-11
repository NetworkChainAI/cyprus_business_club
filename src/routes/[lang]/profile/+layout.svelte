<script lang="ts">
  import { page } from "$app/stores";
  import { withLang } from "$lib/utils/withLang";
  import ProfileHeader from "$components/Profile/ProfileHeader.svelte";
  import ProfileSidebar from "$components/Profile/ProfileSidebar.svelte";

  export let data: any;

  const tabs = [
    { href: "/profile", label: "Tickets", icon: "lucide:ticket" },
    { href: "/profile/meetings", label: "Meetings", icon: "lucide:calendar-clock" },
    { href: "/profile/about", label: "About", icon: "lucide:user" },
    { href: "/profile/interests", label: "Interests", icon: "lucide:heart" },
    { href: "/profile/events", label: "Events", icon: "lucide:calendar-days" },
    { href: "/profile/followers", label: "Followers", icon: "lucide:users" },
    { href: "/profile/following", label: "Following", icon: "lucide:user-plus" },
    { href: "/profile/achievements", label: "Achievements", icon: "lucide:award" },
    { href: "/profile/notifications", label: "Notifications", icon: "lucide:bell" },
    { href: "/profile/settings", label: "Settings", icon: "lucide:settings" },
  ];

  function isActive(href: string, path: string) {
    const stripped = path.replace(/^\/[a-z]{2}(\/|$)/, "/") || "/";
    if (href === "/profile") return stripped === "/profile";
    return stripped.startsWith(href);
  }
</script>

<section class="page">
  <div class="container">
    <ProfileHeader {data} />

    <div class="tabs-row">
      <nav class="tabs" aria-label="Profile tabs">
        {#each tabs as t}
          <a
            class="tab"
            class:active={isActive(t.href, $page.url.pathname)}
            href={withLang(t.href)}
          >
            <iconify-icon icon={t.icon} width="15" height="15"></iconify-icon>
            {t.label}
          </a>
        {/each}
      </nav>

      {#if data.hasAdminAccess}
        <a class="create-btn" href={withLang("/admin")}>
          <iconify-icon icon="lucide:settings" width="16" height="16"></iconify-icon>
          Admin Panel
        </a>
      {/if}
    </div>

    <div class="layout">
      <div class="main">
        <slot />
      </div>

      <div class="side">
        <ProfileSidebar {data} />
      </div>
    </div>
  </div>
</section>

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
    overflow: hidden;
  }

  /* ===== Tabs row ===== */
  .tabs-row {
    margin-top: 16px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .tabs {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .tabs-row {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      padding-bottom: 4px;
    }

    .tabs-row::-webkit-scrollbar {
      display: none;
    }

    .tabs {
      flex-wrap: nowrap;
    }
  }

  .create-btn {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 18px;
    border-radius: 10px;
    background: #4f46e5;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
    transition: background 0.15s;
    white-space: nowrap;
  }

  .create-btn:hover {
    background: #4338ca;
  }

  .create-btn :global(iconify-icon) {
    color: #fff;
  }

  .tab {
    height: 38px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tab:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .tab.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .tab.active :global(iconify-icon) {
    color: #fff;
  }

  .tab :global(iconify-icon) {
    color: #94a3b8;
  }

  /* ===== Layout ===== */
  .layout {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 16px;
    align-items: start;
  }

  .main,
  .side {
    min-width: 0;
  }

  .side {
    position: sticky;
    top: 82px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .side {
      position: static;
    }
  }

  @media (max-width: 520px) {
    .page {
      padding: 20px 12px 40px;
    }

    .tab {
      height: 34px;
      padding: 0 10px;
      font-size: 12px;
    }

    .create-btn {
      height: 34px;
      padding: 0 12px;
      font-size: 12px;
    }
  }
</style>
