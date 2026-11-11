<script lang="ts">
  import { t } from "$lib/i18n";

  export let data: any;
  const user = data?.user;
</script>

<div class="card">
  <div class="title">{$t('profile.about.title')}</div>
  <div class="text">{user?.info?.bio ?? $t('profile.about.noBio')}</div>

  <div class="section">
    <div class="label">{$t('profile.about.privacy')}</div>
    <div class="pill">{user?.settings?.isPrivate ? $t('profile.about.privateProfile') : $t('profile.about.publicProfile')}</div>
  </div>

  <div class="section">
    <div class="label">{$t('profile.about.emailNotifications')}</div>
    <div class="pill">{user?.settings?.emailSend ? $t('profile.about.enabled') : $t('profile.about.disabled')}</div>
  </div>

  <div class="section">
    <div class="label">{$t('profile.about.chatBotNotifications')}</div>
    <div class="pill">{user?.settings?.chatBotSend ? $t('profile.about.enabled') : $t('profile.about.disabled')}</div>
  </div>
</div>

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
  }
  .title {
    font-weight: 900;
    color: #0f172a;
    font-size: 22px;
    margin-bottom: 10px;
  }
  .text {
    color: #334155;
    font-weight: 700;
  }
  .section {
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-top: 1px solid #eef2f7;
    padding-top: 14px;
  }
  .label {
    color: #64748b;
    font-weight: 900;
  }
  .pill {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 8px 12px;
    font-weight: 900;
    color: #0f172a;
    font-size: 12px;
  }
</style>
