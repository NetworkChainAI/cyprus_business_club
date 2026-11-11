<script lang="ts">
  import ProfileHeader from "./Profile/ProfileHeader.svelte";
  import ProfileTabs from "./Profile/ProfileTabs.svelte";
  import ProfileSidebar from "./Profile/ProfileSidebar.svelte";

  import TicketsTab from "./Profile/Tabs/TicketsTab.svelte";
  import MeetingsTab from "./Profile/Tabs/MeetingsTab.svelte";
  import AboutTab from "./Profile/Tabs/AboutTab.svelte";
  import InterestsTab from "./Profile/Tabs/InterestsTab.svelte";
  import EventsTab from "./Profile/Tabs/EventsTab.svelte";
  import FollowersTab from "./Profile/Tabs/FollowersTab.svelte";
  import FollowingTab from "./Profile/Tabs/FollowingTab.svelte";

  export let data: any;

  let tab:
    | "tickets"
    | "meetings"
    | "about"
    | "interests"
    | "events"
    | "followers"
    | "following" = "tickets";
</script>

<section class="page">
  <div class="container">
    <ProfileHeader {data} />

    <ProfileTabs bind:tab />

    <div class="layout">
      <div class="main">
        {#if tab === "tickets"}
          <TicketsTab {data} />
        {:else if tab === "meetings"}
          <MeetingsTab />
        {:else if tab === "about"}
          <AboutTab {data} />
        {:else if tab === "interests"}
          <InterestsTab {data} />
        {:else if tab === "events"}
          <EventsTab {data} />
        {:else if tab === "followers"}
          <FollowersTab {data} />
        {:else if tab === "following"}
          <FollowingTab {data} />
        {/if}
      </div>

      <div class="side">
        <ProfileSidebar {data} />
      </div>
    </div>
  </div>
</section>

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  .layout {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 16px;
    align-items: start;
  }

  .main,
  .side {
    min-width: 0;
  }

  .side {
    position: sticky;
    top: 82px;
    display: flex;
    flex-direction: column;
    gap: 16px;
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
