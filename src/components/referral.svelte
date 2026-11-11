<script lang="ts">
  import { onMount } from "svelte";
  import { resolveUserPhoto } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { formatDate as fmtDate } from "$lib/utils/dateLocale";
  import { withLang } from "$lib/utils/withLang";

  export let data: any;

  const referralId = data.referralId;
  let referrals: any[] = data.referrals ?? [];

  let referralLink = "";
  let qrSrc = "";
  let copied = "";

  onMount(() => {
    const origin = window.location.origin;
    referralLink = `${origin}${withLang(`/register?ref=${referralId}`)}`;
    qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`;
  });

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text);
    copied = label;
    setTimeout(() => (copied = ""), 2000);
  }

  function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    if (name.length <= 2) return "***@" + domain;
    return name.slice(0, 2) + "***@" + domain;
  }

  function resolvePhoto(u: any) {
    return resolveUserPhoto(u, 128);
  }

  let brokenPhotos: Record<string, boolean> = {};

  function displayName(u: any) {
    return u?.info?.name ?? u?.email ?? "User";
  }

  function formatDate(d: string) {
    return fmtDate(d, { month: "short", day: "numeric", year: "numeric" });
  }
</script>

<div class="page">
    <!-- Hero -->
    <div class="hero">
      <div>
        <h1><iconify-icon icon="lucide:gift" width="28" height="28"></iconify-icon>{$t('common.referral.title')}</h1>
        <p>{$t('common.referral.subtitle')}</p>
      </div>

      {#if referralId}
        <div class="count">
          <div class="num">{referrals.length}</div>
          <div class="label">{$t('common.referral.invited')}</div>
        </div>
      {/if}
    </div>

    {#if !referralId}
      <div class="login-prompt">
        <div class="login-card">
          <div class="login-icon">
            <iconify-icon icon="lucide:log-in" width="36" height="36"></iconify-icon>
          </div>
          <div class="login-title">{$t('common.referral.loginTitle')}</div>
          <div class="login-sub">{$t('common.referral.loginSub')}</div>
          <a href={withLang('/login')} class="login-btn">
            <iconify-icon icon="lucide:log-in" width="16" height="16"></iconify-icon>
            {$t('common.referral.logIn')}
          </a>
        </div>
      </div>
    {:else}
      <div class="layout">
        <!-- Left: share section -->
        <div class="main-col">
          <!-- Referral link -->
          <div class="card">
            <div class="card-head">
              <iconify-icon icon="lucide:link" width="18" height="18"></iconify-icon>
              <span>{$t('common.referral.referralLink')}</span>
            </div>
            <div class="field-row">
              <input readonly class="field" value={referralLink} />
              <button class="action-btn" on:click={() => copy(referralLink, "link")}>
                <iconify-icon icon={copied === "link" ? "lucide:check" : "lucide:copy"} width="16" height="16"></iconify-icon>
                {copied === "link" ? $t('common.referral.copied') : $t('common.referral.copy')}
              </button>
              <button class="action-btn share" on:click={() => navigator.share?.({ url: referralLink })}>
                <iconify-icon icon="lucide:share-2" width="16" height="16"></iconify-icon>
                {$t('common.referral.share')}
              </button>
            </div>
          </div>

          <!-- Referral code -->
          <div class="card">
            <div class="card-head">
              <iconify-icon icon="lucide:hash" width="18" height="18"></iconify-icon>
              <span>{$t('common.referral.referralCode')}</span>
            </div>
            <div class="field-row">
              <div class="code-display">{referralId}</div>
              <button class="action-btn" on:click={() => copy(referralId, "code")}>
                <iconify-icon icon={copied === "code" ? "lucide:check" : "lucide:copy"} width="16" height="16"></iconify-icon>
                {copied === "code" ? $t('common.referral.copied') : $t('common.referral.copy')}
              </button>
            </div>
          </div>

          <!-- Referrals list -->
          <div class="card">
            <div class="card-head">
              <iconify-icon icon="lucide:users" width="18" height="18"></iconify-icon>
              <span>{$t('common.referral.myReferrals')}</span>
              {#if referrals.length > 0}
                <span class="count-pill">{referrals.length}</span>
              {/if}
            </div>

            {#if referrals.length === 0}
              <div class="empty">
                <iconify-icon icon="lucide:user-plus" width="36" height="36"></iconify-icon>
                <div class="empty-title">{$t('common.referral.noReferralsYet')}</div>
                <div class="empty-sub">{$t('common.referral.shareInviteFirst')}</div>
              </div>
            {:else}
              <div class="ref-list">
                {#each referrals as r}
                  <a class="ref-row" href={withLang(`/members/${r.id}`)}>
                    <div class="ref-av">
                      {#if resolvePhoto(r) && !brokenPhotos[r.id]}
                        <img src={resolvePhoto(r)} alt={displayName(r)} loading="lazy" decoding="async" on:error={() => (brokenPhotos = { ...brokenPhotos, [r.id]: true })} />
                      {:else}
                        <div class="ref-fb">{displayName(r)[0].toUpperCase()}</div>
                      {/if}
                    </div>
                    <div class="ref-info">
                      <div class="ref-name">{displayName(r)}</div>
                      <div class="ref-email">{maskEmail(r.email)}</div>
                    </div>
                    <div class="ref-date">{formatDate(r.createdAt)}</div>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        </div>

        <!-- Right: QR code -->
        <div class="side-col">
          <div class="card qr-card">
            <div class="card-head">
              <iconify-icon icon="lucide:qr-code" width="18" height="18"></iconify-icon>
              <span>{$t('common.referral.qrCode')}</span>
            </div>
            {#if qrSrc}
              <div class="qr-wrap">
                <img src={qrSrc} alt="QR code" class="qr" />
              </div>
            {/if}
            <p class="qr-hint">{$t('common.referral.qrHint')}</p>
          </div>
        </div>
      </div>
    {/if}
</div>

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  /* Hero — same as Members */
  .hero {
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

  h1 :global(iconify-icon) {
    color: #4f46e5;
  }

  p {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0;
  }

  .count {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(79, 70, 229, 0.06);
    border: 1px solid rgba(79, 70, 229, 0.15);
    flex: 0 0 auto;
  }

  .count .num {
    font-size: 22px;
    font-weight: 900;
    color: #4f46e5;
    line-height: 1;
  }

  .count .label {
    font-size: 11px;
    font-weight: 800;
    color: #4f46e5;
    letter-spacing: 0.06em;
  }

  /* Layout */
  .layout {
    margin-top: 24px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 18px;
    align-items: start;
  }

  .main-col {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
  }

  .side-col {
    position: sticky;
    top: 82px;
    min-width: 0;
  }

  /* Card */
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
  }

  .card-head :global(iconify-icon) {
    color: #4f46e5;
  }

  .count-pill {
    font-size: 11px;
    font-weight: 800;
    color: #4f46e5;
    background: rgba(79, 70, 229, 0.08);
    padding: 2px 8px;
    border-radius: 6px;
    margin-left: auto;
  }

  /* Field row */
  .field-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .field {
    flex: 1;
    height: 42px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    font-family: inherit;
    min-width: 0;
  }

  .code-display {
    flex: 1;
    height: 42px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-size: 18px;
    font-weight: 900;
    color: #4f46e5;
    font-family: inherit;
    letter-spacing: 3px;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    padding: 0 16px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
  }

  .action-btn:hover {
    background: #f1f5f9;
    border-color: #cbd5e1;
  }

  .action-btn.share {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }

  .action-btn.share:hover {
    background: #4338ca;
  }

  /* QR */
  .qr-card {
    align-items: center;
  }

  .qr-wrap {
    padding: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .qr {
    width: 180px;
    height: 180px;
    border-radius: 12px;
  }

  .qr-hint {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-align: center;
    margin: 0;
    line-height: 1.4;
  }

  /* Empty state */
  .empty {
    padding: 32px 16px;
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

  /* Referral list */
  .ref-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .ref-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    text-decoration: none;
    transition: background 0.12s;
    min-width: 0;
  }

  .ref-row:hover {
    background: #f8fafc;
  }

  .ref-av {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 50%;
    overflow: hidden;
    background: #e2e8f0;
    border: 2px solid #e2e8f0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ref-av img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ref-fb {
    font-weight: 900;
    font-size: 14px;
    color: #64748b;
  }

  .ref-info {
    flex: 1;
    min-width: 0;
  }

  .ref-name {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ref-email {
    font-weight: 600;
    font-size: 12px;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ref-date {
    font-weight: 600;
    font-size: 12px;
    color: #94a3b8;
    white-space: nowrap;
    flex: 0 0 auto;
  }

  /* Login prompt */
  .login-prompt {
    display: flex;
    justify-content: center;
    padding: 40px 0;
  }

  .login-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 40px 32px;
    max-width: 440px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .login-icon {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.15);
    display: grid;
    place-items: center;
    color: #4f46e5;
    margin-bottom: 8px;
  }

  .login-title {
    font-weight: 900;
    font-size: 18px;
    color: #0f172a;
  }

  .login-sub {
    font-weight: 600;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
    margin-bottom: 8px;
  }

  .login-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    padding: 0 28px;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    font-family: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }

  .login-btn:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25);
  }

  /* Responsive */
  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .side-col {
      position: static;
    }
  }

  @media (max-width: 720px) {
    .hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }
  }

  @media (max-width: 520px) {
    .field-row {
      flex-wrap: wrap;
    }

    .field,
    .code-display {
      width: 100%;
    }

    .action-btn {
      flex: 1;
      justify-content: center;
    }
  }
</style>
