<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { withLang } from "$lib/utils/withLang";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  $: brands = data.brands ?? [];
  $: categories = data.categories ?? [];

  const currentUserId: string | null = data.currentUserId ?? null;

  // Follow state: track per-brand
  let followState: Record<string, { following: boolean; count: number; busy: boolean }> = {};

  $: {
    const followedSet = new Set(data.followedBrandIds ?? []);
    for (const b of brands) {
      if (!followState[b.id]) {
        followState[b.id] = {
          following: followedSet.has(b.id),
          count: b.followersCount ?? 0,
          busy: false,
        };
      }
    }
  }

  async function toggleFollow(brandId: string, ownerId: string) {
    if (!currentUserId || currentUserId === ownerId) return;
    const st = followState[brandId];
    if (!st || st.busy) return;

    st.busy = true;
    const was = st.following;
    st.following = !was;
    st.count += was ? -1 : 1;
    followState = followState;

    try {
      const res = await fetch(`/api/brands/${brandId}/follow`, {
        method: was ? "DELETE" : "POST",
      });
      if (!res.ok) {
        st.following = was;
        st.count += was ? 1 : -1;
      }
    } catch {
      st.following = was;
      st.count += was ? 1 : -1;
    } finally {
      st.busy = false;
      followState = followState;
    }
  }

  let search = "";
  let selectedCategory = "";
  let typeFilter: "all" | "PERSONAL" | "COMPANY" = "all";

  $: filtered = brands.filter((b: any) => {
    if (search) {
      const q = search.toLowerCase();
      const match =
        b.name.toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedCategory) {
      if (!b.categories.some((c: any) => c.id === selectedCategory)) return false;
    }
    if (typeFilter !== "all" && b.type !== typeFilter) return false;
    return true;
  });

  $: hasActiveFilters =
    selectedCategory !== "" ||
    typeFilter !== "all" ||
    search.trim().length > 0;

  function clearFilters() {
    search = "";
    selectedCategory = "";
    typeFilter = "all";
  }

  function initials(name: string) {
    return (name || "?")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function truncate(text: string | null, max: number) {
    if (!text) return "";
    return text.length > max ? text.slice(0, max) + "..." : text;
  }
</script>

<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>
        <iconify-icon icon="lucide:building-2" width="28" height="28"></iconify-icon>
        {$t('partners.title')}
        {#if brands.length > 0}
          <span class="count">{brands.length}</span>
        {/if}
      </h1>
      <p class="header-sub">{$t('partners.subtitle')}</p>
    </div>

    <div class="header-right">
      <div class="search-box">
        <iconify-icon icon="lucide:search" width="16" height="16"></iconify-icon>
        <input type="text" placeholder={$t('partners.search')} bind:value={search} />
        {#if search.length > 0}
          <button class="search-clear" type="button" on:click={() => (search = "")}>
            <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filters">
    <div class="filter-group">
      <span class="filter-label">{$t('partners.filter.type')}</span>
      <div class="chips">
        <button class="chip" class:active={typeFilter === "all"} on:click={() => (typeFilter = "all")}>
          {$t('partners.filter.all')}
        </button>
        <button class="chip" class:active={typeFilter === "COMPANY"} on:click={() => (typeFilter = "COMPANY")}>
          <iconify-icon icon="lucide:building" width="13" height="13"></iconify-icon>
          {$t('partners.filter.companies')}
        </button>
        <button class="chip" class:active={typeFilter === "PERSONAL"} on:click={() => (typeFilter = "PERSONAL")}>
          <iconify-icon icon="lucide:user" width="13" height="13"></iconify-icon>
          {$t('partners.filter.personal')}
        </button>
      </div>
    </div>

    {#if categories.length > 0}
      <div class="filter-row">
        <div class="filter-group">
          <span class="filter-label">{$t('partners.filter.category')}</span>
          <div class="chips">
            <button class="chip" class:active={!selectedCategory} on:click={() => (selectedCategory = "")}>{$t('partners.filter.all')}</button>
            {#each categories as cat}
              <button class="chip" class:active={selectedCategory === cat.id} on:click={() => (selectedCategory = cat.id)}>
                {cat.name}
              </button>
            {/each}
          </div>
        </div>

        {#if hasActiveFilters}
          <button class="clear-btn" type="button" on:click={clearFilters}>
            <iconify-icon icon="lucide:x" width="13" height="13"></iconify-icon>
            {$t('partners.filter.clear')}
          </button>
        {/if}
      </div>
    {:else if hasActiveFilters}
      <button class="clear-btn" type="button" on:click={clearFilters}>
        <iconify-icon icon="lucide:x" width="13" height="13"></iconify-icon>
        {$t('partners.filter.clear')}
      </button>
    {/if}
  </div>

  <!-- Results count -->
  <div class="results-bar">
    <span class="results-count">{filtered.length} {filtered.length !== 1 ? $t('partners.results.partners') : $t('partners.results.partner')}</span>
  </div>

  <!-- Grid -->
  {#if filtered.length === 0}
    <div class="empty">
      <div class="empty-icon">
        <iconify-icon icon="lucide:search-x" width="40" height="40"></iconify-icon>
      </div>
      <div class="empty-title">{$t('partners.empty.title')}</div>
      <div class="empty-sub">{$t('partners.empty.subtitle')}</div>
      {#if hasActiveFilters}
        <button class="clear-btn-big" type="button" on:click={clearFilters}>
          <iconify-icon icon="lucide:rotate-ccw" width="14" height="14"></iconify-icon>
          {$t('partners.filter.resetAll')}
        </button>
      {/if}
    </div>
  {:else}
    <div class="grid">
      {#each filtered as brand (brand.id)}
        <a class="card" href={withLang(`/partners/${brand.id}`)}>
          <div class="card-top">
            <div class="logo">
              {#if brand.logoUrl}
                <img src={photoSrc(brand.logoUrl, 200)} alt={brand.name} loading="lazy" />
              {:else}
                <div class="logo-fallback">{initials(brand.name)}</div>
              {/if}
            </div>

            <span class="type-badge" class:personal={brand.type === "PERSONAL"}>
              {brand.type === "PERSONAL" ? $t('partners.badge.personal') : $t('partners.badge.company')}
            </span>
          </div>

          <div class="card-name">{brand.name}</div>

          {#if brand.description}
            <div class="card-desc">{truncate(brand.description, 100)}</div>
          {/if}

          {#if brand.categories.length > 0}
            <div class="card-cats">
              {#each brand.categories.slice(0, 3) as cat}
                <span class="cat-chip">{cat.name}</span>
              {/each}
              {#if brand.categories.length > 3}
                <span class="cat-chip cat-more">+{brand.categories.length - 3}</span>
              {/if}
            </div>
          {/if}

          <div class="card-footer">
            <div class="owner">
              {#if brand.owner.photo}
                <img class="owner-avatar" src={photoSrc(brand.owner.photo, 64)} alt="" loading="lazy" on:error={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.removeAttribute("style"); }} />
                <div class="owner-fallback" style="display:none">{(brand.owner.name ?? "?")[0].toUpperCase()}</div>
              {:else}
                <div class="owner-fallback">{(brand.owner.name ?? "?")[0].toUpperCase()}</div>
              {/if}
              <span class="owner-name">{brand.owner.name ?? "Unknown"}</span>
            </div>

            <div class="card-footer-right">
              {#if (followState[brand.id]?.count ?? brand.followersCount) > 0}
                <span class="followers-badge">
                  <iconify-icon icon="lucide:heart" width="12" height="12"></iconify-icon>
                  {followState[brand.id]?.count ?? brand.followersCount}
                </span>
              {/if}
              {#if currentUserId && currentUserId !== brand.owner.id}
                <button
                  class="btn-follow-sm"
                  class:followed={followState[brand.id]?.following}
                  disabled={followState[brand.id]?.busy}
                  on:click|preventDefault|stopPropagation={() => toggleFollow(brand.id, brand.owner.id)}
                >
                  <iconify-icon
                    icon={followState[brand.id]?.following ? "lucide:heart-off" : "lucide:heart"}
                    width="14"
                    height="14"
                  ></iconify-icon>
                  {followState[brand.id]?.following ? $t('partners.unfollow') : $t('partners.follow')}
                </button>
              {/if}
              <span class="card-arrow">
                <iconify-icon icon="lucide:arrow-right" width="16" height="16"></iconify-icon>
              </span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<ContextAssistant contextKey="global" payload={{ page: "brands" }} title="Brands Assistant" />

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  /* ============ HEADER ============ */
  .header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  h1 :global(iconify-icon) {
    color: #4f46e5;
  }

  .count {
    font-size: 14px;
    font-weight: 800;
    color: #4f46e5;
    background: rgba(79, 70, 229, 0.06);
    padding: 3px 10px;
    border-radius: 8px;
    margin-left: 2px;
  }

  .header-sub {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* Search */
  .search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 9px 14px;
    min-width: 280px;
    transition: border-color 0.15s;
  }

  .search-box:focus-within {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
  }

  .search-box :global(iconify-icon) {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .search-box input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
    color: #0f172a;
    background: transparent;
    font-family: inherit;
  }

  .search-box input::placeholder {
    color: #94a3b8;
  }

  .search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
  }

  .search-clear:hover {
    background: #e2e8f0;
  }

  /* ============ FILTERS ============ */
  .filters {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    margin-bottom: 16px;
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-label {
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s;
  }

  .chip:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .chip.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.15s;
    margin-left: auto;
  }

  .clear-btn:hover {
    background: #fee2e2;
  }

  /* ============ RESULTS ============ */
  .results-bar {
    margin-bottom: 14px;
  }

  .results-count {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
  }

  /* ============ GRID ============ */
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 20px;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: all 0.2s ease;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
    border-color: #c7d2fe;
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .logo {
    width: 56px;
    height: 56px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    flex: 0 0 auto;
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .logo-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    font-weight: 900;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.85);
  }

  .type-badge {
    height: 26px;
    padding: 0 10px;
    border-radius: 8px;
    background: #dbeafe;
    color: #1e40af;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
  }

  .type-badge.personal {
    background: #fef3c7;
    color: #92400e;
  }

  .card-name {
    font-size: 17px;
    font-weight: 900;
    color: #0f172a;
    transition: color 0.15s;
  }

  .card:hover .card-name {
    color: #4f46e5;
  }

  .card-desc {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    line-height: 1.5;
  }

  .card-cats {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .cat-chip {
    height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
  }

  .cat-more {
    background: rgba(79, 70, 229, 0.06);
    color: #4f46e5;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: auto;
    padding-top: 10px;
    border-top: 1px solid #f1f5f9;
  }

  .owner {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .owner-avatar {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid #e2e8f0;
  }

  .owner-fallback {
    width: 24px;
    height: 24px;
    border-radius: 8px;
    background: #4f46e5;
    color: #fff;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 900;
  }

  .owner-name {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
  }

  .card-footer-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .followers-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    padding: 4px 8px;
    border-radius: 8px;
    background: #f8fafc;
  }

  .followers-badge :global(iconify-icon) {
    color: #ef4444;
  }

  .btn-follow-sm {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 12px;
    border-radius: 8px;
    border: none;
    background: #4f46e5;
    color: #fff;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn-follow-sm:hover {
    background: #4338ca;
  }

  .btn-follow-sm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-follow-sm.followed {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-follow-sm.followed:hover {
    background: #cbd5e1;
  }

  .card-arrow {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    transition: all 0.15s;
  }

  .card:hover .card-arrow {
    background: #4f46e5;
    color: #fff;
  }

  /* ============ EMPTY ============ */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 60px 20px;
    text-align: center;
  }

  .empty-icon {
    color: #cbd5e1;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a;
  }

  .empty-sub {
    font-size: 14px;
    color: #94a3b8;
  }

  .clear-btn-big {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: #4f46e5;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 12px;
    padding: 10px 18px;
    cursor: pointer;
    margin-top: 6px;
    transition: all 0.15s;
  }

  .clear-btn-big:hover {
    background: #e0e7ff;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 1000px) {
    .grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 720px) {
    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }

    .header-right {
      width: 100%;
    }

    .search-box {
      min-width: 0;
      flex: 1;
    }

    .grid {
      grid-template-columns: 1fr;
    }

    .filter-row {
      gap: 10px;
    }

    .filters {
      padding: 14px;
    }
  }
</style>
