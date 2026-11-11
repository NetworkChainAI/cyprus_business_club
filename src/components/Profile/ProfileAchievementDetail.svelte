<script lang="ts">
  import { t } from "$lib/i18n";
  import { formatDate as fmtDate } from "$lib/utils/dateLocale";

  export let data: any;

  const achievement = data.achievement;
  const progress: any[] = data.userProgress ?? [];
  const percentage: number = data.percentage ?? 0;
  const ownerCount: number = data.ownerCount ?? 0;
  const totalUsers: number = data.totalUsers ?? 0;

  function kindLabel(kind: string): string {
    if (kind === "ONE_OFF") return t.get('profile.achievements.filterOneOff');
    if (kind === "PROGRESS") return t.get('profile.achievements.filterProgress');
    if (kind === "SEASONAL") return t.get('profile.achievements.filterSeasonal');
    return kind ?? "";
  }

  const tierColors: Record<string, { bg: string; text: string; border: string }> = {
    Common: { bg: "rgba(100,116,139,0.08)", text: "#64748b", border: "rgba(100,116,139,0.2)" },
    Rare: { bg: "rgba(59,130,246,0.08)", text: "#3b82f6", border: "rgba(59,130,246,0.2)" },
    Epic: { bg: "rgba(139,92,246,0.08)", text: "#8b5cf6", border: "rgba(139,92,246,0.2)" },
    Legendary: { bg: "rgba(245,158,11,0.08)", text: "#f59e0b", border: "rgba(245,158,11,0.2)" },
    Mythic: { bg: "rgba(239,68,68,0.08)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
  };

  const tier = tierColors[achievement?.tier] ?? tierColors.Common;
  const isEarned = progress.length > 0;

  function formatDateStr(d: string | Date) {
    return fmtDate(d, { day: "numeric", month: "short", year: "numeric" });
  }
</script>

{#if !achievement}
  <div class="empty-card">
    <iconify-icon icon="lucide:award" width="36"></iconify-icon>
    <div class="empty-title">{$t('profile.achievementDetail.notFound')}</div>
  </div>
{:else}
  <a href="/profile/achievements" class="back-link">
    <iconify-icon icon="lucide:arrow-left" width="16"></iconify-icon>
    {$t('profile.achievementDetail.backToAchievements')}
  </a>

  <div class="detail-card">
    <div class="header">
      <div class="icon-box">
        <img
          src={achievement.iconUrl || "/assets/images/placeholder.png"}
          alt={achievement.title}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div class="header-info">
        <div class="pills">
          <span class="kind-pill">{kindLabel(achievement?.kind)}</span>
          {#if achievement.tier}
            <span
              class="tier-pill"
              style="background:{tier.bg};color:{tier.text};border-color:{tier.border}"
            >
              {achievement.tier}
            </span>
          {/if}
          {#if isEarned}
            <span class="earned-pill">
              <iconify-icon icon="lucide:check-circle" width="13"></iconify-icon>
              {$t('profile.achievementDetail.earned')}
            </span>
          {/if}
        </div>

        <h1 class="title">{achievement.title}</h1>

        {#if achievement.description}
          <p class="desc">{achievement.description}</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-icon">
        <iconify-icon icon="lucide:users" width="18"></iconify-icon>
      </div>
      <div>
        <div class="stat-value">{ownerCount}</div>
        <div class="stat-label">{$t('profile.achievementDetail.owners')}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon">
        <iconify-icon icon="lucide:percent" width="18"></iconify-icon>
      </div>
      <div>
        <div class="stat-value">{percentage}%</div>
        <div class="stat-label">{$t('profile.achievementDetail.rarity')}</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon">
        <iconify-icon icon="lucide:layers" width="18"></iconify-icon>
      </div>
      <div>
        <div class="stat-value">{progress.length > 0 ? progress[progress.length - 1].level : 0}</div>
        <div class="stat-label">{$t('profile.achievementDetail.yourLevel')}</div>
      </div>
    </div>
  </div>

  <div class="rarity-card">
    <div class="rarity-top">
      <div class="rarity-title">
        <iconify-icon icon="lucide:bar-chart-3" width="16"></iconify-icon>
        {$t('profile.achievementDetail.communityRarity')}
      </div>
      <div class="rarity-pct">{percentage}%</div>
    </div>
    <div class="rarity-bar">
      <div class="rarity-fill" style="width:{percentage}%"></div>
    </div>
    <div class="rarity-sub">{ownerCount} / {totalUsers} {$t('profile.achievementDetail.rarityDesc')}</div>
  </div>

  {#if achievement.levelsJson && achievement.levelsJson.length > 0}
    <div class="section-card">
      <div class="section-title">
        <iconify-icon icon="lucide:trophy" width="16"></iconify-icon>
        {$t('profile.achievementDetail.levels')}
      </div>
      <div class="levels-grid">
        {#each achievement.levelsJson as lvl, i}
          {@const reached = progress.some((p) => p.level >= lvl.level)}
          <div class="level-item" class:reached>
            <div class="level-num">{lvl.level}</div>
            <div class="level-info">
              <div class="level-target">{$t('profile.achievementDetail.target')}: <b>{lvl.target}</b></div>
              <div class="level-label">
                {#if reached}
                  <iconify-icon icon="lucide:check" width="12"></iconify-icon> {$t('profile.achievements.completed')}
                {:else}
                  {i === 0 ? $t('profile.achievementDetail.starterLevel') : $t('profile.achievementDetail.nextMilestone')}
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="section-card">
    <div class="section-title">
      <iconify-icon icon="lucide:clock" width="16"></iconify-icon>
      {$t('profile.achievementDetail.yourProgress')}
    </div>

    {#if progress.length > 0}
      <div class="timeline">
        {#each progress as p}
          <div class="tl-item">
            <div class="tl-dot"></div>
            <div class="tl-content">
              <div class="tl-level">{$t('profile.achievementDetail.levelEarned')} {p.level}</div>
              <div class="tl-date">{formatDateStr(p.earnedAt)}</div>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="no-progress">
        <iconify-icon icon="lucide:lock" width="20"></iconify-icon>
        <div>{$t('profile.achievementDetail.notEarnedYet')}</div>
        <div class="no-progress-sub">{$t('profile.achievementDetail.completeToUnlock')}</div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
    margin-bottom: 16px;
    transition: all 0.15s;
  }

  .back-link:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #0f172a;
  }

  .detail-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
    margin-bottom: 14px;
  }

  .header {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .icon-box {
    flex: 0 0 100px;
    width: 100px;
    height: 100px;
    border-radius: 16px;
    background: #0f172a;
    overflow: hidden;
  }

  .icon-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .header-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .kind-pill {
    padding: 2px 10px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11px;
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
    border: 1px solid rgba(79, 70, 229, 0.2);
  }

  .tier-pill {
    padding: 2px 10px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11px;
    border: 1px solid;
  }

  .earned-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 10px;
    border-radius: 6px;
    font-weight: 800;
    font-size: 11px;
    background: rgba(34, 197, 94, 0.08);
    color: #16a34a;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  .title {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.2;
  }

  .desc {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    line-height: 1.5;
  }

  /* Stats row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 14px;
  }

  .stat-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(79, 70, 229, 0.06);
    color: #4f46e5;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .stat-value {
    font-weight: 900;
    font-size: 20px;
    color: #0f172a;
    line-height: 1;
  }

  .stat-label {
    font-weight: 700;
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* Rarity */
  .rarity-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 14px;
  }

  .rarity-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .rarity-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 14px;
    color: #0f172a;
  }

  .rarity-title :global(iconify-icon) {
    color: #4f46e5;
  }

  .rarity-pct {
    font-weight: 900;
    font-size: 14px;
    color: #4f46e5;
  }

  .rarity-bar {
    height: 8px;
    border-radius: 999px;
    background: #f1f5f9;
    overflow: hidden;
  }

  .rarity-fill {
    height: 100%;
    background: #4f46e5;
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .rarity-sub {
    margin-top: 8px;
    font-weight: 700;
    font-size: 12px;
    color: #94a3b8;
  }

  /* Section card */
  .section-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 18px;
    margin-bottom: 14px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 14px;
    color: #0f172a;
    margin-bottom: 14px;
  }

  .section-title :global(iconify-icon) {
    color: #4f46e5;
  }

  /* Levels */
  .levels-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .level-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    transition: all 0.15s;
  }

  .level-item.reached {
    background: rgba(34, 197, 94, 0.04);
    border-color: rgba(34, 197, 94, 0.2);
  }

  .level-num {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: #f1f5f9;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 14px;
    color: #64748b;
    flex: 0 0 auto;
  }

  .level-item.reached .level-num {
    background: rgba(34, 197, 94, 0.1);
    color: #16a34a;
  }

  .level-target {
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
  }

  .level-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 600;
    font-size: 11px;
    color: #94a3b8;
    margin-top: 2px;
  }

  .level-item.reached .level-label {
    color: #16a34a;
  }

  /* Timeline */
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    padding-left: 18px;
  }

  .timeline::before {
    content: "";
    position: absolute;
    left: 7px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: #e2e8f0;
  }

  .tl-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 8px 0;
    position: relative;
  }

  .tl-dot {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.15);
    flex: 0 0 auto;
    margin-top: 4px;
    z-index: 1;
    margin-left: -18px;
  }

  .tl-content {
    flex: 1;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .tl-level {
    font-weight: 800;
    font-size: 13px;
    color: #0f172a;
  }

  .tl-date {
    font-weight: 600;
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* No progress */
  .no-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
    padding: 32px 16px;
    color: #94a3b8;
    font-weight: 700;
    font-size: 14px;
  }

  .no-progress :global(iconify-icon) {
    color: #cbd5e1;
  }

  .no-progress-sub {
    font-weight: 600;
    font-size: 12px;
    color: #cbd5e1;
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

  @media (max-width: 640px) {
    .header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .pills {
      justify-content: center;
    }

    .stats-row {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 520px) {
    .detail-card {
      padding: 16px;
    }

    .icon-box {
      width: 80px;
      height: 80px;
      flex-basis: 80px;
    }

    .title {
      font-size: 18px;
    }

    .stat-card {
      padding: 12px;
    }

    .stat-value {
      font-size: 16px;
    }
  }
</style>
