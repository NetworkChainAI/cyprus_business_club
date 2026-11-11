<script lang="ts">
  import { t } from "$lib/i18n";
  import { createQuery } from "@tanstack/svelte-query";
  import { Api } from "$lib/api";
  import DataLoader from "../Exchange/DataLoader.svelte";
  import ExchangeFormVariable from "./ExchangeFormVariable.svelte";
  import { onMount } from "svelte";

  const QUERY_PREFIX: string = "ExchangeCurrencies";

  let currencies: any[];
  let pairs: Map<string, boolean> = new Map();
  export let type: string;
  export let amount: string = "";
  export let currencyCodeChain: string;
  export let address: string = "0xad98403fe174a46e3e4d0793af579c23b666efed";
  
  let currencyCode: string;
  let chain: string;

  onMount(() => {
    const [code, ch] = currencyCodeChain.split("-");
    currencyCode = code;
    chain = ch;
  });

  $: getCurrenciesQuery = createQuery(() => ({
    queryKey: [`${QUERY_PREFIX}.getActive`],
    queryFn: getCurrencies,
    retry: false,
  }));

  const getCurrencies = async () => {
    const data = await Api.get<any[]>("/currencies/getActive");

    await getPairs();

    currencies = currencies ?? data;
    return data;
  };

  const getPairs = async () => {
    const data = await Api.get<any[]>("/pairs/getActive");

    data.forEach((pair) => {
      pairs.set(pair.pairCode, true);
      pairs.set(pair.pairCode.split("-").reverse().join("-"), true);
    });

    return data;
  };
</script>

<div class="xl:pt-7 flex flex-col items-center xl:pb-20">
  <DataLoader data={getCurrenciesQuery} checkEmpty source="Currencies">
    <div
      class="w-full max-w-lg xl:max-w-[928px] p-[25px] xl:bg-neutral-600 xl:bg-opacity-50 xl:rounded-xl xl:backdrop-blur-sm"
      slot="data"
    >
      {#if currencies && pairs}
        {#if type === "DEPOSIT"}
          <ExchangeFormVariable
            {currencies}
            {pairs}
            amountToFixed={amount}
            selectedToFixed={currencies.find(
              (c) => c.currencyCode === currencyCode && c.chain === chain
            )}
            destinationAddressFixed="0x0"
            orderType={type}
          />
        {:else}
          <ExchangeFormVariable
            {currencies}
            {pairs}
            selectedFromFixed={currencies.find(
              (c) => c.currencyCode === currencyCode && c.chain === chain
            )}
            orderType={type}
            destinationAddressFixed={address}
          />
        {/if}
      {/if}
    </div>
  </DataLoader>
</div>

<style>
  .xl\:pt-7 {
    padding-top: 1.75rem;
  }
  .xl\:pb-20 {
    padding-bottom: 5rem;
  }
  .flex {
    display: flex;
  }
  .flex-col {
    flex-direction: column;
  }
  .items-center {
    align-items: center;
  }
  .w-full {
    width: 100%;
  }
  .max-w-lg {
    max-width: 32rem;
  }
  .xl\:max-w-\[928px\] {
    max-width: 928px;
  }
  .p-\[25px\] {
    padding: 25px;
  }
  .xl\:bg-neutral-600 {
    background-color: #1c1c1c; /* Adjust this color to match your theme */
  }
  .xl\:bg-opacity-50 {
    background-opacity: 0.5;
  }
  .xl\:rounded-xl {
    border-radius: 1rem;
  }
  .xl\:backdrop-blur-sm {
    backdrop-filter: blur(4px);
  }
</style>
