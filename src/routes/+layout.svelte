<script lang="ts">
  import { onMount } from "svelte";
  import Header from "../components/Header.svelte";
  import Footer from "../components/Footer.svelte";
  import { page } from "$app/stores";
  import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";
  const queryClient = new QueryClient();

  $: strippedPath = $page.url.pathname.replace(/^\/[a-z]{2}(\/|$)/, "/") || "/";
  $: isChatRoute = strippedPath.startsWith("/chat");

  onMount(() => {
    function ping() {
      if (document.visibilityState === "visible") {
        fetch("/api/user/online", { method: "POST" }).catch(() => {});
      }
    }

    ping(); // immediate on load

    const interval = setInterval(ping, 30000);

    // Re-ping when user switches back to this tab
    document.addEventListener("visibilitychange", ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", ping);
    };
  });
</script>

<div class="layout-wrapper">
  <Header />

  <QueryClientProvider client={queryClient}>
    <main class="app-main">
      <slot />
    </main>
  </QueryClientProvider>

  {#if !isChatRoute}
    <Footer />
  {/if}
</div>

<style>
  .layout-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  main.app-main {
    flex: 1;
    position: relative;
    overflow-x: clip;
  }
</style>
