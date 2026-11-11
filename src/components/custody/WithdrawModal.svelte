<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { t } from "$lib/i18n";
  import OtpInput from "./OtpInput.svelte";

  export let open = false;
  export let wallet: string = "";

  const dispatch = createEventDispatcher();

  let amount = "";
  let to = "";
  let otp = "";
  let error = "";
  let loading = false;
  let pending = false;

  async function submit() {
    error = "";
    loading = true;
    pending = true;

    let validationError = "";

    if (!to) {
      validationError = t.get('wallet.withdraw.errors.enterAddress');
    } else if (!amount || Number(amount) <= 0) {
      validationError = t.get('wallet.withdraw.errors.enterAmount');
    } else if (!otp || otp.length !== 6) {
      validationError = t.get('wallet.withdraw.errors.enterCode');
    }

    if (validationError) {
      error = validationError;
      loading = false;
      pending = false;
      return;
    }

    try {
      const res = await fetch("/api/custody/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          currency: "USDT",
          chain: "Polygon",
          to,
          token: otp,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        error = data.error || t.get('wallet.withdraw.errors.failed');
        return;
      }

      dispatch("success");
    } catch (e) {
      error = t.get('wallet.withdraw.errors.requestError');
    } finally {
      loading = false;
      pending = false;
    }
  }

  function close() {
    dispatch("close");
  }
</script>

{#if open}
  <div class="backdrop" on:click={close}>
    <div class="modal-w" on:click|stopPropagation>
      <div class="hero">
        <div class="heroIcon">
          <iconify-icon icon="lucide:arrow-up" width="22"></iconify-icon>
        </div>
        <div class="heroTitle">{$t('wallet.withdraw.title')}</div>
        <div class="heroSub">{$t('wallet.withdraw.subtitle')}</div>
      </div>

      <div class="body">
        <div class="subline">
          <span class="badge">USDT · Polygon</span>
          <span class="mini">{$t('wallet.withdraw.recipientNote')}</span>
        </div>

        <label>{$t('wallet.withdraw.address')}</label>
        <input bind:value={to} placeholder="0x..." autocomplete="off" />

        <label>{$t('wallet.withdraw.amount')}</label>
        <input type="number" bind:value={amount} placeholder="0.00" />

        <label>{$t('wallet.withdraw.confirmationCode')}</label>
        <OtpInput
          length={6}
          on:change={(e) => (otp = e.detail)}
          disabled={loading}
        />

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button class="btn primary" disabled={loading} on:click={submit}>
          {loading ? $t('wallet.withdraw.submitting') : $t('wallet.withdraw.submit')}
        </button>

        <button class="btn secondary" on:click={close}>{$t('wallet.cancel')}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(6px);
    display: grid;
    place-items: center;
    padding: 12px;
    z-index: 1000;
  }

  .modal-w {
    width: 100%;
    max-width: min(460px, calc(100vw - 24px));
    border-radius: 18px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e2e8f0;
    animation: popIn 0.18s ease-out;
  }

  .hero {
    padding: 24px 18px 18px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  }

  .heroIcon {
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

  .heroTitle {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
  }

  .heroSub {
    margin-top: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
  }

  .body {
    padding: 18px;
    display: grid;
    gap: 10px;
  }

  .subline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.06);
    border: 1px solid rgba(79, 70, 229, 0.18);
    color: #4f46e5;
    font-weight: 900;
    font-size: 12px;
    white-space: nowrap;
  }

  .mini {
    color: #64748b;
    font-weight: 800;
    font-size: 12px;
  }

  label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    margin-top: 4px;
  }

  input {
    width: 100%;
    height: 46px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    padding: 0 14px;
    font-size: 14px;
    font-weight: 800;
    outline: none;
    transition: border-color 0.15s;
  }

  input::placeholder {
    color: #94a3b8;
    font-weight: 800;
  }

  input:focus {
    border-color: #4f46e5;
  }

  .error {
    margin: 2px 0 0;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.18);
    color: #b91c1c;
    font-weight: 900;
    font-size: 13px;
  }

  .btn {
    width: 100%;
    height: 46px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-weight: 900;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn.primary {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }

  .btn.primary:hover {
    background: #4338ca;
  }

  .btn.secondary {
    background: #fff;
    border-color: #e2e8f0;
  }

  @keyframes popIn {
    from {
      transform: translateY(8px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @media (max-width: 640px) {
    .hero {
      padding: 22px 14px 16px;
    }
    .body {
      padding: 14px;
      gap: 9px;
    }
    input,
    .btn {
      height: 44px;
    }
  }
</style>
