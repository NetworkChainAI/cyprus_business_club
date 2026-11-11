<script lang="ts">
  import { t } from "$lib/i18n";

  export let data;

  type FilterType = "all" | "one" | "progress" | "seasonal";
  let activeFilter: FilterType = "all";

  const achievements = data.achievements ?? [];
  const userAchievements = data.userAchievements ?? [];

  const earnedIds = new Set(
    userAchievements.map((ua: any) => ua.achievementId)
  );

  const filterKeys: { id: FilterType; key: string }[] = [
    { id: "all", key: "common.filter.all" },
    { id: "one", key: "common.achievements.oneOff" },
    { id: "progress", key: "common.achievements.progress" },
    { id: "seasonal", key: "common.achievements.seasonal" },
  ];

  // Сделаем список реактивным — так фильтрация всегда точно пересчитается
  $: filteredAchievements =
    activeFilter === "one"
      ? achievements.filter((a: any) => a.kind === "ONE_OFF")
      : activeFilter === "progress"
      ? achievements.filter((a: any) => a.kind === "PROGRESS")
      : activeFilter === "seasonal"
      ? achievements.filter((a: any) => a.kind === "SEASONAL")
      : achievements;

  $: earnedCount = earnedIds.size;
  $: totalCount = achievements.length;
  $: progressPct = totalCount ? Math.round((earnedCount / totalCount) * 100) : 0;
</script>

<div class="wrapper">
  <div class="card">

    <!-- Header -->
    <div class="header">
      <div class="header-text">
        <div class="title">
          {$t('common.achievements.title')}
        </div>
        <div class="subtitle">
          {$t('common.achievements.earned')} <b>{earnedCount}</b> {$t('common.achievements.of')} <b>{totalCount}</b>
        </div>
      </div>

    </div>

    <!-- Filters -->
    <div class="filters">
      {#each filterKeys as f}
        <button
          type="button"
          class="filter-btn"
          class:active={activeFilter === f.id}
          on:click={() => (activeFilter = f.id)}
        >
          {$t(f.key)}
        </button>
      {/each}
    </div>

    <!-- Grid -->
    <div class="grid">
      {#each filteredAchievements as ach}
        <a href={`/achievement/${ach.id}`} class="achievement-link">
          <div class="achievement-card {earnedIds.has(ach.id) ? 'earned' : 'locked'}">

            <div class="icon-wrap">
              <img
                class="icon"
                src={ach.iconUrl || "/assets/images/placeholder.png"}
                alt={ach.title}
                loading="lazy"
              />
          
              {#if !earnedIds.has(ach.id)}
                <div class="lock-overlay">
                  <span class="lock-dot"></span>
                </div>
              {/if}
            </div>

            <div class="card-title">{ach.title}</div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>

<style>
  .wrapper {
    width: min(94%, 74rem);
    margin: 2.5rem auto;
    padding: 0 1rem;
  }

  .card {
    background: #fff;
    border-radius: 1.25rem;
    padding: 1.8rem;
    width: 100%;
    box-shadow: 0 8px 26px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(0, 0, 0, 0.06);
    color: #0b3954;
  }

  /* Header */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    margin-bottom: 1.2rem;
    flex-wrap: wrap;
  }

  .header-text .title {
    font-size: 1.25rem;
    font-weight: 800;
    letter-spacing: 0.2px;
  }

  .header-text .subtitle {
    margin-top: 0.2rem;
    font-size: 0.95rem;
    color: #325c73;
  }

  .progress {
    min-width: 220px;
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }

  .progress-bar {
    height: 10px;
    width: 180px;
    background: #eef1f5;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #6d28d9, #8b5cf6);
    border-radius: 999px;
    transition: width .25s ease;
  }

  .progress-label {
    font-size: 0.85rem;
    font-weight: 700;
    color: #6d28d9;
  }

  /* Filters */
  .filters {
    display: flex;
    gap: 0.6rem;
    margin: 0.8rem 0 1.6rem;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 600;
    background: #f4f5f7;
    color: #0b3954;
    cursor: pointer;
    border: 1px solid rgba(0,0,0,0.08);
    transition: 0.15s ease;
    user-select: none;
  }

  .filter-btn:hover {
    transform: translateY(-1px);
    background: #eceef2;
  }

  .filter-btn.active {
    background: #6d28d9;
    color: #fff;
    border-color: #6d28d9;
    box-shadow: 0 6px 14px rgba(109,40,217,0.35);
  }

  /* Grid */
  .grid {
    display: grid;
    gap: 1.2rem;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  }

  .achievement-link { text-decoration: none; }

  .achievement-card {
    background: #fff;
    border-radius: 1.2rem;
    padding: 1rem;
    border: 1px solid rgba(0, 0, 0, 0.08);
    box-shadow: 0 6px 16px rgba(0,0,0,0.06);
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    position: relative;
    min-height: 210px;
  }

  .achievement-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 22px rgba(0,0,0,0.10);
    border-color: rgba(109,40,217,0.35);
  }

  .icon-wrap {
    position: relative;
    border-radius: 0.9rem;
    overflow: hidden;
    background: #0b1220;
    aspect-ratio: 1 / 1;
    display: grid;
    place-items: center;
  }

  .icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.02);
  }

  .card-title {
    font-size: 0.98rem;
    font-weight: 700;
    color: #0b3954;
    line-height: 1.2;
    text-align: center;

    /* 2 строки с аккуратным обрезанием */
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  /* Earned badge */
  .badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: #22c55e;
    color: #fff;
    font-weight: 900;
    font-size: 0.85rem;
    padding: 4px 7px;
    border-radius: 999px;
    box-shadow: 0 4px 10px rgba(34,197,94,0.4);
  }

  /* Locked state */
  .achievement-card.locked {
    opacity: 0.6;
    filter: grayscale(85%);
  }

  .lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(8, 14, 24, 0.45);
    backdrop-filter: blur(2px);
    display: grid;
    place-items: center;
  }

  .lock-dot {
    width: 46px;
    height: 46px;
    border-radius: 999px;
    background: rgba(255,255,255,0.12);
    border: 2px solid rgba(255,255,255,0.35);
    box-shadow: inset 0 0 0 6px rgba(255,255,255,0.06);
  }
</style>
