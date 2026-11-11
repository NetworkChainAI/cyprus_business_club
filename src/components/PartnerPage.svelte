<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";
  import ShareModal from "./ShareModal.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  let shareOpen = false;

  const brand = data?.brand;
  const answers = brand?.answers || {};
  const about = answers.about || {};
  const audience = answers.audience || {};
  const links = answers.links || {};
  const socials = links.socials || {};
  const contacts = links.contacts || {};
  const team = answers.team || [];

  const problems = answers.problems || {};
  const pains: string[] = problems.pains || [];
  const solutions: string[] = problems.solutions || [];
  const clients = answers.clients || {};
  const potentialClients: string[] = clients.potential || [];
  const monetization = answers.monetization || {};
  const monetizationModels: string[] = monetization.models || [];
  const segments: string[] = audience.segments || [];

  let brokenPhotos: Record<string, boolean> = {};

  // Follow state
  let isFollowing = data?.isFollowing ?? false;
  let followersCount: number = data?.followersCount ?? 0;
  let followBusy = false;
  const currentUserId = data?.currentUserId;
  const isOwner = currentUserId && brand?.ownerId === currentUserId;

  async function toggleFollow() {
    if (!brand?.id || isOwner || !currentUserId) return;
    if (followBusy) return;

    followBusy = true;
    const was = isFollowing;
    isFollowing = !was;
    followersCount += was ? -1 : 1;

    try {
      const res = await fetch(`/api/brands/${brand.id}/follow`, {
        method: was ? "DELETE" : "POST",
      });
      if (!res.ok) {
        isFollowing = was;
        followersCount += was ? 1 : -1;
      }
    } catch {
      isFollowing = was;
      followersCount += was ? 1 : -1;
    } finally {
      followBusy = false;
    }
  }

  // Group tags by type
  const tagsByType: Record<string, string[]> = {};
  if (brand?.tags) {
    for (const t of brand.tags) {
      const type = t.tag.type;
      if (!tagsByType[type]) tagsByType[type] = [];
      tagsByType[type].push(t.tag.title);
    }
  }

  function hasAny(arr?: any[]) {
    return Array.isArray(arr) && arr.length > 0;
  }

  function hasAnyText(obj: any) {
    if (!obj || typeof obj !== "object") return false;
    return Object.values(obj).some(Boolean);
  }

  const socialIcons: Record<string, string> = {
    instagram: "lucide:instagram",
    telegram: "lucide:send",
    tiktok: "lucide:music",
    youtube: "lucide:youtube",
    linkedin: "lucide:linkedin",
  };

  const socialLabels: Record<string, string> = {
    instagram: "Instagram",
    telegram: "Telegram",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn",
  };
</script>

