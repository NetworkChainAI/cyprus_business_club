<script lang="ts">
  import { browser } from '$app/environment';
  import { locale, t } from '$lib/i18n';
  import { pageHasAssistant } from '$lib/stores/assistant';
  import ContextAssistant from '$components/ContextAssistant.svelte';

  export let data: { lang: string };

  // Sync locale store with URL lang param on every navigation/render.
  // This is the single source of truth — the URL always wins.
  $: if (browser) locale.set(data.lang);
</script>

<slot />

{#if !$pageHasAssistant}
  <ContextAssistant contextKey="global" title={$t('common.aiAssistant') ?? 'AI Assistant'} />
{/if}
