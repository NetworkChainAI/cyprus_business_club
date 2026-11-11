<script lang="ts">
  import { goto } from "$app/navigation";
  import { withLang } from "$lib/utils/withLang";
  import { onMount } from "svelte";
  onMount(() => goto(withLang("/admin/events"), { replaceState: true }));
</script>
