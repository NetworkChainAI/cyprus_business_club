<script lang="ts">
  import { loadTranslations } from "$lib/i18n";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";

  const localeNames: Record<string, string> = {
    en: "EN",
    ru: "RU",
  };

  let open = false;
  let switching = false;

  $: strippedPath = $page.url.pathname.replace(/^\/[a-z]{2}(\/|$)/, '/') || '/';
  $: currentLang = $page.params.lang ?? 'en';

  async function switchTo(loc: string) {
    open = false;
    if (currentLang === loc || switching) return;
    switching = true;
    try {
      const search = $page.url.search;
      await loadTranslations(loc, strippedPath);
      await goto(`/${loc}${strippedPath === '/' ? '' : strippedPath}` + search, {
        invalidateAll: true,
        noScroll: true,
      });
    } finally {
      switching = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') open = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
{#if open}
  <div class="backdrop" on:click={() => (open = false)}></div>
{/if}

<div class="dropdown" class:open>
  <button
    class="trigger"
    on:click={() => (open = !open)}
    aria-haspopup="listbox"
    aria-expanded={open}
  >
    <iconify-icon icon="lucide:globe" width="14" height="14"></iconify-icon>
    {localeNames[currentLang] ?? currentLang.toUpperCase()}
    <iconify-icon icon="lucide:chevron-down" width="12" height="12" class="chevron"></iconify-icon>
  </button>

  {#if open}
    <ul class="menu" role="listbox">
      {#each Object.entries(localeNames) as [code, label]}
        <li
          class="item"
          class:active={currentLang === code}
          role="option"
          aria-selected={currentLang === code}
          on:click={() => switchTo(code)}
          on:keydown={(e) => e.key === 'Enter' && switchTo(code)}
          tabindex="0"
        >
          {label}
          {#if currentLang === code}
            <iconify-icon icon="lucide:check" width="12" height="12"></iconify-icon>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 99;
  }

  .dropdown {
    position: relative;
    z-index: 100;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 34px;
    padding: 0 10px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #fff;
    color: #64748b;
    font-weight: 800;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .trigger:hover {
    background: #f8fafc;
    color: #0f172a;
    border-color: #cbd5e1;
  }

  .dropdown.open .trigger {
    background: rgba(79, 70, 229, 0.06);
    color: #4f46e5;
    border-color: rgba(79, 70, 229, 0.3);
  }

  .chevron {
    transition: transform 0.15s;
  }

  .dropdown.open .chevron {
    transform: rotate(180deg);
  }

  .menu {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 100px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    list-style: none;
    margin: 0;
    padding: 4px;
    overflow: hidden;
  }

  .item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    cursor: pointer;
    transition: all 0.12s;
  }

  .item:hover {
    background: #f8fafc;
    color: #0f172a;
  }

  .item.active {
    color: #4f46e5;
    background: rgba(79, 70, 229, 0.06);
  }

  .item :global(iconify-icon) {
    color: #4f46e5;
    flex-shrink: 0;
  }
</style>
