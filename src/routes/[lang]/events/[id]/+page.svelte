<script lang="ts">
  import Event from "$components/EventPage.svelte";
  import { page } from "$app/stores";
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";

  export let data;

  let paymentNotice: "success" | "cancel" | null = null;

  onMount(() => {
    const p = $page.url.searchParams.get("payment");
    if (p === "success") {
      paymentNotice = "success";
      // Clean URL without reloading
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      history.replaceState({}, "", url.toString());
    } else if (p === "cancel") {
      paymentNotice = "cancel";
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      history.replaceState({}, "", url.toString());
    }
  });
</script>

{#if paymentNotice === "success"}
  <div class="notice success">
    <iconify-icon icon="lucide:check-circle" width="18"></iconify-icon>
    {$t('admin.eventDetail.paymentSuccess')}
    <button class="notice-close" on:click={() => (paymentNotice = null)}>
      <iconify-icon icon="lucide:x" width="14"></iconify-icon>
    </button>
  </div>
{:else if paymentNotice === "cancel"}
  <div class="notice cancel">
    <iconify-icon icon="lucide:info" width="18"></iconify-icon>
    {$t('admin.eventDetail.paymentCancelled')}
    <button class="notice-close" on:click={() => (paymentNotice = null)}>
      <iconify-icon icon="lucide:x" width="14"></iconify-icon>
    </button>
  </div>
{/if}

<Event {data} />

<style>
  .notice {
    max-width: 1280px;
    margin: 16px auto 0;
    padding: 12px 18px;
    border-radius: 14px;
    font-weight: 800;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .notice.success {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #065f46;
  }

  .notice.cancel {
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #9a3412;
  }

  .notice-close {
    margin-left: auto;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.6;
    display: grid;
    place-items: center;
  }

  .notice-close:hover {
    opacity: 1;
  }
</style>
