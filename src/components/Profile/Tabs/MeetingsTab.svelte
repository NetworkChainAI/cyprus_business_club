<script lang="ts">
  import { t } from "$lib/i18n";
</script>

<div class="card empty">
  <iconify-icon icon="lucide:calendar-clock" width="28"></iconify-icon>
  <div>{$t('profile.meetings.noMeetings')}</div>
</div>

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 22px;
  }
  .empty {
    min-height: 220px;
    display: grid;
    place-items: center;
    color: #94a3b8;
    font-weight: 900;
    gap: 10px;
  }
</style>
