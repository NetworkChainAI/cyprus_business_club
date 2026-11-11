<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";
  import AskAiButton from "./AskAiButton.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  let assistantOpen = false;

  let member = data?.member;
  const currentUserId = data?.currentUserId ?? null;

  let tab:
    | "about"
    | "interests"
    | "companies"
    | "events"
    | "followers"
    | "following"
    | "mutuals" = "about";

  function displayName(u: any) {
    return u?.info?.name ?? u?.email ?? "User";
  }

  function resolvePhoto(u: any, width?: number) {
    return photoSrc(u?.info?.photo ?? null, width);
  }

  let photoBroken = false;

  function statusText(u: any) {
    return u?.info?.status ?? "Member";
  }

  function locationText(u: any) {
    return u?.info?.location ?? "Remote";
  }

  function formatJoined(dateLike: any) {
    const d = new Date(dateLike);
    return d.toLocaleDateString(getDateLocale(), { month: "long", year: "numeric" });
  }

  function lastSeenInfo(lastOnline: any) {
    if (!lastOnline) return { text: `${t.get('members.lastSeen')} recently`, isOnline: false };

    const last = new Date(lastOnline).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - last);

    const mins = Math.floor(diff / 60000);
    if (mins < 2) return { text: t.get('members.online'), isOnline: true };
    if (mins < 60) return { text: `${t.get('members.lastSeen')} ${mins}m ${t.get('members.ago')}`, isOnline: false };

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { text: `${t.get('members.lastSeen')} ${hrs}h ${t.get('members.ago')}`, isOnline: false };

    const days = Math.floor(hrs / 24);
    return { text: `${t.get('members.lastSeen')} ${days}d ${t.get('members.ago')}`, isOnline: false };
  }

  $: ls = lastSeenInfo(member?.lastOnline);

  const followers = data?.followersCount ?? 0;
  const following = data?.followingCount ?? 0;

  const socialCapital = 850;
  const trustScore = 98;

  const upcomingEvents = data?.upcomingEvents ?? [];
  const visitedEvents = data?.visitedEvents ?? [];
  const createdEvents = data?.createdEvents ?? [];

  const isMe = !!(currentUserId && member?.id === currentUserId);

  let followBusy = false;
  let chatBusy = false;

  async function toggleFollow() {
    if (!member?.id || isMe) return;
    if (followBusy) return;

    followBusy = true;

    const was = !!member.isFollowing;

    member = { ...member, isFollowing: !was };

    try {
      const res = await fetch("/api/member/follow", {
        method: was ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      });

      if (!res.ok) {
        member = { ...member, isFollowing: was };
      }
    } catch (e) {
      member = { ...member, isFollowing: was };
    } finally {
      followBusy = false;
    }
  }

  async function openChat() {
    if (!member?.id || isMe) return;
    if (chatBusy) return;

    chatBusy = true;

    try {
      const res = await fetch("/api/chat/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.id }),
      });

      if (!res.ok) return;

      const { chatId } = await res.json();

      goto(`/chat/${chatId}`);
    } catch (e) {
      // ignore
    } finally {
      chatBusy = false;
    }
  }
</script>

