<script lang="ts">
  import { t } from "$lib/i18n";
  import Paypal from "../paypal.svelte";
  import OtpInput from "../custody/OtpInput.svelte";
  import { generateQr } from "$lib/custody/qrcode";
  import { onMount } from "svelte";
  import { browser } from "$app/environment";

  export let data: any;

  const event = data?.event;
  let isRegistered = data?.isRegistered ?? false;
  const isLoggedIn = Boolean(data?.userId);

  const chatId: string | null = data?.chatId ?? event?.chatId ?? null;

  let payOpen = false;
  let payError: string | null = null;
  let payStatus: "idle" | "success" | "error" = "idle";
  let payMethod: "stripe" | "paypal" | "crypto" = "stripe";
  let stripeLoading = false;

  // Crypto payment state
  const custodyAddress: string | null = data?.custodyAddress ?? null;
  const hasCustodyWallet = Boolean(custodyAddress);
  let cryptoOtp = "";
  let cryptoLoading = false;
  let cryptoBalance: number | null = null;
  let cryptoBalanceLoading = false;
  let usdtPrice: number | null = null;
  let usdtPriceLoading = false;
  let custodySessionActive: boolean | null = null;

  const price = Number(event?.price ?? 0);
  const isPaidEvent = price > 0;
  const isPastEvent = event?.date ? new Date(event.date) < new Date() : false;

  function priceLabel(price: number | null | undefined) {
    if (!price || price === 0) return t.get('events.detail.free');
    const n = Number(price);
    return `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
  }

  async function register() {
    const res = await fetch(`/api/events/${event.id}/register`, { method: "POST" });
    if (!res.ok) throw new Error(await res.text());

    window.location.reload();
  }

  async function onRegisterClick() {
    if (isRegistered) return;

    if (!isPaidEvent) {
      await register();
      return;
    }

    payError = null;
    payStatus = "idle";
    payOpen = true;
  }

  async function loadCryptoData() {
    if (!browser || !custodyAddress) return;

    // Check custody session
    if (custodySessionActive === null) {
      try {
        const res = await fetch("/api/custody/check-session");
        if (res.ok) {
          const d = await res.json();
          custodySessionActive = d.active;
        }
      } catch {
        custodySessionActive = false;
      }
    }

    if (!custodySessionActive) return;

    // Fetch USDT balance
    if (cryptoBalance === null) {
      cryptoBalanceLoading = true;
      try {
        const res = await fetch(`/api/custody/balances?wallet=${custodyAddress}`);
        if (res.ok) {
          const d = await res.json();
          cryptoBalance = Number(d?.usdt ?? 0);
        }
      } catch { /* silent */ }
      cryptoBalanceLoading = false;
    }

    // Fetch EUR→USD rate for display
    if (usdtPrice === null && price > 0) {
      usdtPriceLoading = true;
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/EUR");
        if (res.ok) {
          const d = await res.json();
          const rate = d.rates?.USD ?? 1;
          usdtPrice = Math.round(price * rate * 100) / 100;
        }
      } catch { /* silent */ }
      usdtPriceLoading = false;
    }
  }

  async function handleCryptoPay() {
    if (!browser) return;
    if (cryptoOtp.length !== 6) {
      payError = t.get('events.pay.enterOtpCode');
      return;
    }

    cryptoLoading = true;
    payError = null;

    try {
      const res = await fetch(`/api/events/${event.id}/crypto-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: cryptoOtp }),
      });
      const d = await res.json();

      if (!d.ok) {
        payError = d.error || t.get('events.pay.paymentFailed');
        cryptoLoading = false;
        return;
      }

      payStatus = "success";
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      payError = t.get('events.pay.paymentError');
      cryptoLoading = false;
    }
  }

  function closePayModal() {
    payOpen = false;
    payError = null;
    payStatus = "idle";
    stripeLoading = false;
    cryptoOtp = "";
    cryptoLoading = false;
  }

  async function handleStripeCheckout() {
    stripeLoading = true;
    payError = null;
    try {
      const res = await fetch("/api/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      });
      const data = await res.json();
      if (data.free) {
        await register();
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      } else {
        payError = t.get('events.pay.failedSession');
        stripeLoading = false;
      }
    } catch {
      payError = t.get('events.pay.paymentError');
      stripeLoading = false;
    }
  }

  async function onPaypalSuccess() {
    try {
      payStatus = "success";
      await register();
    } catch (e: any) {
      payStatus = "error";
      payError = e?.message ?? t.get('events.pay.registrationFailed');
    }
  }

  function onPaypalError(e: any) {
    payStatus = "error";
    payError =
      e?.detail?.message ||
      (typeof e?.detail?.err === "string" ? e.detail.err : null) ||
      t.get('events.pay.paymentError');
  }

  function onPaypalFree() {
    register().catch((e) => (payError = e?.message ?? t.get('events.pay.registrationFailed')));
  }

  function openChat() {
    if (!isRegistered || !chatId) return;
    window.location.href = `/chat/${chatId}`;
  }

  const canChat = Boolean(isRegistered && chatId);

  let shareOpen = false;
  let qrDataUrl = "";
  let copied = false;
  let eventUrl = `/events/${event?.id}`;

  onMount(() => {
    eventUrl = `${window.location.origin}/events/${event?.id}`;
  });

  async function openShare() {
    shareOpen = true;
    if (!qrDataUrl && event?.id) {
      qrDataUrl = await generateQr(eventUrl);
    }
  }

  function closeShare() {
    shareOpen = false;
    copied = false;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(eventUrl);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(eventUrl)}&text=${encodeURIComponent(event?.title ?? "")}`,
      "_blank"
    );
  }

  function shareWhatsapp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent((event?.title ?? "") + " " + eventUrl)}`,
      "_blank"
    );
  }

  function shareInstagram() {
    copyLink();
    window.open("https://www.instagram.com/", "_blank");
  }
