<script lang="ts">
  import { onMount } from "svelte";
  import UserAvatar from "./userAvatar.svelte";
  import Notifications from "./notifications.svelte";

  // ---- DROPDOWN ----
  let openDropdown: string | null = null;
  const toggleDropdown = (name: string) => {
    openDropdown = openDropdown === name ? null : name;
  };

  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest(".dropdown")) {
      openDropdown = null;
    }
  }

  // ---- BURGER ----
  let menuOpen = false;

  // ---- UNREAD CHAT ----
  let unread = 0;
  async function loadUnread() {
    try {
      const res = await fetch("/api/chat/unread");
      if (res.ok) {
        const data = await res.json();
        unread = data.unread ?? 0;
      }
    } catch (e) {
      console.error("Unread fetch error:", e);
    }
  }

  onMount(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 1000);

    // ✅ SSR-safe
    if (typeof document !== "undefined") {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== "undefined") {
        document.removeEventListener("click", handleClickOutside);
      }
    };
  });
</script>

<header>
  <div class="container">
    <a href="/" class="logo" aria-label="Go to home">
      <img src="/assets/images/cbc/logo-cbc-dark.svg" alt="Logo" />
    </a>

    <!-- BURGER -->
    <button
      class="burger"
      on:click={() => (menuOpen = !menuOpen)}
      aria-label="Toggle menu"
      aria-expanded={menuOpen}
    >
      <span class="line" class:open={menuOpen}></span>
      <span class="line" class:open={menuOpen}></span>
      <span class="line" class:open={menuOpen}></span>
    </button>

    <!-- NAVIGATION -->
    <nav class:open={menuOpen}>
      <!-- EVENTS DROPDOWN -->
      <div class="dropdown">
        <button class="trigger" on:click={() => toggleDropdown("events")}>
          Events
          <ion-icon name="chevron-down-outline"></ion-icon>
        </button>

        {#if openDropdown === "events"}
          <div class="menu">
            <a href="/events" on:click={() => (openDropdown = null)}>
              <span class="item-icon">
                <iconify-icon icon="lucide:calendar-days" width="18"
                ></iconify-icon>
              </span>
              All events
            </a>

            <div class="devider"></div>

            <a href="/calendar" on:click={() => (openDropdown = null)}>
              <span class="item-icon">
                <iconify-icon icon="lucide:calendar-check" width="18"
                ></iconify-icon>
              </span>
              Calendar
            </a>
          </div>
        {/if}
      </div>

      <!-- COMMUNITY -->
      <div class="dropdown">
        <button class="trigger" on:click={() => toggleDropdown("community")}>
          Community
          <ion-icon name="chevron-down-outline"></ion-icon>
        </button>

        {#if openDropdown === "community"}
          <div class="menu">
            <a href="/partners" on:click={() => (openDropdown = null)}>
              <span class="item-icon">
                <iconify-icon icon="lucide:handshake" width="18"></iconify-icon>
              </span>
              Partners
            </a>

            <div class="devider"></div>

            <a href="/members" on:click={() => (openDropdown = null)}>
              <span class="item-icon">
                <iconify-icon icon="lucide:users" width="18"></iconify-icon>
              </span>
              Members
            </a>

            <div class="devider"></div>

            <a href="/achievement" on:click={() => (openDropdown = null)}>
              <span class="item-icon">
                <iconify-icon icon="lucide:award" width="18"></iconify-icon>
              </span>
              Achievement
            </a>

            <div class="devider"></div>

            <a href="/journal" on:click={() => (openDropdown = null)}>
              <span class="item-icon">
                <iconify-icon icon="lucide:book-open" width="18"></iconify-icon>
              </span>
              Journal
            </a>
          </div>
        {/if}
      </div>

      <!-- TECHNOLOGY -->
      <div class="dropdown">
        <button class="trigger" on:click={() => toggleDropdown("tech")}>
          Technology
          <ion-icon name="chevron-down-outline"></ion-icon>
        </button>

        {#if openDropdown === "tech"}
          <div class="menu">
            <a href="/technologies" on:click={() => (openDropdown = null)}>
              <span class="item-icon">
                <iconify-icon icon="lucide:cpu" width="18"></iconify-icon>
              </span>
              Technologies
            </a>

            <div class="devider"></div>
          </div>
        {/if}
      </div>

      <!-- REGULAR LINKS -->
      <a href="/referral">Referral</a>
      <a href="/about">About</a>
    </nav>

    <!-- RIGHT SIDE -->
    <div class="right-side">
      <a href="/chat" class="chat-icon" aria-label="Chat">
        <div class="icon-wrap">
          <ion-icon name="chatbox-outline"></ion-icon>

          {#if unread > 0}
            <span class="badge">{unread}</span>
          {/if}
        </div>
      </a>
      <a href="/custody" class="wallet-icon" aria-label="Wallet">
        <ion-icon name="wallet-outline"></ion-icon>
      </a>

      <Notifications />
      <UserAvatar showName={false} />
    </div>
  </div>
</header>

<style>
  header {
    background: white;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .wallet-icon {
    margin-right: 16px;
    color: black;
    display: flex;
    align-items: center;
    font-size: 22px;
    opacity: 0.85;
    transition:
      opacity 0.2s,
      transform 0.15s;
  }

  .wallet-icon:hover {
    opacity: 1;
    transform: scale(1.05);
  }

  .wallet-icon ion-icon {
    width: 20px;
    height: 20px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0.8rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo img {
    height: 38px;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;
  }

  nav a,
  nav .dropdown > .trigger {
    color: #334155;
    text-decoration: none;
    font-weight: 500;

    display: inline-flex;
    align-items: center;
    gap: 4px;

    padding: 6px 0;
    line-height: 1;
    background: none;
    border: none;
    cursor: pointer;

    transition: color 0.2s;
  }

  nav a:hover,
  nav .dropdown > .trigger:hover {
    color: #1e3a8a;
  }

  .dropdown {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .trigger ion-icon {
    font-size: 14px;
  }

  .menu {
    position: absolute;
    top: 32px;
    left: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    box-shadow:
      0 10px 24px rgba(15, 23, 42, 0.08),
      0 2px 6px rgba(15, 23, 42, 0.06);
    padding: 6px 0;
    display: flex;
    flex-direction: column;
    min-width: 180px;
    z-index: 999;
  }

  .menu a {
    padding: 10px 16px;
    white-space: nowrap;

    display: flex;
    align-items: center;
    gap: 10px;
    color: #334155;
    text-decoration: none;
    font-weight: 500;
    transition:
      background 0.15s ease,
      color 0.15s ease;
  }

  .menu a:hover {
    background: #f8fafc;
    color: #0f172a;
  }

  .item-icon {
    width: 18px;
    height: 18px;
    display: inline-grid;
    place-items: center;
    opacity: 0.9;
  }

  .devider {
    height: 1px;
    margin: 6px 10px;
    background: #38393b57;
    border-radius: 999px;
    opacity: 1;
  }
  .icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -6px;
    background: #ef4444;
    color: white;
    font-size: 10px;
    font-weight: 700;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .burger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
  }

  .line {
    width: 22px;
    height: 2px;
    background: #0b3954;
    border-radius: 2px;
    transition: 0.2s;
  }
  .line.open:nth-child(1) {
    transform: rotate(45deg) translateY(7px);
  }
  .line.open:nth-child(2) {
    opacity: 0;
  }
  .line.open:nth-child(3) {
    transform: rotate(-45deg) translateY(-7px);
  }

  .right-side {
    display: flex;
    align-items: center;
  }

  .chat-icon {
    margin-right: 16px;
    color: black;
    display: flex;
    align-items: center;
    font-size: 24px;
    opacity: 0.85;
    transition:
      opacity 0.2s,
      transform 0.15s;
  }
  .chat-icon:hover {
    opacity: 1;
    transform: scale(1.02);
  }
  .chat-icon ion-icon {
    width: 20px;
    height: 20px;
  }

  @media (max-width: 768px) {
    nav {
      position: absolute;
      top: 64px;
      left: 0;
      right: 0;
      background: white;
      flex-direction: column;
      align-items: flex-start;
      padding: 1rem;
      gap: 0.8rem;
      border-top: 1px solid #e2e8f0;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
      display: none;
    }
    nav.open {
      display: flex;
    }

    .burger {
      display: flex;
    }

    .menu {
      position: relative;
      top: 0;
      left: 0;
      box-shadow: none;
      border: none;
      padding-left: 14px;
    }

    .chat-icon {
      margin-right: 12px;
    }
  }
</style>
