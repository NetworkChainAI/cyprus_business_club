<script lang="ts">
  import { page } from "$app/stores";
  import { t } from "$lib/i18n";
  import { withLang } from "$lib/utils/withLang";

  let resending = false;
  let resent = false;
  let error = "";

  $: email = $page.url.searchParams.get("email") ?? "";
  $: isInvalidToken = $page.url.searchParams.get("error") === "invalid_token";

  async function resend() {
    if (!email || resending) return;
    resending = true;
    error = "";
    try {
      const res = await fetch("/api/verify-email/resend", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        resent = true;
      } else {
        error = "Failed to resend. Please try again.";
      }
    } catch {
      error = "Network error. Please try again.";
    } finally {
      resending = false;
    }
  }
</script>

<div class="page">
  <div class="card">
    {#if isInvalidToken}
      <div class="icon-wrap error-icon">
        <iconify-icon icon="lucide:x-circle" width="32"></iconify-icon>
      </div>
      <h1>Invalid or expired link</h1>
      <p>This verification link is invalid or has already been used. Please register again or request a new link.</p>
      <a class="btn btn-primary" href={withLang("/register")}>Register</a>
    {:else}
      <div class="icon-wrap">
        <iconify-icon icon="lucide:mail" width="32"></iconify-icon>
      </div>
      <h1>Check your email</h1>
      <p>
        We sent a confirmation link to
        {#if email}<strong>{email}</strong>{:else}your email address{/if}.
        Click the link to activate your account.
      </p>

      {#if resent}
        <div class="success-msg">
          <iconify-icon icon="lucide:check-circle-2" width="16"></iconify-icon>
          Email resent successfully!
        </div>
      {:else if error}
        <div class="error-msg">{error}</div>
      {/if}

      {#if email && !resent}
        <button class="btn btn-ghost" on:click={resend} disabled={resending}>
          {resending ? "Sending…" : "Resend email"}
        </button>
      {/if}

      <a class="back-link" href={withLang("/login")}>
        <iconify-icon icon="lucide:arrow-left" width="14"></iconify-icon>
        Back to login
      </a>
    {/if}
  </div>
</div>

<style>
  .page {
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #f8fafc;
  }

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 48px 40px;
    max-width: 440px;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 32px rgba(15,23,42,0.06);
  }

  .icon-wrap {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: rgba(79,70,229,0.08);
    color: #4f46e5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }

  .error-icon {
    background: rgba(239,68,68,0.08);
    color: #ef4444;
  }

  h1 {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 12px;
  }

  p {
    font-size: 15px;
    color: #64748b;
    font-weight: 600;
    line-height: 1.6;
    margin: 0 0 28px;
  }

  p strong {
    color: #0f172a;
    font-weight: 800;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 24px;
    border-radius: 12px;
    font-weight: 800;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
    border: 1px solid transparent;
  }

  .btn-primary {
    background: #4f46e5;
    color: #fff;
  }

  .btn-primary:hover { background: #4338ca; }

  .btn-ghost {
    background: #fff;
    color: #0f172a;
    border-color: #e2e8f0;
  }

  .btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }
  .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  .success-msg {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #16a34a;
    font-weight: 700;
    font-size: 14px;
    background: rgba(22,163,74,0.07);
    padding: 8px 16px;
    border-radius: 10px;
    margin-bottom: 16px;
  }

  .error-msg {
    color: #dc2626;
    font-weight: 700;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 20px;
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
    text-decoration: none;
    transition: color 0.15s;
  }

  .back-link:hover { color: #4f46e5; }
</style>
