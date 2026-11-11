<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";
  import ShareModal from "./ShareModal.svelte";
  import PostEditor from "./Community/PostEditor.svelte";
  import PostCard from "./Community/PostCard.svelte";
  import "leaflet/dist/leaflet.css";

  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  let shareOpen = false;

  let community = data.community;
  let isMember: boolean = data.isMember;
  let isOwner: boolean = data.isOwner;
  let hasPendingRequest: boolean = data.hasPendingRequest;
  let requestDate: string | null = data.requestDate;

  // Location map
  import { tick } from "svelte";
  let mapEl: HTMLDivElement;
  let mapOpen = false;
  let leafletMapInst: any = null;
  const hasCoords = typeof community.lat === "number" && typeof community.lng === "number";

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${community.lat},${community.lng}`
    : community.address?.full
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(community.address.full)}`
      : "#";

  async function toggleMap() {
    mapOpen = !mapOpen;
    if (mapOpen && !leafletMapInst) {
      await tick();
      if (!mapEl) return;
      const L = await import("leaflet");
      leafletMapInst = L.map(mapEl, {
        zoomControl: false,
        scrollWheelZoom: true,
        dragging: true,
        attributionControl: false,
      }).setView([community.lat, community.lng], 15);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 19 }).addTo(leafletMapInst);
      L.control.zoom({ position: "bottomright" }).addTo(leafletMapInst);
      L.marker([community.lat, community.lng]).addTo(leafletMapInst);
      setTimeout(() => leafletMapInst.invalidateSize(), 100);
    }
  }

  onMount(() => {
    pageHasAssistant.set(true);
  });

  let joinMessage = "";
  let joinBusy = false;
  let joinError = "";

  // Tabs
  let tab: "overview" | "posts" | "manage" = "overview";
  let joinRequests: any[] = data.joinRequests ?? [];
  let actionBusy: Record<string, boolean> = {};
  let brokenPhotos: Record<string, boolean> = {};

  // Posts
  let posts: any[] = [];
  let postsLoaded = false;
  let postsLoading = false;
  let showEditor = false;
  let editingPost: any = null;

  async function loadPosts() {
    if (postsLoaded || postsLoading) return;
    postsLoading = true;
    try {
      const res = await fetch(`/api/community/${community.id}/posts`);
      if (res.ok) posts = await res.json();
      postsLoaded = true;
    } catch {}
    postsLoading = false;
  }

  function openCreatePost() { editingPost = null; showEditor = true; }
  function openEditPost(post: any) { editingPost = post; showEditor = true; }

  function onPostSaved(e: CustomEvent) {
    const saved = e.detail;
    if (editingPost) {
      posts = posts.map((p) => (p.id === saved.id ? saved : p));
    } else {
      posts = [saved, ...posts];
    }
    showEditor = false;
    editingPost = null;
  }

  async function deletePost(e: CustomEvent<string>) {
    const postId = e.detail;
    const res = await fetch(`/api/community/${community.id}/posts/${postId}`, { method: "DELETE" });
    if (res.ok) posts = posts.filter((p) => p.id !== postId);
  }

  $: if (tab === "posts" && !postsLoaded) loadPosts();

  $: canSeeContent = !community.isPrivate || isMember;

  async function approveRequest(requestId: string) {
    if (actionBusy[requestId]) return;
    actionBusy = { ...actionBusy, [requestId]: true };

    try {
      const res = await fetch("/api/community/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        const req = joinRequests.find((r) => r.id === requestId);
        joinRequests = joinRequests.filter((r) => r.id !== requestId);
        if (req) {
          community = {
            ...community,
            memberCount: community.memberCount + 1,
            members: [...community.members, req.user],
          };
        }
      }
    } catch {}
    finally {
      actionBusy = { ...actionBusy, [requestId]: false };
    }
  }

  async function rejectRequest(requestId: string) {
    if (actionBusy[requestId]) return;
    actionBusy = { ...actionBusy, [requestId]: true };

    try {
      const res = await fetch("/api/community/requests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (res.ok) {
        joinRequests = joinRequests.filter((r) => r.id !== requestId);
      }
    } catch {}
    finally {
      actionBusy = { ...actionBusy, [requestId]: false };
    }
  }

  function initials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString(getDateLocale(), {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  async function sendJoinRequest() {
    if (joinBusy) return;
    joinBusy = true;
    joinError = "";

    try {
      const res = await fetch("/api/community/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          communityId: community.id,
          message: joinMessage.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        joinError = body.error ?? "Failed to send request";
        return;
      }

      hasPendingRequest = true;
      requestDate = new Date().toISOString();
    } catch {
      joinError = "Network error";
    } finally {
      joinBusy = false;
    }
  }
</script>

<div class="page">
  <!-- Back link -->
  <a class="back" href="/communities">
    <iconify-icon icon="lucide:arrow-left" width="16" height="16"></iconify-icon>
    {$t('communities.title')}
  </a>

  <!-- Header card -->
  <div class="top">
    <div class="top-left">
      <div class="logo">
        {#if community.logoUrl}
          <img src={photoSrc(community.logoUrl, 200)} alt={community.name} />
        {:else}
          <div class="logo-fallback">{initials(community.name)}</div>
        {/if}
      </div>

      <div class="info">
        <div class="name-row">
          <h1>{community.name}</h1>
          {#if community.isPrivate}
            <span class="privacy-tag private">
              <iconify-icon icon="lucide:lock" width="14" height="14"></iconify-icon>
              {$t('communities.private')}
            </span>
          {:else}
            <span class="privacy-tag public">
              <iconify-icon icon="lucide:globe" width="14" height="14"></iconify-icon>
              {$t('communities.public')}
            </span>
          {/if}
        </div>

        <div class="meta">
          <span class="meta-item">
            <iconify-icon icon="lucide:users" width="14" height="14"></iconify-icon>
            {community.memberCount} {$t('communities.members')}
          </span>
          <span class="meta-item">
            <iconify-icon icon="lucide:calendar" width="14" height="14"></iconify-icon>
            {$t('communities.created')} {formatDate(community.createdAt)}
          </span>
        </div>

        {#if isOwner}
          <div class="role-badge owner">
            <iconify-icon icon="lucide:crown" width="13" height="13"></iconify-icon>
            {$t('communities.owner')}
          </div>
        {:else if isMember}
          <div class="role-badge member">
            <iconify-icon icon="lucide:check" width="13" height="13"></iconify-icon>
            {$t('communities.member')}
          </div>
        {/if}
      </div>
    </div>

    <button class="btn-share" type="button" on:click={() => (shareOpen = true)}>
      <iconify-icon icon="lucide:share-2" width="16" height="16"></iconify-icon>
      {$t('communities.share')}
    </button>
  </div>

  <!-- Tabs (visible to anyone who can see content) -->
  {#if canSeeContent}
    <div class="admin-tabs">
      <button class:active={tab === "overview"} on:click={() => (tab = "overview")}>
        <iconify-icon icon="lucide:layout-grid" width="15" height="15"></iconify-icon>
        {$t('communities.overview')}
      </button>
      <button class:active={tab === "posts"} on:click={() => (tab = "posts")}>
        <iconify-icon icon="lucide:newspaper" width="15" height="15"></iconify-icon>
        {$t('communities.posts')}
        {#if posts.length > 0}
          <span class="req-count posts-count">{posts.length}</span>
        {/if}
      </button>
      {#if isOwner}
        <button class:active={tab === "manage"} on:click={() => (tab = "manage")}>
          <iconify-icon icon="lucide:inbox" width="15" height="15"></iconify-icon>
          {$t('communities.manage')}
          {#if joinRequests.length > 0}
            <span class="req-count">{joinRequests.length}</span>
          {/if}
        </button>
      {/if}
    </div>
  {/if}

  <!-- Location -->
  {#if community.address?.full || hasCoords}
    <div class="loc-card">
      <div class="loc-head">
        <div class="loc-head-left">
          <iconify-icon icon="lucide:map-pin" width="18" height="18"></iconify-icon>
          <span>{$t('communities.location')}</span>
        </div>
        <div class="loc-head-right">
          {#if hasCoords}
            <button type="button" class="map-toggle-btn" class:active={mapOpen} on:click={toggleMap}>
              <iconify-icon icon={mapOpen ? "lucide:map-off" : "lucide:map"} width="13" height="13"></iconify-icon>
              {mapOpen ? $t('communities.showList') : $t('communities.showMap')}
            </button>
          {/if}
          {#if hasCoords || community.address?.full}
            <a class="maps-link" href={mapsUrl} target="_blank" rel="noreferrer">
              {$t('events.detail.openInMaps')}
              <iconify-icon icon="lucide:external-link" width="13" height="13"></iconify-icon>
            </a>
          {/if}
        </div>
      </div>

      <div class="loc-address">
        <iconify-icon icon="lucide:navigation" width="14" height="14"></iconify-icon>
        <span>{community.address?.full ?? [community.address?.street, community.address?.city, community.address?.country].filter(Boolean).join(", ")}</span>
      </div>

      {#if hasCoords && mapOpen}
        <div class="loc-map-wrap">
          <div bind:this={mapEl} class="loc-map"></div>
        </div>
        <div class="loc-coords">{community.lat?.toFixed(6)}, {community.lng?.toFixed(6)}</div>
      {/if}
    </div>
  {/if}

  <!-- CONTENT: accessible or restricted -->
  {#if canSeeContent && tab === "posts"}
    <div class="posts-section">
      {#if isOwner}
        <div class="posts-header">
          {#if !showEditor}
            <button type="button" class="btn-new-post" on:click={openCreatePost}>
              <iconify-icon icon="lucide:plus" width="16"></iconify-icon>
              {$t('communities.createPost')}
            </button>
          {/if}
        </div>
      {/if}

      {#if showEditor}
        <PostEditor
          communityId={community.id}
          editPost={editingPost}
          on:saved={onPostSaved}
          on:cancelled={() => { showEditor = false; editingPost = null; }}
        />
      {/if}

      {#if postsLoading}
        <div class="posts-loading">
          <iconify-icon icon="lucide:loader-2" width="24" class="spin"></iconify-icon>
        </div>
      {:else if posts.length === 0 && !showEditor}
        <div class="posts-empty">
          <iconify-icon icon="lucide:newspaper" width="40"></iconify-icon>
          <div class="empty-title">{$t('communities.noPosts')}</div>
          {#if isOwner}
            <div class="empty-sub">{$t('communities.noPostsHint')}</div>
          {/if}
        </div>
      {:else}
        <div class="posts-list">
          {#each posts as post (post.id)}
            <PostCard
              {post}
              {isOwner}
              on:edit={(e) => openEditPost(e.detail)}
              on:delete={deletePost}
            />
          {/each}
        </div>
      {/if}
    </div>
  {:else if isOwner && tab === "manage"}
    <div class="manage-section">
      <h2>
        <iconify-icon icon="lucide:user-check" width="18" height="18"></iconify-icon>
        {$t('communities.joinRequests')}
        {#if joinRequests.length > 0}
          <span class="h2-count">{joinRequests.length}</span>
        {/if}
      </h2>

      {#if joinRequests.length === 0}
        <div class="empty-state">
          <iconify-icon icon="lucide:inbox" width="40" height="40"></iconify-icon>
          <div class="empty-title">{$t('communities.noPendingRequests')}</div>
          <div class="empty-sub">{$t('communities.newRequestsAppear')}</div>
        </div>
      {:else}
        <div class="requests-list">
          {#each joinRequests as req (req.id)}
            <div class="req-card">
              <a class="req-user" href="/members/{req.user.id}">
                <div class="req-avatar">
                  {#if req.user.photo && !brokenPhotos[req.user.id]}
                    <img src={photoSrc(req.user.photo, 128)} alt={req.user.name} loading="lazy" on:error={() => (brokenPhotos = { ...brokenPhotos, [req.user.id]: true })} />
                  {:else}
                    <div class="req-avatar-fallback">{req.user.name[0].toUpperCase()}</div>
                  {/if}
                </div>
                <div class="req-info">
                  <div class="req-name">{req.user.name}</div>
                  <div class="req-status">{req.user.status}</div>
                </div>
              </a>

              {#if req.message}
                <div class="req-message">
                  <iconify-icon icon="lucide:message-square" width="14" height="14"></iconify-icon>
                  {req.message}
                </div>
              {/if}

              <div class="req-date">
                <iconify-icon icon="lucide:clock" width="13" height="13"></iconify-icon>
                {formatDate(req.createdAt)}
              </div>

              <div class="req-actions">
                <button
                  class="action-btn approve"
                  disabled={actionBusy[req.id]}
                  on:click={() => approveRequest(req.id)}
                >
                  <iconify-icon icon="lucide:check" width="15" height="15"></iconify-icon>
                  {$t('communities.approve')}
                </button>
                <button
                  class="action-btn reject"
                  disabled={actionBusy[req.id]}
                  on:click={() => rejectRequest(req.id)}
                >
                  <iconify-icon icon="lucide:x" width="15" height="15"></iconify-icon>
                  {$t('communities.reject')}
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else if canSeeContent}
    <!-- Owners -->
    <div class="section">
      <h2>
        <iconify-icon icon="lucide:crown" width="18" height="18"></iconify-icon>
        {$t('communities.owners')}
      </h2>
      <div class="people-grid">
        {#each community.owners as person (person.id)}
          <a class="person-card" href="/members/{person.id}">
            <div class="person-avatar">
              {#if person.photo && !brokenPhotos[person.id]}
                <img src={photoSrc(person.photo, 128)} alt={person.name} loading="lazy" on:error={() => (brokenPhotos = { ...brokenPhotos, [person.id]: true })} />
              {:else}
                <div class="person-fallback">{person.name[0].toUpperCase()}</div>
              {/if}
            </div>
            <div class="person-name">{person.name}</div>
            <div class="person-status">{person.status}</div>
          </a>
        {/each}
      </div>
    </div>

    <!-- Members -->
    <div class="section">
      <h2>
        <iconify-icon icon="lucide:users" width="18" height="18"></iconify-icon>
        {$t('communities.membersList')}
        <span class="h2-count">{community.memberCount}</span>
      </h2>
      {#if community.members.length > 0}
        <div class="people-grid">
          {#each community.members as person (person.id)}
            <a class="person-card" href="/members/{person.id}">
              <div class="person-avatar">
                {#if person.photo && !brokenPhotos[person.id]}
                  <img src={photoSrc(person.photo, 128)} alt={person.name} loading="lazy" on:error={() => (brokenPhotos = { ...brokenPhotos, [person.id]: true })} />
                {:else}
                  <div class="person-fallback">{person.name[0].toUpperCase()}</div>
                {/if}
              </div>
              <div class="person-name">{person.name}</div>
              <div class="person-status">{person.status}</div>
            </a>
          {/each}
        </div>
      {:else}
        <div class="muted">{$t('communities.noMembersYet')}</div>
      {/if}
    </div>
  {:else}
    <!-- RESTRICTED: private + not a member -->
    <div class="restricted">
      <div class="restricted-icon">
        <iconify-icon icon="lucide:shield" width="48" height="48"></iconify-icon>
      </div>

      {#if hasPendingRequest}
        <h2>{$t('communities.requestPending')}</h2>
        <p>{$t('communities.requestSent')} {requestDate ? formatDate(requestDate) : $t('communities.recently')}. {$t('communities.reviewSoon')}</p>
        <div class="pending-badge">
          <iconify-icon icon="lucide:clock" width="16" height="16"></iconify-icon>
          {$t('communities.awaitingApproval')}
        </div>
      {:else if data.userId}
        <h2>{$t('communities.privateCommunity')}</h2>
        <p>{$t('communities.sendRequestMessage')}</p>

        <div class="join-form">
          <textarea
            bind:value={joinMessage}
            placeholder={$t('communities.addMessage')}
            rows="3"
          ></textarea>
          {#if joinError}
            <div class="join-error">{joinError}</div>
          {/if}
          <button
            class="join-btn"
            type="button"
            disabled={joinBusy}
            on:click={sendJoinRequest}
          >
            {#if joinBusy}
              {$t('communities.sending')}
            {:else}
              <iconify-icon icon="lucide:send" width="16" height="16"></iconify-icon>
              {$t('communities.requestToJoin')}
            {/if}
          </button>
        </div>
      {:else}
        <h2>{$t('communities.privateCommunity')}</h2>
        <p>{$t('communities.loginToAccess')}</p>
        <a class="join-btn" href="/login">
          <iconify-icon icon="lucide:log-in" width="16" height="16"></iconify-icon>
          {$t('communities.logIn')}
        </a>
      {/if}
    </div>
  {/if}
</div>

<ShareModal
  bind:open={shareOpen}
  url="/communities/{community?.id}"
  title={community?.name ?? ""}
  subtitle={$t('communities.shareCommunity')}
/>

<ContextAssistant contextKey="community" payload={{ community }} title="Community Assistant" />

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  .back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
    text-decoration: none;
    margin-bottom: 18px;
    transition: color 0.15s;
  }

  .back:hover {
    color: #4f46e5;
  }

  /* ============ TOP ============ */
  .top {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 22px;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    align-items: center;
  }

  .top-left {
    display: flex;
    gap: 18px;
    align-items: center;
    min-width: 0;
  }

  .logo {
    width: 80px;
    height: 80px;
    border-radius: 18px;
    overflow: hidden;
    flex: 0 0 auto;
    border: 2px solid #e2e8f0;
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .logo-fallback {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #4f46e5, #7c3aed);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.8);
  }

  .info {
    min-width: 0;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  .privacy-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
  }

  .privacy-tag.private {
    background: #fef3c7;
    color: #92400e;
  }

  .privacy-tag.public {
    background: #d1fae5;
    color: #065f46;
  }

  .meta {
    margin-top: 8px;
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #94a3b8;
  }

  .role-badge {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 800;
  }

  .role-badge.owner {
    background: #fef3c7;
    color: #92400e;
  }

  .role-badge.member {
    background: #dbeafe;
    color: #1e40af;
  }

  .btn-share {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
    margin-top: 16px;
    align-self: flex-start;
  }

  .btn-share:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  /* ============ LOCATION ============ */
  .loc-card {
    margin-top: 18px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    position: relative;
    z-index: 0;
  }

  .loc-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    flex-wrap: wrap;
  }

  .loc-head-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .map-toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 30px;
    padding: 0 12px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }
  .map-toggle-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .map-toggle-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }

  .loc-head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 16px;
    color: #0f172a;
  }

  .loc-head-left :global(iconify-icon) { color: #4f46e5; }

  .maps-link {
    font-weight: 700;
    font-size: 13px;
    color: #4f46e5;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: opacity 0.15s;
  }
  .maps-link:hover { opacity: 0.75; }

  .loc-address {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    line-height: 1.45;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }
  .loc-address :global(iconify-icon) { color: #4f46e5; flex-shrink: 0; margin-top: 2px; }

  .loc-map-wrap {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .loc-map {
    width: 100%;
    height: 280px;
  }

  .loc-coords {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-align: right;
  }

  /* ============ SECTIONS ============ */
  .section {
    margin-top: 24px;
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 16px;
  }

  h2 iconify-icon {
    color: #4f46e5;
  }

  .h2-count {
    font-size: 14px;
    color: #94a3b8;
  }

  .people-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 12px;
  }

  .person-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px;
    text-decoration: none;
    color: inherit;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 6px;
    transition: all 0.2s ease;
  }

  .person-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    border-color: #c7d2fe;
  }

  .person-avatar {
    width: 56px;
    height: 56px;
    border-radius: 999px;
    overflow: hidden;
    background: #f1f5f9;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .person-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .person-fallback {
    font-weight: 900;
    font-size: 18px;
    color: #64748b;
  }

  .person-name {
    font-weight: 800;
    font-size: 13px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .person-status {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
  }

  .muted {
    color: #94a3b8;
    font-weight: 700;
    font-size: 14px;
  }

  /* ============ RESTRICTED ============ */
  .restricted {
    margin-top: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    padding: 48px 20px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
  }

  .restricted-icon {
    color: #94a3b8;
    margin-bottom: 6px;
  }

  .restricted h2 {
    justify-content: center;
    margin: 0;
  }

  .restricted p {
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
    max-width: 400px;
    margin: 0;
    line-height: 1.5;
  }

  .pending-badge {
    margin-top: 8px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-radius: 12px;
    background: #fef3c7;
    color: #92400e;
    font-weight: 800;
    font-size: 14px;
  }

  .join-form {
    margin-top: 12px;
    width: 100%;
    max-width: 400px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .join-form textarea {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 14px;
    color: #0f172a;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s;
  }

  .join-form textarea:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.08);
  }

  .join-form textarea::placeholder {
    color: #94a3b8;
  }

  .join-error {
    font-size: 13px;
    font-weight: 700;
    color: #ef4444;
  }

  .join-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    font-family: inherit;
    font-weight: 700;
    font-size: 14px;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.15s;
  }

  .join-btn:hover {
    background: #4338ca;
  }

  .join-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ============ ADMIN TABS ============ */
  .admin-tabs {
    margin-top: 18px;
    display: flex;
    gap: 6px;
  }

  .admin-tabs button {
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
    gap: 6px;
    transition: all 0.15s;
  }

  .admin-tabs button:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .admin-tabs button.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .req-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: rgba(239, 68, 68, 0.9);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
  }

  .admin-tabs button.active .req-count {
    background: rgba(255, 255, 255, 0.25);
  }

  /* ============ POSTS ============ */
  .posts-section {
    margin-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .posts-header {
    display: flex;
    justify-content: flex-end;
  }

  .btn-new-post {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: #4f46e5;
    border: none;
    border-radius: 12px;
    padding: 10px 18px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-new-post:hover { background: #4338ca; box-shadow: 0 4px 14px rgba(79,70,229,0.3); }

  .posts-loading {
    display: flex;
    justify-content: center;
    padding: 40px;
    color: #94a3b8;
  }

  .posts-empty {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    text-align: center;
    color: #94a3b8;
  }

  .posts-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .posts-count {
    background: rgba(79, 70, 229, 0.15);
    color: #4f46e5;
  }
  .admin-tabs button.active .posts-count {
    background: rgba(255, 255, 255, 0.25);
    color: rgba(255, 255, 255, 0.95);
  }

  /* ============ MANAGE ============ */
  .manage-section {
    margin-top: 24px;
  }

  .empty-state {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 48px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    color: #94a3b8;
  }

  .empty-title {
    font-weight: 800;
    font-size: 16px;
    color: #64748b;
  }

  .empty-sub {
    font-weight: 600;
    font-size: 13px;
    color: #94a3b8;
  }

  .requests-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .req-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.15s;
  }

  .req-card:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
  }

  .req-user {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    color: inherit;
  }

  .req-avatar {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    overflow: hidden;
    background: #f1f5f9;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .req-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .req-avatar-fallback {
    font-weight: 900;
    font-size: 16px;
    color: #64748b;
  }

  .req-name {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  .req-status {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 1px;
  }

  .req-message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 10px 14px;
    background: #f8fafc;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    line-height: 1.5;
  }

  .req-message iconify-icon {
    color: #94a3b8;
    flex: 0 0 auto;
    margin-top: 2px;
  }

  .req-date {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
  }

  .req-actions {
    display: flex;
    gap: 8px;
  }

  .action-btn {
    height: 36px;
    padding: 0 16px;
    border-radius: 10px;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
  }

  .action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-btn.approve {
    background: #d1fae5;
    color: #065f46;
  }

  .action-btn.approve:hover:not(:disabled) {
    background: #a7f3d0;
  }

  .action-btn.reject {
    background: #fee2e2;
    color: #991b1b;
  }

  .action-btn.reject:hover:not(:disabled) {
    background: #fecaca;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 720px) {
    .top {
      flex-direction: column;
      align-items: flex-start;
    }

    .top-left {
      flex-direction: column;
      align-items: flex-start;
    }

    h1 {
      font-size: 22px;
    }

    .people-grid {
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    }
  }
</style>
