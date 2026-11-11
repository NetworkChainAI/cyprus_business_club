<script lang="ts">
  import { goto } from "$app/navigation";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";

  let email = "";
  let password = "";
  let errorMessage = "";
  let loading = false;
  let showPassword = false;

  const handleSubmit = async () => {
    if (!email || !password) {
      errorMessage = t.get('auth.login.fillAllFields');
      return;
    }

    try {
      loading = true;
      errorMessage = "";

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const cookies = document.cookie.split(";").map((c) => c.trim());
        const redirectCookie = cookies.find((c) =>
          c.startsWith("redirectAfterLogin="),
        );

        let redirectTo = withLang("/profile");

        if (redirectCookie) {
          redirectTo = redirectCookie.split("=")[1] || withLang("/profile");
          document.cookie = "redirectAfterLogin=; path=/; max-age=0";
        }

        goto(redirectTo, { invalidateAll: true });
      } else {
        const text = await res.text();
        errorMessage = text || t.get('auth.login.loginFailed');
      }
    } catch (err) {
      errorMessage = t.get('auth.login.genericError');
    } finally {
      loading = false;
    }
  };

  const handleGoogle = async () => {
    try {
      window.location.href = "/api/auth/google";
    } catch (err) {
      console.error("Google login error:", err);
    }
  };
</script>

<div class="page">
  <div class="card">
    <div class="card-header">
      <div class="icon-wrap">
        <iconify-icon icon="lucide:log-in" width="24" height="24"></iconify-icon>
      </div>
      <h1>{$t('auth.login.title')}</h1>
      <p>{$t('auth.login.subtitle')}</p>
    </div>

    <form on:submit|preventDefault={handleSubmit}>
      <div class="field">
        <label for="email">{$t('auth.login.email')}</label>
        <div class="input-wrap">
          <iconify-icon icon="lucide:mail" width="16" height="16"></iconify-icon>
          <input
            id="email"
            type="email"
            placeholder={$t('auth.login.emailPlaceholder')}
            bind:value={email}
            required
          />
        </div>
      </div>

      <div class="field">
        <label for="password">{$t('auth.login.password')}</label>
        <div class="input-wrap">
          <iconify-icon icon="lucide:lock" width="16" height="16"></iconify-icon>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={$t('auth.login.passwordPlaceholder')}
            bind:value={password}
            required
          />
          <button class="eye-btn" type="button" on:click={() => (showPassword = !showPassword)}>
            <iconify-icon icon={showPassword ? "lucide:eye-off" : "lucide:eye"} width="18"></iconify-icon>
          </button>
        </div>
      </div>

      {#if errorMessage}
        <div class="error">
          <iconify-icon icon="lucide:alert-circle" width="14" height="14"></iconify-icon>
          {errorMessage}
        </div>
      {/if}

      <div class="extra-links">
        <a href={withLang("/forgot-password")}>{$t('auth.login.forgotPassword')}</a>
      </div>

      <button type="submit" class="btn-primary" disabled={loading}>
        {#if loading}
          <iconify-icon icon="lucide:loader-2" width="16" height="16" class="spin"></iconify-icon>
          {$t('auth.login.submitting')}
        {:else}
          <iconify-icon icon="lucide:log-in" width="16" height="16"></iconify-icon>
          {$t('auth.login.submit')}
        {/if}
      </button>

      <div class="divider"><span>{$t('auth.login.or')}</span></div>

      <button type="button" class="btn-google" on:click={handleGoogle}>
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
        />
        {$t('auth.login.google')}
      </button>
    </form>

    <div class="footer-text">
      {$t('auth.login.noAccount')}
      <a href={withLang("/register")}>{$t('auth.login.createOne')}</a>
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
    max-width: 440px;
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
  }

  label {
    font-size: 12px;
    font-weight: 800;
    color: #475569;
    letter-spacing: 0.01em;
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

  .extra-links {
    display: flex;
    justify-content: flex-end;
    margin-top: -4px;
  }

  .extra-links a {
    font-size: 12px;
    font-weight: 700;
    color: #4f46e5;
    text-decoration: none;
    transition: color 0.15s;
  }

  .extra-links a:hover {
    color: #4338ca;
    text-decoration: underline;
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

    .btn-primary:hover,
    .btn-google:hover {
      transform: none;
      box-shadow: none;
    }
  }
</style>
