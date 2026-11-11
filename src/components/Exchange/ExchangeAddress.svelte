<script lang="ts">
  import { t } from "$lib/i18n";

  export let destinationAddress: string;
  export let destinationAddressMemo: string;
  export let needTag: boolean = false;

  let showMemoTip: boolean = false;

  $: checkValidAddress = () => {
    try {
      return true;
    } catch (err: any) {
      return true;
    }
  };
</script>

<div class="flex flex-col xl:flex-row xl:space-x-6">
  <div class="grow mb-4 xl:mb-0">
    <div class="relative flex flex-col justify-center">
      <label
        for="destinationAddress"
        class="absolute top-5 left-6 text-[11px] xl:text-base text-neutral-400"
        >{$t('common.exchange.address')}</label
      >
      <input
        id="destinationAddress"
        class={`leading-relaxed bg-neutral-700 xl:bg-white w-full pt-10 xl:pt-12 pb-4 xl:pb-5 pl-4 xl:pl-6 pr-16 rounded-xl text-xl xl:text-2xl ${
          !checkValidAddress()
            ? 'outline-rose-600 text-rose-600'
            : 'text-white xl:text-indigo-950'
        }`}
        bind:value={destinationAddress}
      />
    </div>
  </div>

  {#if needTag}
    <div class="grow xl:max-w-[10rem] mb-4 xl:mb-0">
      <div class="relative flex flex-col justify-center">
        <label
          for="memo"
          class="absolute top-5 left-6 text-[11px] xl:text-base text-neutral-400 flex items-center space-x-2"
        >
          <div>{$t('common.exchange.memo')}</div>

          <div
            class="w-4 h-4 bg-neutral-400 rounded-full justify-center items-center flex relative"
          >
            <div
              class="text-white text-[9px]"
              role="tooltip"
              on:mouseover={() => (showMemoTip = true)}
              on:mouseout={() => (showMemoTip = false)}
              on:focus={() => (showMemoTip = true)}
              on:blur={() => (showMemoTip = false)}
            >
              ?
            </div>
            {#if showMemoTip}
              <div class="absolute top-0 -translate-y-full -mt-2">
                <div class="px-4 py-2 bg-zinc-600 bg-opacity-60 rounded-[11px]">
                  <div class="text-white text-[13px]">{$t('common.exchange.ifExist')}</div>
                  <svg
                    class="w-3 h-auto absolute bottom-0 translate-y-full left-1/2 -translate-x-1/2 text-zinc-600 text-opacity-60 -mt-px"
                    viewBox="0 0 12 6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M6 6L0 0L12 0L6 6Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
            {/if}
          </div>
        </label>
        <input
          class={`leading-relaxed bg-neutral-700 xl:bg-white w-full pt-10 xl:pt-12 pb-4 xl:pb-5 px-4 xl:px-6 rounded-xl text-white xl:text-indigo-950 text-xl xl:text-2xl`}
          bind:value={destinationAddressMemo}
        />
      </div>
    </div>
  {/if}
</div>
