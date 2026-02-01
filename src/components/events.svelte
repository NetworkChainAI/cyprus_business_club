<script lang="ts">
  import { onMount } from "svelte";
  
  type Event = {
    id: string;
    title: string;
    description?: string;
    categories?: { name: string }[];
    date: string;
    location: string;
    price?: number | null;
    photo?: string | null;
  };

  type Category = {
    id: string;
    name: string;
  };

  let categories: Category[] = [];
  let selectedCategory: string = "All";
  let sortOption: "name" | "date" = "name";
  let events: Event[] = [];
  let loading = true;
  let error: string | null = null;

  // --- Categories UI (Top chips + More popover) ---
  const TOP_CATS = 12;
  let moreOpen = false;
  let catQuery = "";

  function toggleMore(e: MouseEvent) {
    e.stopPropagation();
    moreOpen = !moreOpen;
    if (moreOpen) catQuery = "";
  }

  function selectCategory(name: string) {
    selectedCategory = name;
    moreOpen = false;
  }

  $: topCategories = categories.slice(0, TOP_CATS);
  $: activeIsInTop = topCategories.some((c) => c.name === selectedCategory);
  $: chipsCategories = activeIsInTop
    ? topCategories
    : [
        ...topCategories,
        ...(categories.find((c) => c.name === selectedCategory)
          ? [categories.find((c) => c.name === selectedCategory)!]
          : []),
      ];

  $: filteredCategoryList = categories.filter((c) =>
    c.name.toLowerCase().includes(catQuery.trim().toLowerCase())
  );

  onMount(() => {
    const onDocClick = () => (moreOpen = false);
    document.addEventListener("click", onDocClick);

    (async () => {
      try {
        const catRes = await fetch("/api/categories");
        if (!catRes.ok) throw new Error("Failed to load categories");
        const catData = await catRes.json();
        categories = [{ id: "all", name: "All" }, ...catData];

        const eventRes = await fetch("/api/events");
        if (!eventRes.ok) throw new Error("Failed to load events");
        const eventData = await eventRes.json();
        events = eventData;
      } catch (err) {
        console.error(err);
        error = "Ошибка при загрузке данных 😔";
      } finally {
        loading = false;
      }
    })();

    return () => {
      document.removeEventListener("click", onDocClick);
    };
  });

  $: filteredEvents = events
    .filter((e) => {
      if (selectedCategory === "All" || selectedCategory === "all") return true;
      return e.categories?.some((c) => c.name === selectedCategory);
    })
    .sort((a, b) => {
      if (sortOption === "name") return a.title.localeCompare(b.title);
      if (sortOption === "date")
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      return 0;
    });
</script>

<h1>All Events</h1>

