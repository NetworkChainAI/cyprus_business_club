<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;
  const interests = data?.member?.interests ?? [];
</script>

<div class="card">
  <div class="head">
    <iconify-icon icon="lucide:heart" width="18"></iconify-icon>
    <span>{$t('admin.memberDetail.interests')}</span>
    <span class="count">{interests.length}</span>
  </div>

  {#if interests.length === 0}
    <div class="empty">
      <iconify-icon icon="lucide:heart-off" width="28"></iconify-icon>
      <div class="empty-text">{$t('admin.memberDetail.noInterestsYet')}</div>
    </div>
  {:else}
    <div class="chips">
      {#each interests as i (i.id)}
        <span class="chip">{i.name}</span>
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
    margin-bottom: 14px;
  }

  .head :global(iconify-icon) { color: #4f46e5; }

  .count {
    margin-left: auto;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 800;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 8px;
  }

  .empty {
    min-height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: #94a3b8;
  }

  .empty :global(iconify-icon) { color: #cbd5e1; }
  .empty-text { font-weight: 800; font-size: 14px; color: #94a3b8; }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; }

  .chip {
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid #c7d2fe;
    background: #eef2ff;
    font-weight: 700;
    color: #4f46e5;
    font-size: 13px;
  }
</style>
