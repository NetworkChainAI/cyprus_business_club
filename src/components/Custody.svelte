<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { t } from "$lib/i18n";
  import Sparkline from "./Sparkline.svelte";
  import CustodyAuthModal from "./CustodyAuthModal.svelte";
  import DepositModal from "./custody/DepositModal.svelte";
  import WithdrawModal from "./custody/WithdrawModal.svelte";
  import TransferModal from "./custody/TransferModal.svelte";
  import Secret from "./custody/Secret.svelte";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data;

  let loading = true;
  let loggedIn = false;
  let authModal = false;

  let email = data?.user?.email ?? "";

  let depositModal = false;
  let withdrawModal = false;
  let transferModal = false;

  let walletAddress = "";
  let copied = false;

  let showSecret = false;

  let balances = [
    { name: "USDT", logo: "/assets/images/usdt.png", balance: "0.00" },
    { name: "POL", logo: "/assets/images/pol.png", balance: "0.00" },
  ];

  let sessionCheckInterval: ReturnType<typeof setInterval>;

  onMount(async () => {
    loading = true;
    const ok = await tryLoadWallet();
    loggedIn = ok;
    loading = false;

    // Check session every 5 minutes — if jwt cookie expired, prompt re-login
    sessionCheckInterval = setInterval(async () => {
      if (!loggedIn) return;
      const res = await fetch("/api/custody/wallets");
      if (res.status !== 200) {
        loggedIn = false;
        walletAddress = "";
        authModal = true;
      }
    }, 5 * 60 * 1000);
  });

  onDestroy(() => {
    if (sessionCheckInterval) clearInterval(sessionCheckInterval);
  });

  async function tryLoadWallet() {
    const res = await fetch("/api/custody/wallets");
    if (res.status !== 200) return false;

    const wallets = await res.json();
    walletAddress = wallets[0]?.address || "";

    await loadBalances();
    return true;
  }

  async function loadBalances() {
    if (!walletAddress) return;

    const res = await fetch(`/api/custody/balances?wallet=${walletAddress}`);
    const data = await res.json();

    balances = [
      {
        name: "USDT",
        logo: "/assets/images/usdt.png",
        balance: data.usdt.toFixed(2),
      },
      {
        name: "POL",
        logo: "/assets/images/pol.png",
        balance: data.pol.toFixed(4),
      },
    ];
  }

  function copyAddress() {
    navigator.clipboard.writeText(walletAddress);
    copied = true;
    setTimeout(() => (copied = false), 1500);
  }

  function toggleSecretView() {
    showSecret = !showSecret;
    depositModal = false;
    withdrawModal = false;
    transferModal = false;
  }

  function shortAddress(addr: string) {
    if (!addr) return "";
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  }

  function openAuthIfNeeded() {
    if (!loggedIn) authModal = true;
  }

  async function guardedAction(action: () => void) {
    const res = await fetch("/api/custody/wallets");
    if (res.status !== 200) {
      loggedIn = false;
      walletAddress = "";
      authModal = true;
      return;
    }
    action();
  }

  const chainLabel = "Polygon";
</script>

