<script lang="ts">
  import CreateEvent from "$components/admin/createEvent.svelte";
  export let data;
</script>

<CreateEvent
  ownedBrands={data.ownedBrands}
  ownedCommunities={data.ownedCommunities}
  serverCategories={data.categories}
/>
