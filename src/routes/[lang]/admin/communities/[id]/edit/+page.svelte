<script lang="ts">
  import CommunityCreate from "$components/communityCreate/CommunityCreate.svelte";
  export let data;
</script>

<CommunityCreate editCommunity={data.editCommunity} />
