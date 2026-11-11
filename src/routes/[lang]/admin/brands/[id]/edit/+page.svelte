<script lang="ts">
  import BrandCreate from "$components/brandCreate/BrandCreate.svelte";
  export let data;
</script>

<BrandCreate editBrand={data.editBrand} />
