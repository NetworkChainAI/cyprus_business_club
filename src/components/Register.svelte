<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { withLang } from "$lib/utils/withLang";

  let name = "";
  let email = "";
  let password = "";
  let confirmPassword = "";
  let referral = "";
  let errorMessage = "";
  let successMessage = "";
  let loading = false;
  let showPassword = false;

  function meetsPolicy(p: string) {
    const minLen = p.length >= 8;
    const hasLower = /[a-z]/.test(p);
    const hasUpper = /[A-Z]/.test(p);
    const hasDigit = /\d/.test(p);
    return { minLen, hasLower, hasUpper, hasDigit };
  }

  $: policy = meetsPolicy(password);
  $: passwordsMatch = password.length > 0 && password === confirmPassword;
  $: passwordOk = policy.minLen && policy.hasLower && policy.hasUpper && policy.hasDigit;

  onMount(() => {
    const unsub = page.subscribe(async ($page) => {
      const ref = $page.url.searchParams.get("ref");
      if (ref) {
        referral = ref;
        document.cookie = `ref=${ref}; path=/; max-age=86400`;

        const res = await fetch(`/api/user/referral/check?code=${ref}`);
        const data = await res.json();
        if (!data.exists) {
          errorMessage = t.get('auth.register.errors.referralNotFound');
        } else {
          errorMessage = "";
        }
      }
    });

    return () => unsub();
  });

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirmPassword) {
      errorMessage = t.get('auth.register.errors.fillAll');
      return;
    }

    if (!passwordOk) {
      errorMessage = t.get('auth.register.errors.passwordReqs');
      return;
    }

    if (!passwordsMatch) {
      errorMessage = t.get('auth.register.errors.passwordMatch');
      return;
    }

    errorMessage = "";
    successMessage = "";
    loading = true;

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          referral,
        }),
      });

      if (res.status === 201) {
        goto(withLang(`/verify-email?email=${encodeURIComponent(email)}`));
      } else if (res.status === 409) {
        errorMessage = t.get('auth.register.errors.exists');
      } else {
        const text = await res.text();
        errorMessage = `${t.get('auth.register.errors.failed')}: ${text}`;
      }
    } catch (err) {
      console.error("Registration error:", err);
      errorMessage = t.get('auth.register.errors.generic');
    } finally {
      loading = false;
    }
  };

  const handleGoogle = () => {
    const ref = referral || new URL(location.href).searchParams.get("ref");
    window.location.href = `/api/auth/google${ref ? `?state=${ref}` : ""}`;
  };

  $: if (referral && referral.length >= 3) {
    checkReferral(referral);
  }

  async function checkReferral(code: string) {
    const res = await fetch(`/api/user/referral/check?code=${code}`);
    const data = await res.json();

    if (!data.exists) {
      errorMessage = t.get('auth.register.errors.referralNotFound');
    } else {
      errorMessage = "";
    }
  }
</script>

