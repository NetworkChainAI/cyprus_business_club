<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";

  let loading = true;
  let error: string | null = null;
  let secret: string | null = null;

  let revealed = false;
  let copied = false;

  async function loadSecret() {
    loading = true;
    error = null;

    try {
      const res = await fetch("/api/custody/secret", {
        method: "GET",
        headers: { Accept: "application/json" }
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }

      secret = data.secret;
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
      secret = null;
    } finally {
      loading = false;
    }
  }

  async function copySecret() {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      copied = false;
    }
  }

  onMount(() => {
    loadSecret();
  });
</script>

<div class="secretCard">
  <div class="sTop">
    <div class="sTitle">
      <iconify-icon icon="lucide:key-round" width="18" style="color:#4f46e5"></iconify-icon>
      {$t('wallet.secret.title')}
    </div>
    <button class="sReload" type="button" on:click={loadSecret} aria-label="Reload secret">
      <iconify-icon icon="lucide:refresh-cw" width="16"></iconify-icon>
    </button>
  </div>

  {#if loading}
    <div class="state muted">{$t('wallet.secret.loading')}</div>
  {:else if error}
    <div class="state errorState">{error}</div>
  {:else if secret}
    <div class="secretBox">
      <div class="secretLine">
        <code class="secretCode" title={revealed ? secret : ""}>
          {#if revealed}
            {secret}
          {:else}
            {"•".repeat(Math.min(secret.length, 46))}
          {/if}
        </code>

        <button
          class="iconBtn"
          type="button"
          aria-label="Toggle secret visibility"
          on:click={() => (revealed = !revealed)}
        >
          <iconify-icon icon={revealed ? "lucide:eye-off" : "lucide:eye"} width="16"></iconify-icon>
        </button>

        <button class="iconBtn" type="button" on:click={copySecret} aria-label="Copy secret">
          <iconify-icon icon={copied ? "lucide:check-check" : "lucide:copy"} width="16"></iconify-icon>
        </button>
      </div>

      <div class="linksRow">
        <a
          class="linkBtn"
          href="https://chromewebstore.google.com/detail/%D0%B0%D1%83%D1%82%D0%B5%D0%BD%D1%82%D0%B8%D1%84%D0%B8%D0%BA%D0%B0%D1%82%D0%BE%D1%80/bhghoamapcdpbohphigoooaddinpkbai"
          target="_blank"
          rel="noopener noreferrer"
        >
          <iconify-icon icon="lucide:download" width="14"></iconify-icon>
          {$t('wallet.secret.getAuthenticator')}
        </a>

        <a
          class="linkBtn secondary"
          href="https://authenticator.cc/docs/en/quickstart"
          target="_blank"
          rel="noopener noreferrer"
        >
          <iconify-icon icon="lucide:book-open" width="14"></iconify-icon>
          {$t('wallet.secret.setupGuide')}
        </a>
      </div>

      <div class="warn">
        <iconify-icon icon="lucide:alert-triangle" width="14" style="flex-shrink:0;margin-top:1px"></iconify-icon>
        <span>{$t('wallet.secret.warning')}</span>
      </div>
    </div>
  {:else}
    <div class="state muted">{$t('wallet.secret.empty')}</div>
  {/if}
</div>

<style>
  .secretCard {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    width: 100%;
    min-width: 0;
  }

  .sTop {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
  }

  .sTitle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    min-width: 0;
  }

  .sReload {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.15s;
    flex: 0 0 auto;
  }

  .sReload:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .state {
    padding: 10px 12px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 900;
  }

  .muted {
    color: #64748b;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
  }

  .errorState {
    color: #b91c1c;
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.18);
  }

  .secretBox {
    display: grid;
    gap: 12px;
  }

  .secretLine {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    min-width: 0;
    overflow: hidden;
  }

  .secretCode {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
      "Courier New", monospace;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.3px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1 1 auto;
  }

  .iconBtn {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.15s;
    flex: 0 0 auto;
  }

  .iconBtn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .linksRow {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .linkBtn {
    height: 34px;
    padding: 0 12px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-content: center;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-weight: 900;
    font-size: 12px;
    text-decoration: none;
    transition: all 0.15s;
  }

  .linkBtn.secondary {
    background: #f8fafc;
  }

  .linkBtn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .warn {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(245, 158, 11, 0.06);
    border: 1px solid rgba(245, 158, 11, 0.18);
    color: #92400e;
    font-weight: 800;
    font-size: 12px;
    line-height: 1.4;
  }

  @media (max-width: 640px) {
    .secretCard {
      padding: 14px;
      border-radius: 16px;
    }

    .secretLine {
      padding: 10px;
    }
  }
</style>
