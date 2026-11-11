<script lang="ts">
  import { t } from "$lib/i18n";
  import { onMount } from "svelte";

  export let currency: any;
  export let amount: string;
  export let depositAddress: string;

  let copied = false;

  const cancelOrder = () => {
    localStorage.removeItem("order");
    dispatchEvent(new CustomEvent("orderCancelled"));
  };

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(depositAddress);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch (e) {
      console.error("Failed to copy", e);
    }
  }
</script>

<div class="send-container">
  <div class="left">
    <div class="title">{$t('common.exchange.send')}</div>

    <!-- Amount -->
    <div class="block">
      <div class="label">{$t('common.exchange.amount')}</div>

      <div class="value">
        <span class="amount">{amount}</span>
        <span class="currency">{currency?.currencyCode}</span>
      </div>

      <div class="network-tag">{currency?.chain}</div>
    </div>

    <!-- Address -->
    <div class="block">
      <div class="label">{$t('common.exchange.depositAddress')}</div>

      <div class="address-row">
        <div class="address">{depositAddress}</div>

        <button class="copy-btn" on:click={copyAddress}>
          <ion-icon name={copied ? "checkmark-done-outline" : "copy-outline"}
          ></ion-icon>
        </button>
      </div>

      <div class="warning">
        {$t('common.exchange.sendOnly')} <b>{currency?.currencyCode}</b> {$t('common.exchange.on')}
        <b>{currency?.chain}</b> {$t('common.exchange.network')}.
      </div>
    </div>

    <button class="cancel-btn" on:click={cancelOrder}>{$t('common.exchange.cancelOrder')}</button>
  </div>

  <!-- Steps -->
  <div class="right">
    <div class="steps-title">{$t('common.exchange.howToSend')}</div>

    <ol class="steps">
      <li>{$t('common.exchange.step1')}</li>
      <li>{$t('common.exchange.step2')}</li>
      <li>{$t('common.exchange.step3')} <b>{currency?.currencyCode}</b></li>
      <li>{$t('common.exchange.step4')} <b>{currency?.chain}</b></li>
      <li>{$t('common.exchange.step5')}</li>
      <li>{$t('common.exchange.step6')}</li>
    </ol>
  </div>
</div>

<style>
  /* MAIN WRAPPER */
  .send-container {
    display: flex;
    gap: 28px;
    background: #27292e;
    padding: 28px;
    border-radius: 22px;
    color: white;
    flex-wrap: wrap;
  }

  .left {
    flex: 1;
    min-width: 260px;
  }

  .right {
    width: 260px;
    color: #d1d1d1;
    font-size: 14px;
  }

  /* TITLES */
  .title {
    font-size: 26px;
    font-weight: 600;
    margin-bottom: 22px;
  }

  .block {
    margin-bottom: 32px;
  }

  .label {
    color: #9ca0a9;
    margin-bottom: 6px;
  }

  .value {
    display: flex;
    align-items: baseline;
    gap: 10px;
    font-size: 24px;
    font-weight: 600;
  }

  .currency {
    opacity: 0.8;
    font-size: 20px;
  }

  .network-tag {
    margin-top: 6px;
    font-size: 13px;
    background: #33363d;
    padding: 5px 10px;
    width: fit-content;
    border-radius: 8px;
    opacity: 0.9;
  }

  /* ADDRESS + COPY */
  .address-row {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 100%;
  }

  .address {
    background: #1f2125;
    padding: 14px;
    border-radius: 12px;
    font-size: 14px;
    word-break: break-word;
    flex: 1;
  }

  .copy-btn {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    padding: 6px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
    font-size: 1.2rem;
  }

  .copy-btn:hover {
    color: #fff;
  }

  .copy-btn ion-icon {
    font-size: 1.3rem;
  }

  /* WARNING */
  .warning {
    margin-top: 12px;
    color: #ff5757;
    font-size: 15px;
  }

  /* STEPS */
  .steps-title {
    font-weight: 600;
    margin-bottom: 10px;
  }

  .steps {
    padding-left: 20px;
    line-height: 1.5rem;
  }

  /* CANCEL BUTTON */
  .cancel-btn {
    margin-top: 12px;
    padding: 14px 16px;
    width: 100%;
    background: #e63946;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    color: white;
    cursor: pointer;
    transition: 0.2s;
  }

  .cancel-btn:hover {
    filter: brightness(1.15);
  }

  .cancel-btn:active {
    transform: scale(0.98);
  }

  /* MOBILE ADAPTATION */
  @media (max-width: 768px) {
    .send-container {
      flex-direction: column;
      padding: 22px;
      gap: 20px;
    }

    .right {
      width: 100%;
      order: 1;
    }

    .left {
      width: 100%;
      order: 0;
    }

    .cancel-btn {
      margin-top: 24px;
      width: 100%;
      order: 2;
    }

    .value {
      font-size: 22px;
    }

    .amount {
      font-size: 22px;
    }

    .currency {
      font-size: 18px;
    }

    .address-row {
      align-items: flex-start;
    }
  }
</style>
