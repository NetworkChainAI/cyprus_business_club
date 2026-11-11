<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { withLang } from "$lib/utils/withLang";
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "$components/ContextAssistant.svelte";
  import AskAiButton from "$components/AskAiButton.svelte";
  import ShareModal from "$components/ShareModal.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  let assistantOpen = false;
  let shareOpen = false;

  $: member = data?.member;
  $: currentUserId = data?.currentUserId;
  $: isMe = !!(currentUserId && member?.id === currentUserId);
  $: followersCount = data?.followersCount ?? 0;
  $: followingCount = data?.followingCount ?? 0;

  // Reputation
  $: socialCapital = member?.socialTotal?.total ?? 0;
  $: socialRank = member?.socialTotal?.rank ?? "Explorer I";
  $: trustScore = member?.info?.trustScore ?? 0;

  function trustLabel(score: number) {
    if (score >= 80) return t.get('members.trustHighly');
    if (score >= 60) return t.get('members.trustTrusted');
    if (score >= 30) return t.get('members.trustVerified');
    return t.get('members.trustNew');
  }

  function trustColor(score: number): string {
    if (score >= 70) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  function trustBg(score: number): string {
    if (score >= 70) return "rgba(34,197,94,0.08)";
    if (score >= 40) return "rgba(245,158,11,0.08)";
    return "rgba(239,68,68,0.08)";
  }

  // SC rank progress bar
  const rankThresholds = [0, 300, 600, 900, 1200, 1500, 2000];
  function scProgress(total: number) {
    for (let i = rankThresholds.length - 1; i >= 0; i--) {
      if (total >= rankThresholds[i]) {
        const next = rankThresholds[i + 1] ?? rankThresholds[i] + 500;
        const range = next - rankThresholds[i];
        return Math.min(100, Math.round(((total - rankThresholds[i]) / range) * 100));
      }
    }
    return 0;
  }

  function displayName(u: any) {
    return u?.info?.name ?? u?.email ?? "User";
  }

  function resolvePhoto(u: any) {
    return photoSrc(u?.info?.photo ?? null, 200);
  }

  let photoBroken = false;

  function lastSeenInfo(lastOnline: any) {
    if (!lastOnline) return { text: t.get('members.lastSeenRecently'), isOnline: false };
    const diff = Math.max(0, Date.now() - new Date(lastOnline).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return { text: t.get('members.online'), isOnline: true };
    if (mins < 60) return { text: `${t.get('members.lastSeen')} ${mins}m ${t.get('members.ago')}`, isOnline: false };
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { text: `${t.get('members.lastSeen')} ${hrs}h ${t.get('members.ago')}`, isOnline: false };
    return { text: `${t.get('members.lastSeen')} ${Math.floor(hrs / 24)}d ${t.get('members.ago')}`, isOnline: false };
  }

  function formatJoined(d: any) {
    return new Date(d).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  $: ls = lastSeenInfo(member?.lastOnline);
  $: base = `/members/${member?.id}`;

  $: tabDefs = [
    { path: "", label: $t('members.about'), icon: "lucide:user" },
    { path: "/interests", label: $t('members.interests'), icon: "lucide:heart" },
    { path: "/events", label: $t('members.events'), icon: "lucide:calendar-days" },
    { path: "/followers", label: $t('members.followersTab'), icon: "lucide:users" },
    { path: "/following", label: $t('members.followingTab'), icon: "lucide:user-plus" },
  ];

  function isActive(tabPath: string, pathname: string) {
    const stripped = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/") || "/";
    const full = base + tabPath;
    if (tabPath === "") return stripped === base || stripped === base + "/";
    return stripped.startsWith(full);
  }

  let followBusy = false;
  let chatBusy = false;

  async function toggleFollow() {
    if (!currentUserId) { goto(withLang("/login")); return; }
    if (!member?.id || isMe || followBusy) return;
    followBusy = true;
    const was = !!member.isFollowing;
    member = { ...member, isFollowing: !was };

    try {
      const res = await fetch("/api/member/follow", {
        method: was ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      });
      if (!res.ok) member = { ...member, isFollowing: was };
    } catch {
      member = { ...member, isFollowing: was };
    } finally {
      followBusy = false;
    }
  }

  async function openChat() {
    if (!currentUserId) { goto(withLang("/login")); return; }
    if (!member?.id || isMe || chatBusy) return;
    chatBusy = true;
    try {
      const res = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      });
      if (res.ok) {
        const { chatId } = await res.json();
        goto(withLang(`/chat/${chatId}`));
      }
    } catch {} finally {
      chatBusy = false;
    }
  }
</script>

{#if !member}
  <section class="page">
    <div class="container">
      <div class="not-found">
        <iconify-icon icon="lucide:user-x" width="36"></iconify-icon>
        <div class="nf-title">{$t('members.notFound')}</div>
        <a href={withLang("/members")} class="back-btn">{$t('members.backToMembers')}</a>
      </div>
    </div>
  </section>
{:else}
  <section class="page">
    <div class="container">
      <!-- Header -->
      <div class="top">
        <div class="left">
          <div class="avatar-wrap">
            <div class="avatar">
              {#if resolvePhoto(member) && !photoBroken}
                <img src={resolvePhoto(member)} alt={displayName(member)} on:error={() => (photoBroken = true)} />
              {:else}
                <div class="fallback">{displayName(member)[0].toUpperCase()}</div>
              {/if}
            </div>
            <div class="online-dot" class:online={ls.isOnline}></div>
          </div>

          <div class="info">
            <div class="name">{displayName(member)}</div>
            <div class="subtitle">{member.info?.status ?? $t('members.defaultStatus')}</div>

            <div class="meta">
              <span class="meta-item" class:online-now={ls.isOnline}>
                <span class="dot"></span>
                {ls.text}
              </span>
              <span class="meta-item">
                <iconify-icon icon="lucide:map-pin" width="14"></iconify-icon>
                {member.info?.location ?? $t('members.locationFallback')}
              </span>
              <span class="meta-item">
                <iconify-icon icon="lucide:calendar" width="14"></iconify-icon>
                {$t('members.joined')} {formatJoined(member.createdAt)}
              </span>
            </div>

            <div class="stats">
              <div class="stat"><span class="n">{followersCount}</span> {$t('members.followers')}</div>
              <div class="stat"><span class="n">{followingCount}</span> {$t('members.followingLabel')}</div>
            </div>
          </div>
        </div>

        <div class="actions">
          {#if !isMe}
            <button
              class="btn-follow"
              class:followed={member.isFollowing}
              disabled={followBusy}
              on:click={toggleFollow}
            >
              <iconify-icon
                icon={member.isFollowing ? "lucide:user-check" : "lucide:user-plus"}
                width="16"
              ></iconify-icon>
              {member.isFollowing ? $t('members.following') : $t('members.follow')}
            </button>
          {/if}

          <div class="action-row">
            <button class="icon-btn" title="Message" disabled={isMe || chatBusy} on:click={openChat}>
              <iconify-icon icon="lucide:message-square" width="18"></iconify-icon>
            </button>
            <button class="icon-btn" title="Share" on:click={() => (shareOpen = true)}>
              <iconify-icon icon="lucide:share-2" width="18"></iconify-icon>
            </button>
            <AskAiButton on:click={() => (assistantOpen = true)} />
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-row">
        <nav class="tabs">
          {#each tabDefs as tab}
            <a
              class="tab"
              class:active={isActive(tab.path, $page.url.pathname)}
              href={withLang(`${base}${tab.path}`)}
            >
              <iconify-icon icon={tab.icon} width="15" height="15"></iconify-icon>
              {tab.label}
            </a>
          {/each}
        </nav>
      </div>

      <!-- Layout -->
      <div class="layout">
        <div class="main">
          <slot />
        </div>

        <div class="side">
          <div class="side-card purple">
            <div class="side-title">
              <iconify-icon icon="lucide:trophy" width="18"></iconify-icon>
              {$t('members.socialCapital')}
            </div>
            <div class="big-num">{socialCapital} <span>{$t('members.pts')}</span></div>
            <div class="rank-badge">{socialRank}</div>
            <div class="bar"><div class="fill" style="width:{scProgress(socialCapital)}%"></div></div>
            <div class="bar-hint">{$t('members.nextRank')}: {scProgress(socialCapital)}%</div>
          </div>

          <div class="side-card">
            <div class="side-title">
              <iconify-icon icon="lucide:shield-check" width="18" style="color:{trustColor(trustScore)}"></iconify-icon>
              {$t('members.trustScore')}
            </div>
            <div class="trust-row">
              <div class="ring" style="border-color:{trustColor(trustScore)}; color:{trustColor(trustScore)}; background:{trustBg(trustScore)}">{trustScore}</div>
              <div>
                <div class="trust-main">{trustLabel(trustScore)}</div>
                <div class="trust-sub">{$t('members.trustScoreBased')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
{/if}

<ShareModal
  bind:open={shareOpen}
  url="/members/{member?.id}"
  title={displayName(member)}
  subtitle={$t('members.shareProfile')}
/>

<ContextAssistant
  bind:open={assistantOpen}
  contextKey="member"
  payload={{ member, followersCount, followingCount, socialCapital, trustScore }}
  title={$t('members.memberAssistant')}
/>

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
    overflow: hidden;
  }

  /* Not found */
  .not-found {
    min-height: 300px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #94a3b8;
  }
  .nf-title { font-weight: 900; font-size: 18px; color: #64748b; }
  .back-btn {
    margin-top: 8px;
    padding: 8px 18px;
    border-radius: 10px;
    background: #4f46e5;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    text-decoration: none;
  }
  .back-btn:hover { background: #4338ca; }

  /* Top card */
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
  .left { display: flex; gap: 18px; align-items: center; min-width: 0; }

  .avatar-wrap { position: relative; width: 92px; height: 92px; flex: 0 0 auto; }
  .avatar {
    width: 92px; height: 92px; border-radius: 999px; overflow: hidden;
    border: 4px solid #fff; box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
    background: #f1f5f9; display: grid; place-items: center;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .fallback { font-weight: 900; color: #0f172a; font-size: 20px; }
  .online-dot {
    position: absolute; width: 20px; height: 20px; right: 6px; bottom: 6px;
    border-radius: 999px; background: #94a3b8; border: 4px solid #fff;
  }
  .online-dot.online { background: #22c55e; }

  .info { min-width: 0; }
  .name { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; }
  .subtitle { margin-top: 2px; font-size: 14px; font-weight: 700; color: #64748b; }
  .meta { margin-top: 10px; display: flex; flex-wrap: wrap; gap: 14px; color: #94a3b8; font-weight: 800; font-size: 13px; }
  .meta-item { display: inline-flex; align-items: center; gap: 8px; }
  .dot { width: 8px; height: 8px; border-radius: 999px; background: #cbd5e1; }
  .meta-item.online-now { color: #16a34a; }
  .meta-item.online-now .dot { background: #22c55e; }
  .stats { margin-top: 12px; display: flex; gap: 28px; font-weight: 900; color: #0f172a; }

  /* Actions */
  .actions { display: flex; flex-direction: column; gap: 10px; flex: 0 0 auto; }
  .btn-follow {
    border: none; border-radius: 12px; padding: 10px 18px;
    background: #4f46e5; color: #fff; font-weight: 700; font-size: 13px;
    font-family: inherit; display: inline-flex; align-items: center; gap: 7px;
    cursor: pointer; transition: all 0.15s;
  }
  .btn-follow:hover { background: #4338ca; }
  .btn-follow.followed { background: #e2e8f0; color: #475569; }
  .btn-follow.followed :global(iconify-icon) { color: #475569; }
  .btn-follow:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-follow :global(iconify-icon) { color: #fff; }

  .action-row { display: flex; gap: 10px; justify-content: flex-end; }
  .icon-btn {
    width: 42px; height: 42px; border-radius: 12px;
    border: 1px solid #e2e8f0; background: #fff;
    display: grid; place-items: center; color: #64748b;
    cursor: pointer; transition: all 0.15s;
  }
  .icon-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Tabs */
  .tabs-row { margin-top: 16px; display: flex; align-items: center; gap: 6px; }
  .tabs { display: flex; gap: 6px; flex-wrap: wrap; }

  @media (max-width: 768px) {
    .tabs-row { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 4px; }
    .tabs-row::-webkit-scrollbar { display: none; }
    .tabs { flex-wrap: nowrap; }
  }

  .tab {
    height: 38px; padding: 0 14px; border-radius: 10px;
    border: 1px solid #e2e8f0; background: #fff; color: #64748b;
    font-family: inherit; font-weight: 600; font-size: 13px;
    cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
    text-decoration: none; transition: all 0.15s; white-space: nowrap; flex-shrink: 0;
  }
  .tab:hover { background: #f8fafc; border-color: #cbd5e1; }
  .tab.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }
  .tab.active :global(iconify-icon) { color: #fff; }
  .tab :global(iconify-icon) { color: #94a3b8; }

  /* Layout */
  .layout { margin-top: 16px; display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; }
  .main, .side { min-width: 0; }
  .side { position: sticky; top: 82px; display: flex; flex-direction: column; gap: 16px; }

  /* Side cards */
  .side-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px; }
  .side-card.purple { background: rgba(79, 70, 229, 0.06); border-color: rgba(79, 70, 229, 0.18); }
  .side-title { display: flex; align-items: center; gap: 10px; font-weight: 900; color: #0f172a; }
  .big-num { margin-top: 14px; font-size: 42px; font-weight: 900; color: #4f46e5; line-height: 1; }
  .big-num span { font-size: 14px; font-weight: 900; color: #64748b; margin-left: 6px; }
  .bar { margin-top: 12px; height: 8px; border-radius: 999px; background: rgba(15, 23, 42, 0.06); overflow: hidden; }
  .fill { height: 100%; background: #4f46e5; border-radius: 999px; }
  .rank-badge { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 8px; background: rgba(79, 70, 229, 0.12); color: #4f46e5; font-weight: 800; font-size: 12px; }
  .bar-hint { margin-top: 10px; color: #4f46e5; font-weight: 900; font-size: 12px; }
  .trust-row { margin-top: 14px; display: flex; gap: 14px; align-items: center; }
  .ring {
    width: 54px; height: 54px; border-radius: 999px; border: 4px solid;
    display: grid; place-items: center; font-weight: 900; flex: 0 0 auto;
  }
  .trust-main { font-weight: 900; color: #0f172a; }
  .trust-sub { font-weight: 800; color: #94a3b8; font-size: 12px; margin-top: 2px; }

  @media (max-width: 980px) {
    .top { flex-direction: column; align-items: flex-start; }
    .actions { width: 100%; flex-direction: row; justify-content: space-between; align-items: center; }
    .layout { grid-template-columns: 1fr; }
    .side { position: static; }
  }

  @media (max-width: 580px) {
    .page { padding: 20px 12px 40px; }
    .top { padding: 20px 16px; align-items: center; }
    .left { flex-direction: column; align-items: center; text-align: center; width: 100%; }
    .avatar-wrap { width: 80px; height: 80px; }
    .avatar { width: 80px; height: 80px; }
    .info { display: flex; flex-direction: column; align-items: center; }
    .name { font-size: 22px; }
    .meta { justify-content: center; gap: 8px 14px; font-size: 12px; }
    .stats { justify-content: center; gap: 20px; }
    .tab { height: 34px; padding: 0 10px; font-size: 12px; }
  }
</style>
