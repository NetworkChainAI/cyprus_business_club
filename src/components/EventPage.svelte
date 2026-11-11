<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { t } from "$lib/i18n";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import EventHero from "./Event/EventHero.svelte";
  import EventAbout from "./Event/EventAbout.svelte";
  import EventAgenda from "./Event/EventAgenda.svelte";
  import EventSidebar from "./Event/EventSidebar.svelte";
  import EventOrganizer from "./Event/EventOrganizer.svelte";
  import EventSpeakers from "./Event/EventSpeakers.svelte";
  import EventSponsors from "./Event/EventSponsors.svelte";
  import EventMap from "./Event/EventMap.svelte";
  import EventParticipants from "./Event/EventParticipants.svelte";
  import SimilarEvents from "./Event/SimilarEvents.svelte";
  import ContextAssistant from "./ContextAssistant.svelte";
  import AskAiButton from "./AskAiButton.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;
  const event = data?.event;

  let assistantOpen = false;
</script>

<div class="page">
  <div class="container">
    <EventHero {data} />

    <div class="layout">
      <div class="main">
        <EventAbout {data} />

        <EventAgenda {data} />

        <EventSpeakers {data} />

        <EventOrganizer {data} />

        <EventMap {data} />
        <SimilarEvents {data} />
      </div>

      <div class="side">
        <AskAiButton label={$t('events.detail.askAi')} size="md" on:click={() => (assistantOpen = true)} />
        <EventSidebar {data} />
        <EventSponsors {data} />
        <EventParticipants {data} />
      </div>
    </div>
  </div>
</div>
<ContextAssistant
  bind:open={assistantOpen}
  contextKey="event"
  payload={event}
  title={$t('events.detail.aiAssistantTitle')}
/>

<style>
  .page {
    background: rgb(248 250 252);
    padding: 22px 0 56px;
  }

  .container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 18px;
  }

  .layout {
    margin-top: 18px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 340px;
    gap: 18px;
    align-items: start;
  }

  .main {
    display: flex;
    flex-direction: column;
    gap: 18px;
    min-width: 0;
  }

  .side {
    display: flex;
    flex-direction: column;
    gap: 18px;
    position: sticky;
    top: 82px;
    min-width: 0;
  }

  @media (max-width: 980px) {
    .layout {
      grid-template-columns: 1fr;
    }

    .side {
      position: static;
    }
  }
</style>
