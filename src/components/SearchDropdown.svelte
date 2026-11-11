<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { t } from "$lib/i18n";

  export let options: { id: string; name: string }[] = [];
  export let selected: string[] = [];
  export let placeholder = "";
  export let searchPlaceholder = "";
  export let multiple = true;
  export let maxItems: number | null = null;
  export let maxChips = 3;
  export let disabled = false;

  let open = false;
  let search = "";
  let wrapperRef: HTMLElement;

  const dispatch = createEventDispatcher<{
    change: { selected: string[]; items: { id: string; name: string }[] };
  }>();

  $: filteredOptions = search.trim()
    ? options.filter((o) =>
        o.name.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : options;

  $: selectedItems = options.filter((o) => selected.includes(o.id));
  $: visibleChips = selectedItems.slice(0, maxChips);
  $: hiddenCount = Math.max(0, selectedItems.length - maxChips);
  $: isMaxReached = maxItems !== null && selected.length >= maxItems;

  function toggle(id: string) {
    if (disabled) return;

    if (multiple) {
      if (selected.includes(id)) {
        selected = selected.filter((s) => s !== id);
      } else {
        if (isMaxReached) return;
        selected = [...selected, id];
      }
    } else {
      selected = selected.includes(id) ? [] : [id];
      open = false;
    }

    dispatch("change", {
      selected,
      items: options.filter((o) => selected.includes(o.id)),
    });
  }

  function handleClickOutside(e: MouseEvent) {
    if (wrapperRef && !wrapperRef.contains(e.target as Node)) {
      open = false;
    }
  }

  function toggleOpen() {
    if (disabled) return;
    open = !open;
    if (open) search = "";
  }

  onMount(() => {
    if (!browser) return;
    document.addEventListener("click", handleClickOutside);
  });

  onDestroy(() => {
    if (!browser) return;
    document.removeEventListener("click", handleClickOutside);
  });
</script>

<div class="search-dropdown" class:disabled bind:this={wrapperRef}>
  <button
    type="button"
    class="trigger"
    class:open
    on:click={toggleOpen}
    {disabled}
  >
    <div class="trigger-content">
      {#if selectedItems.length > 0}
        <div class="chips" title={selectedItems.map((x) => x.name).join(", ")}>
          {#each visibleChips as item (item.id)}
            <span class="chip">{item.name}</span>
          {/each}
          {#if hiddenCount > 0}
            <span class="chip chip-more">+{hiddenCount}</span>
          {/if}
        </div>
      {:else}
        <span class="sd-placeholder">{placeholder || $t('common.searchDropdown.select')}</span>
      {/if}
    </div>

    <svg
      class="chevron"
      class:rotated={open}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"
      />
    </svg>
  </button>

  {#if open}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="panel" on:click|stopPropagation>
      <div class="search-row">
        <input
          type="text"
          class="search-input"
          placeholder={searchPlaceholder || $t('common.searchDropdown.search')}
          bind:value={search}
          autocomplete="off"
        />
        {#if maxItems !== null}
          <span class="counter">{selected.length}/{maxItems}</span>
        {/if}
      </div>

      <div class="options-list">
        {#if filteredOptions.length === 0}
          <div class="empty">{$t('common.searchDropdown.noResults')}</div>
        {:else}
          {#each filteredOptions as option (option.id)}
            {@const isSelected = selected.includes(option.id)}
            {@const isDisabled = !isSelected && isMaxReached}

            <label
              class="option"
              class:selected={isSelected}
              class:disabled={isDisabled}
            >
              <span class="option-name">{option.name}</span>
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isDisabled}
                on:change={() => toggle(option.id)}
              />
            </label>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .search-dropdown {
    position: relative;
    width: 100%;
  }

  .search-dropdown.disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  /* Trigger Button */
  .trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #d1d5db;
    background: #f9fafb;
    border-radius: 10px;
    padding: 10px 14px;
    cursor: pointer;
    font-size: 14px;
    color: #111827;
    text-align: left;
    transition:
      border-color 0.2s,
      background 0.2s;
  }

  .trigger:hover {
    background: #f3f4f6;
  }

  .trigger.open {
    border-color: #60a5fa;
    background: #fff;
  }

  .trigger-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .placeholder {
    color: #6b7280;
  }

  .chevron {
    flex-shrink: 0;
    transition: transform 0.2s;
    color: #6b7280;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  /* Chips */
  .chips {
    display: flex;
    flex-wrap: nowrap;
    gap: 6px;
    overflow: hidden;
  }

  .chip {
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #fff;
    color: #111827;
    white-space: nowrap;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chip-more {
    background: #eef2ff;
    border-color: #c7d2fe;
    color: #1e3a8a;
  }

  /* Dropdown Panel */
  .panel {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    z-index: 100;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 10px;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.1);
  }

  .search-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .search-input {
    flex: 1;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
  }

  .search-input:focus {
    background: #fff;
    border-color: #60a5fa;
  }

  .counter {
    font-size: 12px;
    color: #6b7280;
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 999px;
    background: #fff;
  }

  /* Options List */
  .options-list {
    max-height: 220px;
    overflow-y: auto;
  }

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 8px;
    border-radius: 8px;
    cursor: pointer;
  }

  .option:hover {
    background: #f9fafb;
  }

  .option.selected {
    background: #eff6ff;
  }

  .option.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .option-name {
    flex: 1;
    font-size: 14px;
    color: #111827;
  }

  .option input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: #1e3a8a;
  }

  .empty {
    padding: 16px;
    text-align: center;
    color: #6b7280;
  }
</style>
