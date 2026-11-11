<script lang="ts">
  import { page } from "$app/stores";
  import { t } from "$lib/i18n";

  $: path = $page.url.pathname;

  $: navItems = [
    { href: "/platform-admin/users", label: $t('admin.platformAdmin.users'), icon: "lucide:users" },
    { href: "/platform-admin/brands", label: $t('admin.platformAdmin.brandRequests'), icon: "lucide:building-2" },
    { href: "/platform-admin/communities", label: $t('admin.platformAdmin.communityRequests'), icon: "lucide:heart-handshake" },
  ];

  function isActive(href: string) {
    return path.startsWith(href);
  }
</script>

<div class="admin-shell">
  <aside class="sidebar">
    <div class="sidebar-head">
      <iconify-icon icon="lucide:shield" width="20" height="20"></iconify-icon>
      <span class="sidebar-title">{$t('admin.platformAdmin.title')}</span>
    </div>

    <nav class="sidebar-nav">
      {#each navItems as item}
        <a
          class="sidebar-link"
          class:active={isActive(item.href)}
          href={item.href}
        >
          <iconify-icon icon={item.icon} width="18" height="18"></iconify-icon>
          <span>{item.label}</span>
        </a>
      {/each}
    </nav>
  </aside>

  <main class="admin-main">
    <slot />
  </main>
</div>

<style>
  .admin-shell {
    display: flex;
    min-height: calc(100dvh - 65px);
  }

  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: #fff;
    border-right: 1px solid #e2e8f0;
    padding: 20px 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sidebar-head {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 8px;
    color: #4f46e5;
  }

  .sidebar-title {
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
  }

  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    text-decoration: none;
    color: #64748b;
    font-weight: 700;
    font-size: 14px;
    transition: all 0.15s;
  }

  .sidebar-link:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .sidebar-link.active {
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
    font-weight: 800;
  }

  .admin-main {
    flex: 1;
    padding: 24px;
    background: #f8fafc;
    min-width: 0;
  }

  @media (max-width: 768px) {
    .admin-shell {
      flex-direction: column;
    }

    .sidebar {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #e2e8f0;
      padding: 12px;
    }

    .sidebar-nav {
      flex-direction: row;
      gap: 4px;
    }

    .admin-main {
      padding: 16px;
    }
  }
</style>