<div class="top-bar">
  <div class="categories" on:click|stopPropagation>
    {#each chipsCategories as category (category.id)}
      <button
        type="button"
        class="category {selectedCategory === category.name ? 'active' : ''}"
        on:click={() => selectCategory(category.name)}
        title={category.name}
      >
        {category.name}
      </button>
    {/each}

    <button type="button" class="category more" on:click={toggleMore}>
      More ▾
    </button>

    {#if moreOpen}
      <div class="cat-popover">
        <input
          class="cat-search"
          placeholder="Search category…"
          bind:value={catQuery}
        />

        <div class="cat-list">
          {#each filteredCategoryList as c (c.id)}
            <button
              type="button"
              class="cat-item {selectedCategory === c.name ? 'active' : ''}"
              on:click={() => selectCategory(c.name)}
            >
              <span class="cat-name">{c.name}</span>
              {#if selectedCategory === c.name}
                <span class="cat-check">✓</span>
              {/if}
            </button>
          {/each}

          {#if filteredCategoryList.length === 0}
            <div class="cat-empty">No results</div>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  <div class="controls">
    <span class="label">Sort:</span>

    <div class="segmented" role="tablist" aria-label="Sort events">
      <button
        type="button"
        class="seg-btn {sortOption === 'name' ? 'active' : ''}"
        on:click={() => (sortOption = "name")}
      >
        Name
      </button>

      <button
        type="button"
        class="seg-btn {sortOption === 'date' ? 'active' : ''}"
        on:click={() => (sortOption = "date")}
      >
        Date
      </button>
    </div>
  </div>
</div>

{#if loading}
  <p class="loading"></p>
{:else if error}
  <p class="error">{error}</p>
{:else}
  <div class="grid">
    {#each filteredEvents as event (event.id)}
      <a href={`/events/${event.id}`} class="card">
  <div class="img-wrapper">
    <img
      src={event.photo
        ? `/api/photo/${event.photo.split("/").pop()}`
        : "/assets/images/placeholder-event.jpg"}
      alt={event.title}
    />

    <div class="img-overlay"></div>

    <div class="top-badges">
      <span class="price-badge">
        {event.price ? `€${event.price}` : "Free"}
      </span>
    </div>

    <div class="date-pill">
      <span class="day">
        {new Date(event.date).getDate()}
      </span>
      <span class="month">
        {new Date(event.date).toLocaleString("en", { month: "short" })}
      </span>
    </div>
  </div>

  <div class="card-content">
    <h3>{event.title}</h3>

    {#if event.categories?.length}
      <div class="card-chips">
        {#each event.categories.slice(0, 2) as c}
          <span class="chip">{c.name}</span>
        {/each}
        {#if event.categories.length > 2}
          <span class="chip ghost">+{event.categories.length - 2}</span>
        {/if}
      </div>
    {/if}

    <div class="meta">
      <p class="location">
        📍 {event.location}
      </p>

      <p class="date-text">
        {new Date(event.date).toLocaleDateString("ru-RU", {
          weekday: "short",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>
    </div>
  </div>
</a>

    {/each}
  </div>
{/if}

<style>
  .icon {
    margin-right: 4px;
    opacity: 0.7;
  }

  h1 {
    text-align: center;
    margin-top: 3rem;
    font-size: 2rem;
    font-weight: 700;
    color: #0b3954;
  }
  .card-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 2px;
  }

  .chip {
    font-size: 12px;
    padding: 5px 9px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #111827;
    line-height: 1;
  }

  .chip.ghost {
    background: #fff;
    color: #6b7280;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    max-width: 1100px;
    margin: 0 auto 1.5rem auto;
    padding: 0 1rem;
    gap: 1rem;
  }

  .categories {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    max-width: 100%;
  }

  /* chip */
  .category {
    background: white;
    color: #0b3954;
    border-radius: 9999px;
    padding: 0.4rem 1rem;
    border: 1px solid #cbd5e1;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.25s ease;
    white-space: nowrap;
  }

  .category:hover {
    background: #e2e8f0;
  }

  .category.active {
    background: #0b3954;
    color: white;
    border-color: #0b3954;
  }

  .category.more {
    background: #f8fafc;
  }

  /* popover */
  .cat-popover {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: min(520px, 100%);
    z-index: 60;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 10px;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  }

  .cat-search {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 14px;
    background: #f9fafb;
    outline: none;
  }

  .cat-search:focus {
    background: #fff;
    border-color: #60a5fa;
  }

  .cat-list {
    margin-top: 10px;
    max-height: 280px;
    overflow: auto;
    padding-right: 4px;
    display: grid;
    gap: 6px;
  }

  .cat-item {
    width: 100%;
    border: 1px solid #e5e7eb;
    background: #fff;
    border-radius: 12px;
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
  }

  .cat-item:hover {
    background: #f8fafc;
  }

  .cat-item.active {
    border-color: #bfdbfe;
    background: #eff6ff;
  }

  .cat-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .cat-check {
    flex: 0 0 auto;
    color: #1d4ed8;
    font-weight: 700;
  }

  .cat-empty {
    padding: 10px 6px;
    color: #6b7280;
    font-size: 14px;
  }

  .card:hover .img-wrapper img {
    transform: scale(1.05);
  }

  .img-wrapper img {
    transition: transform 0.4s ease;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .label {
    font-size: 0.85rem;
    color: #334155;
  }

  .segmented {
    display: inline-flex;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: #ffffff;
    overflow: hidden;
  }

  .seg-btn {
    border: 0;
    background: transparent;
    padding: 0.45rem 0.9rem;
    font-size: 0.85rem;
    cursor: pointer;
    color: #0b3954;
    transition: background 0.2s ease;
  }

  .seg-btn:hover {
    background: #f1f5f9;
  }

  .seg-btn.active {
    background: #0b3954;
    color: #fff;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 1rem;
    max-width: 1100px;
    margin: 0 auto 3rem auto;
    padding: 0 0.5rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    height: 340px;
    width: 100%;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition:
      transform 0.25s ease,
      box-shadow 0.25s ease;
    cursor: pointer;
  }

  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.07);
  }

  .img-wrapper {
    flex: 0 0 160px;
    height: 160px;
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .badge {
    position: absolute;
    right: 10px;
    top: 10px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: rgba(17, 24, 39, 0.55);
    color: #fff;
    backdrop-filter: blur(6px);
  }

  .img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-content {
    padding: 0.8rem 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card h3 {
    margin-bottom: 0.2rem;
    color: #0b3954;
    font-size: 1rem;
    font-weight: 600;
  }
  .meta {
    margin-top: auto;
    display: grid;
    gap: 2px;
  }

  .location {
    font-size: 0.85rem;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .date {
    font-size: 0.85rem;
    color: #0b3954;
    font-weight: 500;
  }
  .meta p {
    margin: 0;
  }
  .img-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.15),
    rgba(0, 0, 0, 0.55)
  );
}

.top-badges {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.price-badge {
  background: rgba(255, 255, 255, 0.95);
  color: #0b3954;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  font-weight: 600;
}

.date-pill {
  position: absolute;
  bottom: 10px;
  left: 10px;
  z-index: 2;
  background: white;
  border-radius: 10px;
  padding: 6px 10px;
  text-align: center;
  line-height: 1;
}

.date-pill .day {
  font-size: 18px;
  font-weight: 700;
  color: #0b3954;
}

.date-pill .month {
  font-size: 11px;
  text-transform: uppercase;
  color: #64748b;
}

.card-content h3 {
  font-size: 1.05rem;
  line-height: 1.3;
}

.date-text {
  font-size: 0.8rem;
  color: #64748b;
}

.card {
  height: auto;
  min-height: 360px;
}

</style>
