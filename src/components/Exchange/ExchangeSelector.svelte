<!-- <script lang="ts">
	export let currencies: any[];
	export let selectedCurrency: any | null = currencies?.length > 0 ? currencies[0] : null;

	let search: string = '';
	let opened: boolean = false;

	$: if (selectedCurrency && currencies?.length && !currencies.includes(selectedCurrency)) {
		selectedCurrency = currencies?.length > 0 ? currencies[0] : null;
	}

	$: if (selectedCurrency === null) {
		selectedCurrency = currencies?.length > 0 ? currencies[0] : null;
	}

	$: filteredCurrencies = currencies
		?.filter(
			(c) =>
				search === '' ||
				c.currencyCode.toLowerCase().includes(search.toLowerCase()) ||
				c.currencyName.toLowerCase().includes(search.toLowerCase()) ||
				c.chain.toLowerCase().includes(search.toLowerCase())
		)
		.sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));
</script>

<div class="relative flex flex-col items-center">
	{#if currencies}
		<div class="absolute px-3 bg-neutral-500 bg-opacity-60 rounded-[11px] -top-3 z-10">
			<div class="text-white text-[11px] uppercase maxText">
				{selectedCurrency?.chain}
			</div>
		</div>
		<button
			class="px-2 py-2.5 bg-neutral-600 xl:bg-zinc-100 rounded-[11px] cursor-pointer"
			on:click={(e) => (opened = !opened)}
		>
			<div class="items-center gap-1.5 flex">
				<img width={20} height={20} alt="" src={selectedCurrency?.logoLink} class="w-5 h-5" />
				<div class="text-zinc-400 xl:text-neutral-500">
					{selectedCurrency?.currencyCode}
				</div>
			</div>
		</button>
		{#if opened}
			<div
				class="bg-zinc-100 px-3 py-4 xl:rounded-[11px] left-0 xl:left-auto top-0 xl:top-auto border w-screen xl:w-[20rem] z-50 fixed xl:absolute xl:top-12"
			>
				<input
					placeholder="search"
					class="block px-3 py-4 w-full bg-zinc-100 rounded-lg border border-black border-opacity-5 mb-4"
					bind:value={search}
				/>
				<ul class="flex-col gap-5 flex max-h-screen xl:max-h-[15rem] overflow-y-auto no-select">
					{#each filteredCurrencies as currency}
						<li>
							<a
								href="#"
								class="flex space-x-2 items-center"
								on:click={(e) => {
									e.preventDefault();
									selectedCurrency = currency;
									opened = false;
								}}
							>
								<img width={32} height={32} alt="" src={currency.logoLink} class="w-8 h-8" />
								<div class="text-zinc-800">{currency.currencyName}</div>
								<div class="text-neutral-400 text-xs">
									{currency.chain}
								</div>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{:else}
		<p>...</p>
	{/if}
</div>

<style lang="scss">
	.maxText {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 10ch;
	}
</style> -->

<script lang="ts">
  import { t } from "$lib/i18n";

  export let currencies: any[] = [];
  export let selectedCurrency: any | null = null;

  let opened = false;
  let search = "";

  $: filtered = currencies.filter(
    (c) =>
      c.currencyCode.toLowerCase().includes(search.toLowerCase()) ||
      c.currencyName.toLowerCase().includes(search.toLowerCase()) ||
      c.chain.toLowerCase().includes(search.toLowerCase())
  );
</script>

<div class="selector">
  <button class="select-btn" on:click={() => (opened = !opened)}>
    <img class="logo" src={selectedCurrency?.logoLink} alt="" />
    <div class="info">
      <span class="chain">{selectedCurrency?.chain}</span>
      <span class="code">{selectedCurrency?.currencyCode}</span>
    </div>
    <span class="arrow">⌄</span>
  </button>

  {#if opened}
    <div class="dropdown">
      <input
        type="text"
        placeholder={$t('common.exchange.searchCurrency')}
        class="search"
        bind:value={search}
      />

      <div class="list">
        {#each filtered as c}
          <div
            class="item"
            on:click={() => {
              selectedCurrency = c;
              opened = false;
            }}
          >
            <img src={c.logoLink} class="logo-small" />
            <div class="col">
              <span class="label">{c.currencyName}</span>
              <span class="chain-small">{c.chain}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .selector {
    position: relative;
  }

  .select-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    width: 100%;
    background: #2c2f36;
    color: white;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    transition: 0.2s;
  }

  .select-btn:hover {
    background: #33363d;
  }

  .logo {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }

  .info {
    display: flex;
    flex-direction: column;
    text-align: left;
  }

  .chain {
    font-size: 11px;
    color: #aaa;
  }

  .code {
    font-size: 15px;
    font-weight: 600;
  }

  .arrow {
    margin-left: auto;
    font-size: 14px;
    opacity: 0.7;
  }

  .dropdown {
    position: relative;
    display: inline-block;
    width: 100%;
    top: calc(100% + 6px);
    background: #1f2125;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 12px;
    z-index: 200;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .search {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: none;
    background: #2c2f36;
    color: white;
    margin-bottom: 12px;
  }

  .search:focus {
    outline: 2px solid #007bff;
  }

  .list {
    max-height: 260px;
    overflow-y: auto;
  }

  .item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.15s;
  }

  .item:hover {
    background: #2e3138;
  }

  .logo-small {
    width: 28px;
    height: 28px;
  }

  .label {
    font-size: 15px;
  }

  .chain-small {
    font-size: 12px;
    color: #888;
  }
</style>
