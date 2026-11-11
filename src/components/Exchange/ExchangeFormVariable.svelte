<script lang="ts">
  import { t } from "$lib/i18n";
  import { Api } from "$lib/api";
  import ExchangeSelector from "./ExchangeSelector.svelte";
  import ExchangeInput from "./ExchangeInput.svelte";
  import ExchangeAddress from "./ExchangeAddress.svelte";
  import Decimal from "decimal.js";
  import { get, writable } from "svelte/store";
  import ExchangeRate from "./ExchangeRate.svelte";
  import ExchangeCreatedOrder from "./ExchangeCreatedOrder.svelte";
  import { onDestroy, onMount } from "svelte";

  const rate = writable<any | null>(null);

  export let currencies: any[] = [];
  export let pairs: Map<string, boolean>;

  // --- INITIAL SELECT ---
  export let selectedFromFixed: any | null = null;
  let selectedFrom: any | null = selectedFromFixed;

  export let selectedToFixed: any | null = null;
  let selectedTo: any | null = selectedToFixed;

  // Assign defaults when currencies arrive
  $: if (!selectedFrom && currencies?.length > 0) {
    selectedFrom = currencies[0];
  }

  $: if (!selectedTo && currencies?.length > 1) {
    selectedTo = currencies[1];
  }

  // --- AMOUNTS ---
  export let amountFromFixed: string | null = null;
  let amountFrom: string = amountFromFixed || "1000";

  export let amountToFixed: string | null = null;
  let amountTo: string = amountToFixed || "0";

  export let destinationAddressFixed = "";
  let destinationAddress = destinationAddressFixed;
  let destinationAddressMemo = "";

  export let orderType = "";

  let order: any | null = null;
  let created = false;
  let depositAddress = "";
  let interval: NodeJS.Timeout;

  // -----------------------
  //       MOUNT
  // ----------------------
  onMount(() => {
    getOrder();
    // interval = setInterval(getOrder, 5000);
  });

  //   onDestroy(() => clearInterval(interval));

  // -----------------------
  //  FETCH RATES WHEN PAIR CHANGES
  // ----------------------
  $: if (selectedFrom && selectedTo) {
    getRates();
  }

  // -----------------------
  //  FETCH RATE
  // ----------------------
  const getRates = async () => {
    if (!selectedFrom || !selectedTo) return;

    if (selectedFrom.currencyCode === selectedTo.currencyCode) {
      rate.set(null);
      return;
    }

    try {
      const data = await Api.get<any>(
        `/pairs/getRate/${selectedFrom.currencyCode}-${selectedTo.currencyCode}`
      );

      if (data?.price) {
        rate.set(data);
      } else {
        rate.set(null);
      }
    } catch (e) {
      rate.set(null);
    }
  };

  // -----------------------
  //  CALCULATE AMOUNTS WHEN RATE CHANGES
  // ----------------------
  $: if ($rate && selectedFrom && selectedTo) {
    calcRate();
  }

  const calcRate = () => {
    const r = get(rate);
    const price = new Decimal(r?.price || 0);

    if (price.gt(0)) {
      if (amountToFixed) {
        amountFrom = new Decimal(amountToFixed).div(price).toString();
        amountTo = amountToFixed;
      } else {
        amountTo = price.mul(amountFrom).toString();
      }
    }
  };

  // -----------------------
  //  ORDER CREATION
  // ----------------------
  const createOrder = async () => {
    if (new Decimal(amountTo).lte(0)) return;

    try {
      const body = {
        destinationAddress,
        destinationAddressMemo:
          destinationAddressMemo?.trim() !== "" ? destinationAddressMemo : null,

        claimedIncomingAmount: new Decimal(amountFrom).toString(),
        claimedPublicRate: new Decimal(amountTo).toString(),

        currencyFrom: {
          currencyCode: selectedFrom.currencyCode,
          chain: selectedFrom.chain,
        },

        currencyTo: {
          currencyCode: selectedTo.currencyCode,
          chain: selectedTo.chain,
        },

        type: orderType,
      };

      const data = await Api.post<any>("/orders/create", body);

      if (data?.orderId) {
        created = true;
        depositAddress = data.depositAddressWithMemo;
        getOrder(data.orderId);
      }
    } catch (err) {
      console.error("Error creating order:", err);
    }
  };

  // -----------------------
  //  ORDER LOADING
  // ----------------------
  const getOrder = async (orderId?: number) => {
    orderId = orderId ?? Number(localStorage.getItem("order"));
    if (!orderId) return;

    try {
      order = await Api.get<any>(`/orders/findOne/${orderId}`);
      localStorage.setItem("order", String(order.orderId));
    } catch {}
  };

  // -----------------------
  //  FILTERS
  // ----------------------
  $: getFilteredCurrencies = () =>
    currencies?.filter(
      (c) =>
        c.currencyCode !== selectedFrom?.currencyCode &&
        pairs?.get(`${selectedFrom?.currencyCode}-${c.currencyCode}`)
    );

  $: getFilteredFromCurrencies = () =>
    currencies?.filter(
      (c) =>
        c.currencyCode !== selectedTo?.currencyCode &&
        pairs?.get(`${selectedTo?.currencyCode}-${c.currencyCode}`)
    );

  // disable button?
  $: disabled = () => false;
