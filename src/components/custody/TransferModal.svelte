<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { t } from "$lib/i18n";
  import OtpInput from "./OtpInput.svelte";

  export let open = false;
  export let wallet: string = "";

  const dispatch = createEventDispatcher();

  type FollowingUser = {
    id: string;
    email: string;
    custodyAddress: string | null;
    photo: string | null;
  };

  let users: FollowingUser[] = [];
  let selectedUserId: string = "";
  let selectedUserData: FollowingUser | null = null;

  let amount = "";
  let otp = "";
  let error = "";
  let loading = false;
  let dropdownOpen = false;
  let pending = false;

  let availableUsdt = 0;
  let usdtLoading = false;

  $: if (open) {
    loadUsers();
    loadUsdtBalance();
  }

  async function loadUsers() {
    try {
      const res = await fetch("/api/custody/following");
      const data = await res.json();
      users = data.ok ? (data.users as FollowingUser[]) : [];
    } catch {
      users = [];
    }
  }

  async function loadUsdtBalance() {
    if (!wallet) {
      availableUsdt = 0;
      return;
    }

    usdtLoading = true;
    try {
      const res = await fetch(`/api/custody/balances?wallet=${wallet}`);
      const data = await res.json();
      availableUsdt = Number(data?.usdt ?? 0);
    } catch {
      availableUsdt = 0;
    } finally {
      usdtLoading = false;
    }
  }

  $: selectedUserData = users.find((u) => u.id === selectedUserId) ?? null;

  function setPercent(p: 25 | 50 | 75 | 100) {
    const v = (availableUsdt * p) / 100;
    amount = v.toFixed(2);
  }

  function close() {
    dropdownOpen = false;
    dispatch("close");
  }

  function choose(user: FollowingUser) {
    selectedUserId = user.id;
    dropdownOpen = false;
  }

  function validate(): string {
    if (!selectedUserData) return t.get('wallet.transfer.errors.selectRecipient');
    if (!selectedUserData.custodyAddress) return t.get('wallet.transfer.errors.noWallet');
    if (!otp || otp.length !== 6) return t.get('wallet.transfer.errors.enterCode');
    if (!amount || Number(amount) <= 0) return t.get('wallet.transfer.errors.enterAmount');
    if (!usdtLoading && Number(amount) > availableUsdt)
      return `${t.get('wallet.transfer.errors.insufficient')} ${availableUsdt.toFixed(2)} USDT`;
    return "";
  }

  async function submit() {
    error = "";
    loading = true;
    pending = true;

    const validationError = validate();
    if (validationError) {
      error = validationError;
      loading = false;
      pending = false;
      return;
    }

    const user = selectedUserData!;

    try {
      const res = await fetch("/api/custody/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          currency: "USDT",
          chain: "Polygon",
          to: user.custodyAddress,
          toUserId: user.id,
          token: otp,
        }),
      });

      const data = await res.json();

      if (!data.ok) {
        error = data.error || t.get('wallet.transfer.errors.failed');
        return;
      }

      dispatch("success");
    } catch {
      error = t.get('wallet.transfer.errors.requestError');
    } finally {
      loading = false;
      pending = false;
    }
  }
</script>

