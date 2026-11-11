<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;

  type Category = { id: string; name: string };

  const allCategories: Category[] = data?.allCategories ?? [];
  let selectedIds: Set<string> = new Set(
    (data?.user?.interests ?? []).map((i: Category) => i.id)
  );

  let savingId: string | null = null;

  async function toggle(id: string) {
    const wasSelected = selectedIds.has(id);

    if (wasSelected) {
      selectedIds.delete(id);
    } else {
      selectedIds.add(id);
    }
    selectedIds = new Set(selectedIds);

    savingId = id;
    try {
      const formData = new FormData();
      formData.append("categoryIds", JSON.stringify([...selectedIds]));
      await fetch("/api/user/profile", {
        method: "POST",
        body: formData,
      });
    } catch (err) {
      console.error("Failed to save interest:", err);
      // revert on error
      if (wasSelected) {
        selectedIds.add(id);
      } else {
        selectedIds.delete(id);
      }
      selectedIds = new Set(selectedIds);
    } finally {
      savingId = null;
    }
  }
</script>

<div class="card">
  <div class="head">
    <iconify-icon icon="lucide:heart" width="18"></iconify-icon>
    <span>{$t('profile.tabs.interests')}</span>
    <span class="count">{selectedIds.size}</span>
  </div>

  <div class="hint">{$t('profile.interests.hint')}</div>

  {#if allCategories.length === 0}
    <div class="muted">{$t('profile.interests.noCategories')}</div>
  {:else}
    <div class="chips">
      {#each allCategories as cat (cat.id)}
        <button
          class="chip"
          class:selected={selectedIds.has(cat.id)}
          class:saving={savingId === cat.id}
          on:click={() => toggle(cat.id)}
          disabled={savingId !== null}
        >
          {#if savingId === cat.id}
            <iconify-icon icon="lucide:loader-2" width="13" class="spin"></iconify-icon>
          {:else if selectedIds.has(cat.id)}
            <iconify-icon icon="lucide:check" width="13"></iconify-icon>
          {:else}
            <iconify-icon icon="lucide:plus" width="13"></iconify-icon>
          {/if}
          {cat.name}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 22px;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
    margin-bottom: 6px;
  }

  .head :global(iconify-icon) {
    color: #4f46e5;
  }

  .count {
    margin-left: auto;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 800;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 8px;
  }

  .hint {
    color: #94a3b8;
    font-weight: 600;
    font-size: 13px;
    margin-bottom: 16px;
  }

  .muted {
    color: #94a3b8;
    font-weight: 800;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    font-weight: 700;
    color: #64748b;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .chip :global(iconify-icon) {
    color: #94a3b8;
    transition: color 0.15s;
  }

  .chip:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .chip.selected {
    background: #eef2ff;
    border-color: #c7d2fe;
    color: #4f46e5;
  }

  .chip.selected :global(iconify-icon) {
    color: #4f46e5;
  }

  .chip.saving {
    opacity: 0.7;
  }

  .chip:disabled {
    cursor: default;
  }

  .chip :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
