<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;
  const event = data?.event;
</script>

<section class="card">
  <div class="head">{$t('events.detail.about')}</div>
  <div class="text">{event?.description}</div>
</section>

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    min-width: 0;
  }
  .head {
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 10px;
  }
  .text {
    color: #475569;
    line-height: 1.6;
    font-weight: 600;
    font-size: 14px;
  }
</style>
