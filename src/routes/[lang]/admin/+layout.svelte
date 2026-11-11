<script lang="ts">
  import { page } from "$app/stores";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";

  export let data: any;

  $: navItems = [
    { href: "/admin/events", label: $t('admin.nav.myEvents'), icon: "lucide:calendar-days" },
    { href: "/admin/create-event", label: $t('admin.nav.createEvent'), icon: "lucide:plus-circle" },
    { href: "/admin/brands", label: $t('admin.nav.myBrands'), icon: "lucide:building-2" },
    { href: "/admin/create-brand", label: $t('admin.nav.createBrand'), icon: "lucide:plus-circle" },
    { href: "/admin/communities", label: $t('admin.nav.myCommunities'), icon: "lucide:users" },
    { href: "/admin/create-community", label: $t('admin.nav.createCommunity'), icon: "lucide:plus-circle" },
    { href: "/admin/categories", label: $t('admin.nav.categories'), icon: "lucide:tags" },
  ];

  function isActive(href: string, pathname: string) {
    const stripped = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/") || "/";
    if (href === "/admin/events") {
      return stripped === "/admin/events" || stripped === "/admin" || stripped.startsWith("/admin/events/");
    }
    if (href === "/admin/brands") {
      return stripped === "/admin/brands" || stripped.startsWith("/admin/brands/");
    }
    if (href === "/admin/communities") {
      return stripped === "/admin/communities" || stripped.startsWith("/admin/communities/");
    }
    return stripped.startsWith(href);
  }
</script>

<section class="admin-page">
  <div class="admin-container">
    <div class="admin-header">
      <div class="admin-title">
        <iconify-icon icon="lucide:settings" width="22"></iconify-icon>
        {$t('admin.panel')}
      </div>
      <a href={withLang("/events")} class="back-link">
        <iconify-icon icon="lucide:arrow-left" width="16"></iconify-icon>
        {$t('admin.backToEvents')}
      </a>
    </div>

    <nav class="admin-nav">
      {#each navItems as item}
        <a
          class="nav-item"
          class:active={isActive(item.href, $page.url.pathname)}
          href={withLang(item.href)}
        >
          <iconify-icon icon={item.icon} width="16" height="16"></iconify-icon>
          {item.label}
        </a>
      {/each}
    </nav>

    <div class="admin-content">
      <slot />
    </div>
  </div>
</section>

<style>
  .admin-page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .admin-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 24px;
    font-weight: 900;
    color: #0f172a;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #64748b;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
    transition: color 0.15s;
  }
  .back-link:hover { color: #4f46e5; }

  .admin-nav {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .nav-item {
    height: 40px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .nav-item:hover { background: #f8fafc; border-color: #cbd5e1; }
  .nav-item.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }
  .nav-item.active :global(iconify-icon) { color: #fff; }
  .nav-item :global(iconify-icon) { color: #94a3b8; }

  .admin-content {
    min-height: 300px;
  }

  @media (max-width: 580px) {
    .admin-page { padding: 20px 12px 40px; }
    .admin-header { flex-direction: column; gap: 12px; align-items: flex-start; }
    .admin-nav { overflow-x: auto; flex-wrap: nowrap; scrollbar-width: none; }
    .admin-nav::-webkit-scrollbar { display: none; }
  }
</style>
