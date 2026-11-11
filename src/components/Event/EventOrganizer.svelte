<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";

  export let data: any;

  const event = data?.event;
  const organizer = event?.organizer;
  const community = event?.community;
  const brand = event?.brand;

  function displayName(u: any) {
    return u?.info?.name ?? u?.email ?? t.get('events.detail.organizer');
  }

  function userPhoto(u: any) {
    return photoSrc(u?.info?.photo ?? null);
  }

  // Determine what type of organizer to show
  $: entity = community ?? brand ?? null;
  $: entityName = entity?.name ?? null;
  $: entityLogo = entity?.logoUrl ?? null;
  $: entityType = community
    ? t.get('events.detail.entityCommunity')
    : brand?.type === "PERSONAL"
      ? t.get('events.detail.entityPersonalBrand')
      : brand
        ? t.get('events.detail.entityCompany')
        : null;
  $: entityHref = community
    ? `/community/${community.id}`
    : brand
      ? `/partners/${brand.id}`
      : null;
</script>

<section class="card">
  <div class="head">
    <iconify-icon icon="lucide:megaphone" width="18" height="18"></iconify-icon>
    <span>{$t('events.detail.organizer')}</span>
  </div>

  {#if entity}
    <!-- Brand / Community organizer -->
    <a class="org" href={entityHref}>
      <div class="org-logo">
        {#if entityLogo}
          <img src={photoSrc(entityLogo)} alt={entityName} />
        {:else}
          <span class="org-fb">{entityName?.[0]?.toUpperCase() ?? "?"}</span>
        {/if}
      </div>
      <div class="org-text">
        <div class="org-name">{entityName}</div>
        <div class="org-type">{entityType}</div>
      </div>
    </a>

    <!-- Person who manages -->
    {#if organizer}
      <a class="manager" href={`/members/${organizer.id}`}>
        <div class="manager-av">
          {#if userPhoto(organizer)}
            <img src={userPhoto(organizer)} alt={displayName(organizer)} />
          {:else}
            <span class="fb">{displayName(organizer)[0].toUpperCase()}</span>
          {/if}
        </div>
        <div class="manager-text">
          <span class="manager-role">{$t('events.detail.eventManager')}</span>
          <span class="manager-name">{displayName(organizer)}</span>
        </div>
      </a>
    {/if}
  {:else if organizer}
    <!-- Personal organizer (no entity) -->
    <a class="org" href={`/members/${organizer.id}`}>
      <div class="org-av">
        {#if userPhoto(organizer)}
          <img src={userPhoto(organizer)} alt={displayName(organizer)} />
        {:else}
          <span class="org-fb">{displayName(organizer)[0].toUpperCase()}</span>
        {/if}
      </div>
      <div class="org-text">
        <div class="org-name">{displayName(organizer)}</div>
        <div class="org-type">{organizer?.info?.status ?? "member"}</div>
      </div>
    </a>
  {/if}
</section>

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 15px;
    color: #0f172a;
  }

  .head :global(iconify-icon) {
    color: #4f46e5;
  }

  /* --- Main organizer row --- */
  .org {
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    padding: 14px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: background 0.15s, border-color 0.15s;
    min-width: 0;
    overflow: hidden;
  }

  .org:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .org-logo {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 12px;
    overflow: hidden;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .org-logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .org-av {
    width: 48px;
    height: 48px;
    min-width: 48px;
    border-radius: 50%;
    overflow: hidden;
    background: #e2e8f0;
    border: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .org-av img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .org-fb {
    font-weight: 900;
    font-size: 16px;
    color: #64748b;
  }

  .org-text {
    min-width: 0;
    flex: 1;
  }

  .org-name {
    font-weight: 800;
    font-size: 15px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .org-type {
    font-weight: 600;
    font-size: 12px;
    color: #4f46e5;
    margin-top: 2px;
    text-transform: lowercase;
  }

  /* --- Manager sub-row --- */
  .manager {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid #f1f5f9;
    background: transparent;
    transition: background 0.12s;
    min-width: 0;
    overflow: hidden;
  }

  .manager:hover {
    background: #f8fafc;
  }

  .manager-av {
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    position: relative;
  }

  .manager-av img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fb {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 12px;
    color: #64748b;
  }

  .manager-text {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 13px;
  }

  .manager-role {
    color: #94a3b8;
    font-weight: 600;
    white-space: nowrap;
  }

  .manager-name {
    color: #0f172a;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
