<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { pageHasAssistant } from '$lib/stores/assistant';

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));
</script>

<slot />