</script>

<section class="card">
  <div class="top">
    <div>
      <div class="label">{$t('events.detail.price')}</div>
      <div class="price">{priceLabel(event?.price)}</div>
    </div>

    <button class="bookmark" type="button" aria-label={$t('events.detail.bookmark')}>
      <iconify-icon icon="lucide:bookmark" width="18"></iconify-icon>
    </button>
  </div>

  {#if !isLoggedIn}
    <a href="/login" class="primary login-link">
      <iconify-icon icon="lucide:log-in" width="16"></iconify-icon>
      {$t('events.detail.loginFirst')}
    </a>
  {:else if isPastEvent}
    <button class="primary past" type="button" disabled>
      {$t('events.detail.eventEnded')}
    </button>
  {:else}
    <button class="primary" type="button" on:click={onRegisterClick} disabled={isRegistered}>
      {isRegistered ? $t('events.detail.youAreRegistered') : (isPaidEvent ? $t('events.detail.buyTicket') : $t('events.detail.registerNow'))}
    </button>
  {/if}

  <button
    class="secondary"
    type="button"
    on:click={openChat}
    disabled={!canChat}
    style="cursor: {canChat ? 'pointer' : 'not-allowed'}"
  >
    <iconify-icon icon="lucide:message-square" width="16"></iconify-icon>
    <span>{canChat ? $t('events.detail.openChat') : $t('events.detail.registerToChat')}</span>
  </button>

  <button class="ghost" type="button" on:click={openShare}>
    <iconify-icon icon="lucide:share-2" width="16"></iconify-icon>
    <span>{$t('events.detail.share')}</span>
  </button>
</section>

{#if payOpen}
  <div class="modal-backdrop" on:click|self={closePayModal}>
    <div class="modal-window">
      <div class="modal-head">
        <div>
          <div class="modal-title">{$t('events.pay.completePayment')}</div>
          <div class="modal-subtitle">{event.title}</div>
        </div>

        <button class="icon-btn" type="button" on:click={closePayModal} aria-label={$t('events.pay.close')}>
          ✕
        </button>
      </div>

      <div class="modal-body">
        <div class="price-row">
          <span>{$t('events.pay.total')}</span>
          <strong>{price.toFixed(2)} EUR</strong>
        </div>

        {#if payStatus === "success"}
          <div class="pay-success">{$t('events.pay.paymentSuccessful')}</div>
        {:else}
          {#if payError}
            <div class="pay-error">{payError}</div>
          {/if}

          <div class="pay-tabs">
            <button
              class="pay-tab"
              class:active={payMethod === "stripe"}
              type="button"
              on:click={() => { payMethod = "stripe"; payError = null; }}
            >
              <iconify-icon icon="lucide:credit-card" width="16"></iconify-icon>
              {$t('events.pay.card')}
            </button>
            <button
              class="pay-tab"
              class:active={payMethod === "paypal"}
              type="button"
              on:click={() => { payMethod = "paypal"; payError = null; }}
            >
              <iconify-icon icon="simple-icons:paypal" width="16"></iconify-icon>
              PayPal
            </button>
            <button
              class="pay-tab"
              class:active={payMethod === "crypto"}
              type="button"
              on:click={() => { payMethod = "crypto"; payError = null; loadCryptoData(); }}
            >
              <iconify-icon icon="lucide:wallet" width="16"></iconify-icon>
              Crypto
            </button>
          </div>

          {#if payMethod === "paypal"}
            <div class="paypal-box">
              <Paypal
                eventId={event.id}
                on:success={onPaypalSuccess}
                on:error={onPaypalError}
                on:free={onPaypalFree}
              />
            </div>
          {:else if payMethod === "crypto"}
            <div class="crypto-box">
              {#if !hasCustodyWallet}
                <div class="crypto-notice">
                  <iconify-icon icon="lucide:wallet" width="20"></iconify-icon>
                  <div>
                    <strong>{$t('events.pay.walletRequired')}</strong>
                    <p>{$t('events.pay.walletRequiredDesc')}</p>
                  </div>
                </div>
                <a href="/wallet" class="crypto-link-btn">
                  <iconify-icon icon="lucide:plus" width="16"></iconify-icon>
                  {$t('events.pay.createWallet')}
                </a>
              {:else if custodySessionActive === false}
                <div class="crypto-notice">
                  <iconify-icon icon="lucide:lock" width="20"></iconify-icon>
                  <div>
                    <strong>{$t('events.pay.sessionExpired')}</strong>
                    <p>{$t('events.pay.sessionExpiredDesc')}</p>
                  </div>
                </div>
                <a href="/wallet" class="crypto-link-btn">
                  <iconify-icon icon="lucide:log-in" width="16"></iconify-icon>
                  {$t('events.pay.reconnectWallet')}
                </a>
              {:else if custodySessionActive === null}
                <div class="crypto-loading">
                  <iconify-icon icon="lucide:loader-2" width="22" class="spin"></iconify-icon>
                  <span>{$t('events.pay.checkingWallet')}</span>
                </div>
              {:else}
                <div class="crypto-info-row">
                  <span>{$t('events.pay.priceInUsdt')}</span>
                  <strong>
                    {#if usdtPriceLoading}
                      <iconify-icon icon="lucide:loader-2" width="14" class="spin"></iconify-icon>
                    {:else if usdtPrice !== null}
                      {usdtPrice.toFixed(2)} USDT
                    {:else}
                      --
                    {/if}
                  </strong>
                </div>

                <div class="crypto-info-row">
                  <span>{$t('events.pay.yourBalance')}</span>
                  <strong>
                    {#if cryptoBalanceLoading}
                      <iconify-icon icon="lucide:loader-2" width="14" class="spin"></iconify-icon>
                    {:else if cryptoBalance !== null}
                      {cryptoBalance.toFixed(2)} USDT
                    {:else}
                      --
                    {/if}
                  </strong>
                </div>

                {#if cryptoBalance !== null && usdtPrice !== null && cryptoBalance < usdtPrice}
                  <div class="crypto-warning">
                    {$t('events.pay.insufficientBalance')}: ${usdtPrice.toFixed(2)} USDT ({$t('events.pay.yourBalance')}: ${cryptoBalance.toFixed(2)} USDT)
                  </div>
                {/if}

                <div class="crypto-otp">
                  <label class="crypto-label">{$t('events.pay.confirmationCode')}</label>
                  <OtpInput
                    length={6}
                    on:change={(e) => (cryptoOtp = e.detail)}
                    disabled={cryptoLoading}
                  />
                </div>

                <button
                  class="crypto-btn"
                  type="button"
                  disabled={cryptoLoading || cryptoOtp.length !== 6 || (cryptoBalance !== null && usdtPrice !== null && cryptoBalance < usdtPrice)}
                  on:click={handleCryptoPay}
                >
                  {#if cryptoLoading}
                    <iconify-icon icon="lucide:loader-2" width="18" class="spin"></iconify-icon>
                    {$t('events.pay.processing')}
                  {:else}
                    <iconify-icon icon="lucide:wallet" width="18"></iconify-icon>
                    {$t('events.pay.payWithUsdt')}
                  {/if}
                </button>
              {/if}
            </div>
          {:else}
            <button
              class="stripe-btn"
              type="button"
              disabled={stripeLoading}
              on:click={handleStripeCheckout}
            >
              {#if stripeLoading}
                <iconify-icon icon="lucide:loader-2" width="18" class="spin"></iconify-icon>
                {$t('events.pay.redirectingStripe')}
              {:else}
                <iconify-icon icon="lucide:credit-card" width="18"></iconify-icon>
                {$t('events.pay.payWithCard')}
              {/if}
            </button>
          {/if}
        {/if}
      </div>

      <div class="modal-foot">
        <button class="btn" type="button" on:click={closePayModal}>{$t('events.pay.cancel')}</button>
      </div>
    </div>
  </div>
{/if}

{#if shareOpen}
  <div class="modal-backdrop share-backdrop" on:click|self={closeShare}>
    <div class="modal-window share-window">
      <div class="share-hero">
        <div class="share-icon-wrap">
          <iconify-icon icon="lucide:share-2" width="22"></iconify-icon>
        </div>
        <div class="share-title">{$t('events.share.title')}</div>
        <div class="share-subtitle">{event?.title}</div>

        <button class="share-close" type="button" on:click={closeShare} aria-label={$t('events.pay.close')}>
          <iconify-icon icon="lucide:x" width="18"></iconify-icon>
        </button>
      </div>

      <div class="share-body">
        <div class="qr-wrap">
          {#if qrDataUrl}
            <img src={qrDataUrl} alt="QR Code" class="qr-img" />
          {:else}
            <div class="qr-loading">
              <iconify-icon icon="lucide:loader-2" width="24" class="spin"></iconify-icon>
            </div>
          {/if}
        </div>

        <div class="share-url-row">
          <input type="text" readonly value={eventUrl} class="share-url" />
          <button class="copy-btn" type="button" on:click={copyLink} class:copied>
            <iconify-icon icon={copied ? "lucide:check" : "lucide:copy"} width="16"></iconify-icon>
          </button>
        </div>

        <div class="share-grid">
          <button class="share-option" type="button" on:click={copyLink}>
            <div class="share-opt-icon" style="background: rgba(79,70,229,0.08); color: #4f46e5;">
              <iconify-icon icon="lucide:link" width="20"></iconify-icon>
            </div>
            <span class="share-opt-label">{copied ? $t('events.share.copied') : $t('events.share.copyLink')}</span>
          </button>

          <button class="share-option" type="button" on:click={shareTelegram}>
            <div class="share-opt-icon" style="background: rgba(38,165,228,0.08); color: #26A5E4;">
              <iconify-icon icon="simple-icons:telegram" width="20"></iconify-icon>
            </div>
            <span class="share-opt-label">Telegram</span>
          </button>

          <button class="share-option" type="button" on:click={shareWhatsapp}>
            <div class="share-opt-icon" style="background: rgba(37,211,102,0.08); color: #25D366;">
              <iconify-icon icon="simple-icons:whatsapp" width="20"></iconify-icon>
            </div>
            <span class="share-opt-label">WhatsApp</span>
          </button>

          <button class="share-option" type="button" on:click={shareInstagram}>
            <div class="share-opt-icon" style="background: rgba(228,64,95,0.08); color: #E4405F;">
              <iconify-icon icon="simple-icons:instagram" width="20"></iconify-icon>
            </div>
            <span class="share-opt-label">Instagram</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    min-width: 0;
  }

  .top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .label {
    color: #94a3b8;
    font-weight: 800;
    font-size: 12px;
  }

  .price {
    color: #0f172a;
    font-weight: 900;
    font-size: 28px;
    margin-top: 4px;
  }

  .bookmark {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    cursor: pointer;
  }

  .primary {
    width: 100%;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: rgb(79 70 229);
    color: #fff;
    font-weight: 900;
    cursor: pointer;
  }
  .primary:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }

  .primary.past {
    background: #94a3b8;
    opacity: 1;
  }

  .login-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.15s;
  }

  .login-link:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25);
  }

  .secondary {
    width: 100%;
    height: 40px;
    margin-top: 10px;
    border-radius: 12px;
    border: none;
    background: #f1f5f9;
    color: #94a3b8;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .ghost {
    width: 100%;
    height: 40px;
    margin-top: 10px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-weight: 800;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
  }

  /* modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    z-index: 50;
  }

  .modal-window {
    width: min(520px, 100%);
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .modal-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-title {
    font-weight: 900;
  }

  .modal-subtitle {
    color: #64748b;
    font-weight: 700;
    font-size: 12px;
    margin-top: 2px;
  }

  .icon-btn {
    border: 1px solid #e2e8f0;
    background: #fff;
    border-radius: 10px;
    width: 36px;
    height: 36px;
    cursor: pointer;
  }

  .modal-body {
    padding: 16px;
  }

  .price-row {
    display: flex;
    justify-content: space-between;
    font-weight: 800;
    margin-bottom: 12px;
  }

  .pay-error {
    background: #fff1f2;
    border: 1px solid #fecdd3;
    color: #9f1239;
    padding: 10px;
    border-radius: 12px;
    margin-bottom: 12px;
    font-weight: 800;
  }

  .pay-success {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
    padding: 10px;
    border-radius: 12px;
    font-weight: 900;
  }

  .modal-foot {
    padding: 16px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
  }

  .btn {
    height: 40px;
    padding: 0 14px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    font-weight: 800;
    cursor: pointer;
  }

  /* pay tabs */
  .pay-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 14px;
  }

  .pay-tab {
    flex: 1;
    height: 40px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-weight: 800;
    font-size: 13px;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .pay-tab:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .pay-tab.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .pay-tab.active :global(iconify-icon) {
    color: #fff;
  }

  .stripe-btn {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    border: none;
    background: #0f172a;
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .stripe-btn:hover {
    background: #1e293b;
  }

  .stripe-btn:disabled {
    opacity: 0.75;
    cursor: not-allowed;
  }

  /* crypto payment */
  .crypto-box {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .crypto-notice {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 13px;
    font-weight: 700;
  }

  .crypto-notice strong {
    display: block;
    color: #0f172a;
    font-weight: 900;
    margin-bottom: 2px;
  }

  .crypto-notice p {
    margin: 0;
    line-height: 1.4;
  }

  .crypto-notice :global(iconify-icon) {
    flex-shrink: 0;
    margin-top: 2px;
    color: #64748b;
  }

  .crypto-link-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 44px;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    text-decoration: none;
    transition: all 0.15s;
  }

  .crypto-link-btn:hover {
    background: #4338ca;
  }

  .crypto-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px;
    color: #64748b;
    font-weight: 800;
    font-size: 14px;
  }

  .crypto-info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 14px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-weight: 800;
    font-size: 14px;
  }

  .crypto-info-row span {
    color: #64748b;
  }

  .crypto-info-row strong {
    color: #0f172a;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .crypto-warning {
    padding: 10px 12px;
    border-radius: 12px;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #9a3412;
    font-weight: 800;
    font-size: 13px;
  }

  .crypto-otp {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .crypto-label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
  }

  .crypto-btn {
    width: 100%;
    height: 48px;
    border-radius: 12px;
    border: none;
    background: #0f172a;
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .crypto-btn:hover {
    background: #1e293b;
  }

  .crypto-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* share modal */
  .share-backdrop {
    backdrop-filter: blur(2px);
    z-index: 1000;
  }

  .share-window {
    width: min(420px, 100%);
    animation: sharePopIn 0.18s ease-out;
  }

  @keyframes sharePopIn {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .share-hero {
    position: relative;
    padding: 24px 18px 18px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  }

  .share-icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    margin: 0 auto 12px;
    display: grid;
    place-items: center;
    background: rgba(79, 70, 229, 0.06);
    border: 1px solid rgba(79, 70, 229, 0.18);
    color: #4f46e5;
  }

  .share-title {
    font-size: 20px;
    font-weight: 900;
    color: #0f172a;
  }

  .share-subtitle {
    margin-top: 4px;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
  }

  .share-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }
  .share-close:hover { background: #f8fafc; border-color: #cbd5e1; }

  .share-body {
    padding: 20px 18px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .qr-wrap {
    width: 200px;
    height: 200px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .qr-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 8px;
  }

  .qr-loading {
    color: #94a3b8;
  }

  :global(.spin) {
    animation: spinAnim 0.8s linear infinite;
  }
  @keyframes spinAnim {
    to { transform: rotate(360deg); }
  }

  .share-url-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .share-url {
    flex: 1;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    outline: none;
    min-width: 0;
  }

  .copy-btn {
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }
  .copy-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .copy-btn.copied { border-color: #22c55e; color: #22c55e; background: rgba(34, 197, 94, 0.06); }

  .share-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }

  .share-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 16px 12px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    transition: all 0.15s;
  }
  .share-option:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }

  .share-opt-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
  }

  .share-opt-label {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
  }
</style>
