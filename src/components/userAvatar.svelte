<script lang="ts">
  import { onMount } from "svelte";

  interface User {
    id: string;
    email: string;
    info?: {
      name?: string;
      photo?: string;
    };
  }

  export let showName: boolean = true;

  let user: User | null = null;
  let loading = true;
  let menuOpen = false;

  const handleOutsideClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest(".user-avatar")) {
      menuOpen = false;
    }
  };

  onMount(() => {
    document.addEventListener("click", handleOutsideClick);
    loadUser();

    const interval = setInterval(loadUser, 1000);

    return () => {
      document.removeEventListener("click", handleOutsideClick);
      clearInterval(interval);
    };
  });

  async function loadUser() {
    try {
      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        user = null;
        return;
      }

      const data = await res.json();
      user = data?.user ?? null;
    } catch (err) {
      console.error("Failed to fetch user:", err);
      user = null;
    } finally {
      loading = false;
    }
  }

  const toggleMenu = () => (menuOpen = !menuOpen);

  const handleLinkClick = () => {
    menuOpen = false;
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/";
  };
</script>

{#if loading}
  <div class="user-loading" />
{:else if user}
  <div class="user-avatar">
    <button
      class="avatar-btn"
      aria-label="User menu"
      on:click={toggleMenu}
      aria-expanded={menuOpen}
    >
      <img
        src={user.info?.photo
          ? `/api/photo/${user.info.photo.split("/").pop()}`
          : "https://api.dicebear.com/7.x/initials/svg?seed=" +
            (user.info?.name || "User")}
        alt="User photo"
        class="avatar-img"
        width="38"
        height="38"
      />

      {#if showName}
        <span class="username">{user.info?.name || user.email}</span>
      {/if}
      <svg
        class="arrow"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    {#if menuOpen}
      <div class="dropdown">
        <a href="/profile" on:click={handleLinkClick}>👤 My Profile</a>
        <a
          href="#"
          on:click|preventDefault={() => {
            handleLogout();
            menuOpen = false;
          }}>🚪 Log out</a
        >
      </div>
    {/if}
  </div>
{:else}
  <a href="/login" class="login-link">Sign in</a>
{/if}

<style>
  .user-avatar {
    position: relative;
    display: flex;
    align-items: center;
  }

  .avatar-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font: inherit;
    padding: 0.4rem 0.6rem;
    border-radius: 0.8rem;
    transition: background 0.2s ease;
  }

  .avatar-btn:hover {
    background: #f8fafc;
  }

  .avatar-img {
    border-radius: 50%;
    width: 38px;
    height: 38px;
    object-fit: cover;
    border: 2px solid #e2e8f0;
    transition: all 0.2s ease;
  }

  .avatar-btn:hover .avatar-img {
    border-color: #3b82f6;
  }

  .username {
    font-size: 0.95rem;
    color: #0b3954;
    font-weight: 500;
  }

  .arrow {
    width: 1rem;
    height: 1rem;
    color: #64748b;
    transition: transform 0.2s ease;
  }

  .avatar-btn[aria-expanded="true"] .arrow {
    transform: rotate(180deg);
  }

  /* Дропдаун */
  .dropdown {
    position: absolute;
    top: 110%;
    right: 0;
    background: white;
    border-radius: 0.8rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    z-index: 20;
    display: flex;
    flex-direction: column;
    min-width: 180px;
    animation: dropdownFade 0.15s ease-out;
  }

  @keyframes dropdownFade {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown a {
    padding: 0.75rem 1.2rem;
    color: #334155;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }

  .dropdown a:hover {
    background: #f1f5f9;
    color: #0b3954;
  }

  .login-link {
    color: #1e3a8a;
    font-weight: 500;
    text-decoration: none;
  }

  .user-loading {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #e2e8f0;
    animation: pulse 1.2s infinite ease-in-out;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
</style>
