<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { t } from "$lib/i18n";

  export let data: any;

  $: categories = data?.allCategories ?? [];

  let newName = "";
  let creating = false;
  let createError = "";
  let deleting: Record<string, boolean> = {};
  let deleteError = "";

  async function addCategory() {
    const name = newName.trim();
    if (!name) return;
    creating = true;
    createError = "";

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        newName = "";
        await invalidateAll();
      } else if (res.status === 409) {
        createError = $t('admin.categories.alreadyExists');
      } else {
        createError = $t('admin.categories.createError');
      }
    } catch {
      createError = $t('admin.categories.networkError');
    } finally {
      creating = false;
    }
  }

  async function deleteCategory(id: string) {
    if (deleting[id]) return;
    deleting[id] = true;
    deleteError = "";

    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });

      if (res.ok) {
        await invalidateAll();
      } else {
        const data = await res.json().catch(() => ({}));
        deleteError = data.error ?? $t('admin.categories.deleteError');
      }
    } catch {
      deleteError = $t('admin.categories.networkError');
    } finally {
      deleting[id] = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") addCategory();
  }
</script>

<div class="categories-admin">
  <div class="section-header">
    <h2>{$t('admin.categories.title')}</h2>
    <span class="count">{categories.length} {$t('admin.categories.total')}</span>
  </div>

  <!-- Add form -->
  <div class="add-row">
    <input
      type="text"
      bind:value={newName}
      placeholder={$t('admin.categories.placeholder')}
      on:keydown={handleKeydown}
      disabled={creating}
    />
    <button class="add-btn" disabled={creating || !newName.trim()} on:click={addCategory}>
      {#if creating}
        <iconify-icon icon="lucide:loader-2" width="16" class="spin"></iconify-icon>
      {:else}
        <iconify-icon icon="lucide:plus" width="16"></iconify-icon>
      {/if}
      {$t('admin.categories.add')}
    </button>
  </div>

  {#if createError}
    <div class="error-msg">{createError}</div>
  {/if}
  {#if deleteError}
    <div class="error-msg">{deleteError}</div>
  {/if}

  <!-- List -->
  {#if categories.length === 0}
    <div class="empty">
      <iconify-icon icon="lucide:tags" width="36"></iconify-icon>
      <p>{$t('admin.categories.noCategories')}</p>
    </div>
  {:else}
    <div class="cat-list">
      {#each categories as cat (cat.id)}
        <div class="cat-row">
          <div class="cat-name">
            <iconify-icon icon="lucide:tag" width="14"></iconify-icon>
            {cat.name}
          </div>
          <div class="cat-stats">
            <span class="cat-badge">{cat.eventsCount} {$t('admin.categories.events')}</span>
            <span class="cat-badge">{cat.brandsCount} {$t('admin.categories.brands')}</span>
          </div>
          <button
            class="delete-btn"
            disabled={deleting[cat.id] || cat.eventsCount > 0 || cat.brandsCount > 0}
            title={cat.eventsCount > 0 || cat.brandsCount > 0 ? $t('admin.categories.cannotDelete') : $t('admin.categories.deleteTitle')}
            on:click={() => deleteCategory(cat.id)}
          >
            <iconify-icon icon="lucide:trash-2" width="14"></iconify-icon>
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .categories-admin { }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .section-header h2 {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }
  .count {
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
  }

  .add-row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .add-row input {
    flex: 1;
    height: 42px;
    padding: 0 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 0.15s;
  }
  .add-row input:focus { border-color: #4f46e5; }
  .add-row input::placeholder { color: #94a3b8; }

  .add-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    padding: 0 18px;
    border-radius: 12px;
    border: none;
    background: #4f46e5;
    color: #fff;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .add-btn:hover { background: #4338ca; }
  .add-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .error-msg {
    margin-bottom: 12px;
    padding: 8px 14px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
    font-weight: 700;
    font-size: 13px;
  }

  .empty {
    text-align: center;
    padding: 40px 20px;
    color: #94a3b8;
  }
  .empty p { font-weight: 700; margin-top: 10px; }

  .cat-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cat-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  .cat-name {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  .cat-stats {
    display: flex;
    gap: 6px;
  }

  .cat-badge {
    padding: 3px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #64748b;
    font-weight: 700;
    font-size: 11px;
    white-space: nowrap;
  }

  .delete-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #ef4444;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.15s;
  }
  .delete-btn:hover { background: rgba(239, 68, 68, 0.06); border-color: #ef4444; }
  .delete-btn:disabled { opacity: 0.3; cursor: not-allowed; color: #94a3b8; }
  .delete-btn:disabled:hover { background: #fff; border-color: #e2e8f0; }

  :global(.spin) {
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
