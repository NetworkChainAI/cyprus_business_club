<script lang="ts">
  import Events from "$components/events.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<Events {data} />
