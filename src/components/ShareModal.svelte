<script lang="ts">
  import { onMount } from "svelte";
  import { generateQr } from "$lib/custody/qrcode";
  import { t } from "$lib/i18n";

  export let open = false;
  export let url = "";
  export let title = "";
  export let subtitle = "";

  let qrDataUrl = "";
  let copied = false;
  let fullUrl = url;

  onMount(() => {
    fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  });

  $: if (open && !qrDataUrl && fullUrl) {
    generateQr(fullUrl).then((d) => (qrDataUrl = d));
  }

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl);
    copied = true;
    setTimeout(() => (copied = false), 2000);
  }

  function shareTelegram() {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`,
      "_blank"
    );
  }

  function shareWhatsapp() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(title + " " + fullUrl)}`,
      "_blank"
    );
  }

  function shareInstagram() {
    copyLink();
    window.open("https://www.instagram.com/", "_blank");
  }

  function close() {
    open = false;
    copied = false;
  }
</script>

{#if open}
  <div class="backdrop" on:click|self={close}>
    <div class="window">
      <div class="hero">
        <div class="icon-wrap">
          <iconify-icon icon="lucide:share-2" width="22"></iconify-icon>
        </div>
        <div class="modal-title">{subtitle || $t('common.shareModal.share')}</div>
        {#if title}
          <div class="modal-subtitle">{title}</div>
        {/if}

        <button class="close-btn" type="button" on:click={close} aria-label={$t('common.btn.close')}>
          <iconify-icon icon="lucide:x" width="18"></iconify-icon>
        </button>
      </div>

      <div class="body">
        <div class="qr-wrap">
          {#if qrDataUrl}
            <img src={qrDataUrl} alt="QR Code" class="qr-img" />
          {:else}
            <div class="qr-loading">
              <div class="spinner"></div>
            </div>
          {/if}
        </div>

        <div class="url-row">
          <input type="text" readonly value={fullUrl} class="url-input" />
          <button class="copy-btn" type="button" on:click={copyLink} class:copied>
            <iconify-icon icon={copied ? "lucide:check" : "lucide:copy"} width="16"></iconify-icon>
          </button>
        </div>

        <div class="grid">
          <button class="option" type="button" on:click={copyLink}>
            <div class="opt-icon" style="background: rgba(79,70,229,0.08); color: #4f46e5;">
              <iconify-icon icon="lucide:link" width="20"></iconify-icon>
            </div>
            <span class="opt-label">{copied ? $t('common.shareModal.copied') : $t('common.shareModal.copyLink')}</span>
          </button>

          <button class="option" type="button" on:click={shareTelegram}>
            <div class="opt-icon" style="background: rgba(38,165,228,0.08); color: #26A5E4;">
              <iconify-icon icon="simple-icons:telegram" width="20"></iconify-icon>
            </div>
            <span class="opt-label">Telegram</span>
          </button>

          <button class="option" type="button" on:click={shareWhatsapp}>
            <div class="opt-icon" style="background: rgba(37,211,102,0.08); color: #25D366;">
              <iconify-icon icon="simple-icons:whatsapp" width="20"></iconify-icon>
            </div>
            <span class="opt-label">WhatsApp</span>
          </button>

          <button class="option" type="button" on:click={shareInstagram}>
            <div class="opt-icon" style="background: rgba(228,64,95,0.08); color: #E4405F;">
              <iconify-icon icon="simple-icons:instagram" width="20"></iconify-icon>
            </div>
            <span class="opt-label">Instagram</span>
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(2, 6, 23, 0.45);
    backdrop-filter: blur(2px);
    z-index: 1000;
    display: grid;
    place-items: center;
    padding: 20px;
    animation: fadeIn 0.18s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .window {
    width: min(420px, 100%);
    background: #fff;
    border-radius: 18px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.18);
    animation: popIn 0.18s ease-out;
  }

  @keyframes popIn {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .hero {
    position: relative;
    padding: 24px 18px 18px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
  }

  .icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.15);
    display: grid;
    place-items: center;
    margin: 0 auto 12px;
    color: #4f46e5;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 900;
    color: #0f172a;
  }

  .modal-subtitle {
    margin-top: 4px;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    max-width: 280px;
    margin-left: auto;
    margin-right: auto;
  }

  .close-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    color: #64748b;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }
  .close-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

  .body {
    padding: 20px 18px 22px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .qr-wrap {
    width: 160px;
    height: 160px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    display: grid;
    place-items: center;
    background: #fff;
  }

  .qr-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 10px;
  }

  .qr-loading { display: grid; place-items: center; }
  .spinner {
    width: 24px;
    height: 24px;
    border: 3px solid #e2e8f0;
    border-top-color: #4f46e5;
    border-radius: 999px;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .url-row {
    display: flex;
    gap: 8px;
    width: 100%;
  }

  .url-input {
    flex: 1;
    height: 40px;
    padding: 0 12px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    background: #f8fafc;
    outline: none;
    min-width: 0;
  }

  .copy-btn {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: #64748b;
    flex: 0 0 auto;
    transition: all 0.15s;
  }
  .copy-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .copy-btn.copied { border-color: #22c55e; color: #22c55e; background: rgba(34, 197, 94, 0.06); }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }

  .option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px 10px;
    border-radius: 14px;
    border: 1px solid #f1f5f9;
    background: #fff;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }
  .option:hover { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }

  .opt-icon {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
  }

  .opt-label {
    font-size: 12px;
    font-weight: 800;
    color: #0f172a;
  }
</style>