{#if !brand}
  <div class="page">
    <div class="empty-state">
      <iconify-icon icon="lucide:alert-circle" width="40" height="40"></iconify-icon>
      <div class="empty-title">{$t('partners.partnerPage.notFound')}</div>
    </div>
  </div>
{:else}
  <div class="page">
    <!-- Back link -->
    <a class="back" href="/partners">
      <iconify-icon icon="lucide:arrow-left" width="16" height="16"></iconify-icon>
      {$t('partners.title')}
    </a>

    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="logo">
          {#if brand.logoUrl}
            <img src={photoSrc(brand.logoUrl, 300)} alt={brand.name} />
          {:else}
            <div class="logo-fallback">
              {(brand.name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          {/if}
        </div>

        <div class="header-info">
          <div class="name-row">
            <h1>{brand.name}</h1>
            <span class="type-badge" class:personal={brand.type === "PERSONAL"}>
              <iconify-icon icon={brand.type === "PERSONAL" ? "lucide:user" : "lucide:building"} width="13" height="13"></iconify-icon>
              {brand.type === "PERSONAL" ? $t('partners.badge.personal') : $t('partners.badge.company')}
            </span>
          </div>

          {#if brand.website}
            <a class="website" href={brand.website} target="_blank" rel="noreferrer">
              <iconify-icon icon="lucide:globe" width="14" height="14"></iconify-icon>
              {brand.website.replace(/^https?:\/\//, "")}
            </a>
          {/if}

          {#if brand.categories?.length}
            <div class="header-cats">
              {#each brand.categories as c}
                <span class="chip">{c.name}</span>
              {/each}
            </div>
          {/if}

          {#if hasAnyText(socials) || contacts.email || contacts.phone}
            <div class="header-links">
              {#each Object.entries(socials) as [key, url]}
                {#if url}
                  <a class="social-icon" href={url} target="_blank" rel="noreferrer" title={socialLabels[key] ?? key}>
                    <iconify-icon icon={socialIcons[key] ?? "lucide:link"} width="18" height="18"></iconify-icon>
                  </a>
                {/if}
              {/each}
              {#if contacts.email}
                <a class="social-icon" href="mailto:{contacts.email}" title={contacts.email}>
                  <iconify-icon icon="lucide:mail" width="18" height="18"></iconify-icon>
                </a>
              {/if}
              {#if contacts.phone}
                <a class="social-icon" href="tel:{contacts.phone}" title={contacts.phone}>
                  <iconify-icon icon="lucide:phone" width="18" height="18"></iconify-icon>
                </a>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      {#if currentUserId && !isOwner}
        <div class="header-actions">
          <button
            class="btn-follow"
            class:followed={isFollowing}
            disabled={followBusy}
            on:click={toggleFollow}
          >
            <iconify-icon
              icon={isFollowing ? "lucide:heart-off" : "lucide:heart"}
              width="16"
              height="16"
            ></iconify-icon>
            {isFollowing ? $t('partners.unfollow') : $t('partners.follow')}
          </button>
          <button class="btn-share" type="button" on:click={() => (shareOpen = true)}>
            <iconify-icon icon="lucide:share-2" width="16" height="16"></iconify-icon>
            {$t('partners.partnerPage.share')}
          </button>
          <span class="followers-count">
            <iconify-icon icon="lucide:users" width="14" height="14"></iconify-icon>
            {followersCount} {$t('partners.followers')}
          </span>
        </div>
      {:else}
        <div class="header-actions">
          <button class="btn-share" type="button" on:click={() => (shareOpen = true)}>
            <iconify-icon icon="lucide:share-2" width="16" height="16"></iconify-icon>
            {$t('partners.partnerPage.share')}
          </button>
          {#if followersCount > 0}
            <span class="followers-count">
              <iconify-icon icon="lucide:users" width="14" height="14"></iconify-icon>
              {followersCount} {$t('partners.followers')}
            </span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- About -->
    {#if about.description || hasAny(about.products)}
      <div class="section">
        <h2>
          <iconify-icon icon="lucide:info" width="18" height="18"></iconify-icon>
          {$t('partners.partnerPage.about')}
        </h2>
        <div class="card">
          {#if about.description}
            <p class="desc">{about.description}</p>
          {/if}

          {#if hasAny(about.products)}
            <div class="sub-title">{$t('partners.partnerPage.productsServices')}</div>
            <div class="tag-list">
              {#each about.products as p}
                <span class="tag">{p}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Audience -->
    {#if audience.gender?.length || audience.ageRange?.from || audience.geo?.length || audience.interests?.length || hasAny(segments)}
      <div class="section">
        <h2>
          <iconify-icon icon="lucide:target" width="18" height="18"></iconify-icon>
          {$t('partners.partnerPage.targetAudience')}
        </h2>
        <div class="card">
          <div class="stats-grid">
            {#if audience.gender?.length}
              <div class="stat-item">
                <div class="stat-label">{$t('partners.partnerPage.gender')}</div>
                <div class="stat-value">{audience.gender.join(", ")}</div>
              </div>
            {/if}
            {#if audience.ageRange?.from || audience.ageRange?.to}
              <div class="stat-item">
                <div class="stat-label">{$t('partners.partnerPage.ageRange')}</div>
                <div class="stat-value">{audience.ageRange?.from ?? "?"} – {audience.ageRange?.to ?? "?"}</div>
              </div>
            {/if}
            {#if audience.geo?.length}
              <div class="stat-item">
                <div class="stat-label">{$t('partners.partnerPage.geography')}</div>
                <div class="stat-value">{audience.geo.join(", ")}</div>
              </div>
            {/if}
            {#if audience.interests?.length}
              <div class="stat-item">
                <div class="stat-label">{$t('partners.partnerPage.interests')}</div>
                <div class="stat-value">{audience.interests.join(", ")}</div>
              </div>
            {/if}
          </div>

          {#if hasAny(segments)}
            <div class="sub-title">{$t('partners.partnerPage.audienceSegments')}</div>
            <div class="tag-list">
              {#each segments as s}
                <span class="tag">{s}</span>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    <!-- Problems & Solutions -->
    {#if hasAny(pains) || hasAny(solutions)}
      <div class="section">
        <h2>
          <iconify-icon icon="lucide:lightbulb" width="18" height="18"></iconify-icon>
          {$t('partners.partnerPage.problemsSolutions')}
        </h2>
        <div class="split">
          <div class="card split-card">
            <div class="split-label">
              <iconify-icon icon="lucide:alert-triangle" width="14" height="14"></iconify-icon>
              {$t('partners.partnerPage.painPoints')}
            </div>
            {#if hasAny(pains)}
              <div class="tag-list">
                {#each pains as p}
                  <span class="tag red">{p}</span>
                {/each}
              </div>
            {:else}
              <div class="muted">{$t('partners.partnerPage.notSpecified')}</div>
            {/if}
          </div>

          <div class="card split-card">
            <div class="split-label">
              <iconify-icon icon="lucide:check-circle" width="14" height="14"></iconify-icon>
              {$t('partners.partnerPage.solutions')}
            </div>
            {#if hasAny(solutions)}
              <div class="tag-list">
                {#each solutions as s}
                  <span class="tag green">{s}</span>
                {/each}
              </div>
            {:else}
              <div class="muted">{$t('partners.partnerPage.notSpecified')}</div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <!-- Potential Clients -->
    {#if hasAny(potentialClients)}
      <div class="section">
        <h2>
          <iconify-icon icon="lucide:users" width="18" height="18"></iconify-icon>
          {$t('partners.partnerPage.potentialClients')}
        </h2>
        <div class="card">
          <div class="tag-list">
            {#each potentialClients as c}
              <span class="tag">{c}</span>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Monetization -->
    {#if hasAny(monetizationModels)}
      <div class="section">
        <h2>
          <iconify-icon icon="lucide:coins" width="18" height="18"></iconify-icon>
          {$t('partners.partnerPage.monetization')}
        </h2>
        <div class="card">
          <div class="tag-list">
            {#each monetizationModels as m}
              <span class="tag">{m}</span>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    <!-- Team -->
    {#if team.length > 0}
      <div class="section">
        <h2>
          <iconify-icon icon="lucide:users-2" width="18" height="18"></iconify-icon>
          {$t('partners.partnerPage.team')}
        </h2>
        <div class="team-grid">
          {#each team as m}
            {#if m.userId}
              <a class="team-card team-card-link" href="/members/{m.userId}">
                <div class="team-avatar">
                  {#if m.photo && !brokenPhotos[m.userId]}
                    <img src={photoSrc(m.photo, 64)} alt="" on:error={() => (brokenPhotos = { ...brokenPhotos, [m.userId]: true })} />
                  {:else}
                    {(m.name || "?")[0].toUpperCase()}
                  {/if}
                </div>
                <div class="team-info">
                  <div class="team-name">
                    {m.name || "—"}
                    <iconify-icon icon="lucide:badge-check" width="13" height="13" style="color:#4f46e5;"></iconify-icon>
                  </div>
                  <div class="team-role">{m.role || "—"}</div>
                </div>
                <iconify-icon icon="lucide:chevron-right" width="14" height="14" style="color:#94a3b8;margin-left:auto;flex-shrink:0;"></iconify-icon>
              </a>
            {:else}
              <div class="team-card">
                <div class="team-avatar">
                  {(m.name || "?")[0].toUpperCase()}
                </div>
                <div class="team-info">
                  <div class="team-name">{m.name || "—"}</div>
                  <div class="team-role">{m.role || "—"}</div>
                  {#if m.email}
                    <div class="team-email">{m.email}</div>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}

    <!-- Owner -->
    <div class="section">
      <h2>
        <iconify-icon icon="lucide:crown" width="18" height="18"></iconify-icon>
        {$t('partners.partnerPage.brandOwner')}
      </h2>
      <a class="owner-card" href="/members/{brand.owner?.id}">
        <div class="owner-avatar">
          {#if brand.owner?.info?.photo && !brokenPhotos["owner"]}
            <img src={photoSrc(brand.owner.info.photo, 128)} alt="" on:error={() => (brokenPhotos = { ...brokenPhotos, owner: true })} />
          {:else}
            <div class="owner-avatar-fallback">
              {(brand.owner?.info?.name || brand.owner?.email || "?")[0].toUpperCase()}
            </div>
          {/if}
        </div>
        <div class="owner-info">
          <div class="owner-name">{brand.owner?.info?.name || brand.owner?.email}</div>
          {#if brand.owner?.info?.status}
            <div class="owner-status">{brand.owner.info.status}</div>
          {/if}
          {#if brand.owner?.info?.location}
            <div class="owner-loc">
              <iconify-icon icon="lucide:map-pin" width="12" height="12"></iconify-icon>
              {brand.owner.info.location}
            </div>
          {/if}
        </div>
        <iconify-icon icon="lucide:chevron-right" width="16" height="16" style="color:#94a3b8;margin-left:auto;"></iconify-icon>
      </a>
    </div>
  </div>
{/if}

<ShareModal
  bind:open={shareOpen}
  url="/partners/{brand?.id}"
  title={brand?.name ?? ""}
  subtitle={$t('partners.partnerPage.sharePartner')}
/>

<ContextAssistant
  contextKey="brand"
  payload={{ brand }}
  title={$t('partners.partnerPage.assistant')}
/>

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

  /* ============ HEADER ============ */
  .header {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .header-left {
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }

  .logo {
    width: 88px;
    height: 88px;
    border-radius: 18px;
    overflow: hidden;
    border: 2px solid #e2e8f0;
    flex: 0 0 auto;
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
    font-size: 28px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.8);
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

  .type-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    background: #dbeafe;
    color: #1e40af;
  }

  .type-badge.personal {
    background: #fef3c7;
    color: #92400e;
  }

  .website {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .website:hover {
    opacity: 0.7;
  }

  .header-cats {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .header-links {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }

  .social-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    display: grid;
    place-items: center;
    color: #64748b;
    text-decoration: none;
    transition: all 0.15s;
  }

  .social-icon:hover {
    background: rgba(79, 70, 229, 0.06);
    border-color: rgba(79, 70, 229, 0.25);
    color: #4f46e5;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
  }

  .btn-follow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    border: none;
    background: #4f46e5;
    color: #fff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-follow:hover {
    background: #4338ca;
  }

  .btn-follow:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-follow.followed {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-follow.followed:hover {
    background: #cbd5e1;
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
  }

  .btn-share:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .followers-count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #64748b;
  }

  .chip {
    height: 26px;
    padding: 0 10px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
  }

  /* ============ SECTIONS ============ */
  .section {
    margin-bottom: 20px;
  }

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 12px;
  }

  h2 :global(iconify-icon) {
    color: #4f46e5;
  }

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
  }

  .desc {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
    line-height: 1.65;
    margin: 0;
  }

  .sub-title {
    font-size: 12px;
    font-weight: 900;
    color: #94a3b8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 16px 0 8px;
  }

  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .tag {
    height: 28px;
    padding: 0 12px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #475569;
    font-size: 12px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
  }

  .tag.red {
    background: #fef2f2;
    color: #991b1b;
  }

  .tag.green {
    background: #f0fdf4;
    color: #166534;
  }

  /* ============ STATS GRID ============ */
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .stat-item {
    padding: 14px;
    background: #f8fafc;
    border-radius: 12px;
    border: 1px solid #f1f5f9;
  }

  .stat-label {
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .stat-value {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  /* ============ SPLIT ============ */
  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .split-card {
    padding: 18px;
  }

  .split-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 10px;
  }

  .muted {
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
  }

  /* ============ TEAM ============ */
  .team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }

  .team-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .team-card-link {
    text-decoration: none;
    color: inherit;
    transition: all 0.15s;
    cursor: pointer;
  }

  .team-card-link:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
  }

  .team-avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 16px;
    flex: 0 0 auto;
    overflow: hidden;
  }

  .team-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .team-name {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  .team-role {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    margin-top: 1px;
  }

  .team-email {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* ============ OWNER ============ */
  .owner-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    color: inherit;
    transition: all 0.15s;
  }

  .owner-card:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
  }

  .owner-avatar {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    overflow: hidden;
    flex: 0 0 auto;
    border: 1px solid #e2e8f0;
  }

  .owner-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .owner-avatar-fallback {
    width: 100%;
    height: 100%;
    background: #4f46e5;
    color: #fff;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 18px;
  }

  .owner-name {
    font-weight: 800;
    font-size: 15px;
    color: #0f172a;
  }

  .owner-status {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    margin-top: 1px;
  }

  .owner-loc {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 3px;
  }

  /* ============ EMPTY ============ */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 60px 20px;
    color: #94a3b8;
  }

  .empty-title {
    font-weight: 800;
    font-size: 16px;
    color: #64748b;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 720px) {
    .header-left {
      flex-direction: column;
    }

    h1 {
      font-size: 22px;
    }

    .split {
      grid-template-columns: 1fr;
    }

    .stats-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
