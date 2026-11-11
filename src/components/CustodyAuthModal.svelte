<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { t } from "$lib/i18n";
  import { gotoWithRedirectPreserved } from "$lib/utils/navigation";

  export let email: string | null = null;
  export let open: boolean = false;
  export let address: string | null = null;

  const dispatch = createEventDispatcher();

  let mode: "login" | "register" = "login";

  let password = "";
  let passwordConfirm = "";
  let showPassword = false;

  let error = "";
  let loading = false;

  if (address) mode = "login";

  function switchMode(to: "login" | "register") {
    if (address) return;
    mode = to;
    password = "";
    passwordConfirm = "";
    error = "";
    loading = false;
  }

  function meetsPolicy(p: string) {
    const minLen = p.length >= 8;
    const hasLower = /[a-z]/.test(p);
    const hasUpper = /[A-Z]/.test(p);
    const hasDigit = /\d/.test(p);
    return { minLen, hasLower, hasUpper, hasDigit };
  }

  $: policy = meetsPolicy(password);
  $: passwordsMatch =
    mode === "register"
      ? password.length > 0 && password === passwordConfirm
      : true;
  $: passwordOk =
    mode === "register"
      ? policy.minLen && policy.hasLower && policy.hasUpper && policy.hasDigit
      : password.length >= 4;

  $: canSubmit =
    !!email &&
    !loading &&
    (mode === "login" ? passwordOk : passwordOk && passwordsMatch);

  function policyText() {
    const missing: string[] = [];
    if (!policy.minLen) missing.push(t.get('wallet.auth.policy.minLen'));
    if (!policy.hasLower) missing.push(t.get('wallet.auth.policy.lowercase'));
    if (!policy.hasUpper) missing.push(t.get('wallet.auth.policy.uppercase'));
    if (!policy.hasDigit) missing.push(t.get('wallet.auth.policy.number'));
    return missing;
  }

  async function handleLogin() {
    error = "";

    if (!email) {
      error = t.get('wallet.auth.errors.notSignedIn');
      return;
    }
    if (!password || password.length < 4) {
      error = t.get('wallet.auth.errors.passwordShort');
      return;
    }

    loading = true;
    try {
      const res = await fetch("/api/custody/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!data.ok) {
        error = data.error || t.get('wallet.auth.errors.loginFailed');
        return;
      }

      dispatch("success");
    } catch {
      error = t.get('wallet.auth.errors.connectionError');
    } finally {
      loading = false;
    }
  }

  async function handleRegister() {
    error = "";

    if (!email) {
      error = t.get('wallet.auth.errors.signInFirst');
      return;
    }

    const missing = policyText();
    if (missing.length) {
      error = `${t.get('wallet.auth.errors.passwordMustInclude')}: ${missing.join(", ")}.`;
      return;
    }
    if (!passwordsMatch) {
      error = t.get('wallet.auth.errors.passwordsNoMatch');
      return;
    }

    loading = true;
    try {
      const res = await fetch("/api/custody/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!data.ok) {
        error = data.error || t.get('wallet.auth.errors.createFailed');
        return;
      }

      dispatch("created", { wallet: data.wallet });
    } catch {
      error = t.get('wallet.auth.errors.connectionError');
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <div class="backdrop" on:click={() => dispatch("close")}>
    <div class="modal-w" on:click|stopPropagation>
      <div class="hero">
        <div class="heroIcon">
          <iconify-icon icon="lucide:shield" width="24"></iconify-icon>
        </div>
        <div class="heroTitle">
          {mode === "login" ? $t('wallet.auth.unlockTitle') : $t('wallet.auth.createTitle')}
        </div>
        <div class="heroSub">
          {mode === "login"
            ? $t('wallet.auth.unlockSubtitle')
            : $t('wallet.auth.createSubtitle')}
        </div>
      </div>

      <div class="body">
        {#if loading}
          <div class="loading-block">
            <div class="spinner"></div>
            <p>
              {mode === "register" ? $t('wallet.auth.creatingWallet') : $t('wallet.auth.unlockingWallet')}
            </p>
          </div>
        {:else}
          {#if !email}
            <div class="alertBox">
              <div class="alertTitle">{$t('wallet.auth.notSignedInTitle')}</div>
              <div class="alertText">{$t('wallet.auth.notSignedInText')}</div>

              <button
                class="btn primary"
                on:click={() => gotoWithRedirectPreserved("/login")}
              >
                {$t('wallet.auth.signIn')}
              </button>
            </div>
          {:else}
            <div class="infoRow">
              {mode === "login"
                ? `${$t('wallet.auth.account')}: ${email}`
                : `${$t('wallet.auth.createFor')}: ${email}`}
            </div>

            <div class="inputWrap">
              <input
                type={showPassword ? "text" : "password"}
                bind:value={password}
                placeholder={mode === "login" ? $t('wallet.auth.password') : $t('wallet.auth.createPassword')}
                autocomplete={mode === "login"
                  ? "current-password"
                  : "new-password"}
              />
              <button
                class="eyeBtn"
                type="button"
                on:click={() => (showPassword = !showPassword)}
              >
                <iconify-icon
                  icon={showPassword ? "lucide:eye-off" : "lucide:eye"}
                  width="18"
                ></iconify-icon>
              </button>
            </div>

            {#if mode === "register"}
              <div class="policy">
                <div class:ok={policy.minLen} class="rule">
                  <span class="dot"></span><span>{$t('wallet.auth.policy.minLen')}</span>
                </div>
                <div class:ok={policy.hasLower} class="rule">
                  <span class="dot"></span><span>{$t('wallet.auth.policy.lowercase')}</span>
                </div>
                <div class:ok={policy.hasUpper} class="rule">
                  <span class="dot"></span><span>{$t('wallet.auth.policy.uppercase')}</span>
                </div>
                <div class:ok={policy.hasDigit} class="rule">
                  <span class="dot"></span><span>{$t('wallet.auth.policy.number')}</span>
                </div>
              </div>

              <div class="inputWrap">
                <input
                  type={showPassword ? "text" : "password"}
                  bind:value={passwordConfirm}
                  placeholder={$t('wallet.auth.confirmPassword')}
                  autocomplete="new-password"
                />
                <button
                  class="eyeBtn"
                  type="button"
                  on:click={() => (showPassword = !showPassword)}
                >
                  <iconify-icon
                    icon={showPassword ? "lucide:eye-off" : "lucide:eye"}
                    width="18"
                  ></iconify-icon>
                </button>
              </div>

              <div
                class="matchRow"
                class:bad={!passwordsMatch && passwordConfirm.length > 0}
                class:good={passwordsMatch && passwordConfirm.length > 0}
              >
                {#if passwordConfirm.length === 0}
                  <span class="muted">{$t('wallet.auth.reenterPassword')}</span>
                {:else if passwordsMatch}
                  <span class="goodText">{$t('wallet.auth.passwordsMatch')}</span>
                {:else}
                  <span class="badText">{$t('wallet.auth.passwordsNoMatch')}</span>
                {/if}
              </div>
            {/if}

            {#if error}
              <p class="error">{error}</p>
            {/if}

            <button
              class="btn primary"
              on:click={mode === "login" ? handleLogin : handleRegister}
              disabled={!canSubmit}
            >
              {mode === "login" ? $t('wallet.auth.unlock') : $t('wallet.auth.register')}
            </button>

            {#if !address}
              <button
                class="btn ghost"
                on:click={() =>
                  switchMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login"
                  ? $t('wallet.auth.noWalletYet')
                  : $t('wallet.auth.alreadyHaveWallet')}
              </button>
            {/if}
          {/if}

          <button class="btn secondary" on:click={() => dispatch("close")}
            >{$t('wallet.close')}</button
          >
        {/if}
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
    max-width: min(520px, calc(100vw - 24px));
    border-radius: 18px;
    overflow: hidden;
    background: #fff;
    border: 1px solid #e2e8f0;
  }

  .hero {
    padding: 28px 18px 22px;
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
  }

  .infoRow {
    font-size: 12px;
    font-weight: 800;
    color: #64748b;
  }

  .inputWrap {
    position: relative;
  }

  input {
    width: 100%;
    height: 46px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 44px 0 14px;
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
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

  .eyeBtn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    border: none;
    background: transparent;
    cursor: pointer;
    color: #64748b;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 10px;
    transition: background 0.12s;
  }

  .eyeBtn:hover {
    background: rgba(79, 70, 229, 0.06);
  }

  /* POLICY */
  .policy {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 10px;
    padding: 10px 12px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
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
  }

  .rule.ok {
    color: #16a34a;
  }
  .rule.ok .dot {
    background: #22c55e;
  }

  /* MATCH ROW */
  .matchRow {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    padding: 0 2px;
  }

  .matchRow.good .goodText {
    color: #16a34a;
  }
  .matchRow.bad .badText {
    color: #dc2626;
  }
  .muted {
    color: #94a3b8;
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

  /* BUTTONS */
  .btn {
    width: 100%;
    height: 46px;
    border-radius: 14px;
    font-weight: 900;
    cursor: pointer;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    transition: all 0.15s;
  }

  .btn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .btn:disabled {
    opacity: 0.55;
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

  .btn.ghost {
    background: transparent;
    border-color: #e2e8f0;
    color: #4f46e5;
  }

  .btn.ghost:hover {
    background: rgba(79, 70, 229, 0.04);
  }

  /* ALERT */
  .alertBox {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .alertTitle {
    font-weight: 900;
    color: #0f172a;
  }
  .alertText {
    font-size: 13px;
    font-weight: 800;
    color: #64748b;
  }

  /* LOADING */
  .loading-block {
    display: grid;
    place-items: center;
    gap: 12px;
    padding: 16px 0 8px;
    text-align: center;
  }

  .loading-block p {
    margin: 0;
    color: #64748b;
    font-weight: 900;
    font-size: 13px;
  }

  .spinner {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    border: 3px solid rgba(79, 70, 229, 0.18);
    border-top-color: #4f46e5;
    animation: spin 0.9s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 640px) {
    .backdrop {
      padding: 12px 10px;
    }

    .modal-w {
      border-radius: 16px;
    }

    .hero {
      padding: 22px 14px 18px;
    }
    .heroTitle {
      font-size: 20px;
    }

    .body {
      padding: 14px;
      gap: 10px;
    }

    input,
    .btn {
      height: 44px;
    }

    .policy {
      grid-template-columns: 1fr;
      gap: 8px;
    }
  }
</style>
