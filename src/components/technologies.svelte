<script lang="ts">
  import { t } from "$lib/i18n";
</script>

<svelte:head>
  <title>{$t('home.tech.pageTitle')}</title>
</svelte:head>

<div class="page">
  <!-- Hero -->
  <section class="hero">
    <div class="hero-icon">
      <iconify-icon icon="lucide:cpu" width="32"></iconify-icon>
    </div>
    <h1>{$t('home.tech.heroTitle')}</h1>
    <p class="hero-sub">
      {@html $t('home.tech.heroSub')}
    </p>
  </section>

  <!-- AI Assistants -->
  <section class="card">
    <div class="section-head">
      <div class="section-icon ai">
        <iconify-icon icon="lucide:bot" width="22"></iconify-icon>
      </div>
      <div>
        <h2>{$t('home.tech.aiSection.title')}</h2>
        <p class="section-sub">{$t('home.tech.aiSection.subtitle')}</p>
      </div>
    </div>

    <p class="desc">
      {$t('home.tech.aiSection.desc')}
    </p>

    <h3>
      <iconify-icon icon="lucide:sparkles" width="16"></iconify-icon>
      {$t('home.tech.aiSection.whatAiCanDo')}
    </h3>

    <div class="feat-grid">
      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(79,70,229,0.08); color: #4f46e5;">
          <iconify-icon icon="lucide:message-square" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.aiSection.contextAware')}</span>
          <span class="feat-desc">{$t('home.tech.aiSection.contextAwareDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(59,130,246,0.08); color: #3b82f6;">
          <iconify-icon icon="lucide:calendar-check" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.aiSection.eventRec')}</span>
          <span class="feat-desc">{$t('home.tech.aiSection.eventRecDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(16,185,129,0.08); color: #10b981;">
          <iconify-icon icon="lucide:search" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.aiSection.smartSearch')}</span>
          <span class="feat-desc">{$t('home.tech.aiSection.smartSearchDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(34,197,94,0.08); color: #22c55e;">
          <iconify-icon icon="lucide:shield-check" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.aiSection.contentMod')}</span>
          <span class="feat-desc">{$t('home.tech.aiSection.contentModDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(245,158,11,0.08); color: #f59e0b;">
          <iconify-icon icon="lucide:lightbulb" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.aiSection.insights')}</span>
          <span class="feat-desc">{$t('home.tech.aiSection.insightsDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(168,85,247,0.08); color: #a855f7;">
          <iconify-icon icon="lucide:wand-2" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.aiSection.brandOpt')}</span>
          <span class="feat-desc">{$t('home.tech.aiSection.brandOptDesc')}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Web3 Custody Wallet -->
  <section class="card">
    <div class="section-head">
      <div class="section-icon web3">
        <iconify-icon icon="lucide:wallet" width="22"></iconify-icon>
      </div>
      <div>
        <h2>{$t('home.tech.walletSection.title')}</h2>
        <p class="section-sub">{$t('home.tech.walletSection.subtitle')}</p>
      </div>
    </div>

    <p class="desc">
      {@html $t('home.tech.walletSection.desc')}
    </p>

    <h3>
      <iconify-icon icon="lucide:zap" width="16"></iconify-icon>
      {$t('home.tech.walletSection.features')}
    </h3>

    <div class="feat-grid">
      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(59,130,246,0.08); color: #3b82f6;">
          <iconify-icon icon="lucide:credit-card" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.walletSection.eventPayments')}</span>
          <span class="feat-desc">{$t('home.tech.walletSection.eventPaymentsDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(79,70,229,0.08); color: #4f46e5;">
          <iconify-icon icon="lucide:arrow-left-right" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.walletSection.p2p')}</span>
          <span class="feat-desc">{$t('home.tech.walletSection.p2pDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(16,185,129,0.08); color: #10b981;">
          <iconify-icon icon="lucide:shield" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.walletSection.twoFa')}</span>
          <span class="feat-desc">{$t('home.tech.walletSection.twoFaDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(245,158,11,0.08); color: #f59e0b;">
          <iconify-icon icon="lucide:zap" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.walletSection.lowCost')}</span>
          <span class="feat-desc">{$t('home.tech.walletSection.lowCostDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(236,72,153,0.08); color: #ec4899;">
          <iconify-icon icon="lucide:qr-code" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.walletSection.qrDeposits')}</span>
          <span class="feat-desc">{$t('home.tech.walletSection.qrDepositsDesc')}</span>
        </div>
      </div>

      <div class="feat-item">
        <div class="feat-icon" style="background: rgba(34,197,94,0.08); color: #22c55e;">
          <iconify-icon icon="lucide:lock" width="20"></iconify-icon>
        </div>
        <div class="feat-info">
          <span class="feat-label">{$t('home.tech.walletSection.encrypted')}</span>
          <span class="feat-desc">{$t('home.tech.walletSection.encryptedDesc')}</span>
        </div>
      </div>
    </div>
  </section>

  <!-- Security -->
  <section class="card small">
    <div class="section-head">
      <div class="section-icon security">
        <iconify-icon icon="lucide:fingerprint" width="22"></iconify-icon>
      </div>
      <div>
        <h2>{$t('home.tech.security.title')}</h2>
        <p class="section-sub">{$t('home.tech.security.subtitle')}</p>
      </div>
    </div>
    <p class="desc">
      {@html $t('home.tech.security.desc')}
    </p>
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

  .section-icon.ai {
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.15);
    color: #4f46e5;
  }

  .section-icon.web3 {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }

  .section-icon.security {
    background: rgba(34, 197, 94, 0.08);
    border: 1px solid rgba(34, 197, 94, 0.15);
    color: #22c55e;
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

  /* Feature Grid */
  .feat-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .feat-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    transition: all 0.15s;
  }

  .feat-item:hover {
    border-color: #e2e8f0;
    background: #fff;
  }

  .feat-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .feat-info {
    flex: 1;
    min-width: 0;
  }

  .feat-label {
    display: block;
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  .feat-desc {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 1px;
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

    .feat-desc {
      display: none;
    }
  }
</style>
