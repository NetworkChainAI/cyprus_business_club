<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { withLang } from "$lib/utils/withLang";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  let members = data?.members ?? [];
  let recommendedMembers = data?.recommendedMembers ?? [];

  let q = "";
  let tab: "all" | "member" | "experts" = "all";
  let sort: "most_followed" | "name_asc" = "most_followed";
  let activeCategory: string = "all";

  const categoryKeys = [
    "all",
    "tech",
    "music",
    "business",
    "social",
    "art",
    "science",
    "sports",
    "health",
  ];

  $: categories = categoryKeys.map((k) => ({
    key: k,
    label: $t(`members.categories.${k}`),
  }));

  const totalUsers = members.length;

  function displayName(u: any) {
    return u?.info?.name ?? u?.email ?? "User";
  }

  function statusText(u: any) {
    return u?.info?.status ?? "Member";
  }

  function followersCount(u: any) {
    return u?._count?.followers ?? 0;
  }

  function followingCount(u: any) {
    return u?._count?.following ?? 0;
  }
  let busy: Record<string, boolean> = {};

  async function toggleFollow(u: any) {
    if (!data?.myId) {
      window.location.href = withLang("/login");
      return;
    }
    if (!u?.id) return;

    if (busy[u.id]) return;
    busy = { ...busy, [u.id]: true };

    const was = !!u.isFollowing;

    setIsFollowing(u.id, !was);

    try {
      const res = await fetch("/api/member/follow", {
        method: was ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });

      if (!res.ok) {
        setIsFollowing(u.id, was);
      } else {
        //
      }
    } catch (e) {
      setIsFollowing(u.id, was);
    } finally {
      busy = { ...busy, [u.id]: false };
    }
  }

  function setIsFollowing(userId: string, v: boolean) {
    members = members.map((m: any) =>
      m.id === userId ? { ...m, isFollowing: v } : m,
    );
    recommendedMembers = recommendedMembers.map((m: any) =>
      m.id === userId ? { ...m, isFollowing: v } : m,
    );
  }

  function bumpFollowers(userId: string, delta: number) {
    const apply = (arr: any[]) =>
      arr.map((m) =>
        m.id === userId
          ? {
              ...m,
              _count: {
                ...m._count,
                followers: (m._count?.followers ?? 0) + delta,
              },
            }
          : m,
      );

    members = apply(members);
    recommendedMembers = apply(recommendedMembers);
  }

  function resolvePhoto(u: any, width?: number) {
    return photoSrc(u?.info?.photo ?? null, width);
  }

  let brokenPhotos: Record<string, boolean> = {};

  function onPhotoError(userId: string) {
    brokenPhotos = { ...brokenPhotos, [userId]: true };
  }

  function isExpert(u: any) {
    const s = String(statusText(u)).toLowerCase();
    return s.includes("expert");
  }

  $: filtered = members
    .filter((u: any) => {
      if (tab === "experts" && !isExpert(u)) return false;
      if (tab === "member" && isExpert(u)) return false;

      if (activeCategory !== "all") {
      }

      const text =
        `${displayName(u)} ${u?.email ?? ""} ${statusText(u)}`.toLowerCase();
      return text.includes(q.trim().toLowerCase());
    })
    .sort((a: any, b: any) => {
      if (sort === "name_asc")
        return displayName(a).localeCompare(displayName(b));
      return followersCount(b) - followersCount(a);
    });

  function badgeText(u: any) {
    if (isExpert(u)) return t.get('members.expert');
    return statusText(u);
  }

  $: visibleCount = filtered.length;
</script>