{#if authModal}
  <CustodyAuthModal
    email={data?.user?.email}
    address={data?.user?.info?.custodyAddress}
    open={authModal}
    on:close={() => (authModal = false)}
    on:success={() => {
      authModal = false;
      loggedIn = true;
      tryLoadWallet();
    }}
    on:created={(e) => {
      authModal = false;
      walletAddress = e.detail.wallet;
      loggedIn = true;
      tryLoadWallet();
    }}
  />
{/if}

<div class="page">
  <div class="layout">
    <div class="headerCard">
      <div class="hLeft">
        <div class="hIcon">
          <iconify-icon icon="lucide:shield" width="20"></iconify-icon>
        </div>

        <div class="hText">
          <div class="hTitleRow">
            <h2 class="hTitle">
              {showSecret ? $t('wallet.secret.title') : $t('wallet.custodial')}
            </h2>

            <button
              class="hGhostBtn"
              on:click={toggleSecretView}
              aria-label="Toggle secret"
            >
              <iconify-icon icon={showSecret ? "lucide:wallet" : "lucide:settings"} width="18"></iconify-icon>
            </button>
          </div>

          {#if !showSecret}
            <div class="hSubRow">
              <span class="addr">{shortAddress(walletAddress)}</span>

              {#if loggedIn && walletAddress}
                <button
                  class="copyMini"
                  on:click={copyAddress}
                  aria-label="Copy address"
                >
                  <iconify-icon icon={copied ? "lucide:check-check" : "lucide:copy"} width="16"></iconify-icon>
                </button>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      {#if !showSecret}
        <div class="hRight">
          <button class="pill statusPill" on:click={openAuthIfNeeded}>
            <span class="dot {loggedIn ? 'ok' : 'bad'}"></span>
            <span>{loggedIn ? $t('wallet.connected') : $t('wallet.disconnected')}</span>
          </button>

          <div class="pill chainPill">
            {chainLabel}
          </div>
        </div>
      {/if}
    </div>

    {#if loading}
      <div class="loadingState">
        <div class="spinner"></div>
        <div class="loadingText">{$t('wallet.loading')}</div>
      </div>
    {:else if showSecret}
        <Secret />
    {:else if loggedIn}
      <div class="balancesRow">
        <div class="balanceCard balanceDark">
          <div class="bTop">
            <div class="bMeta">
              <div class="bName">Tether USD</div>
              <div class="bAmount">
                ${balances.find((b) => b.name === "USDT")?.balance ?? "0.00"}
              </div>
            </div>
            <div class="bBadge bBadgeGreen">
              <iconify-icon icon="lucide:banknote" width="18"></iconify-icon>
            </div>
          </div>

          <div class="bSpark">
            <Sparkline symbol="USDC" quote="USDT" />
            <div class="sparkFade"></div>
          </div>
        </div>

        <div class="balanceCard balanceLight">
          <div class="bTop">
            <div class="bMeta">
              <div class="bName">Polygon Eco</div>
              <div class="bAmountPol">
                {balances.find((b) => b.name === "POL")?.balance ?? "0.0000"} POL
              </div>
            </div>
            <div class="bBadge bBadgePurple">
              <span class="pLetter">P</span>
            </div>
          </div>

          <div class="bSpark purple">
            <Sparkline symbol="POL" quote="USDT" />
            <div class="sparkFade light"></div>
          </div>
        </div>
      </div>

      <DepositModal
        open={depositModal}
        wallet={walletAddress}
        on:close={() => (depositModal = false)}
      />

      <WithdrawModal
        open={withdrawModal}
        wallet={walletAddress}
        on:close={() => (withdrawModal = false)}
        on:success={() => {
          withdrawModal = false;
          loadBalances();
        }}
      />

      <TransferModal
        open={transferModal}
        wallet={walletAddress}
        on:close={() => (transferModal = false)}
        on:success={() => {
          transferModal = false;
          loadBalances();
        }}
      />

      <div class="actionsRow">
        <button
          class="actionBtn primary"
          on:click={() => guardedAction(() => (depositModal = true))}
        >
          <iconify-icon icon="lucide:arrow-down" width="18"></iconify-icon>
          <span>{$t('wallet.actions.topUp')}</span>
        </button>

        <button class="actionBtn" on:click={() => guardedAction(() => (withdrawModal = true))}>
          <iconify-icon icon="lucide:arrow-up" width="18"></iconify-icon>
          <span>{$t('wallet.actions.withdraw')}</span>
        </button>

        <button class="actionBtn" on:click={() => guardedAction(() => (transferModal = true))}>
          <iconify-icon icon="lucide:send" width="18"></iconify-icon>
          <span>{$t('wallet.actions.transfer')}</span>
        </button>
      </div>

      <div class="txCard">
        <div class="txHeader">
          <div class="txTitle">
            <iconify-icon icon="lucide:clock" width="18"></iconify-icon>
            <span>{$t('wallet.transactionHistory')}</span>
          </div>
        </div>

        <div class="txBody">
          <div class="txEmpty">
            <iconify-icon icon="lucide:inbox" width="32" style="color:#cbd5e1"></iconify-icon>
            <div>{$t('wallet.noTransactions')}</div>
          </div>
        </div>
      </div>
    {:else}
      <div class="emptyState">
        <iconify-icon icon="lucide:wallet" width="36" style="color:#94a3b8"></iconify-icon>
        <div class="emptyTitle">{$t('wallet.notConnected')}</div>
        <div class="emptyText">
          {$t('wallet.notConnectedHint')}
        </div>
        <button class="connectBtn" on:click={() => (authModal = true)}>
          {$t('wallet.connectWallet')}
        </button>
      </div>
    {/if}
  </div>
</div>

<ContextAssistant
  contextKey="custody"
  payload={{ address: walletAddress, balances }}
  title={$t('wallet.assistantTitle')}
/>

<style>
  .page {
    width: 100%;
    padding: 26px 14px;
  }

  .layout {
    width: min(1100px, 100%);
    margin: 0 auto;
    display: grid;
    gap: 16px;
  }

  .headerCard {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .hLeft {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
  }

  .hIcon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: rgba(79, 70, 229, 0.06);
    color: #4f46e5;
    flex: 0 0 auto;
  }

  .hText {
    min-width: 0;
    flex: 1 1 auto;
  }

  .hTitleRow {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .hTitle {
    margin: 0;
    font-size: 20px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    flex: 1 1 auto;
  }

  .hGhostBtn {
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

  .hGhostBtn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .hSubRow {
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    font-size: 13px;
    min-width: 0;
  }

  .addr {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 360px;
    min-width: 0;
  }

  .copyMini {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    border: none;
    background: transparent;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: color 0.12s;
    flex: 0 0 auto;
  }

  .copyMini:hover {
    color: #4f46e5;
  }

  .hRight {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 0 0 auto;
    min-width: 0;
  }

  .pill {
    height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 800;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    user-select: none;
    min-width: 0;
    white-space: nowrap;
  }

  .statusPill {
    cursor: pointer;
    transition: all 0.15s;
  }

  .statusPill:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: 0 0 auto;
  }

  .dot.ok {
    background: #22c55e;
  }

  .dot.bad {
    background: #ef4444;
  }

  .chainPill {
    background: rgba(79, 70, 229, 0.06);
    border-color: rgba(79, 70, 229, 0.18);
    color: #4f46e5;
    font-weight: 900;
  }

  /* ===== BALANCES ===== */
  .balancesRow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    min-width: 0;
  }

  .balanceCard {
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    padding: 18px;
    position: relative;
    min-height: 150px;
    min-width: 0;
  }

  .balanceDark {
    background: #0f172a;
    border-color: #1e293b;
    color: #e2e8f0;
  }

  .balanceLight {
    background: #fff;
    color: #0f172a;
  }

  .bTop {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    min-width: 0;
  }

  .bMeta {
    display: grid;
    gap: 6px;
    min-width: 0;
  }

  .bName {
    font-size: 14px;
    font-weight: 800;
    opacity: 0.9;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bAmount {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -0.8px;
    color: #fff;
    line-height: 1.05;
    white-space: nowrap;
  }

  .bAmountPol {
    font-size: 38px;
    font-weight: 900;
    letter-spacing: -0.8px;
    line-height: 1.05;
    white-space: nowrap;
  }

  .bBadge {
    width: 42px;
    height: 42px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .bBadgeGreen {
    background: rgba(34, 197, 94, 0.18);
    color: #22c55e;
  }

  .bBadgePurple {
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
  }

  .pLetter {
    font-weight: 900;
    font-size: 16px;
  }

  .bSpark {
    margin-top: 14px;
    position: relative;
    height: 46px;
    min-width: 0;
  }

  .bSpark :global(canvas) {
    width: 100% !important;
    height: 100% !important;
    display: block;
  }

  .sparkFade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.65) 100%);
    border-radius: 12px;
    opacity: 0.6;
  }

  .sparkFade.light {
    background: linear-gradient(180deg, transparent 0%, rgba(79, 70, 229, 0.08) 100%);
    opacity: 1;
  }

  /* ===== ACTIONS ===== */
  .actionsRow {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 14px;
    min-width: 0;
  }

  .actionBtn {
    height: 56px;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    font-weight: 900;
    font-size: 14px;
    cursor: pointer;
    color: #0f172a;
    transition: all 0.15s;
    min-width: 0;
    white-space: nowrap;
  }

  .actionBtn :global(iconify-icon) {
    color: #64748b;
  }

  .actionBtn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .actionBtn.primary {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }

  .actionBtn.primary :global(iconify-icon) {
    color: #fff;
  }

  .actionBtn.primary:hover {
    background: #4338ca;
  }

  /* ===== TRANSACTIONS ===== */
  .txCard {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
    min-width: 0;
  }

  .txHeader {
    padding: 16px 18px;
    border-bottom: 1px solid #e2e8f0;
  }

  .txTitle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    color: #0f172a;
  }

  .txTitle :global(iconify-icon) {
    color: #4f46e5;
  }

  .txBody {
    padding: 40px 18px;
    min-height: 130px;
    display: grid;
    place-items: center;
  }

  .txEmpty {
    color: #94a3b8;
    font-weight: 800;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  /* ===== EMPTY STATE ===== */
  .emptyState {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 40px 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    min-width: 0;
  }

  .emptyTitle {
    font-weight: 900;
    font-size: 18px;
    color: #0f172a;
  }

  .emptyText {
    color: #64748b;
    font-weight: 700;
  }

  .connectBtn {
    margin-top: 8px;
    height: 44px;
    border-radius: 14px;
    border: none;
    background: #4f46e5;
    color: #fff;
    font-weight: 900;
    cursor: pointer;
    transition: background 0.15s;
    width: fit-content;
    padding: 0 20px;
  }

  .connectBtn:hover {
    background: #4338ca;
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 860px) {
    .balancesRow {
      grid-template-columns: 1fr;
    }

    .actionsRow {
      grid-template-columns: 1fr;
    }

    .addr {
      max-width: 240px;
    }
  }

  @media (max-width: 640px) {
    .page {
      padding: 16px 10px;
    }

    .layout {
      gap: 12px;
    }

    .headerCard {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 14px;
    }

    .hLeft {
      width: 100%;
    }

    .hRight {
      width: 100%;
      justify-content: space-between;
    }

    .hTitle {
      font-size: 18px;
    }

    .addr {
      max-width: 100%;
    }

    .balanceCard {
      padding: 14px;
      min-height: 140px;
    }

    .bAmount {
      font-size: 32px;
    }

    .bAmountPol {
      font-size: 28px;
    }

    .bSpark {
      height: 48px;
    }

    .txBody {
      padding: 28px 14px;
    }

    .txHeader {
      padding: 14px;
    }
  }

  @media (max-width: 380px) {
    .pill {
      padding: 0 10px;
      font-size: 12px;
    }

    .hIcon {
      width: 38px;
      height: 38px;
      border-radius: 13px;
    }

    .actionBtn {
      height: 50px;
    }

    .bAmount {
      font-size: 30px;
    }

    .bAmountPol {
      font-size: 26px;
    }
  }

  /* ===== LOADING ===== */
  .loadingState {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 60px 26px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 4px solid #e2e8f0;
    border-top-color: #4f46e5;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .loadingText {
    font-weight: 800;
    color: #64748b;
    font-size: 14px;
  }
</style>
