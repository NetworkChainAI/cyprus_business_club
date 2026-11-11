<script lang="ts">
  import Communities from "$components/Communities.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<Communities {data} />
