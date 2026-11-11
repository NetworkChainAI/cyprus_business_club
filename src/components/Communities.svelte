<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { withLang } from "$lib/utils/withLang";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";
  import "leaflet/dist/leaflet.css";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: {
    communities: Array<{
      id: string;
      name: string;
      logoUrl: string | null;
      isPrivate: boolean;
      createdAt: string | Date;
      memberCount: number;
      postCount: number;
      owners: Array<{ id: string; name: string; photo: string | null }>;
      isMember: boolean;
      isPending: boolean;
      address: { country?: string; city?: string; street?: string; full?: string } | null;
      lat: number | null;
      lng: number | null;
    }>;
    userId: string | null;
    countries: string[];
  };

  let search = "";
  let privacyFilter: "all" | "public" | "private" = "all";
  let countryFilter = "all";
  let sort: "members" | "newest" = "members";

  // Map state
  let mapOpen = false;
  let mapEl: HTMLDivElement;
  let leafletMap: any = null;

  $: filtered = data.communities
    .filter((c) => {
      const q = search.trim().toLowerCase();
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (privacyFilter === "public" && c.isPrivate) return false;
      if (privacyFilter === "private" && !c.isPrivate) return false;
      if (countryFilter !== "all" && c.address?.country !== countryFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "members") return b.memberCount - a.memberCount;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });

  $: hasActiveFilters = privacyFilter !== "all" || search.trim().length > 0 || countryFilter !== "all";
  $: mapCommunities = data.communities.filter((c) => c.lat && c.lng);

  // Per-community join state
  let joiningId: string | null = null;
  let localJoin: Record<string, "member" | "pending"> = {};

  async function joinCommunity(e: MouseEvent, community: any) {
    e.preventDefault();
    e.stopPropagation();
    if (!data.userId) { window.location.href = withLang("/login"); return; }
    if (joiningId) return;
    joiningId = community.id;
    try {
      const res = await fetch("/api/community/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityId: community.id }),
      });
      if (res.ok) {
        localJoin = { ...localJoin, [community.id]: community.isPrivate ? "pending" : "member" };
      }
    } catch {}
    joiningId = null;
  }

  function clearFilters() {
    search = "";
    privacyFilter = "all";
    countryFilter = "all";
  }

  function initials(name: string) {
    return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  }

  async function toggleMap() {
    mapOpen = !mapOpen;
    if (mapOpen) {
      await tick();
      initMap();
    }
  }

  async function initMap() {
    if (!mapEl || leafletMap) return;
    const L = await import("leaflet");
    const coords = mapCommunities.map((c) => [c.lat!, c.lng!] as [number, number]);
    const center: [number, number] = coords.length > 0
      ? [coords.reduce((s, c) => s + c[0], 0) / coords.length, coords.reduce((s, c) => s + c[1], 0) / coords.length]
      : [34.9, 33.0];
    leafletMap = L.map(mapEl, { zoomControl: false, scrollWheelZoom: true, dragging: true, attributionControl: false }).setView(center, coords.length > 0 ? 7 : 8);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(leafletMap);
    L.control.zoom({ position: "bottomright" }).addTo(leafletMap);
    for (const c of mapCommunities) {
      const popup = L.popup({ closeButton: false }).setContent(
        `<a href="/communities/${encodeURIComponent(c.name)}" style="font-weight:700;color:#4f46e5;text-decoration:none;font-size:13px">${c.name}</a>` +
        (c.address?.city ? `<div style="font-size:11px;color:#64748b;margin-top:2px">${c.address.city}${c.address.country ? ', ' + c.address.country : ''}</div>` : '')
      );
      L.marker([c.lat!, c.lng!]).bindPopup(popup).addTo(leafletMap);
    }
    setTimeout(() => leafletMap.invalidateSize(), 100);
    if (coords.length > 1) leafletMap.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
  }
</script>