</script>

<div class="pt-5 d-flex flex-column align-items-center pb-5 w-100">
  {#if order}
    {#if order.deposit || order.type === "WITHDRAWAL"}
      <div class="success-card">
        <div class="icon-wrap">
          <span class="checkmark">✔</span>
        </div>

        <h2 class="title">{$t('common.exchange.transactionSuccessful')}</h2>

        <p class="subtitle">
          {$t('common.exchange.orderCompleted')}: #{order.orderId}
        </p>

        <p class="desc">
          {$t('common.exchange.viewExchanges')}
          <a href="/profile">{$t('common.exchange.profilePage')}</a> {$t('common.exchange.page')}
        </p>

        <button
          class="primary-btn mt-4"
          on:click={() => {
            localStorage.removeItem("order");
            order = null;
          }}
        >
          {$t('common.exchange.goHome')}
        </button>
      </div>
    {:else}
      <ExchangeCreatedOrder
        currency={order.currencyFrom}
        amount={order.claimedIncomingAmount.toString()}
        depositAddress={order.depositAddressWithMemo}
      />
    {/if}
  {:else if created && selectedFrom}
    <ExchangeCreatedOrder
      currency={selectedFrom}
      amount={amountFrom}
      {depositAddress}
    />
  {:else}
    <div class="w-100 bg-light rounded-lg p-4 shadow-sm">
      <div class="d-flex flex-column flex-xl-row gap-3 w-100">
        <div class="flex-grow-1">
          <div class="position-relative d-flex flex-column justify-center">
            <div class="position-absolute end-0 me-2">
              <ExchangeSelector
                currencies={selectedFromFixed
                  ? [selectedFromFixed]
                  : selectedToFixed
                    ? getFilteredFromCurrencies()
                    : currencies}
                bind:selectedCurrency={selectedFrom}
              />
            </div>
            <ExchangeInput
              inputTitle={$t('common.exchange.from')}
              bind:amount={amountFrom}
              currency={selectedFrom}
              readonly={amountFromFixed ? true : false}
            />
          </div>
          <ExchangeRate
            currencyFrom={selectedFrom?.currencyCode}
            currencyTo={selectedTo?.currencyCode}
            rate={$rate?.price}
          />
        </div>
        <div class="flex-grow-1">
          <div class="position-relative d-flex flex-column justify-center">
            <div class="position-absolute end-0 me-2">
              <ExchangeSelector
                currencies={selectedToFixed
                  ? [selectedToFixed]
                  : getFilteredCurrencies()}
                bind:selectedCurrency={selectedTo}
              />
            </div>
            <ExchangeInput
              inputTitle={$t('common.exchange.to')}
              bind:amount={amountTo}
              checkMinAmount={false}
              readonly
            />
          </div>
          <ExchangeRate
            currencyFrom={selectedTo?.currencyCode}
            currencyTo={selectedFrom?.currencyCode}
            rate={$rate?.price}
            reverse={true}
          />
        </div>
      </div>

      {#if destinationAddressFixed !== "0x0"}
        <ExchangeAddress
          bind:destinationAddress
          bind:destinationAddressMemo
          needTag={selectedTo?.needTag || false}
        />
      {/if}

      <button class="primary-btn" disabled={disabled()} on:click={createOrder}
        >{$t('common.exchange.create')}
      </button>
    </div>
  {/if}
</div>

<style>
  .success-card {
  width: 100%;
  background: #1c1c1e;
  border-radius: 18px;
  padding: 40px 28px;
  text-align: center;
  color: #e5e5e7;
  box-shadow: 0 8px 22px rgba(0,0,0,0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-wrap {
  width: 80px;
  height: 80px;
  background: #0a84ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
  box-shadow: 0 4px 14px rgba(10,132,255,0.4);
}

.checkmark {
  font-size: 38px;
  color: white;
  font-weight: bold;
}

.title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 6px;
  color: white;
}

.subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 12px;
}

.desc {
  font-size: 16px;
  margin-top: 6px;
  opacity: 0.8;
}

.desc a {
  color: #0a84ff;
  text-decoration: none;
}

.desc a:hover {
  text-decoration: underline;
}


  .primary-btn {
    width: 100%;
    padding: 14px;
    font-size: 20px;
    font-weight: 500;
    border-radius: 14px;
    background: linear-gradient(90deg, #006eff, #0095ff);
    color: white;
    border: none;
    cursor: pointer;
    transition: 0.2s;
  }

  .primary-btn:hover {
    filter: brightness(1.15);
  }

  .primary-btn:active {
    transform: scale(0.98);
  }
</style>
