<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { t } from "$lib/i18n";
  const dispatch = createEventDispatcher();

  export let label = "";
  export let size: "sm" | "md" = "sm";
  $: displayLabel = label || $t('common.ai.askAi');
</script>

<button class="ask-ai" class:md={size === "md"} on:click={() => dispatch("click")}>
  <iconify-icon icon="lucide:sparkles" width={size === "md" ? "18" : "15"}></iconify-icon>
  {displayLabel}
</button>

<style>
  .ask-ai {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%);
    border: none;
    border-radius: 12px;
    padding: 10px 18px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .ask-ai:hover {
    filter: brightness(1.08);
  }

  .ask-ai:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .ask-ai.md {
    font-size: 14px;
    padding: 12px 22px;
    gap: 8px;
  }
</style>
