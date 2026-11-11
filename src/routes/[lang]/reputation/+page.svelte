<script lang="ts">
  import { t } from "$lib/i18n";
</script>

<svelte:head>
  <title>{$t('reputation.pageTitle')}</title>
</svelte:head>

<div class="page">
  <!-- Hero -->
  <section class="hero">
    <div class="hero-icon">
      <iconify-icon icon="lucide:shield-check" width="32"></iconify-icon>
    </div>
    <h1>{$t('reputation.pageTitle')}</h1>
    <p class="hero-sub">
      {@html $t('reputation.heroSub')}
    </p>
  </section>

  <!-- Social Capital -->
  <section class="card">
    <div class="section-head">
      <div class="section-icon sc">
        <iconify-icon icon="lucide:trending-up" width="22"></iconify-icon>
      </div>
      <div>
        <h2>{$t('reputation.socialCapital.title')}</h2>
        <p class="section-sub">{$t('reputation.socialCapital.sub')}</p>
      </div>
    </div>

    <p class="desc">{$t('reputation.socialCapital.desc')}</p>

    <h3>
      <iconify-icon icon="lucide:zap" width="16"></iconify-icon>
      {$t('reputation.socialCapital.howToEarn')}
    </h3>

    <div class="earn-grid">
      <div class="earn-item">
        <div class="earn-icon" style="background: rgba(79,70,229,0.08); color: #4f46e5;">
          <iconify-icon icon="lucide:calendar-plus" width="20"></iconify-icon>
        </div>
        <div class="earn-info">
          <span class="earn-label">{$t('reputation.socialCapital.createEvent')}</span>
          <span class="earn-desc">{$t('reputation.socialCapital.createEventDesc')}</span>
        </div>
        <span class="earn-pts">+30</span>
      </div>

      <div class="earn-item">
        <div class="earn-icon" style="background: rgba(59,130,246,0.08); color: #3b82f6;">
          <iconify-icon icon="lucide:wallet" width="20"></iconify-icon>
        </div>
        <div class="earn-info">
          <span class="earn-label">{$t('reputation.socialCapital.openWallet')}</span>
          <span class="earn-desc">{$t('reputation.socialCapital.openWalletDesc')}</span>
        </div>
        <span class="earn-pts">+20</span>
      </div>

      <div class="earn-item">
        <div class="earn-icon" style="background: rgba(16,185,129,0.08); color: #10b981;">
          <iconify-icon icon="lucide:user-plus" width="20"></iconify-icon>
        </div>
        <div class="earn-info">
          <span class="earn-label">{$t('reputation.socialCapital.referral')}</span>
          <span class="earn-desc">{$t('reputation.socialCapital.referralDesc')}</span>
        </div>
        <span class="earn-pts">+10</span>
      </div>

      <div class="earn-item">
        <div class="earn-icon" style="background: rgba(168,85,247,0.08); color: #a855f7;">
          <iconify-icon icon="lucide:users" width="20"></iconify-icon>
        </div>
        <div class="earn-info">
          <span class="earn-label">{$t('reputation.socialCapital.joinCommunity')}</span>
          <span class="earn-desc">{$t('reputation.socialCapital.joinCommunityDesc')}</span>
        </div>
        <span class="earn-pts">+5</span>
      </div>

      <div class="earn-item">
        <div class="earn-icon" style="background: rgba(245,158,11,0.08); color: #f59e0b;">
          <iconify-icon icon="lucide:ticket" width="20"></iconify-icon>
        </div>
        <div class="earn-info">
          <span class="earn-label">{$t('reputation.socialCapital.attendEvent')}</span>
          <span class="earn-desc">{$t('reputation.socialCapital.attendEventDesc')}</span>
        </div>
        <span class="earn-pts">+5</span>
      </div>

      <div class="earn-item">
        <div class="earn-icon" style="background: rgba(236,72,153,0.08); color: #ec4899;">
          <iconify-icon icon="lucide:heart" width="20"></iconify-icon>
        </div>
        <div class="earn-info">
          <span class="earn-label">{$t('reputation.socialCapital.gainFollower')}</span>
          <span class="earn-desc">{$t('reputation.socialCapital.gainFollowerDesc')}</span>
        </div>
        <span class="earn-pts">+3</span>
      </div>
    </div>

    <h3>
      <iconify-icon icon="lucide:award" width="16"></iconify-icon>
      {$t('reputation.socialCapital.ranks')}
    </h3>
    <p class="desc">{$t('reputation.socialCapital.ranksDesc')}</p>

    <div class="ranks">
      <div class="rank" style="--clr: #94a3b8;">
        <span class="rank-name">Explorer I</span>
        <span class="rank-range">0 – 299 pts</span>
      </div>
      <div class="rank" style="--clr: #64748b;">
        <span class="rank-name">Explorer II</span>
        <span class="rank-range">300 – 599 pts</span>
      </div>
      <div class="rank" style="--clr: #3b82f6;">
        <span class="rank-name">Explorer III</span>
        <span class="rank-range">600 – 899 pts</span>
      </div>
      <div class="rank" style="--clr: #8b5cf6;">
        <span class="rank-name">Mentor I</span>
        <span class="rank-range">900 – 1,199 pts</span>
      </div>
      <div class="rank" style="--clr: #a855f7;">
        <span class="rank-name">Mentor II</span>
        <span class="rank-range">1,200 – 1,499 pts</span>
      </div>
      <div class="rank" style="--clr: #ec4899;">
        <span class="rank-name">Leader I</span>
        <span class="rank-range">1,500 – 1,999 pts</span>
      </div>
      <div class="rank" style="--clr: #4f46e5;">
        <span class="rank-name">Leader II</span>
        <span class="rank-range">2,000+ pts</span>
      </div>
    </div>
  </section>

  <!-- Trust Score -->
  <section class="card">
    <div class="section-head">
      <div class="section-icon trust">
        <iconify-icon icon="lucide:shield" width="22"></iconify-icon>
      </div>
      <div>
        <h2>{$t('reputation.trustScore.title')}</h2>
        <p class="section-sub">{$t('reputation.trustScore.sub')}</p>
      </div>
    </div>

    <p class="desc">{$t('reputation.trustScore.desc')}</p>

    <h3>
      <iconify-icon icon="lucide:check-circle" width="16"></iconify-icon>
      {$t('reputation.trustScore.howToBuild')}
    </h3>

    <div class="trust-items">
      <div class="trust-item">
        <iconify-icon icon="lucide:camera" width="18"></iconify-icon>
        <span>{$t('reputation.trustScore.addPhoto')}</span>
        <strong>+5</strong>
      </div>
      <div class="trust-item">
        <iconify-icon icon="lucide:phone" width="18"></iconify-icon>
        <span>{$t('reputation.trustScore.addPhone')}</span>
        <strong>+5</strong>
      </div>
      <div class="trust-item">
        <iconify-icon icon="lucide:wallet" width="18"></iconify-icon>
        <span>{$t('reputation.trustScore.openWallet')}</span>
        <strong>+5</strong>
      </div>
      <div class="trust-item">
        <iconify-icon icon="lucide:mic" width="18"></iconify-icon>
        <span>{$t('reputation.trustScore.speakEvent')}</span>
        <strong>+15</strong>
      </div>
      <div class="trust-item">
        <iconify-icon icon="lucide:badge-check" width="18"></iconify-icon>
        <span>{$t('reputation.trustScore.kyc')}</span>
        <strong>+25</strong>
      </div>
    </div>

    <h3>
      <iconify-icon icon="lucide:thermometer" width="16"></iconify-icon>
      {$t('reputation.trustScore.levels')}
    </h3>

    <div class="trust-levels">
      <div class="trust-level red">
        <div class="tl-head">
          <span class="tl-dot"></span>
          <span class="tl-name">{$t('reputation.trustScore.newMember')}</span>
        </div>
        <span class="tl-range">{$t('reputation.trustScore.newMemberRange')}</span>
        <p>{$t('reputation.trustScore.newMemberDesc')}</p>
      </div>
      <div class="trust-level amber">
        <div class="tl-head">
          <span class="tl-dot"></span>
          <span class="tl-name">{$t('reputation.trustScore.verified')}</span>
        </div>
        <span class="tl-range">{$t('reputation.trustScore.verifiedRange')}</span>
        <p>{$t('reputation.trustScore.verifiedDesc')}</p>
      </div>
      <div class="trust-level green">
        <div class="tl-head">
          <span class="tl-dot"></span>
          <span class="tl-name">{$t('reputation.trustScore.highlyTrusted')}</span>
        </div>
        <span class="tl-range">{$t('reputation.trustScore.highlyTrustedRange')}</span>
        <p>{$t('reputation.trustScore.highlyTrustedDesc')}</p>
      </div>
    </div>
  </section>

  <!-- Connection -->
  <section class="card">
    <div class="section-head">
      <div class="section-icon link">
        <iconify-icon icon="lucide:link" width="22"></iconify-icon>
      </div>
      <div>
        <h2>{$t('reputation.together.title')}</h2>
        <p class="section-sub">{$t('reputation.together.sub')}</p>
      </div>
    </div>

    <p class="desc">{$t('reputation.together.desc')}</p>

    <div class="multipliers">
      <div class="mult">
        <div class="mult-bar" style="width: 25%; background: #ef4444;"></div>
        <div class="mult-info">
          <span class="mult-range">Trust 0–29</span>
          <strong class="mult-val">&times;0.5</strong>
        </div>
      </div>
      <div class="mult">
        <div class="mult-bar" style="width: 50%; background: #f59e0b;"></div>
        <div class="mult-info">
          <span class="mult-range">Trust 30–59</span>
          <strong class="mult-val">&times;1.0</strong>
        </div>
      </div>
      <div class="mult">
        <div class="mult-bar" style="width: 75%; background: #3b82f6;"></div>
        <div class="mult-info">
          <span class="mult-range">Trust 60–79</span>
          <strong class="mult-val">&times;1.2</strong>
        </div>
      </div>
      <div class="mult">
        <div class="mult-bar" style="width: 100%; background: #22c55e;"></div>
        <div class="mult-info">
          <span class="mult-range">Trust 80–100</span>
          <strong class="mult-val">&times;1.5</strong>
        </div>
      </div>
    </div>
  </section>

  <!-- Anti-Farm -->
  <section class="card small">
    <div class="section-head">
      <div class="section-icon decay">
        <iconify-icon icon="lucide:timer" width="22"></iconify-icon>
      </div>
      <div>
        <h2>{$t('reputation.stayActive.title')}</h2>
        <p class="section-sub">{$t('reputation.stayActive.sub')}</p>
      </div>
    </div>
    <p class="desc">{@html $t('reputation.stayActive.desc')}</p>
  </section>