<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>
        <iconify-icon icon="lucide:globe" width="28" height="28"></iconify-icon>
        {$t('communities.title')}
        {#if data.communities.length > 0}
          <span class="count">{data.communities.length}</span>
        {/if}
      </h1>
      <p class="header-sub">{$t('communities.subtitle')}</p>
    </div>

    <div class="header-right">
      <div class="search-box">
        <iconify-icon icon="lucide:search" width="16" height="16"></iconify-icon>
        <input type="text" placeholder={$t('communities.search')} bind:value={search} />
        {#if search.length > 0}
          <button class="search-clear" type="button" on:click={() => (search = "")}>
            <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
          </button>
        {/if}
      </div>
      {#if mapCommunities.length > 0}
        <button class="map-toggle-btn" class:active={mapOpen} type="button" on:click={toggleMap}>
          <iconify-icon icon={mapOpen ? "lucide:layout-grid" : "lucide:map"} width="15" height="15"></iconify-icon>
          {mapOpen ? $t('communities.showList') : $t('communities.showMap')}
        </button>
      {/if}
    </div>
  </div>

  {#if mapOpen}
    <div class="map-section">
      <div class="map-container" bind:this={mapEl}></div>
      {#if mapCommunities.length > 0}
        <div class="map-hint">
          <iconify-icon icon="lucide:info" width="13"></iconify-icon>
          {mapCommunities.length} {$t('communities.communitiesOnMap')}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Filters -->
  <div class="filters">
    <div class="filter-group">
      <span class="filter-label">{$t('communities.filterType')}</span>
      <div class="chips">
        <button class="chip" class:active={privacyFilter === "all"} type="button" on:click={() => (privacyFilter = "all")}>
          {$t('communities.all')}
        </button>
        <button class="chip" class:active={privacyFilter === "public"} type="button" on:click={() => (privacyFilter = "public")}>
          <iconify-icon icon="lucide:globe" width="13" height="13"></iconify-icon>
          {$t('communities.public')}
        </button>
        <button class="chip" class:active={privacyFilter === "private"} type="button" on:click={() => (privacyFilter = "private")}>
          <iconify-icon icon="lucide:lock" width="13" height="13"></iconify-icon>
          {$t('communities.private')}
        </button>
      </div>
    </div>

    {#if data.countries.length > 0}
      <div class="filter-row">
        <div class="filter-group">
          <span class="filter-label">{$t('communities.allCountries')}</span>
          <div class="chips">
            <button class="chip" class:active={countryFilter === "all"} type="button" on:click={() => (countryFilter = "all")}>
              <iconify-icon icon="lucide:globe-2" width="13" height="13"></iconify-icon>
              {$t('communities.allCountries')}
            </button>
            {#each data.countries as country}
              <button class="chip" class:active={countryFilter === country} type="button" on:click={() => (countryFilter = country)}>
                {country}
              </button>
            {/each}
          </div>
        </div>

        <button class="sort-btn" type="button" on:click={() => (sort = sort === "members" ? "newest" : "members")}>
          <iconify-icon icon="lucide:arrow-up-down" width="14" height="14"></iconify-icon>
          {sort === "members" ? $t('communities.mostMembers') : $t('communities.newest')}
        </button>

        {#if hasActiveFilters}
          <button class="clear-btn" type="button" on:click={clearFilters}>
            <iconify-icon icon="lucide:x" width="13" height="13"></iconify-icon>
            {$t('communities.clear')}
          </button>
        {/if}
      </div>
    {:else}
      <div class="filter-row">
        <button class="sort-btn" type="button" on:click={() => (sort = sort === "members" ? "newest" : "members")}>
          <iconify-icon icon="lucide:arrow-up-down" width="14" height="14"></iconify-icon>
          {sort === "members" ? $t('communities.mostMembers') : $t('communities.newest')}
        </button>
        {#if hasActiveFilters}
          <button class="clear-btn" type="button" on:click={clearFilters}>
            <iconify-icon icon="lucide:x" width="13" height="13"></iconify-icon>
            {$t('communities.clear')}
          </button>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Results count -->
  <div class="results-bar">
    <span class="results-count">{filtered.length} {$t('communities.title').toLowerCase()}</span>
  </div>

  <!-- Grid -->
  {#if filtered.length === 0}
    <div class="empty">
      <div class="empty-icon">
        <iconify-icon icon="lucide:search-x" width="40" height="40"></iconify-icon>
      </div>
      <div class="empty-title">{$t('communities.empty.title')}</div>
      <div class="empty-sub">{$t('communities.empty.subtitle')}</div>
      {#if hasActiveFilters}
        <button class="clear-btn-big" type="button" on:click={clearFilters}>
          <iconify-icon icon="lucide:rotate-ccw" width="14" height="14"></iconify-icon>
          {$t('communities.resetAll')}
        </button>
      {/if}
    </div>
  {:else}
    <div class="grid">
      {#each filtered as community (community.id)}
        {@const joinState = localJoin[community.id]}
        {@const isOwnerOfThis = !!data.userId && community.owners.some((o) => o.id === data.userId)}
        {@const effectiveMember = community.isMember || joinState === "member" || isOwnerOfThis}
        {@const effectivePending = (joinState === "pending" || community.isPending) && !isOwnerOfThis && !effectiveMember}
        <a class="card" href={withLang(`/communities/${encodeURIComponent(community.name)}`)}>
          <!-- Top row: logo + badge -->
          <div class="card-top">
            <div class="logo">
              {#if community.logoUrl}
                <img src={photoSrc(community.logoUrl, 200)} alt={community.name} loading="lazy" />
              {:else}
                <div class="logo-fallback">{initials(community.name)}</div>
              {/if}
            </div>

            <span class="privacy-badge" class:public={!community.isPrivate}>
              {#if community.isPrivate}
                <iconify-icon icon="lucide:lock" width="11" height="11"></iconify-icon>
                {$t('communities.private')}
              {:else}
                <iconify-icon icon="lucide:globe" width="11" height="11"></iconify-icon>
                {$t('communities.public')}
              {/if}
            </span>
          </div>

          <!-- Name -->
          <div class="card-name">{community.name}</div>

          <!-- Address as info -->
          {#if community.address?.city || community.address?.country}
            <div class="card-location">
              <iconify-icon icon="lucide:map-pin" width="12" height="12"></iconify-icon>
              {[community.address.city, community.address.country].filter(Boolean).join(", ")}
            </div>
          {/if}

          <!-- Stats chips -->
          <div class="card-cats">
            <span class="cat-chip">
              <iconify-icon icon="lucide:users" width="11" height="11"></iconify-icon>
              {community.memberCount} {$t('communities.members')}
            </span>
            {#if community.postCount > 0}
              <span class="cat-chip cat-posts">
                <iconify-icon icon="lucide:newspaper" width="11" height="11"></iconify-icon>
                {community.postCount} {$t('communities.posts')}
              </span>
            {/if}
          </div>

          <!-- Footer: owner + join -->
          <div class="card-footer">
            {#if community.owners.length > 0}
              {@const owner = community.owners[0]}
              <div class="owner">
                {#if owner.photo}
                  <img class="owner-avatar" src={photoSrc(owner.photo, 64)} alt={owner.name} loading="lazy"
                    on:error={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; e.currentTarget.nextElementSibling?.removeAttribute("style"); }} />
                  <div class="owner-fallback" style="display:none">{owner.name[0].toUpperCase()}</div>
                {:else}
                  <div class="owner-fallback">{owner.name[0].toUpperCase()}</div>
                {/if}
                <span class="owner-name">{owner.name}</span>
              </div>
            {/if}

            <div class="card-footer-right">
              {#if effectiveMember}
                <span class="joined-badge" class:owner-badge={isOwnerOfThis}>
                  <iconify-icon icon={isOwnerOfThis ? "lucide:crown" : "lucide:check"} width="12" height="12"></iconify-icon>
                  {isOwnerOfThis ? $t('communities.owner') : $t('communities.joined')}
                </span>
              {:else if effectivePending}
                <span class="pending-badge">
                  <iconify-icon icon="lucide:clock" width="12" height="12"></iconify-icon>
                  {$t('communities.awaitingApproval')}
                </span>
              {:else}
                <button
                  type="button"
                  class="btn-join"
                  class:private={community.isPrivate}
                  disabled={joiningId === community.id}
                  on:click|preventDefault|stopPropagation={(e) => joinCommunity(e, community)}
                >
                  {#if joiningId === community.id}
                    <iconify-icon icon="lucide:loader-2" width="13" height="13" class="spin"></iconify-icon>
                  {:else if community.isPrivate}
                    <iconify-icon icon="lucide:send" width="13" height="13"></iconify-icon>
                    {$t('communities.requestToJoin')}
                  {:else}
                    <iconify-icon icon="lucide:user-plus" width="13" height="13"></iconify-icon>
                    {$t('communities.join')}
                  {/if}
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

<ContextAssistant contextKey="community_list" payload={{}} title="Communities Assistant" />

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

  h1 :global(iconify-icon) { color: #4f46e5; }

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
  .search-box :global(iconify-icon) { color: #94a3b8; flex-shrink: 0; }
  .search-box input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
    color: #0f172a;
    background: transparent;
    font-family: inherit;
  }
  .search-box input::placeholder { color: #94a3b8; }
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
  .search-clear:hover { background: #e2e8f0; }

  .map-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .map-toggle-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .map-toggle-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }

  /* Map */
  .map-section {
    margin-bottom: 16px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    position: relative;
    z-index: 0;
  }
  .map-container { width: 100%; height: 380px; }
  .map-hint {
    position: absolute;
    bottom: 12px;
    left: 12px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 8px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(6px);
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    border: 1px solid #e2e8f0;
    pointer-events: none;
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
  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
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
  .chip:hover { background: #f8fafc; border-color: #cbd5e1; }
  .chip.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }

  .sort-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    margin-left: auto;
  }
  .sort-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .sort-btn :global(iconify-icon) { color: #94a3b8; }

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
  }
  .clear-btn:hover { background: #fee2e2; }

  /* ============ RESULTS ============ */
  .results-bar { margin-bottom: 14px; }
  .results-count { font-size: 13px; font-weight: 700; color: #94a3b8; }

  /* ============ GRID ============ */
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  /* ============ CARD ============ */
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
  .logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .logo-fallback {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    font-weight: 900;
    font-size: 18px;
    color: rgba(255,255,255,0.85);
  }

  .privacy-badge {
    height: 26px;
    padding: 0 10px;
    border-radius: 8px;
    background: #fef3c7;
    color: #92400e;
    font-size: 11px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .privacy-badge.public {
    background: #d1fae5;
    color: #065f46;
  }

  .card-name {
    font-size: 17px;
    font-weight: 900;
    color: #0f172a;
    transition: color 0.15s;
    line-height: 1.3;
  }
  .card:hover .card-name { color: #4f46e5; }

  .card-location {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
  }
  .card-location :global(iconify-icon) { color: #94a3b8; flex-shrink: 0; }

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
    gap: 4px;
  }
  .cat-posts {
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

  .owner { display: flex; align-items: center; gap: 8px; }
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
  .owner-name { font-size: 12px; font-weight: 700; color: #64748b; }

  .card-footer-right { display: flex; align-items: center; gap: 8px; }

  .owner-badge {
    background: #fef3c7 !important;
    color: #92400e !important;
  }

  .joined-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    background: #d1fae5;
    color: #065f46;
    font-size: 11px;
    font-weight: 700;
  }
  .pending-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    background: #fef3c7;
    color: #92400e;
    font-size: 11px;
    font-weight: 700;
  }

  .btn-join {
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
  .btn-join:hover:not(:disabled) { background: #4338ca; }
  .btn-join.private { background: #e2e8f0; color: #475569; }
  .btn-join.private:hover:not(:disabled) { background: #cbd5e1; }
  .btn-join:disabled { opacity: 0.6; cursor: not-allowed; }

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
  .card:hover .card-arrow { background: #4f46e5; color: #fff; }

  :global(.spin) { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ============ EMPTY ============ */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 60px 20px;
    text-align: center;
  }
  .empty-icon { color: #cbd5e1; }
  .empty-title { font-size: 18px; font-weight: 800; color: #0f172a; }
  .empty-sub { font-size: 14px; color: #94a3b8; }
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
  .clear-btn-big:hover { background: #e0e7ff; }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 1000px) {
    .grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 720px) {
    .header { flex-direction: column; align-items: flex-start; gap: 14px; }
    .header-right { width: 100%; }
    .search-box { min-width: 0; flex: 1; }
    .grid { grid-template-columns: 1fr; }
    .filter-row { gap: 10px; }
    .filters { padding: 14px; }
  }
</style>
