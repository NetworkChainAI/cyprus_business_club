<script lang="ts">
  import { t } from "$lib/i18n";

  export let tab:
    | "tickets"
    | "meetings"
    | "about"
    | "interests"
    | "companies"
    | "events"
    | "followers"
    | "following";
</script>

<div class="tabs">
  <button class:active={tab === "tickets"} on:click={() => (tab = "tickets")}>{$t('profile.tabs.tickets')}</button>
  <button class:active={tab === "meetings"} on:click={() => (tab = "meetings")}>{$t('profile.tabs.meetings')}</button>
  <button class:active={tab === "about"} on:click={() => (tab = "about")}>{$t('profile.tabs.about')}</button>
  <button class:active={tab === "interests"} on:click={() => (tab = "interests")}>{$t('profile.tabs.interests')}</button>
  <button class:active={tab === "companies"} on:click={() => (tab = "companies")}>{$t('profile.tabs.companies')}</button>
  <button class:active={tab === "events"} on:click={() => (tab = "events")}>{$t('profile.tabs.events')}</button>
  <button class:active={tab === "followers"} on:click={() => (tab = "followers")}>{$t('profile.tabs.followers')}</button>
  <button class:active={tab === "following"} on:click={() => (tab = "following")}>{$t('profile.tabs.following')}</button>
</div>

<style>
  .tabs {
    margin-top: 16px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .tabs button {
    height: 38px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.15s;
  }

  .tabs button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .tabs button.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }
</style>