<section class="page">
  <div class="container">
    <!-- TOP PROFILE CARD -->
    <div class="top">
      <div class="left">
        <div class="avatarWrap">
          <div class="avatar">
            {#if resolvePhoto(member, 200) && !photoBroken}
              <img src={resolvePhoto(member, 200)} alt={displayName(member)} decoding="async" on:error={() => (photoBroken = true)} />
            {:else}
              <div class="fallback">{displayName(member)[0].toUpperCase()}</div>
            {/if}
          </div>
          <div class="onlineDot" title="Online status"></div>
        </div>

        <div class="info">
          <div class="nameRow">
            <div class="name">{displayName(member)}</div>
            <span class="verified" title="Verified">
              <iconify-icon icon="lucide:badge-check" width="18"></iconify-icon>
            </span>
          </div>

          <div class="subtitle">
            Organizing Web3 Summit <span class="globe">🌐</span>
          </div>

          <div class="meta">
            <span class="metaItem" class:onlineNow={ls.isOnline}>
              <span class="dot"></span>
              {ls.text}
            </span>

            <span class="metaItem">
              <iconify-icon icon="lucide:map-pin" width="14"></iconify-icon>
              {locationText(member)}
            </span>

            <span class="metaItem">
              <iconify-icon icon="lucide:calendar" width="14"></iconify-icon>
              Joined {formatJoined(member?.createdAt)}
            </span>
          </div>

          <div class="stats">
            <div class="stat">
              <span class="n">{followers}</span> {$t('members.followers')}
            </div>
            <div class="stat">
              <span class="n">{following}</span> {$t('members.followingTab')}
            </div>
          </div>
        </div>
      </div>

      <div class="actions">
        {#if !isMe}
          <button
            class="btnFollow"
            class:followed={member?.isFollowing}
            disabled={followBusy}
            on:click={toggleFollow}
          >
            <iconify-icon
              icon={member?.isFollowing
                ? "lucide:user-check"
                : "lucide:user-plus"}
              width="18"
            ></iconify-icon>
            {member?.isFollowing ? $t('members.following') : $t('members.follow')}
          </button>
        {/if}

        <div class="actionRow">
          <button
            class="iconBtn"
            title="Message"
            disabled={isMe || chatBusy}
            on:click={openChat}
          >
            <iconify-icon icon="lucide:message-square" width="18"
            ></iconify-icon>
          </button>

          <button class="iconBtn" title="Gift">
            <iconify-icon icon="lucide:gift" width="18"></iconify-icon>
          </button>

          <AskAiButton on:click={() => (assistantOpen = true)} />
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="tabs">
      <button class:active={tab === "about"} on:click={() => (tab = "about")}
        >{$t('members.about')}</button
      >
      <button
        class:active={tab === "interests"}
        on:click={() => (tab = "interests")}>{$t('members.interests')}</button
      >
      <button
        class:active={tab === "companies"}
        on:click={() => (tab = "companies")}>{$t('members.companies')}</button
      >
      <button class:active={tab === "events"} on:click={() => (tab = "events")}
        >{$t('members.events')}</button
      >
      <button
        class:active={tab === "followers"}
        on:click={() => (tab = "followers")}>{$t('members.followersTab')}</button
      >
      <button
        class:active={tab === "following"}
        on:click={() => (tab = "following")}>{$t('members.followingTab')}</button
      >
      <button
        class:active={tab === "mutuals"}
        on:click={() => (tab = "mutuals")}>Mutuals</button
      >
    </div>

    <!-- LAYOUT -->
    <div class="layout">
      <!-- MAIN -->
      <div class="main">
        {#if tab === "about"}
          <div class="card">
            <div class="cardTitle">{$t('members.about')}</div>
            <div class="text">
              {#if member?.info?.bio}
                {member.info.bio}
              {:else}
                No bio available.
              {/if}
            </div>

            <div class="subCard">
              <div class="subHead">WORKS AT</div>
              <div class="companyRow">
                <div class="companyIcon">
                  <iconify-icon icon="lucide:building-2" width="18"
                  ></iconify-icon>
                </div>
                <div class="companyTxt">
                  <div class="companyName">TechEvents Inc.</div>
                  <div class="companyRole">CEO</div>
                </div>
              </div>
            </div>

            <div class="langs">
              <div class="langTitle">Languages</div>
              <div class="langPill">
                <iconify-icon icon="lucide:globe" width="14"></iconify-icon>
                English
              </div>
            </div>
          </div>
        {/if}

        {#if tab === "events"}
          <div class="card">
            <div class="cardTitle">{$t('members.events')}</div>

            <div class="blockTitle">Upcoming</div>
            {#if upcomingEvents.length === 0}
              <div class="muted">No upcoming events.</div>
            {:else}
              <div class="eventList">
                {#each upcomingEvents as ev (ev.id)}
                  <a class="ev" href={`/events/${ev.id}`}>
                    <div class="evTitle">{ev.title}</div>
                    <div class="evMeta">
                      {new Date(ev.date).toLocaleDateString(getDateLocale(), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      · {ev.location}
                    </div>
                  </a>
                {/each}
              </div>
            {/if}

            <div class="blockTitle" style="margin-top:16px;">Visited</div>
            {#if visitedEvents.length === 0}
              <div class="muted">No visited events.</div>
            {:else}
              <div class="eventList">
                {#each visitedEvents as ev (ev.id)}
                  <a class="ev" href={`/events/${ev.id}`}>
                    <div class="evTitle">{ev.title}</div>
                    <div class="evMeta">
                      {new Date(ev.date).toLocaleDateString(getDateLocale(), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      · {ev.location}
                    </div>
                  </a>
                {/each}
              </div>
            {/if}

            <div class="blockTitle" style="margin-top:16px;">Created</div>
            {#if createdEvents.length === 0}
              <div class="muted">No created events.</div>
            {:else}
              <div class="eventList">
                {#each createdEvents as ev (ev.id)}
                  <a class="ev" href={`/events/${ev.id}`}>
                    <div class="evTitle">{ev.title}</div>
                    <div class="evMeta">
                      {new Date(ev.date).toLocaleDateString(getDateLocale(), {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      · {ev.location}
                    </div>
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if tab !== "about" && tab !== "events"}
          <div class="card">
            <div class="cardTitle">{tab[0].toUpperCase() + tab.slice(1)}</div>
            <div class="muted">This section is not connected yet.</div>
          </div>
        {/if}
      </div>

      <!-- SIDE -->
      <div class="side">
        <div class="sideCard purple">
          <div class="sideTitle">
            <iconify-icon icon="lucide:trophy" width="18"></iconify-icon>
            Social Capital
          </div>

          <div class="bigNum">{socialCapital} <span>pts</span></div>

          <div class="bar">
            <div
              class="fill"
              style={`width:${Math.min(100, (socialCapital / 1000) * 100)}%`}
            ></div>
          </div>

          <div class="hint">Top 15% in Community</div>
        </div>

        <div class="sideCard">
          <div class="sideTitle">
            <iconify-icon
              icon="lucide:shield-check"
              width="18"
              style="color:#16a34a;"
            ></iconify-icon>
            Trust Score
          </div>

          <div class="trustRow">
            <div class="ring">{trustScore}</div>
            <div>
              <div class="trustMain">Highly Trusted</div>
              <div class="trustSub">Based on verified activity</div>
            </div>
          </div>

          <div class="divider"></div>

          <div class="proofTitle">SOCIAL PROOF</div>
          <div class="proofRow">
            <span>References</span><b>12</b>
          </div>
          <div class="proofRow">
            <span>Achievements</span><b>5</b>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<ContextAssistant
  bind:open={assistantOpen}
  contextKey="member"
  payload={{ member, followers, following, socialCapital, trustScore }}
  title="Member Assistant"
/>

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  /* TOP */
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

  .left {
    display: flex;
    gap: 18px;
    align-items: center;
    min-width: 0;
  }

  .avatarWrap {
    position: relative;
    width: 92px;
    height: 92px;
    flex: 0 0 auto;
  }

  .avatar {
    width: 92px;
    height: 92px;
    border-radius: 999px;
    overflow: hidden;
    border: 4px solid #fff;
    box-shadow: 0 14px 30px rgba(15, 23, 42, 0.12);
    background: #f1f5f9;
    display: grid;
    place-items: center;
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .fallback {
    font-weight: 900;
    color: #0f172a;
    font-size: 20px;
  }

  .onlineDot {
    position: absolute;
    width: 20px;
    height: 20px;
    right: 6px;
    bottom: 6px;
    border-radius: 999px;
    background: #94a3b8;
    border: 4px solid #fff;
  }

  .info {
    min-width: 0;
  }

  .nameRow {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .name {
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .verified {
    color: rgb(79 70 229);
    display: inline-flex;
    align-items: center;
  }

  .subtitle {
    margin-top: 2px;
    font-size: 14px;
    font-weight: 700;
    color: #64748b;
  }

  .meta {
    margin-top: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    color: #94a3b8;
    font-weight: 800;
    font-size: 13px;
  }

  .metaItem {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #cbd5e1;
    display: inline-block;
  }

  .stats {
    margin-top: 12px;
    display: flex;
    gap: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .stat .n {
    color: #0f172a;
  }

  .actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 0 0 auto;
  }

  .btnFollow {
    border: none;
    border-radius: 12px;
    padding: 12px 18px;
    background: #4f46e5;
    color: #fff;
    font-weight: 700;
    font-size: 14px;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btnFollow:hover {
    background: #4338ca;
  }
  .btnFollow.followed {
    background: #e2e8f0;
    color: #475569;
  }

  .btnFollow:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .actionRow {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }

  .iconBtn {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: grid;
    place-items: center;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
  }

  .iconBtn:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }
  .metaItem.onlineNow {
    color: #16a34a;
  }

  .metaItem.onlineNow .dot {
    background: #22c55e;
  }

  /* TABS */
  .tabs {
    margin-top: 16px;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
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

  /* LAYOUT */
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

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
  }

  .cardTitle {
    font-weight: 900;
    color: #0f172a;
    font-size: 18px;
    margin-bottom: 10px;
  }

  .text {
    color: #334155;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.6;
  }

  .subCard {
    margin-top: 16px;
    background: #f8fafc;
    border: 1px solid #eef2f7;
    border-radius: 16px;
    padding: 14px;
  }

  .subHead {
    color: #94a3b8;
    font-weight: 900;
    font-size: 12px;
    letter-spacing: 0.08em;
  }

  .companyRow {
    margin-top: 10px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .companyIcon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(79, 70, 229, 0.12);
    display: grid;
    place-items: center;
    color: rgb(79 70 229);
    flex: 0 0 auto;
  }

  .companyName {
    font-weight: 900;
    color: #0f172a;
  }

  .companyRole {
    font-weight: 800;
    color: #94a3b8;
    font-size: 12px;
  }

  .langs {
    margin-top: 18px;
  }

  .langTitle {
    font-weight: 900;
    color: #0f172a;
    margin-bottom: 10px;
  }

  .langPill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 999px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    font-weight: 900;
    color: #0f172a;
    font-size: 12px;
  }

  /* SIDE CARDS */
  .side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    position: sticky;
    top: 82px;
  }

  .sideCard {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 18px;
  }

  .sideCard.purple {
    background: rgba(79, 70, 229, 0.06);
    border-color: rgba(79, 70, 229, 0.18);
  }

  .sideTitle {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    color: #0f172a;
  }

  .bigNum {
    margin-top: 14px;
    font-size: 42px;
    font-weight: 900;
    color: rgb(79 70 229);
    line-height: 1;
  }

  .bigNum span {
    font-size: 14px;
    font-weight: 900;
    color: #64748b;
    margin-left: 6px;
  }

  .bar {
    margin-top: 12px;
    height: 8px;
    border-radius: 999px;
    background: rgba(15, 23, 42, 0.06);
    overflow: hidden;
  }

  .fill {
    height: 100%;
    background: rgb(79 70 229);
    border-radius: 999px;
  }

  .hint {
    margin-top: 10px;
    color: rgb(79 70 229);
    font-weight: 900;
    font-size: 12px;
  }

  .trustRow {
    margin-top: 14px;
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .ring {
    width: 54px;
    height: 54px;
    border-radius: 999px;
    border: 4px solid #22c55e;
    display: grid;
    place-items: center;
    font-weight: 900;
    color: #166534;
    background: rgba(34, 197, 94, 0.08);
    flex: 0 0 auto;
  }

  .trustMain {
    font-weight: 900;
    color: #0f172a;
  }

  .trustSub {
    font-weight: 800;
    color: #94a3b8;
    font-size: 12px;
    margin-top: 2px;
  }

  .divider {
    margin: 16px 0;
    height: 1px;
    background: #eef2f7;
  }

  .proofTitle {
    font-weight: 900;
    color: #94a3b8;
    font-size: 12px;
    letter-spacing: 0.08em;
  }

  .proofRow {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    font-weight: 900;
    color: #0f172a;
  }

  .muted {
    color: #94a3b8;
    font-weight: 800;
  }

  .blockTitle {
    font-weight: 900;
    color: #0f172a;
    margin: 12px 0 10px;
  }

  .eventList {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .ev {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 12px;
    text-decoration: none;
    background: #fff;
    transition:
      border-color 150ms ease,
      box-shadow 150ms ease;
  }

  .ev:hover {
    border-color: rgba(79, 70, 229, 0.35);
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
  }

  .evTitle {
    font-weight: 900;
    color: #0f172a;
  }

  .evMeta {
    margin-top: 4px;
    color: #64748b;
    font-weight: 800;
    font-size: 12px;
  }

  @media (max-width: 980px) {
    .top {
      flex-direction: column;
      align-items: flex-start;
    }

    .actions {
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }

    .layout {
      grid-template-columns: 1fr;
    }

    .side {
      position: static;
    }
  }
</style>
