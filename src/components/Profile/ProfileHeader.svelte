<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import { formatDate as fmtDate } from "$lib/utils/dateLocale";

  export let data: any;

  const user = data?.user;

  function displayName(u: any) {
    return u?.info?.name ?? u?.email ?? t.get('profile.header.defaultUser');
  }

  function resolvePhoto(u: any, width?: number) {
    return photoSrc(u?.info?.photo ?? null, width);
  }

  let photoBroken = false;

  function lastSeenInfo(lastOnline: any) {
    if (!lastOnline) return { text: t.get('profile.header.lastSeenRecently'), isOnline: false };

    const last = new Date(lastOnline).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - last);

    const mins = Math.floor(diff / 60000);
    if (mins < 2) return { text: t.get('profile.header.online'), isOnline: true };
    if (mins < 60) return { text: `${t.get('profile.header.lastSeen')} ${mins} ${t.get('profile.header.minutesAgo')}`, isOnline: false };

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { text: `${t.get('profile.header.lastSeen')} ${hrs} ${t.get('profile.header.hoursAgo')}`, isOnline: false };

    const days = Math.floor(hrs / 24);
    return { text: `${t.get('profile.header.lastSeen')} ${days} ${t.get('profile.header.daysAgo')}`, isOnline: false };
  }

  function joinedText(dateLike: any) {
    return fmtDate(dateLike, { month: "long", year: "numeric" });
  }

  const followers = data?.followersCount ?? 0;
  const following = data?.followingCount ?? 0;

  $: ls = lastSeenInfo(user?.lastOnline);
</script>

<div class="top">
  <div class="left">
    <div class="avatarWrap">
      <div class="avatar">
        {#if resolvePhoto(user, 200) && !photoBroken}
          <img src={resolvePhoto(user, 200)} alt={displayName(user)} decoding="async" on:error={() => (photoBroken = true)} />
        {:else}
          <div class="fallback">{displayName(user)[0].toUpperCase()}</div>
        {/if}
      </div>

      <div class="statusDot" class:online={ls.isOnline} title={ls.text}></div>
    </div>

    <div class="info">
      <div class="name">{displayName(user)}</div>
      <div class="subtitle">{user?.info?.status ?? $t('profile.header.defaultStatus')}</div>

      <div class="meta">
        <span class="metaItem" class:onlineNow={ls.isOnline}>
          <span class="dot"></span>
          {ls.text}
        </span>

        <span class="metaItem">
          <iconify-icon icon="lucide:map-pin" width="14"></iconify-icon>
          {user?.info?.location ?? $t('profile.header.defaultLocation')}
        </span>

        <span class="metaItem">
          <iconify-icon icon="lucide:calendar" width="14"></iconify-icon>
          {$t('profile.header.joined')} {joinedText(user?.createdAt)}
        </span>
      </div>

      <div class="stats">
        <div class="stat"><span class="n">{followers}</span> {$t('profile.header.followers')}</div>
        <div class="stat"><span class="n">{following}</span> {$t('profile.header.following')}</div>
      </div>
    </div>
  </div>

  <!-- <div class="actions">
    <a class="edit" href="/settings/profile">Edit Profile</a>
  </div> -->
</div>

<style>
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

  .statusDot {
    position: absolute;
    width: 20px;
    height: 20px;
    right: 6px;
    bottom: 6px;
    border-radius: 999px;
    background: #94a3b8;
    border: 4px solid #fff;
  }

  .statusDot.online {
    background: #22c55e;
  }

  .info {
    min-width: 0;
  }

  .name {
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.02em;
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

  .metaItem.onlineNow {
    color: #16a34a;
  }
  .metaItem.onlineNow .dot {
    background: #22c55e;
  }

  .stats {
    margin-top: 12px;
    display: flex;
    gap: 28px;
    font-weight: 900;
    color: #0f172a;
  }

  .actions {
    flex: 0 0 auto;
  }

  .edit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 18px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    font-weight: 700;
    font-size: 14px;
    color: #0f172a;
    text-decoration: none;
    transition: all 0.15s;
  }

  .edit:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  @media (max-width: 980px) {
    .top {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (max-width: 580px) {
    .top {
      padding: 20px 16px;
      align-items: center;
    }

    .left {
      flex-direction: column;
      align-items: center;
      text-align: center;
      width: 100%;
    }

    .avatarWrap {
      width: 80px;
      height: 80px;
    }

    .avatar {
      width: 80px;
      height: 80px;
    }

    .statusDot {
      width: 18px;
      height: 18px;
      right: 2px;
      bottom: 2px;
      border-width: 3px;
    }

    .info {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .name {
      font-size: 22px;
    }

    .subtitle {
      font-size: 13px;
    }

    .meta {
      justify-content: center;
      gap: 8px 14px;
      font-size: 12px;
    }

    .stats {
      justify-content: center;
      gap: 20px;
      font-size: 14px;
    }

    .actions {
      width: 100%;
    }

    .edit {
      width: 100%;
      justify-content: center;
      padding: 10px 16px;
      font-size: 13px;
    }
  }
</style>
