<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";
  import { withLang } from "$lib/utils/withLang";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: {
    categories: Array<{ id: string; name: string }>;
    events: Array<{
      id: string;
      title: string;
      description: string;
      date: string | Date;
      location: string;
      price: number | null;
      photo: string | null;
      categories: Array<{ id: string; name: string }>;
      community: { id: string; name: string; logoUrl: string | null } | null;
      brand: { id: string; name: string; logoUrl: string | null; type: string } | null;
      goingCount: number;
      isRegistered: boolean;
    }>;
    userId: string | null;
    isOwner: boolean;
  };

  let query = "";
  let sort: "soonest" | "latest" = "latest";

  let activeCategory: string = "All";
  let dateFilter: "all" | "today" | "week" = "all";
  let priceFilter: "all" | "free" | "paid" = "all";

  let categoriesOpen = false;
  const CATS_LIMIT = 10;

  $: allCategoryNames = data.categories.map((c) => c.name);
  $: visibleCats = categoriesOpen
    ? allCategoryNames
    : allCategoryNames.slice(0, CATS_LIMIT);

  function isToday(d: Date) {
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }

  function isThisWeek(d: Date) {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return d >= start && d < end;
  }

  function formatDay(dateValue: string | Date) {
    return new Date(dateValue).getDate().toString();
  }

  function formatMonth(dateValue: string | Date) {
    return new Date(dateValue)
      .toLocaleString(getDateLocale(), { month: "short" })
      .toUpperCase();
  }

  function formatFullDate(dateValue: string | Date) {
    return new Date(dateValue).toLocaleDateString(getDateLocale(), {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function priceBadge(e: any) {
    if (e.price === null || e.price === undefined || e.price === 0)
      return t.get('events.filter.free');
    const n = Number(e.price);
    if (Number.isFinite(n))
      return `€${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
    return t.get('events.filter.paid');
  }

  function isFreeEvent(e: any) {
    return e.price === null || e.price === undefined || e.price === 0;
  }

  function clearFilters() {
    query = "";
    activeCategory = "All";
    dateFilter = "all";
    priceFilter = "all";
  }

  $: filtered = data.events
    .filter((e) => {
      const name = (e.title ?? "").toLowerCase();
      const location = (e.location ?? "").toLowerCase();
      const q = query.trim().toLowerCase();
      if (q && !(name.includes(q) || location.includes(q))) return false;

      if (activeCategory !== "All") {
        const cats = (e.categories ?? []).map((c: any) => c.name);
        if (!cats.includes(activeCategory)) return false;
      }

      const d = new Date(e.date);
      if (dateFilter === "today" && !isToday(d)) return false;
      if (dateFilter === "week" && !isThisWeek(d)) return false;

      if (priceFilter === "free" && !isFreeEvent(e)) return false;
      if (priceFilter === "paid" && isFreeEvent(e)) return false;

      return true;
    })
    .sort((a, b) => {
      if (sort === "soonest") return +new Date(a.date) - +new Date(b.date);
      if (sort === "latest") return +new Date((b as any).createdAt ?? b.date) - +new Date((a as any).createdAt ?? a.date);
      return 0;
    });

  $: hasActiveFilters =
    activeCategory !== "All" ||
    dateFilter !== "all" ||
    priceFilter !== "all" ||
    query.trim().length > 0;
</script>

<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <h1>
        <iconify-icon icon="lucide:calendar-days" width="28" height="28"></iconify-icon>
        {$t('events.title')}
      </h1>
      <p class="header-sub">{$t('events.subtitle')}</p>
    </div>
    <div class="header-right">
      <div class="search-box">
        <iconify-icon icon="lucide:search" width="16" height="16"></iconify-icon>
        <input
          bind:value={query}
          placeholder={$t('events.search')}
          aria-label={$t('events.search')}
        />
        {#if query.length > 0}
          <button class="search-clear" type="button" on:click={() => (query = "")}>
            <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
          </button>
        {/if}
      </div>
      <button
        class="sort-btn"
        type="button"
        on:click={() => (sort = sort === "soonest" ? "latest" : "soonest")}
      >
        <iconify-icon icon="lucide:arrow-up-down" width="14" height="14"></iconify-icon>
        {sort === "soonest" ? $t('events.sort.soonest') : $t('events.sort.latest')}
      </button>
      {#if data.isOwner}
        <a class="create-event-btn" href={withLang('/admin')}>
          <iconify-icon icon="lucide:settings" width="16" height="16"></iconify-icon>
          {$t('events.adminPanel')}
        </a>
      {/if}
    </div>
  </div>

  <!-- Filters -->
  <div class="filters">
    <div class="filter-group">
      <span class="filter-label">{$t('events.filter.category')}</span>
      <div class="chips">
        <button
          class="chip"
          class:active={activeCategory === "All"}
          type="button"
          on:click={() => (activeCategory = "All")}
        >
          {$t('events.filter.all')}
        </button>
        {#each visibleCats as c}
          <button
            class="chip"
            class:active={activeCategory === c}
            type="button"
            on:click={() => (activeCategory = c)}
          >
            {c}
          </button>
        {/each}
        {#if allCategoryNames.length > CATS_LIMIT}
          <button
            class="chip chip-more"
            type="button"
            on:click={() => (categoriesOpen = !categoriesOpen)}
          >
            {categoriesOpen ? $t('events.filter.less') : `+${allCategoryNames.length - CATS_LIMIT}`}
          </button>
        {/if}
      </div>
    </div>

    <div class="filter-row">
      <div class="filter-group">
        <span class="filter-label">{$t('events.filter.date')}</span>
        <div class="chips">
          <button
            class="chip"
            class:active={dateFilter === "today"}
            type="button"
            on:click={() => (dateFilter = dateFilter === "today" ? "all" : "today")}
          >
            <iconify-icon icon="lucide:sun" width="13" height="13"></iconify-icon>
            {$t('events.filter.today')}
          </button>
          <button
            class="chip"
            class:active={dateFilter === "week"}
            type="button"
            on:click={() => (dateFilter = dateFilter === "week" ? "all" : "week")}
          >
            <iconify-icon icon="lucide:calendar-range" width="13" height="13"></iconify-icon>
            {$t('events.filter.thisWeek')}
          </button>
        </div>
      </div>

      <div class="filter-group">
        <span class="filter-label">{$t('events.filter.price')}</span>
        <div class="chips">
          <button
            class="chip"
            class:active={priceFilter === "free"}
            type="button"
            on:click={() => (priceFilter = priceFilter === "free" ? "all" : "free")}
          >
            {$t('events.filter.free')}
          </button>
          <button
            class="chip"
            class:active={priceFilter === "paid"}
            type="button"
            on:click={() => (priceFilter = priceFilter === "paid" ? "all" : "paid")}
          >
            {$t('events.filter.paid')}
          </button>
        </div>
      </div>

      {#if hasActiveFilters}
        <button class="clear-btn" type="button" on:click={clearFilters}>
          <iconify-icon icon="lucide:x" width="13" height="13"></iconify-icon>
          {$t('events.filter.clear')}
        </button>
      {/if}
    </div>
  </div>

  <!-- Results count -->
  <div class="results-bar">
    <span class="results-count">{filtered.length} {filtered.length !== 1 ? $t('events.results.events') : $t('events.results.event')}</span>
  </div>

  <!-- Grid -->
  {#if filtered.length > 0}
    <div class="grid">
      {#each filtered as event (event.id)}
        <a class="card" href={withLang(`/events/${event.id}`)}>
          <div class="card-img">
            <img
              src={photoSrc(event.photo, 500) || "/assets/images/placeholder-event.jpg"}
              alt={event.title}
              loading="lazy"
              decoding="async"
            />
            <div class="card-price" class:free={isFreeEvent(event)}>
              {priceBadge(event)}
            </div>
            <div class="card-date-badge">
              <span class="cdb-day">{formatDay(event.date)}</span>
              <span class="cdb-month">{formatMonth(event.date)}</span>
            </div>
            {#if event.isRegistered}
              <div class="card-registered">
                <iconify-icon icon="lucide:check" width="12" height="12"></iconify-icon>
                {$t('events.card.going')}
              </div>
            {/if}
          </div>

          <div class="card-body">
            <h3>{event.title}</h3>

            {#if event.community}
              <div class="org-badge">
                {#if event.community.logoUrl}
                  <img src={photoSrc(event.community.logoUrl)} alt="" class="org-logo" />
                {:else}
                  <iconify-icon icon="lucide:users" width="12" height="12"></iconify-icon>
                {/if}
                <span>{event.community.name}</span>
              </div>
            {:else if event.brand}
              <div class="org-badge">
                {#if event.brand.logoUrl}
                  <img src={photoSrc(event.brand.logoUrl)} alt="" class="org-logo" />
                {:else}
                  <iconify-icon icon="lucide:building-2" width="12" height="12"></iconify-icon>
                {/if}
                <span>{event.brand.name}</span>
              </div>
            {/if}

            {#if event.categories.length > 0}
              <div class="card-cats">
                {#each event.categories.slice(0, 2) as cat}
                  <span class="cat-tag">{cat.name}</span>
                {/each}
                {#if event.categories.length > 2}
                  <span class="cat-tag cat-more">+{event.categories.length - 2}</span>
                {/if}
              </div>
            {/if}

            <div class="card-info">
              <span class="info-row">
                <iconify-icon icon="lucide:map-pin" width="13" height="13"></iconify-icon>
                <span>{event.location}</span>
              </span>
              <span class="info-row">
                <iconify-icon icon="lucide:clock" width="13" height="13"></iconify-icon>
                <span>{formatFullDate(event.date)}</span>
              </span>
            </div>

            <div class="card-footer">
              {#if event.goingCount > 0}
                <div class="going">
                  <iconify-icon icon="lucide:users" width="13" height="13"></iconify-icon>
                  {event.goingCount} {$t('events.card.goingCount')}
                </div>
              {:else}
                <div></div>
              {/if}
              <span class="card-arrow">
                <iconify-icon icon="lucide:arrow-right" width="16" height="16"></iconify-icon>
              </span>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {:else}
    <div class="empty">
      <div class="empty-icon">
        <iconify-icon icon="lucide:calendar-x-2" width="40" height="40"></iconify-icon>
      </div>
      <div class="empty-title">{$t('events.empty.title')}</div>
      <div class="empty-sub">{$t('events.empty.subtitle')}</div>
      {#if hasActiveFilters}
        <button class="clear-btn-big" type="button" on:click={clearFilters}>
          <iconify-icon icon="lucide:rotate-ccw" width="14" height="14"></iconify-icon>
          {$t('events.filter.resetAll')}
        </button>
      {/if}
    </div>
  {/if}
</div>

<ContextAssistant contextKey="global" payload={{ page: "events" }} title="Events Assistant" />

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

  h1 iconify-icon {
    color: #4f46e5;
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

  .create-event-btn {
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

  .create-event-btn:hover {
    background: #4338ca;
  }

  .create-event-btn :global(iconify-icon) {
    color: #fff;
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

  .search-box iconify-icon {
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

  .sort-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .sort-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .sort-btn iconify-icon {
    color: #94a3b8;
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

  .chip-more {
    border-style: dashed;
    color: #94a3b8;
  }

  .chip-more:hover {
    color: #4f46e5;
    border-color: #c7d2fe;
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

  /* ============ CARD ============ */
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    transition: all 0.2s ease;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
    border-color: #c7d2fe;
  }

  .card-img {
    position: relative;
    height: 180px;
    overflow: hidden;
    background: #0f172a;
  }

  .card-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.3s ease;
  }

  .card:hover .card-img img {
    transform: scale(1.05);
  }

  .card-price {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 5px 10px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(226, 232, 240, 0.6);
    font-weight: 800;
    font-size: 12px;
    color: #0f172a;
  }

  .card-price.free {
    background: rgba(16, 185, 129, 0.9);
    border-color: transparent;
    color: #fff;
  }

  .card-date-badge {
    position: absolute;
    top: 12px;
    left: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 6px 10px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(6px);
    border: 1px solid rgba(226, 232, 240, 0.6);
    line-height: 1;
  }

  .cdb-day {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .cdb-month {
    font-size: 10px;
    font-weight: 800;
    color: #4f46e5;
    letter-spacing: 0.05em;
  }

  .card-registered {
    position: absolute;
    bottom: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(16, 185, 129, 0.9);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    backdrop-filter: blur(6px);
  }

  .card-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .card-body h3 {
    font-size: 16px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    transition: color 0.15s;
  }

  .card:hover .card-body h3 {
    color: #4f46e5;
  }

  .org-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    color: #4f46e5;
    background: #eef2ff;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .org-badge :global(iconify-icon) {
    color: #4f46e5;
  }

  .org-logo {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    object-fit: cover;
  }

  .card-cats {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .cat-tag {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #475569;
  }

  .cat-more {
    color: #94a3b8;
    background: #f8fafc;
  }

  .card-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: auto;
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }

  .info-row iconify-icon {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .info-row span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px solid #f1f5f9;
  }

  .going {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 700;
    color: #059669;
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
