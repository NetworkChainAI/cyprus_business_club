<script lang="ts">
  import { generateQr } from "$lib/custody/qrcode";
  import { createEventDispatcher } from "svelte";
  import { t } from "$lib/i18n";

  export let open = false;
  export let wallet: string = "";

  const dispatch = createEventDispatcher();

  let error = "";
  let qr = "";
  let copied = false;
  let qrLoading = false;

  $: if (open && wallet) {
    loadQr();
  }

  async function loadQr() {
    error = "";
    qr = "";
    qrLoading = true;

    try {
      qr = await generateQr(wallet);
    } catch {
      error = t.get('wallet.deposit.qrFailed');
    } finally {
      qrLoading = false;
    }
  }

  function copy() {
    if (!wallet) return;
    navigator.clipboard.writeText(wallet);
    copied = true;
    setTimeout(() => (copied = false), 1400);
  }

  function close() {
    dispatch("close");
  }

  function shortAddress(addr: string) {
    if (!addr) return "";
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  }
</script>

{#if open}
  <div class="backdrop" on:click={close}>
    <div class="modal-w" on:click|stopPropagation>
      <div class="hero">
        <div class="heroIcon">
          <iconify-icon icon="lucide:arrow-down" width="22"></iconify-icon>
        </div>
        <div class="heroTitle">{$t('wallet.deposit.title')}</div>
        <div class="heroSub">{$t('wallet.deposit.scanQr')}</div>
      </div>

      <div class="body">
        <div class="subline">
          <span class="badge">Polygon</span>
          <span class="mini">{$t('wallet.deposit.usdtSupported')}</span>
        </div>

        <label>{$t('wallet.deposit.yourAddress')}</label>
        <div class="addrRow">
          <div class="addrBox" title={wallet}>
            <span class="addrText">{wallet ? shortAddress(wallet) : "—"}</span>
          </div>

          <button class="copyBtn" type="button" on:click={copy} disabled={!wallet}>
            <iconify-icon icon={copied ? "lucide:check-check" : "lucide:copy"} width="16"></iconify-icon>
            <span>{copied ? $t('wallet.copied') : $t('wallet.deposit.copy')}</span>
          </button>
        </div>

        <div class="qrWrap">
          {#if qrLoading}
            <div class="qrSkeleton" aria-label="Loading QR">
              <div class="shimmer"></div>
            </div>
          {:else if qr}
            <img class="qr" src={qr} alt="Wallet QR code" />
          {:else}
            <div class="qrEmpty">{$t('wallet.deposit.qrNotAvailable')}</div>
          {/if}
        </div>

        <div class="note">
          <iconify-icon icon="lucide:info" width="14" style="flex-shrink:0;margin-top:1px"></iconify-icon>
          <span>{@html $t('wallet.deposit.warning')}</span>
        </div>

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button class="btn secondary" on:click={close}>{$t('wallet.close')}</button>
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
    padding: 18px 12px;
    z-index: 1000;
  }

  .modal-w {
    width: 100%;
    max-width: min(460px, calc(100vw - 24px));
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
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
    gap: 12px;
    color: #0f172a;
  }

  .subline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }

  .badge {
    height: 30px;
    padding: 0 10px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    font-size: 12px;
    font-weight: 900;
    background: rgba(79, 70, 229, 0.06);
    border: 1px solid rgba(79, 70, 229, 0.18);
    color: #4f46e5;
    white-space: nowrap;
  }

  .mini {
    font-size: 12px;
    font-weight: 800;
    color: #64748b;
    white-space: nowrap;
  }

  label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    margin-top: 6px;
  }

  .addrRow {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    align-items: center;
    min-width: 0;
  }

  .addrBox {
    height: 46px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 14px;
    display: flex;
    align-items: center;
    min-width: 0;
  }

  .addrText {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 900;
    color: #0f172a;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 13px;
  }

  .copyBtn {
    height: 46px;
    padding: 0 14px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    cursor: pointer;
    color: #0f172a;
    transition: all 0.15s;
    flex: 0 0 auto;
  }

  .copyBtn :global(iconify-icon) {
    color: #64748b;
  }

  .copyBtn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .copyBtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .qrWrap {
    margin-top: 6px;
    display: grid;
    place-items: center;
  }

  .qr {
    width: 220px;
    height: 220px;
    border-radius: 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
  }

  .qrEmpty {
    width: 220px;
    height: 220px;
    border-radius: 16px;
    border: 1px dashed #cbd5e1;
    background: #f8fafc;
    display: grid;
    place-items: center;
    color: #64748b;
    font-weight: 900;
    font-size: 13px;
    text-align: center;
    padding: 12px;
  }

  .qrSkeleton {
    width: 220px;
    height: 220px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    position: relative;
    overflow: hidden;
  }

  .shimmer {
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(90deg, transparent 0%, rgba(79, 70, 229, 0.08) 50%, transparent 100%);
    animation: shimmer 1.1s infinite;
  }

  @keyframes shimmer {
    100% {
      transform: translateX(100%);
    }
  }

  .note {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(79, 70, 229, 0.04);
    border: 1px solid rgba(79, 70, 229, 0.12);
    color: #64748b;
    font-weight: 800;
    font-size: 12px;
    line-height: 1.4;
  }

  .note b {
    color: #0f172a;
  }

  .error {
    margin: 0;
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
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    cursor: pointer;
    color: #0f172a;
    transition: all 0.15s;
  }

  .btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
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
    .backdrop {
      padding: 14px 10px;
    }

    .modal-w {
      border-radius: 16px;
    }

    .hero {
      padding: 22px 14px 16px;
    }

    .body {
      padding: 14px;
      gap: 10px;
    }

    .addrRow {
      grid-template-columns: 1fr;
    }

    .addrBox,
    .copyBtn,
    .btn {
      height: 44px;
    }

    .qr,
    .qrEmpty,
    .qrSkeleton {
      width: min(220px, 78vw);
      height: min(220px, 78vw);
    }

    .mini {
      white-space: normal;
    }
  }
</style>
