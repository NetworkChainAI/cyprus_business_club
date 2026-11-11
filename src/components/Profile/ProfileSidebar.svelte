<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;

  $: socialCapital = data?.socialCapital ?? 0;
  $: socialRank = data?.socialRank ?? "Explorer I";
  $: trustScore = data?.trustScore ?? 0;
  $: achievementCount = new Set((data?.userAchievements ?? []).map((ua: any) => ua.achievementId)).size;

  function trustLabel(score: number) {
    if (score >= 80) return t.get('profile.sidebar.highlyTrusted');
    if (score >= 60) return t.get('profile.sidebar.trusted');
    if (score >= 30) return t.get('profile.sidebar.verified');
    return t.get('profile.sidebar.newMember');
  }

  // Stepped: red → amber → green
  function trustColor(score: number): string {
    if (score >= 70) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  function trustBg(score: number): string {
    if (score >= 70) return "rgba(34,197,94,0.08)";
    if (score >= 40) return "rgba(245,158,11,0.08)";
    return "rgba(239,68,68,0.08)";
  }

  const rankThresholds = [0, 300, 600, 900, 1200, 1500, 2000];
  function scProgress(total: number) {
    for (let i = rankThresholds.length - 1; i >= 0; i--) {
      if (total >= rankThresholds[i]) {
        const next = rankThresholds[i + 1] ?? rankThresholds[i] + 500;
        const range = next - rankThresholds[i];
        return Math.min(100, Math.round(((total - rankThresholds[i]) / range) * 100));
      }
    }
    return 0;
  }
</script>

<div class="sideCard purple">
  <div class="sideTitle">
    <iconify-icon icon="lucide:trophy" width="18"></iconify-icon>
    {$t('profile.sidebar.socialCapital')}
  </div>

  <div class="bigNum">{socialCapital} <span>{$t('profile.sidebar.pts')}</span></div>
  <div class="rankBadge">{socialRank}</div>

  <div class="bar">
    <div class="fill" style="width:{scProgress(socialCapital)}%"></div>
  </div>

  <div class="hint">{$t('profile.sidebar.nextRank')}: {scProgress(socialCapital)}%</div>

  <a href="/reputation" class="how-link">
    <iconify-icon icon="lucide:info" width="14"></iconify-icon>
    {$t('profile.sidebar.howItWorks')}
  </a>
</div>

<div class="sideCard">
  <div class="sideTitle">
    <iconify-icon icon="lucide:shield-check" width="18" style="color:{trustColor(trustScore)};"></iconify-icon>
    {$t('profile.sidebar.trustScore')}
  </div>

  <div class="trustRow">
    <div class="ring" style="border-color:{trustColor(trustScore)}; color:{trustColor(trustScore)}; background:{trustBg(trustScore)}">{trustScore}</div>
    <div>
      <div class="trustMain">{trustLabel(trustScore)}</div>
      <div class="trustSub">{$t('profile.sidebar.basedOnActivity')}</div>
    </div>
  </div>

  <div class="divider"></div>

  <div class="proofTitle">{$t('profile.sidebar.socialProof')}</div>
  <div class="proofRow">
    <span>{$t('profile.sidebar.achievements')}</span><b>{achievementCount}</b>
  </div>
</div>

<style>
  .sideCard {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
  }

  .sideCard.purple {
    background: rgba(79, 70, 229, 0.06);
    border-color: rgba(79, 70, 229, 0.18);
  }

  .sideTitle {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    color: #0f172a;
  }

  .bigNum {
    margin-top: 14px;
    font-size: 42px;
    font-weight: 900;
    color: rgb(79 70 229);
    line-height: 1;
  }

  .bigNum span {
    font-size: 14px;
    font-weight: 900;
    color: #64748b;
    margin-left: 6px;
  }

  .rankBadge {
    display: inline-block;
    margin-top: 8px;
    padding: 3px 10px;
    border-radius: 8px;
    background: rgba(79, 70, 229, 0.12);
    color: #4f46e5;
    font-weight: 800;
    font-size: 12px;
  }

  .bar {
    margin-top: 12px;
    height: 8px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: rgb(79 70 229);
    border-radius: 999px;
  }

  .hint {
    margin-top: 10px;
    color: rgb(79 70 229);
    font-weight: 900;
    font-size: 12px;
  }

  .how-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    font-size: 12px;
    font-weight: 800;
    color: #4f46e5;
    text-decoration: none;
    opacity: 0.8;
    transition: opacity 0.15s;
  }

  .how-link:hover {
    opacity: 1;
  }

  .trustRow {
    margin-top: 14px;
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .ring {
    width: 54px;
    height: 54px;
    border-radius: 999px;
    border: 4px solid;
    display: grid;
    place-items: center;
    font-weight: 900;
    flex: 0 0 auto;
  }

  .trustMain {
    font-weight: 900;
    color: #0f172a;
  }

  .trustSub {
    font-weight: 800;
    color: #94a3b8;
    font-size: 12px;
    margin-top: 2px;
  }

  .divider {
    margin: 16px 0;
    height: 1px;
    background: #eef2f7;
  }

  .proofTitle {
    font-weight: 900;
    color: #94a3b8;
    font-size: 12px;
    letter-spacing: 0.08em;
  }

  .proofRow {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    font-weight: 900;
    color: #0f172a;
  }
</style>
