<script lang="ts">
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";

  export let member: any;

  export let isLoggedIn = false;
  export let isFollowing = false;
  export let isLoading = false;

  export let onToggle: (id: string) => void;
  export let stopCardClick: (e: MouseEvent) => void;

  const name = (m: any) => m.info?.name ?? "Без имени";
  const role = (m: any) => m.info?.status ?? "Member";

  const fallback = () =>
    "https://api.dicebear.com/7.x/initials/svg?seed=" +
    encodeURIComponent(name(member));

  $: avatar = photoSrc(member?.info?.photo, 128) ?? fallback();
</script>

<a href={`/members/${member.id}`} class="member-card">
  <img
    src={avatar}
    alt="Member photo"
    class="avatar"
    loading="lazy"
    decoding="async"
    referrerpolicy="no-referrer"
  />

  <div class="card-main">
    <h3 class="name">{name(member)}</h3>

    <div class="meta-row">
      <span class="badge">{role(member)}</span>
      <span class="followers-pill">
        {member._count?.followers ?? 0} {$t('members.followers')}
      </span>
    </div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="follow-action" on:click={stopCardClick}>
    <button
      type="button"
      class="follow-chip {isFollowing ? 'following' : ''}"
      disabled={isLoading}
      on:click={() => isLoggedIn ? onToggle(member.id) : (window.location.href = "/login")}
      title={isFollowing ? "Unfollow" : "Follow"}
    >
      {#if isLoading}
        …
      {:else if isFollowing}
        ✓ {$t('members.following')}
      {:else}
        + {$t('members.follow')}
      {/if}
    </button>
  </div>

  <slot name="hover" />
</a>

<style>
  .member-card {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.9rem;
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e6edf5;
    border-radius: 1.1rem;
    padding: 1rem;
    padding-top: 1.05rem;
    text-decoration: none;
    color: inherit;
    box-shadow:
      0 2px 8px rgba(15, 23, 42, 0.04),
      0 1px 2px rgba(15, 23, 42, 0.03);
    transition:
      transform 0.15s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
    z-index: 1;
  }

  .member-card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 10px 24px rgba(15, 23, 42, 0.1),
      0 2px 6px rgba(15, 23, 42, 0.06);
    border-color: #d8e3f3;
    background: #fff;
    z-index: 50;
  }

  .follow-action {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 5;
  }

  .follow-chip {
    font-size: 0.72rem;
    font-weight: 800;
    padding: 0.28rem 0.6rem;
    border-radius: 999px;
    border: 1px solid #d1d5db;
    background: rgba(255, 255, 255, 0.95);
    color: #0b3954;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    line-height: 1.1;
  }

  .follow-chip:hover {
    background: #f3f4f6;
  }

  .follow-chip.following {
    background: #ecfdf5;
    border-color: #bbf7d0;
    color: #166534;
  }

  .follow-chip:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* мелкая защита от налезания текста на кнопку */
  .card-main {
    padding-right: 92px;
  }

  /* если у тебя эти классы уже есть глобально — можно убрать ниже,
     но оставляю чтобы компонент был самодостаточен */
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    object-fit: cover;
    flex-shrink: 0;
    background: #f1f5f9;
    border: 2px solid #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .card-main {
    min-width: 0;
    display: grid;
    gap: 0.35rem;
  }

  .name {
    font-size: 1.05rem;
    font-weight: 800;
    color: #0b3954;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .badge {
    width: fit-content;
    font-size: 0.78rem;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    background: #eef2ff;
    color: #3730a3;
    font-weight: 650;
    letter-spacing: 0.02em;
  }

  .followers-pill {
    font-size: 0.78rem;
    padding: 0.22rem 0.55rem;
    border-radius: 999px;
    background: #f1f5f9;
    color: #0b3954;
    border: 1px solid #e6edf5;
    font-weight: 650;
  }
</style>