<section class="page">
  <div class="container">
    <div class="hero">
      <div>
        <h1><iconify-icon icon="lucide:users" width="28" height="28"></iconify-icon>{$t('members.title')}</h1>
        <p>{$t('members.subtitle')}</p>
      </div>

      <div class="count">
        <div class="num">{totalUsers}</div>
        <div class="label">{$t('members.membersCount')}</div>
      </div>
    </div>

    <div class="controls">
      <div class="search">
        <iconify-icon icon="lucide:search" width="18"></iconify-icon>
        <input
          placeholder={$t('members.search')}
          bind:value={q}
        />
      </div>

      <div class="tabs">
        <button class:active={tab === "all"} on:click={() => (tab = "all")}
          >{$t('members.tabs.all')}</button
        >
        <button
          class:active={tab === "member"}
          on:click={() => (tab = "member")}>{$t('members.tabs.member')}</button
        >
        <button
          class:active={tab === "experts"}
          on:click={() => (tab = "experts")}>{$t('members.tabs.experts')}</button
        >
      </div>

      <div class="sort">
        <span>Sort by:</span>
        <select bind:value={sort}>
          <option value="most_followed">{$t('members.sort.mostFollowed')}</option>
          <option value="name_asc">{$t('members.sort.nameAsc')}</option>
        </select>
      </div>
    </div>


    {#if recommendedMembers.length > 0}
      <div class="sectionTitle">
        <iconify-icon icon="lucide:sparkles" width="18"></iconify-icon>
        {$t('members.recommended')}
      </div>
      <div class="grid">
        {#each recommendedMembers as u (u.id)}
          <a class="card" href={`/members/${u.id}`}>
            <div class="cover" ></div>

            <div class="card-body">
              <div class="avatar-row">
                <div class="avatar">
                  {#if resolvePhoto(u, 128) && !brokenPhotos[u.id]}
                    <img src={resolvePhoto(u, 128)} alt={displayName(u)} loading="lazy" decoding="async" on:error={() => onPhotoError(u.id)} />
                  {:else}
                    <div class="fallback">{displayName(u)[0].toUpperCase()}</div>
                  {/if}
                </div>

                {#if !u.isMe}
                  <button
                    type="button"
                    class="followBtn"
                    class:followed={u.isFollowing}
                    disabled={busy[u.id]}
                    on:click|preventDefault|stopPropagation={() =>
                      toggleFollow(u)}
                  >
                    <iconify-icon
                      icon={u.isFollowing
                        ? "lucide:user-check"
                        : "lucide:user-plus"}
                      width="14"
                    />
                    {u.isFollowing ? $t('members.following') : $t('members.follow')}
                  </button>
                {/if}
              </div>

              <div class="name">{displayName(u)}</div>

              <div class="role-row">
                <span class="badge" class:expert={isExpert(u)}>
                  {#if isExpert(u)}
                    <iconify-icon icon="lucide:zap" width="11"></iconify-icon>
                  {/if}
                  {badgeText(u)}
                </span>
              </div>

              <div class="stats">
                <div class="stat">
                  <span class="stat-num">{followersCount(u)}</span>
                  <span class="stat-label">{$t('members.followers')}</span>
                </div>
                <div class="stat-sep"></div>
                <div class="stat">
                  <span class="stat-num">{followingCount(u)}</span>
                  <span class="stat-label">{$t('members.followingLabel')}</span>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    <div class="sectionTitle">
      {$t('members.people')} <span class="muted">({visibleCount})</span>
    </div>

    <div class="grid">
      {#each filtered as u (u.id)}
        <a class="card" href={`/members/${u.id}`}>
          <div class="cover" ></div>

          <div class="card-body">
            <div class="avatar-row">
              <div class="avatar">
                {#if resolvePhoto(u, 128) && !brokenPhotos[u.id]}
                  <img src={resolvePhoto(u, 128)} alt={displayName(u)} loading="lazy" decoding="async" on:error={() => onPhotoError(u.id)} />
                {:else}
                  <div class="fallback">{displayName(u)[0].toUpperCase()}</div>
                {/if}
              </div>

              {#if !u.isMe}
                <button
                  type="button"
                  class="followBtn"
                  class:followed={u.isFollowing}
                  disabled={busy[u.id]}
                  on:click|preventDefault|stopPropagation={() => toggleFollow(u)}
                >
                  <iconify-icon
                    icon={u.isFollowing
                      ? "lucide:user-check"
                      : "lucide:user-plus"}
                    width="14"
                  />
                  {u.isFollowing ? $t('members.following') : $t('members.follow')}
                </button>
              {/if}
            </div>

            <div class="name">{displayName(u)}</div>

            <div class="role-row">
              <span class="badge" class:expert={isExpert(u)}>
                {#if isExpert(u)}
                  <iconify-icon icon="lucide:zap" width="11"></iconify-icon>
                {/if}
                {badgeText(u)}
              </span>
            </div>

            <div class="stats">
              <div class="stat">
                <span class="stat-num">{followersCount(u)}</span>
                <span class="stat-label">{$t('members.followers')}</span>
              </div>
              <div class="stat-sep"></div>
              <div class="stat">
                <span class="stat-num">{followingCount(u)}</span>
                <span class="stat-label">{$t('members.followingLabel')}</span>
              </div>
            </div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</section>

<ContextAssistant contextKey="global" payload={{ page: "members" }} title="Members Assistant" />

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  .hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  h1 iconify-icon {
    color: #4f46e5;
  }

  p {
    font-size: 14px;
    color: #64748b;
    margin: 4px 0 0;
  }

  .count {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 18px;
    border-radius: 12px;
    background: rgba(79, 70, 229, 0.06);
    border: 1px solid rgba(79, 70, 229, 0.15);
    flex: 0 0 auto;
  }

  .count .num {
    font-size: 22px;
    font-weight: 900;
    color: #4f46e5;
    line-height: 1;
  }

  .count .label {
    font-size: 11px;
    font-weight: 800;
    color: #4f46e5;
    letter-spacing: 0.06em;
  }

  .controls {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 16px 20px;
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 9px 14px;
    color: #94a3b8;
    min-width: 0;
    transition: border-color 0.15s;
  }

  .search:focus-within {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
  }

  .search input {
    border: none;
    outline: none;
    width: 100%;
    font-size: 14px;
    font-weight: 600;
    background: transparent;
    color: #0f172a;
    font-family: inherit;
    min-width: 0;
  }

  .search input::placeholder {
    color: #94a3b8;
  }

  .tabs {
    display: flex;
    gap: 6px;
  }

  .tabs button {
    height: 38px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.15s;
  }

  .tabs button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .tabs button.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .sort {
    display: flex;
    align-items: center;
    gap: 6px;
    justify-content: flex-end;
    color: #94a3b8;
    font-weight: 700;
    font-size: 13px;
    white-space: nowrap;
  }

  .sort select {
    height: 40px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 14px;
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
    font-family: inherit;
    outline: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .sort select:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .cats {
    margin-top: 14px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cats button {
    height: 32px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.15s;
  }

  .cats button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .cats button.catActive {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .sectionTitle {
    margin: 24px 0 14px;
    font-weight: 900;
    color: #0f172a;
    font-size: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .muted {
    color: #94a3b8;
    font-weight: 900;
  }

  /* ===== Grid ===== */
  .grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
  }

  /* ===== Card ===== */
  .card {
    position: relative;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
  }

  .card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
    border-color: #c7d2fe;
  }

  .cover {
    height: 72px;
    flex: 0 0 auto;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);
  }

  .card-body {
    padding: 0 16px 16px;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .avatar-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-top: -32px;
    margin-bottom: 10px;
  }

  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    background: #f1f5f9;
    border: 3px solid #fff;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
    overflow: hidden;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    transition: box-shadow 0.2s;
  }

  .card:hover .avatar {
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.18);
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .fallback {
    font-weight: 900;
    font-size: 22px;
    color: #64748b;
  }

  /* Follow button */
  .followBtn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #4f46e5;
    color: #fff;
    border-radius: 8px;
    padding: 5px 12px;
    font-weight: 700;
    font-size: 12px;
    font-family: inherit;
    border: none;
    cursor: pointer;
    line-height: 1;
    white-space: nowrap;
    transition: all 0.15s;
    flex: 0 0 auto;
  }

  .followBtn:hover:not(:disabled) { background: #4338ca; }
  .followBtn:disabled { opacity: 0.6; cursor: not-allowed; }

  .followBtn.followed {
    background: #e2e8f0;
    color: #475569;
  }
  .followBtn.followed:hover:not(:disabled) { background: #cbd5e1; }

  .followBtn.followed:hover {
    background: #e2e8f0;
    transform: scale(1.03);
  }

  .followBtn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  /* Name */
  .name {
    font-weight: 900;
    color: #0f172a;
    font-size: 16px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    letter-spacing: -0.01em;
  }

  /* Role badge */
  .role-row {
    margin-top: 6px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 999px;
    background: #f1f5f9;
    color: #475569;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 0.01em;
  }

  .badge.expert {
    background: #fef3c7;
    color: #92400e;
  }

  /* Stats */
  .stats {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding-top: 14px;
    border-top: 1px solid #f1f5f9;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .stat-num {
    font-weight: 900;
    font-size: 14px;
    color: #0f172a;
  }

  .stat-label {
    font-weight: 700;
    font-size: 12px;
    color: #94a3b8;
  }

  .stat-sep {
    width: 3px;
    height: 3px;
    border-radius: 999px;
    background: #cbd5e1;
    flex: 0 0 auto;
  }

  @media (max-width: 1100px) {
    .grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .controls {
      grid-template-columns: 1fr;
    }
    .sort {
      justify-content: flex-start;
    }
  }

  @media (max-width: 720px) {
    .grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 14px;
    }

    .controls {
      grid-template-columns: 1fr;
    }

    .sort {
      justify-content: flex-start;
    }
  }

  @media (max-width: 420px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
