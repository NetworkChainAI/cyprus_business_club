<script lang="ts">
  import { goto } from "$app/navigation";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";

  export let data: any;

  $: filters = [
    { value: "PENDING", label: $t('admin.platformAdmin.pending'), icon: "lucide:clock" },
    { value: "ACTIVE", label: $t('admin.platformAdmin.active'), icon: "lucide:check-circle" },
    { value: "DISABLED", label: $t('admin.platformAdmin.disabled'), icon: "lucide:x-circle" },
  ] as const;

  function switchFilter(f: string) {
    goto(`/platform-admin/brands?filter=${f}`, { replaceState: true });
  }

  let busyId: string | null = null;

  async function updateStatus(brandId: string, newStatus: string) {
    if (busyId) return;
    busyId = brandId;

    const prev = [...data.brands];
    data.brands = data.brands.map((b: any) =>
      b.id === brandId ? { ...b, status: newStatus } : b
    );

    try {
      const res = await fetch("/api/platform-admin/brands", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId, status: newStatus }),
      });
      if (!res.ok) {
        data.brands = prev;
        const msg = await res.json().catch(() => null);
        alert(msg?.error || $t('admin.platformAdmin.failedToUpdate'));
      } else {
        // Remove from current list if status changed away from filter
        if (newStatus !== data.filter) {
          data.brands = data.brands.filter((b: any) => b.id !== brandId);
          data.counts[data.filter]--;
          data.counts[newStatus]++;
          data.counts = { ...data.counts };
        }
      }
    } catch {
      data.brands = prev;
      alert($t('admin.platformAdmin.networkError'));
    } finally {
      busyId = null;
    }
  }

  function formatDate(d: any) {
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function ownerName(brand: any) {
    return brand.owner?.info?.name || brand.owner?.email || "Unknown";
  }

  function brandDescription(brand: any) {
    return brand.answers?.about?.description || null;
  }

  let brokenLogos: Record<string, boolean> = {};
  let brokenOwnerPhotos: Record<string, boolean> = {};
  let expandedId: string | null = null;

  function toggleExpand(id: string) {
    expandedId = expandedId === id ? null : id;
  }
</script>

<div class="page-head">
  <h1>{$t('admin.platformAdmin.brandRequests')}</h1>
</div>

<div class="filters">
  {#each filters as f}
    <button
      class="filter-btn"
      class:active={data.filter === f.value}
      on:click={() => switchFilter(f.value)}
    >
      <iconify-icon icon={f.icon} width="15"></iconify-icon>
      {f.label}
      <span class="filter-count">{data.counts[f.value] ?? 0}</span>
    </button>
  {/each}
</div>

{#if data.brands.length === 0}
  <div class="empty">
    <iconify-icon icon="lucide:inbox" width="36"></iconify-icon>
    <div class="empty-text">
      {#if data.filter === "PENDING"}
        {$t('admin.platformAdmin.noPendingBrands')}
      {:else if data.filter === "ACTIVE"}
        {$t('admin.platformAdmin.noActiveBrands')}
      {:else}
        {$t('admin.platformAdmin.noDisabledBrands')}
      {/if}
    </div>
  </div>
{:else}
  <div class="brand-list">
    {#each data.brands as brand (brand.id)}
      <div class="brand-card" class:busy={busyId === brand.id}>
        <!-- Header row -->
        <div class="brand-header">
          <div class="brand-logo">
            {#if brand.logoUrl && !brokenLogos[brand.id]}
              <img
                src={photoSrc(brand.logoUrl, 120)}
                alt={brand.name}
                on:error={() => (brokenLogos = { ...brokenLogos, [brand.id]: true })}
              />
            {:else}
              <div class="logo-fallback">
                <iconify-icon icon="lucide:building-2" width="20"></iconify-icon>
              </div>
            {/if}
          </div>

          <div class="brand-info">
            <div class="brand-name">{brand.name}</div>
            <div class="brand-meta">
              <span class="type-badge" class:personal={brand.type === "PERSONAL"}>
                <iconify-icon icon={brand.type === "COMPANY" ? "lucide:building" : "lucide:user"} width="12"></iconify-icon>
                {brand.type === "COMPANY" ? $t('admin.platformAdmin.company') : $t('admin.platformAdmin.personal')}
              </span>
              <span class="date-meta">
                <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                {formatDate(brand.createdAt)}
              </span>
              {#if brand.website}
                <span class="website-meta">
                  <iconify-icon icon="lucide:link" width="12"></iconify-icon>
                  {brand.website}
                </span>
              {/if}
            </div>
            {#if brand.categories.length > 0}
              <div class="brand-cats">
                {#each brand.categories as cat}
                  <span class="cat-chip">{cat.name}</span>
                {/each}
              </div>
            {/if}
          </div>

          <div class="brand-owner">
            <div class="owner-avatar">
              {#if brand.owner?.info?.photo && !brokenOwnerPhotos[brand.id]}
                <img
                  src={photoSrc(brand.owner.info.photo, 60)}
                  alt=""
                  on:error={() => (brokenOwnerPhotos = { ...brokenOwnerPhotos, [brand.id]: true })}
                />
              {:else}
                <div class="owner-fallback">{ownerName(brand)[0].toUpperCase()}</div>
              {/if}
            </div>
            <div class="owner-details">
              <div class="owner-name">{ownerName(brand)}</div>
              <div class="owner-email">{brand.owner?.email ?? ""}</div>
            </div>
          </div>
        </div>

        <!-- Expandable details -->
        {#if brandDescription(brand)}
          <button class="expand-btn" on:click={() => toggleExpand(brand.id)}>
            <iconify-icon icon={expandedId === brand.id ? "lucide:chevron-up" : "lucide:chevron-down"} width="14"></iconify-icon>
            {expandedId === brand.id ? $t('admin.platformAdmin.hideDetails') : $t('admin.platformAdmin.showDetails')}
          </button>
        {/if}

        {#if expandedId === brand.id}
          <div class="brand-details">
            {#if brandDescription(brand)}
              <div class="detail-block">
                <div class="detail-label">{$t('admin.platformAdmin.description')}</div>
                <div class="detail-text">{brandDescription(brand)}</div>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Actions -->
        <div class="brand-actions">
          {#if data.filter === "PENDING"}
            <button
              class="action-btn approve"
              on:click={() => updateStatus(brand.id, "ACTIVE")}
              disabled={busyId !== null}
            >
              <iconify-icon icon="lucide:check" width="15"></iconify-icon>
              {$t('admin.platformAdmin.approve')}
            </button>
            <button
              class="action-btn reject"
              on:click={() => updateStatus(brand.id, "DISABLED")}
              disabled={busyId !== null}
            >
              <iconify-icon icon="lucide:x" width="15"></iconify-icon>
              {$t('admin.platformAdmin.reject')}
            </button>
          {:else if data.filter === "ACTIVE"}
            <button
              class="action-btn reject"
              on:click={() => updateStatus(brand.id, "DISABLED")}
              disabled={busyId !== null}
            >
              <iconify-icon icon="lucide:ban" width="15"></iconify-icon>
              {$t('admin.platformAdmin.disable')}
            </button>
          {:else}
            <button
              class="action-btn approve"
              on:click={() => updateStatus(brand.id, "ACTIVE")}
              disabled={busyId !== null}
            >
              <iconify-icon icon="lucide:check" width="15"></iconify-icon>
              {$t('admin.platformAdmin.reactivate')}
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
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

  /* Filters */
  .filters {
    display: flex;
    gap: 6px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filter-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

  .filter-btn.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .filter-btn.active :global(iconify-icon) { color: #fff; }
  .filter-btn :global(iconify-icon) { color: #94a3b8; }

  .filter-count {
    font-size: 11px;
    font-weight: 800;
    padding: 1px 7px;
    border-radius: 6px;
    background: rgba(0,0,0,0.06);
  }

  .filter-btn.active .filter-count {
    background: rgba(255,255,255,0.2);
    color: #fff;
  }

  /* Empty */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 60px 16px;
    color: #94a3b8;
  }

  .empty-text { font-size: 15px; font-weight: 700; color: #64748b; }

  /* Brand list */
  .brand-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .brand-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 18px;
    transition: opacity 0.15s;
  }

  .brand-card.busy { opacity: 0.5; pointer-events: none; }

  .brand-header {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }

  .brand-logo {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    overflow: hidden;
    flex: 0 0 auto;
    background: #f1f5f9;
  }

  .brand-logo img { width: 100%; height: 100%; object-fit: cover; }

  .logo-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    color: #cbd5e1;
  }

  .brand-info { flex: 1; min-width: 0; }

  .brand-name {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 4px;
  }

  .brand-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }

  .brand-meta span { display: inline-flex; align-items: center; gap: 4px; }

  .type-badge { color: #3b82f6; }
  .type-badge.personal { color: #8b5cf6; }
  .date-meta :global(iconify-icon) { color: #94a3b8; }
  .website-meta :global(iconify-icon) { color: #94a3b8; }

  .brand-cats {
    margin-top: 6px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .cat-chip {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
  }

  /* Owner */
  .brand-owner {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
    padding: 8px 12px;
    background: #f8fafc;
    border-radius: 10px;
  }

  .owner-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    flex: 0 0 auto;
  }

  .owner-avatar img { width: 100%; height: 100%; object-fit: cover; }

  .owner-fallback {
    width: 100%;
    height: 100%;
    background: #4f46e5;
    color: #fff;
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 13px;
  }

  .owner-name { font-size: 13px; font-weight: 800; color: #0f172a; }
  .owner-email { font-size: 11px; color: #94a3b8; }

  /* Expand */
  .expand-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 12px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }

  .expand-btn:hover { color: #4f46e5; }

  .brand-details {
    margin-top: 10px;
    padding: 12px;
    background: #f8fafc;
    border-radius: 10px;
  }

  .detail-label {
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 4px;
  }

  .detail-text {
    font-size: 13px;
    color: #334155;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  /* Actions */
  .brand-actions {
    display: flex;
    gap: 8px;
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #f1f5f9;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 8px 16px;
    border-radius: 10px;
    border: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .action-btn.approve {
    background: #ecfdf5;
    color: #059669;
  }

  .action-btn.approve:hover:not(:disabled) {
    background: #d1fae5;
  }

  .action-btn.reject {
    background: #fef2f2;
    color: #dc2626;
  }

  .action-btn.reject:hover:not(:disabled) {
    background: #fee2e2;
  }

  @media (max-width: 768px) {
    .brand-header { flex-wrap: wrap; }
    .brand-owner { width: 100%; }
  }
</style>
