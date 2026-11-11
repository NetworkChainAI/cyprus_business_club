<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;

  type FilterType = "all" | "one" | "progress" | "seasonal";
  let activeFilter: FilterType = "all";

  const achievements: any[] = data.allAchievements ?? [];
  const userAchievements: any[] = data.userAchievements ?? [];

  const earnedIds = new Set(
    userAchievements.map((ua: any) => ua.achievementId)
  );

  const earnedMap = new Map<string, any>();
  for (const ua of userAchievements) {
    if (!earnedMap.has(ua.achievementId)) {
      earnedMap.set(ua.achievementId, ua);
    }
  }

  const filters: { id: FilterType; labelKey: string; icon: string }[] = [
    { id: "all", labelKey: "profile.achievements.filterAll", icon: "lucide:layout-grid" },
    { id: "one", labelKey: "profile.achievements.filterOneOff", icon: "lucide:zap" },
    { id: "progress", labelKey: "profile.achievements.filterProgress", icon: "lucide:trending-up" },
    { id: "seasonal", labelKey: "profile.achievements.filterSeasonal", icon: "lucide:calendar" },
  ];

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    Common: { bg: "rgba(100,116,139,0.08)", text: "#64748b", border: "rgba(100,116,139,0.2)" },
    Rare: { bg: "rgba(59,130,246,0.08)", text: "#3b82f6", border: "rgba(59,130,246,0.2)" },
    Epic: { bg: "rgba(139,92,246,0.08)", text: "#8b5cf6", border: "rgba(139,92,246,0.2)" },
    Legendary: { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
    Mythic: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  };

  $: filtered =
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

<!-- Progress bar -->
<div class="progress-card">
  <div class="progress-top">
    <div class="progress-label">
      <iconify-icon icon="lucide:award" width="18" height="18"></iconify-icon>
      <span>{$t('profile.achievements.progress')}</span>
    </div>
    <div class="progress-nums">
      <span class="earned">{earnedCount}</span>
      <span class="sep">/</span>
      <span class="total">{totalCount}</span>
    </div>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" style="width:{progressPct}%"></div>
  </div>
  <div class="progress-pct">{progressPct}% {$t('profile.achievements.completed')}</div>
</div>

<!-- Filters -->
<div class="filters">
  {#each filters as f}
    <button
      type="button"
      class="filter-btn"
      class:active={activeFilter === f.id}
      on:click={() => (activeFilter = f.id)}
    >
      <iconify-icon icon={f.icon} width="14" height="14"></iconify-icon>
      {$t(f.labelKey)}
    </button>
  {/each}
</div>

<!-- Grid -->
{#if filtered.length === 0}
  <div class="empty-card">
    <iconify-icon icon="lucide:award" width="36" height="36"></iconify-icon>
    <div class="empty-title">{$t('profile.empty.noAchievements')}</div>
    <div class="empty-sub">{$t('profile.achievements.completeToEarn')}</div>
  </div>
{:else}
  <div class="grid">
    {#each filtered as ach (ach.id)}
      {@const isEarned = earnedIds.has(ach.id)}
      {@const tier = tierColors[ach.tier] ?? tierColors.Common}
      <a href="/profile/achievements/{ach.id}" class="ach-card" class:locked={!isEarned}>
        <div class="ach-icon">
          <img
            src={ach.iconUrl || "/assets/images/placeholder.png"}
            alt={ach.title}
            loading="lazy"
            decoding="async"
          />
          {#if !isEarned}
            <div class="lock-overlay">
              <iconify-icon icon="lucide:lock" width="16" height="16"></iconify-icon>
            </div>
          {/if}
        </div>

        <div class="ach-body">
          <div class="ach-title">{ach.title}</div>

          {#if ach.tier}
            <span
              class="tier-pill"
              style="background:{tier.bg};color:{tier.text};border-color:{tier.border}"
            >
              {ach.tier}
            </span>
          {/if}

          <div class="ach-kind">
            {ach.kind === "ONE_OFF" ? $t('profile.achievements.filterOneOff') : ach.kind === "PROGRESS" ? $t('profile.achievements.filterProgress') : $t('profile.achievements.filterSeasonal')}
          </div>
        </div>

        {#if isEarned}
          <div class="earned-check">
            <iconify-icon icon="lucide:check-circle" width="18" height="18"></iconify-icon>
          </div>
        {/if}
      </a>
    {/each}
  </div>
{/if}

<style>
  /* Progress card */
  .progress-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 16px;
  }

  .progress-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .progress-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
  }

  .progress-label :global(iconify-icon) {
    color: #4f46e5;
  }

  .progress-nums {
    font-weight: 900;
    font-size: 15px;
  }

  .earned {
    color: #4f46e5;
  }

  .sep {
    color: #cbd5e1;
    margin: 0 2px;
  }

  .total {
    color: #94a3b8;
  }

  .progress-bar {
    height: 8px;
    border-radius: 999px;
    background: #f1f5f9;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: #4f46e5;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .progress-pct {
    margin-top: 8px;
    font-weight: 700;
    font-size: 12px;
    color: #4f46e5;
  }

  /* Filters */
  .filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-bottom: 16px;
  }

  .filter-btn {
    height: 34px;
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
    transition: all 0.15s;
  }

  .filter-btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .filter-btn.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .filter-btn.active :global(iconify-icon) {
    color: #fff;
  }

  /* Empty */
  .empty-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
    color: #94a3b8;
  }

  .empty-title {
    font-weight: 800;
    font-size: 14px;
    color: #64748b;
  }

  .empty-sub {
    font-weight: 600;
    font-size: 12px;
    color: #94a3b8;
  }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  /* Achievement card */
  .ach-card {
    position: relative;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
  }

  .ach-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    border-color: #c7d2fe;
  }

  .ach-card.locked {
    opacity: 0.55;
    filter: grayscale(70%);
  }

  .ach-card.locked:hover {
    opacity: 0.7;
    filter: grayscale(40%);
  }

  /* Icon area */
  .ach-icon {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    background: #0f172a;
    overflow: hidden;
  }

  .ach-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .lock-overlay {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(3px);
    display: grid;
    place-items: center;
    color: rgba(255, 255, 255, 0.6);
  }

  /* Body */
  .ach-body {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ach-title {
    font-weight: 800;
    font-size: 12px;
    color: #0f172a;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tier-pill {
    display: inline-flex;
    align-self: flex-start;
    padding: 1px 6px;
    border-radius: 5px;
    font-weight: 800;
    font-size: 10px;
    border: 1px solid;
  }

  .ach-kind {
    font-weight: 600;
    font-size: 10px;
    color: #94a3b8;
  }

  /* Earned check */
  .earned-check {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    border-radius: 6px;
    background: rgba(34, 197, 94, 0.9);
    color: #fff;
    display: grid;
    place-items: center;
  }

  .earned-check :global(iconify-icon) {
    font-size: 14px;
  }

  @media (max-width: 520px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .ach-body {
      padding: 8px;
    }

    .ach-title {
      font-size: 11px;
    }
  }
</style>
