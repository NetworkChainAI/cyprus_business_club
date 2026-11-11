<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;
  const member = data?.member;
</script>

<div class="card">
  <div class="head">
    <iconify-icon icon="lucide:user" width="18"></iconify-icon>
    <span>{$t('admin.memberDetail.about')}</span>
  </div>

  <div class="bio">
    {#if member?.info?.bio}
      {member.info.bio}
    {:else}
      <span class="muted">{$t('admin.memberDetail.noBio')}</span>
    {/if}
  </div>

  {#if member?.info?.location}
    <div class="info-row">
      <iconify-icon icon="lucide:map-pin" width="15"></iconify-icon>
      <span class="info-label">{$t('admin.memberDetail.location')}</span>
      <span class="info-value">{member.info.location}</span>
    </div>
  {/if}

  {#if member?.info?.dateOfBirth}
    <div class="info-row">
      <iconify-icon icon="lucide:cake" width="15"></iconify-icon>
      <span class="info-label">{$t('admin.memberDetail.birthday')}</span>
      <span class="info-value">
        {new Date(member.info.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      </span>
    </div>
  {/if}

  <div class="info-row">
    <iconify-icon icon="lucide:calendar" width="15"></iconify-icon>
    <span class="info-label">{$t('admin.memberDetail.joined')}</span>
    <span class="info-value">
      {new Date(member?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
    </span>
  </div>

  <div class="info-row">
    <iconify-icon icon="lucide:mail" width="15"></iconify-icon>
    <span class="info-label">{$t('admin.memberDetail.email')}</span>
    <span class="info-value">{member?.email}</span>
  </div>
</div>

{#if member?.interests?.length > 0}
  <div class="card" style="margin-top: 14px;">
    <div class="head">
      <iconify-icon icon="lucide:heart" width="18"></iconify-icon>
      <span>{$t('admin.memberDetail.interests')}</span>
      <span class="count">{member.interests.length}</span>
    </div>
    <div class="chips">
      {#each member.interests as i (i.id)}
        <span class="chip">{i.name}</span>
      {/each}
    </div>
  </div>
{/if}

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

  .bio {
    color: #334155;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;
    margin-bottom: 16px;
  }

  .muted { color: #94a3b8; }

  .info-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0;
    border-top: 1px solid #f1f5f9;
  }

  .info-row :global(iconify-icon) { color: #94a3b8; flex-shrink: 0; }

  .info-label {
    font-weight: 800;
    font-size: 13px;
    color: #64748b;
    min-width: 80px;
  }

  .info-value {
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
  }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; }

  .chip {
    padding: 6px 14px;
    border-radius: 10px;
    border: 1px solid #c7d2fe;
    background: #eef2ff;
    font-weight: 700;
    color: #4f46e5;
    font-size: 13px;
  }
</style>
