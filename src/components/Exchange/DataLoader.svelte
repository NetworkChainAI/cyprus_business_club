<script lang="ts">
  import { t } from "$lib/i18n";
  import type { CreateQueryResult } from "@tanstack/svelte-query";

  /**
   * Проверка на пустоту данных
   */
  const isNotEmptyData = (data: unknown) => {
    if (data === null || data === undefined) return false;

    if (typeof data === "string" && data.trim() === "") return false;

    if (Array.isArray(data) && data.length === 0) return false;

    return true;
  };

  export let data: CreateQueryResult;
  export let checkEmpty: boolean = false;
  export let source: string = "";
</script>

{#if data.isLoading}
  <!-- LOADING -->
  <div class="spinner-center-box">
    <div class="spinner-center">
      <div role="status">
        <svg
          aria-hidden="true"
          class="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 
              100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 
              50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 
              97.0079 33.5539C95.2932 28.8227 92.871 24.3692 
              89.8167 20.348C85.8452 15.1192 80.8826 10.7238 
              75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 
              56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 
              41.7345 1.27873C39.2613 1.69328 37.813 
              4.19778 38.4501 6.62326C39.0873 9.04874 
              41.5694 10.4717 44.0505 10.1071C47.8511 
              9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 
              10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 
              17.9648 79.3347 21.5619 82.5849 25.841C84.9175 
              28.9121 86.7997 32.2913 88.1811 35.8758C89.083 
              38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="currentFill"
          />
        </svg>
        <span class="sr-only">{$t('common.exchange.loading')}</span>
      </div>
    </div>
  </div>
{:else if data.isError}
  <!-- ERROR -->
  <aside class="alert variant-ghost">
    <div class="alert-message">
      <h3 class="h3 text-slate-400">{source}</h3>
      <p class="text-slate-200">
        {#if data.error instanceof Error}
          {data.error.message}
        {:else}
          {$t('common.exchange.error')}
        {/if}
      </p>
    </div>
  </aside>
{:else if checkEmpty && !isNotEmptyData(data.data)}
  <!-- EMPTY -->
  <div class="alert variant-ghost">
    <div class="alert-message">
      <h3 class="h3 text-slate-400">{source}</h3>
      <p class="text-slate-200">{$t('common.exchange.empty')}</p>
    </div>
  </div>
{:else}
  <!-- SUCCESS -->
  <slot name="data" />
{/if}

<style>
  .spinner-center-box {
    position: relative;
    padding: 2rem;
  }
  .spinner-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(0, -50%);
  }
</style>