</div>

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 64px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Hero */
  .hero {
    text-align: center;
    padding: 40px 20px 32px;
  }

  .hero-icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.18);
    color: #4f46e5;
    display: grid;
    place-items: center;
    margin: 0 auto 18px;
  }

  h1 {
    font-size: 32px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  .hero-sub {
    max-width: 520px;
    margin: 10px auto 0;
    color: #64748b;
    font-weight: 600;
    font-size: 15px;
    line-height: 1.6;
  }

  .hero-sub strong {
    color: #4f46e5;
    font-weight: 800;
  }

  /* Cards */
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
  }

  .card.small {
    padding: 20px 24px;
  }

  .section-head {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .section-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .section-icon.sc {
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.15);
    color: #4f46e5;
  }

  .section-icon.trust {
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  .section-icon.link {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }

  .section-icon.decay {
    background: rgba(245, 158, 11, 0.08);
    border: 1px solid rgba(245, 158, 11, 0.15);
    color: #f59e0b;
  }

  h2 {
    font-size: 20px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  .section-sub {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
    margin: 2px 0 0;
  }

  h3 {
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
    margin: 24px 0 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h3 :global(iconify-icon) {
    color: #4f46e5;
  }

  .desc {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    line-height: 1.65;
    margin: 0;
  }

  .desc strong {
    color: #0f172a;
    font-weight: 800;
  }

  /* Earn Grid */
  .earn-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .earn-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    transition: all 0.15s;
  }

  .earn-item:hover {
    border-color: #e2e8f0;
    background: #fff;
  }

  .earn-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .earn-info {
    flex: 1;
    min-width: 0;
  }

  .earn-label {
    display: block;
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  .earn-desc {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 1px;
  }

  .earn-pts {
    font-weight: 900;
    font-size: 16px;
    color: #4f46e5;
    flex-shrink: 0;
  }

  /* Ranks */
  .ranks {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .rank {
    flex: 1;
    min-width: 90px;
    padding: 14px 12px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--clr) 6%, white);
    border: 1px solid color-mix(in srgb, var(--clr) 18%, white);
    text-align: center;
  }

  .rank-name {
    display: block;
    font-weight: 900;
    font-size: 13px;
    color: var(--clr);
  }

  .rank-range {
    display: block;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    margin-top: 4px;
  }

  /* Trust items */
  .trust-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    font-weight: 700;
    font-size: 14px;
    color: #475569;
  }

  .trust-item :global(iconify-icon) {
    color: #22c55e;
    flex-shrink: 0;
  }

  .trust-item span {
    flex: 1;
  }

  .trust-item strong {
    color: #22c55e;
    font-weight: 900;
    font-size: 15px;
  }

  /* Trust levels */
  .trust-levels {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }

  .trust-level {
    padding: 16px;
    border-radius: 14px;
    border: 1px solid;
  }

  .trust-level.red {
    background: rgba(239, 68, 68, 0.04);
    border-color: rgba(239, 68, 68, 0.15);
  }

  .trust-level.amber {
    background: rgba(245, 158, 11, 0.04);
    border-color: rgba(245, 158, 11, 0.15);
  }

  .trust-level.green {
    background: rgba(34, 197, 94, 0.04);
    border-color: rgba(34, 197, 94, 0.15);
  }

  .tl-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .tl-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .red .tl-dot { background: #ef4444; }
  .amber .tl-dot { background: #f59e0b; }
  .green .tl-dot { background: #22c55e; }

  .tl-name {
    font-weight: 900;
    font-size: 14px;
    color: #0f172a;
  }

  .tl-range {
    font-size: 12px;
    font-weight: 800;
    color: #94a3b8;
  }

  .trust-level p {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    line-height: 1.5;
    margin: 8px 0 0;
  }

  /* Multipliers */
  .multipliers {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 16px;
  }

  .mult {
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    overflow: hidden;
  }

  .mult-bar {
    height: 6px;
    border-radius: 3px 3px 0 0;
  }

  .mult-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
  }

  .mult-range {
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
  }

  .mult-val {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
  }

  /* Responsive */
  @media (max-width: 600px) {
    .page {
      padding: 20px 14px 48px;
    }

    h1 {
      font-size: 26px;
    }

    .hero {
      padding: 28px 14px 24px;
    }

    .card {
      padding: 18px;
    }

    .trust-levels {
      grid-template-columns: 1fr;
    }

    .ranks {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
    }

    .earn-desc {
      display: none;
    }
  }
</style>
