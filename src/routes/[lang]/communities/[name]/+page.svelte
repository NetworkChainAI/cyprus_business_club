<script lang="ts">
  import CommunityPage from "$components/CommunityPage.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
</script>

<CommunityPage {data} />