<div class="page">
  <div class="card">
    <div class="card-header">
      <div class="icon-wrap">
        <iconify-icon icon="lucide:user-plus" width="24" height="24"></iconify-icon>
      </div>
      <h1>{$t('auth.register.title')}</h1>
      <p>{$t('auth.register.subtitle')}</p>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="field">
        <label for="name">{$t('auth.register.fullName')}</label>
        <div class="input-wrap">
          <iconify-icon icon="lucide:user" width="16" height="16"></iconify-icon>
          <input
            id="name"
            type="text"
            placeholder={$t('auth.register.namePlaceholder')}
            bind:value={name}
            required
          />
        </div>
      </div>

      <div class="field">
        <label for="email">{$t('auth.register.email')}</label>
        <div class="input-wrap">
          <iconify-icon icon="lucide:mail" width="16" height="16"></iconify-icon>
          <input
            id="email"
            type="email"
            placeholder={$t('auth.register.emailPlaceholder')}
            bind:value={email}
            required
          />
        </div>
      </div>

      <div class="field">
        <label for="password">{$t('auth.register.password')}</label>
        <div class="input-wrap">
          <iconify-icon icon="lucide:lock" width="16" height="16"></iconify-icon>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={$t('auth.register.passwordPlaceholder')}
            bind:value={password}
            required
          />
          <button class="eye-btn" type="button" on:click={() => (showPassword = !showPassword)}>
            <iconify-icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width="18"></iconify-icon>
          </button>
        </div>

        <div class="policy">
          <div class="rule" class:ok={policy.minLen}>
            <span class="dot"></span><span>{$t('auth.register.policy.minLen')}</span>
          </div>
          <div class="rule" class:ok={policy.hasLower}>
            <span class="dot"></span><span>{$t('auth.register.policy.lowercase')}</span>
          </div>
          <div class="rule" class:ok={policy.hasUpper}>
            <span class="dot"></span><span>{$t('auth.register.policy.uppercase')}</span>
          </div>
          <div class="rule" class:ok={policy.hasDigit}>
            <span class="dot"></span><span>{$t('auth.register.policy.number')}</span>
          </div>
        </div>
      </div>

      <div class="field">
        <label for="confirm">{$t('auth.register.confirmPassword')}</label>
        <div class="input-wrap">
          <iconify-icon icon="lucide:lock" width="16" height="16"></iconify-icon>
          <input
            id="confirm"
            type={showPassword ? "text" : "password"}
            placeholder={$t('auth.register.confirmPlaceholder')}
            bind:value={confirmPassword}
            required
          />
          <button class="eye-btn" type="button" on:click={() => (showPassword = !showPassword)}>
            <iconify-icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width="18"></iconify-icon>
          </button>
        </div>

        <div
          class="match-row"
          class:bad={!passwordsMatch && confirmPassword.length > 0}
          class:good={passwordsMatch && confirmPassword.length > 0}
        >
          {#if confirmPassword.length === 0}
            <span class="match-muted">{$t('auth.register.match.hint')}</span>
          {:else if passwordsMatch}
            <span class="match-good">{$t('auth.register.match.match')}</span>
          {:else}
            <span class="match-bad">{$t('auth.register.match.noMatch')}</span>
          {/if}
        </div>
      </div>

      <div class="field">
        <label for="referral">{$t('auth.register.referralCode')} <span class="optional">({$t('auth.register.optional')})</span></label>
        <div class="input-wrap">
          <iconify-icon icon="lucide:gift" width="16" height="16"></iconify-icon>
          <input id="referral" type="text" placeholder={$t('auth.register.referralPlaceholder')} bind:value={referral} maxlength="6" />
        </div>
      </div>

      {#if errorMessage}
        <div class="error">
          <iconify-icon icon="lucide:alert-circle" width="14" height="14"></iconify-icon>
          {errorMessage}
        </div>
      {/if}

      {#if successMessage}
        <div class="success">
          <iconify-icon icon="lucide:check-circle" width="14" height="14"></iconify-icon>
          {successMessage}
        </div>
      {/if}

      <button type="submit" class="btn-primary" disabled={loading}>
        {#if loading}
          <iconify-icon icon="lucide:loader-2" width="16" height="16" class="spin"></iconify-icon>
          {$t('auth.register.submitting')}
        {:else}
          <iconify-icon icon="lucide:arrow-right" width="16" height="16"></iconify-icon>
          {$t('auth.register.submit')}
        {/if}
      </button>

      <div class="divider"><span>{$t('auth.register.or')}</span></div>

      <button type="button" class="btn-google" on:click={handleGoogle}>
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
        />
        {$t('auth.register.google')}
      </button>
    </form>

    <div class="footer-text">
      {$t('auth.register.hasAccount')}
      <a href={withLang('/login')}>{$t('auth.register.signIn')}</a>
    </div>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px 16px;
    background: #f8fafc;
  }

  .card {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 0;
    overflow: hidden;
    animation: fadeUp 0.2s ease-out;
  }

  .card-header {
    padding: 28px 24px 20px;
    text-align: center;
    border-bottom: 1px solid #e2e8f0;
    background: #fff;
  }

  .icon-wrap {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.15);
    display: grid;
    place-items: center;
    color: #4f46e5;
    margin: 0 auto 14px;
  }

  h1 {
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  .card-header p {
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
    margin: 6px 0 0;
  }

  form {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }


  label {
    font-size: 12px;
    font-weight: 800;
    color: #475569;
    letter-spacing: 0.01em;
  }

  .optional {
    font-weight: 600;
    color: #94a3b8;
  }

  .input-wrap {
    height: 44px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.15s;
  }

  .input-wrap :global(iconify-icon) {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .input-wrap:focus-within {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
  }

  .input-wrap:focus-within :global(iconify-icon) {
    color: #4f46e5;
  }

  input {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: #0f172a;
    font-weight: 700;
    font-size: 14px;
    font-family: inherit;
    min-width: 0;
  }

  input::placeholder {
    color: #cbd5e1;
    font-weight: 600;
  }

  .eye-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    color: #94a3b8;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    flex-shrink: 0;
    transition: background 0.12s;
  }

  .eye-btn:hover {
    background: rgba(79, 70, 229, 0.06);
    color: #4f46e5;
  }

  .policy {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    margin-top: 8px;
  }

  .rule {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    min-width: 0;
  }

  .rule .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #cbd5e1;
    flex: 0 0 auto;
    transition: background 0.15s;
  }

  .rule.ok {
    color: #16a34a;
  }

  .rule.ok .dot {
    background: #22c55e;
  }

  .match-row {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    padding: 6px 2px 0;
  }

  .match-muted {
    color: #94a3b8;
  }

  .match-row.good .match-good {
    color: #16a34a;
  }

  .match-row.bad .match-bad {
    color: #dc2626;
  }

  .error {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-weight: 700;
    font-size: 13px;
  }

  .success {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 12px;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #059669;
    font-weight: 700;
    font-size: 13px;
  }

  .btn-primary {
    width: 100%;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: #4f46e5;
    color: #fff;
    font-weight: 900;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.15s;
  }

  .btn-primary:hover {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(79, 70, 229, 0.25);
  }

  .btn-primary:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-primary :global(.spin) {
    animation: spin 1s linear infinite;
  }

  .divider {
    position: relative;
    text-align: center;
    color: #94a3b8;
    font-weight: 800;
    font-size: 12px;
  }

  .divider::before,
  .divider::after {
    content: "";
    position: absolute;
    top: 50%;
    width: 42%;
    height: 1px;
    background: #e2e8f0;
  }

  .divider::before { left: 0; }
  .divider::after { right: 0; }

  .divider span {
    display: inline-block;
    padding: 0 10px;
    background: #fff;
  }

  .btn-google {
    width: 100%;
    height: 44px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-weight: 800;
    font-size: 14px;
    font-family: inherit;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: all 0.15s;
  }

  .btn-google:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  }

  .btn-google img {
    width: 18px;
    height: 18px;
  }

  .footer-text {
    padding: 16px 24px;
    text-align: center;
    font-size: 13px;
    color: #64748b;
    font-weight: 700;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .footer-text a {
    color: #4f46e5;
    font-weight: 900;
    text-decoration: none;
  }

  .footer-text a:hover {
    text-decoration: underline;
  }

  @keyframes fadeUp {
    from { transform: translateY(8px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .page { padding: 16px 12px; }
    .card { border-radius: 16px; }
    form { padding: 20px 18px; }
    .card-header { padding: 24px 18px 18px; }
    .policy { grid-template-columns: 1fr; gap: 8px; }
    .btn-primary:hover,
    .btn-google:hover {
      transform: none;
      box-shadow: none;
    }
  }
</style>
