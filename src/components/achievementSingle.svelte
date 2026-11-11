<script lang="ts">
  export let data;
  import { goto } from "$app/navigation";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";

  const achievement = data.achievement;
  const progress = data.userProgress ?? [];
  const percentage = data.percentage ?? 0;

  $: kindMap = {
    ONE_OFF: $t('common.achievements.oneOff'),
    PROGRESS: $t('common.achievements.progress'),
    SEASONAL: $t('common.achievements.seasonal')
  } as Record<string, string>;
  $: kindLabel = kindMap[achievement?.kind] ?? achievement?.kind ?? "";

  function goBack() {
    if (typeof history !== "undefined" && history.length > 1) {
      history.back();
    } else {
      goto("/achievements"); // <-- если у тебя другой путь к сетке, поменяй тут
    }
  }
</script>

{#if !achievement}
  <div class="empty">{$t('common.achievements.notFound')}</div>
{:else}
  <div class="wrapper">
    <div class="card">

      <!-- BACK BUTTON -->
      <button class="back-btn" on:click={goBack}>
        ← {$t('common.btn.back')}
      </button>

      <!-- HEADER -->
      <div class="header">
        <div class="icon-wrap">
          <img
            src={achievement.iconUrl || "/assets/images/placeholder.png"}
            alt={achievement.title}
            class="icon"
          />
        </div>

        <div class="head-meta">
          <div class="kind-pill kind-{achievement.kind?.toLowerCase()}">
            {kindLabel}
          </div>

          <h1 class="title">{achievement.title}</h1>
          <p class="desc">{achievement.description}</p>
        </div>
      </div>

      <!-- RARITY -->
      <div class="rarity">
        <div class="rarity-top">
          <div class="rarity-title">{$t('common.achievements.rarity')}</div>
          <div class="rarity-value">
            {percentage}% {$t('common.achievements.rarityDesc')}
          </div>
        </div>

        <div class="rarity-bar">
          <div class="rarity-fill" style="width:{percentage}%"></div>
        </div>
      </div>

      <!-- LEVELS -->
      {#if achievement.levelsJson}
        <div class="section">
          <h2 class="section-title">{$t('common.achievements.levels')}</h2>

          <div class="levels-grid">
            {#each achievement.levelsJson as lvl, i}
              <div class="level-card">
                <div class="level-badge">{$t('common.achievements.level')} {lvl.level}</div>
                <div class="level-target">
                  {$t('common.achievements.target')}: <b>{lvl.target}</b>
                </div>

                {#if i === 0}
                  <div class="level-hint">{$t('common.achievements.starterLevel')}</div>
                {:else}
                  <div class="level-hint">{$t('common.achievements.nextMilestone')}</div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- USER PROGRESS -->
      <div class="section">
        <h2 class="section-title">{$t('common.achievements.yourProgress')}</h2>

        {#if progress.length > 0}
          <div class="timeline">
            {#each progress as p}
              <div class="timeline-item">
                <div class="dot"></div>
                <div class="timeline-card">
                  <div class="timeline-level">
                    {$t('common.achievements.level')} <b>{p.level}</b> {$t('common.achievements.levelEarned')}
                  </div>
                  <div class="timeline-date">
                    {new Date(p.earnedAt).toLocaleString(getDateLocale())}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {:else}
          <div class="no-progress">
            {$t('common.achievements.noProgress')}
          </div>
        {/if}
      </div>

    </div>
  </div>
{/if}

<style>
  .wrapper {
    width: min(94%, 70rem);
    margin: 2.5rem auto;
    padding: 0 1rem;
  }

  .card {
    background: #fff;
    border-radius: 1.4rem;
    padding: clamp(1.4rem, 3vw, 2.2rem);
    box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    border: 1px solid rgba(0,0,0,0.06);
  }

  .empty {
    padding: 2rem;
    font-size: 1.1rem;
    color: #607280;
  }

  /* Back button */
  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.9rem;
    margin-bottom: 1.2rem;

    border-radius: 999px;
    border: 1px solid rgba(0,0,0,0.10);
    background: #f4f5f7;
    color: #0b3954;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: 0.15s ease;
    user-select: none;
  }

  .back-btn:hover {
    transform: translateY(-1px);
    background: #eceef2;
  }

  /* Header */
  .header {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 1.6rem;
    align-items: center;
  }

  @media (max-width: 640px) {
    .header {
      grid-template-columns: 1fr;
    }
  }

  .icon-wrap {
    width: 120px;
    height: 120px;
    border-radius: 1.1rem;
    background: radial-gradient(circle at 30% 20%, #1b2a52, #0b1220);
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.08);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
  }

  .icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.03);
  }

  .head-meta {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .title {
    font-size: clamp(1.6rem, 3.2vw, 2.2rem);
    font-weight: 800;
    margin: 0;
    color: #0b3954;
    letter-spacing: 0.2px;
  }

  .desc {
    margin: 0;
    color: #4b5e6e;
    font-size: 1.02rem;
    line-height: 1.45;
  }

  .kind-pill {
    align-self: flex-start;
    padding: 0.28rem 0.7rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 700;
    border: 1px solid rgba(0,0,0,0.08);
    background: #f3f5f8;
    color: #0b3954;
  }

  .kind-one_off { background: #eef2ff; color: #3730a3; border-color: rgba(55,48,163,0.25); }
  .kind-progress { background: #ecfeff; color: #0e7490; border-color: rgba(14,116,144,0.25); }
  .kind-seasonal { background: #fff7ed; color: #c2410c; border-color: rgba(194,65,12,0.25); }

  /* Rarity */
  .rarity {
    margin-top: 1.6rem;
    padding: 1.1rem 1.2rem;
    background: #f7f9fc;
    border-radius: 1rem;
    border: 1px solid rgba(0,0,0,0.06);
  }

  .rarity-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.7rem;
  }

  .rarity-title {
    font-weight: 800;
    color: #0b3954;
  }

  .rarity-value {
    font-weight: 700;
    color: #6d28d9;
  }

  .rarity-bar {
    height: 10px;
    background: #e9edf3;
    border-radius: 999px;
    overflow: hidden;
    border: 1px solid rgba(0,0,0,0.05);
  }

  .rarity-fill {
    height: 100%;
    background: linear-gradient(90deg, #6d28d9, #8b5cf6);
    transition: width .25s ease;
  }

  /* Sections */
  .section {
    margin-top: 2.1rem;
  }

  .section-title {
    font-size: 1.2rem;
    font-weight: 800;
    margin-bottom: 0.9rem;
    color: #0b3954;
  }

  /* Levels */
  .levels-grid {
    display: grid;
    gap: 0.9rem;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }

  .level-card {
    background: #fff;
    border: 1px solid rgb(0, 0, 0);
    border-radius: 1rem;
    padding: 1rem;
    box-shadow: 0 6px 14px rgba(0,0,0,0.06);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: transform .18s ease, box-shadow .18s ease;
  }

  .level-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(0,0,0,0.10);
  }

  .level-badge {
    align-self: flex-start;
    padding: 0.22rem 0.6rem;
    border-radius: 999px;
    font-size: 0.85rem;
    font-weight: 800;
    background: #f0f2f6;
    color: #0b3954;
  }

  .level-target {
    font-size: 1rem;
    color: #263846;
  }

  .level-hint {
    font-size: 0.85rem;
    color: #7c8b97;
  }

  /* Timeline progress */
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    position: relative;
    padding-left: 0.8rem;
  }

  .timeline:before {
    content: "";
    position: absolute;
    left: 8px;
    top: 4px;
    bottom: 4px;
    width: 2px;
    background: #cfd6e0; /* более контрастная линия */
  }

  .timeline-item {
    display: grid;
    grid-template-columns: 16px 1fr;
    gap: 0.8rem;
    align-items: start;
  }

  .dot {
    width: 12px;
    height: 12px;
    margin-top: 6px;
    border-radius: 999px;
    background: #22c55e;
    box-shadow: 0 0 0 5px rgba(34,197,94,0.2);
    z-index: 1;
  }

  .timeline-card {
    background: #fff;
    border: 1px solid #d7dee8; /* заметный бордер */
    border-radius: 0.9rem;
    padding: 0.8rem 1rem;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
  }

  .timeline-level {
    font-weight: 700;
    color: #0b3954;
  }

  .timeline-date {
    margin-top: 0.2rem;
    font-size: 0.9rem;
    color: #6b7b88;
  }

  .no-progress {
    padding: 1rem;
    background: #f8fafc;
    border: 1px dashed rgba(0,0,0,0.12);
    border-radius: 0.9rem;
    color: #7a8a96;
  }
</style>