{#if open}
  <div class="backdrop" on:click={close}>
    <div class="modal-w" on:click|stopPropagation>
      <div class="hero">
        <div class="heroIcon">
          <iconify-icon icon="lucide:send" width="22"></iconify-icon>
        </div>
        <div class="heroTitle">{$t('wallet.transfer.title')}</div>
        <div class="heroSub">{$t('wallet.transfer.subtitle')}</div>
      </div>

      <div class="body">
        <div class="subline">
          <span class="badge">USDT · Polygon</span>
          <span class="mini">
            {#if usdtLoading}
              {$t('wallet.transfer.loadingBalance')}
            {:else}
              {$t('wallet.transfer.available')}: <b>{availableUsdt.toFixed(2)}</b> USDT
            {/if}
          </span>
        </div>

        <label>{$t('wallet.transfer.recipient')}</label>

        <div class="dropdown">
          <div
            class="dropdown-selected"
            on:click={() => (dropdownOpen = !dropdownOpen)}
          >
            {#if selectedUserData}
              <img
                class="photo"
                alt="user"
                src={selectedUserData.photo || "/assets/images/user-male-circle.jpg"}
              />
              <span>{selectedUserData.email}</span>
            {:else}
              <span class="placeholder-user">{$t('wallet.transfer.selectRecipient')}</span>
            {/if}

            <iconify-icon icon="lucide:chevron-down" width="16" class="arrow-icon"></iconify-icon>
          </div>

          {#if dropdownOpen}
            <div class="dropdown-list">
              {#each users as u}
                <div class="dropdown-item" on:click={() => choose(u)}>
                  <img
                    class="photo"
                    alt="user"
                    src={u.photo || "/assets/images/user-male-circle.jpg"}
                  />
                  <span>{u.email}</span>
                </div>
              {/each}

              {#if users.length === 0}
                <div class="dropdown-empty">{$t('wallet.transfer.noUsers')}</div>
              {/if}
            </div>
          {/if}
        </div>

        <label>{$t('wallet.transfer.amount')}</label>
        <input type="number" bind:value={amount} placeholder="0.00" />

        <div class="amountRow">
          <div class="hint">
            {#if !usdtLoading}
              {$t('wallet.transfer.max')}:
              <button
                class="linkBtn"
                type="button"
                on:click={() => (amount = availableUsdt.toFixed(2))}
              >
                {availableUsdt.toFixed(2)}
              </button>
              USDT
            {/if}
          </div>

          <div class="chips">
            <button class="chip" type="button" on:click={() => setPercent(25)}>25%</button>
            <button class="chip" type="button" on:click={() => setPercent(50)}>50%</button>
            <button class="chip" type="button" on:click={() => setPercent(75)}>75%</button>
            <button class="chip" type="button" on:click={() => setPercent(100)}>MAX</button>
          </div>
        </div>

        <label>{$t('wallet.transfer.confirmationCode')}</label>
        <OtpInput length={6} on:change={(e) => (otp = e.detail)} disabled={loading} />

        {#if error}
          <p class="error">{error}</p>
        {/if}

        <button class="btn primary" on:click={submit} disabled={loading}>
          {loading ? $t('wallet.transfer.submitting') : $t('wallet.transfer.submit')}
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

  .mini b {
    color: #0f172a;
  }

  label {
    font-size: 12px;
    font-weight: 900;
    color: #64748b;
    margin-top: 6px;
  }

  input[type="number"] {
    width: 100%;
    height: 46px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 14px;
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
    outline: none;
    transition: border-color 0.15s;
  }

  input[type="number"]::placeholder {
    color: #94a3b8;
    font-weight: 800;
  }

  input[type="number"]:focus {
    border-color: #4f46e5;
  }

  .amountRow {
    margin-top: -6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .hint {
    font-size: 12px;
    font-weight: 800;
    color: #64748b;
  }

  .linkBtn {
    border: none;
    background: transparent;
    color: #4f46e5;
    font-weight: 900;
    cursor: pointer;
    padding: 0 2px;
  }

  .linkBtn:hover {
    text-decoration: underline;
  }

  .chips {
    display: inline-flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .chip {
    height: 28px;
    padding: 0 10px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-weight: 900;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .chip:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .dropdown {
    position: relative;
    width: 100%;
    min-width: 0;
  }

  .dropdown-selected {
    height: 46px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    cursor: pointer;
    user-select: none;
    transition: border-color 0.15s;
    min-width: 0;
  }

  .dropdown-selected:hover {
    border-color: #cbd5e1;
  }

  .dropdown-selected span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 900;
    color: #0f172a;
  }

  .placeholder-user {
    color: #94a3b8 !important;
  }

  .photo {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    object-fit: cover;
    flex: 0 0 auto;
    border: 1px solid #e2e8f0;
  }

  .dropdown-selected :global(.arrow-icon) {
    margin-left: auto;
    color: #64748b;
    flex: 0 0 auto;
  }

  .dropdown-list {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    overflow: hidden;
    z-index: 20;
    max-height: 260px;
    overflow-y: auto;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.12s;
    min-width: 0;
  }

  .dropdown-item:hover {
    background: #f8fafc;
  }

  .dropdown-item span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 900;
    color: #0f172a;
  }

  .dropdown-empty {
    padding: 12px;
    color: #94a3b8;
    font-weight: 900;
    text-align: center;
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
    color: #0f172a;
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

    input[type="number"],
    .dropdown-selected,
    .btn {
      height: 44px;
    }

    .mini {
      white-space: normal;
    }
  }
</style>
