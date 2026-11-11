<script lang="ts">
  import { photoSrc } from "$lib/utils/photo";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";

  export let data: any;

  $: brands = data?.ownedBrands ?? [];

  function formatDate(d: any) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
</script>

<div class="brands-admin">
  <div class="section-header">
    <h2>{$t('admin.brands.title')}</h2>
    <span class="count">{brands.length} {$t('admin.brands.count')}</span>
  </div>

  {#if brands.length === 0}
    <div class="empty">
      <iconify-icon icon="lucide:building-2" width="36"></iconify-icon>
      <p>{$t('admin.brands.noBrands')}</p>
      <a href={withLang("/admin/create-brand")} class="create-btn">
        <iconify-icon icon="lucide:plus" width="16"></iconify-icon>
        {$t('admin.brands.createBrand')}
      </a>
    </div>
  {:else}
    <div class="brand-list">
      {#each brands as brand (brand.id)}
        <div class="brand-card" class:pending={brand.status === "PENDING"}>
          <div class="brand-logo">
            {#if brand.logoUrl}
              <img src={photoSrc(brand.logoUrl, 200)} alt={brand.name} />
            {:else}
              <div class="logo-placeholder">
                <iconify-icon icon="lucide:building-2" width="24"></iconify-icon>
              </div>
            {/if}
          </div>

          <div class="brand-info">
            <div class="brand-title">{brand.name}</div>
            <div class="brand-meta">
              <span class="type-badge" class:personal={brand.type === "PERSONAL"}>
                <iconify-icon icon={brand.type === "COMPANY" ? "lucide:building" : "lucide:user"} width="13"></iconify-icon>
                {brand.type === "COMPANY" ? $t('admin.brands.company') : $t('admin.brands.personal')}
              </span>
              <span class="status-badge" class:active={brand.status === "ACTIVE"} class:pending-badge={brand.status === "PENDING"}>
                {brand.status === "ACTIVE" ? $t('admin.brands.active') : $t('admin.brands.pending')}
              </span>
              <span>
                <iconify-icon icon="lucide:calendar-days" width="13"></iconify-icon>
                {formatDate(brand.createdAt)}
              </span>
              <span>
                <iconify-icon icon="lucide:calendar" width="13"></iconify-icon>
                {brand._count?.events ?? 0} {$t('admin.brands.events')}
              </span>
            </div>
            {#if brand.categories.length > 0}
              <div class="brand-cats">
                {#each brand.categories as cat}
                  <span class="cat-chip">{cat.name}</span>
                {/each}
              </div>
            {/if}
          </div>

          <div class="brand-actions">
            <a href={withLang(`/admin/brands/${brand.id}/edit`)} class="edit-btn">
              <iconify-icon icon="lucide:pencil" width="14"></iconify-icon>
              {$t('admin.brands.edit')}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .brands-admin { }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .section-header h2 {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }
  .count {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
  }

  .empty {
    text-align: center;
    padding: 60px 20px;
    color: #94a3b8;
  }
  .empty p { font-weight: 700; margin-top: 10px; }
  .create-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 14px;
    padding: 10px 20px;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
  }
  .create-btn:hover { background: #4338ca; }

  .brand-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .brand-card {
    display: flex;
    gap: 16px;
    align-items: center;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px;
    transition: opacity 0.2s;
  }
  .brand-card.pending { opacity: 0.65; }

  .brand-logo {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    flex: 0 0 auto;
    background: #f1f5f9;
  }
  .brand-logo img { width: 100%; height: 100%; object-fit: cover; }
  .logo-placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: #cbd5e1;
  }

  .brand-info { flex: 1; min-width: 0; }
  .brand-title {
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brand-meta {
    margin-top: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    color: #64748b;
    font-weight: 700;
    font-size: 12px;
  }
  .brand-meta span { display: inline-flex; align-items: center; gap: 4px; }

  .type-badge {
    color: #3b82f6;
  }
  .type-badge.personal {
    color: #8b5cf6;
  }

  .status-badge {
    font-weight: 800;
  }
  .status-badge.active { color: #22c55e; }
  .status-badge.pending-badge { color: #f59e0b; }

  .brand-cats {
    margin-top: 8px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  .cat-chip {
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
    font-weight: 700;
    font-size: 11px;
  }

  .brand-actions {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }

  .edit-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #4f46e5;
    font-weight: 700;
    font-size: 12px;
    text-decoration: none;
    transition: all 0.15s;
  }
  .edit-btn:hover { background: #f8fafc; border-color: #4f46e5; }

  @media (max-width: 640px) {
    .brand-card { flex-direction: column; align-items: stretch; }
    .brand-logo { width: 100%; height: 160px; }
    .brand-actions { flex-direction: row; justify-content: flex-end; align-items: center; }
  }
</style>
