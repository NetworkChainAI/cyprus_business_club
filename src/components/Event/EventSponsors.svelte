<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";

  export let data: any;

  const event = data?.event;
  const community = event?.community;
  const brand = event?.brand;
  const sponsors: any[] = event?.sponsors ?? [];

  // Show this card only when event is associated with an entity or has sponsors
  $: hasEntity = !!community || !!brand;
  $: hasSponsors = sponsors.length > 0;
  $: showCard = hasEntity || hasSponsors;

  function sponsorName(s: any): string {
    if (s.brand) return s.brand.name;
    return s.name ?? t.get('events.detail.sponsorFallback');
  }

  function sponsorLogo(s: any): string | null {
    if (s.brand?.logoUrl) return photoSrc(s.brand.logoUrl);
    if (s.logoUrl) return photoSrc(s.logoUrl);
    return null;
  }

  function sponsorHref(s: any): string | null {
    if (s.brandId) return `/partners/${s.brandId}`;
    return null;
  }
</script>

{#if showCard}
  <section class="card">
    {#if hasEntity}
      <div class="head">
        <iconify-icon icon="lucide:building" width="18" height="18"></iconify-icon>
        <span>{$t('events.detail.hostedBy')}</span>
      </div>

      {#if community}
        <a class="entity" href={`/community/${community.id}`}>
          <div class="logo">
            {#if community.logoUrl}
              <img src={photoSrc(community.logoUrl)} alt={community.name} />
            {:else}
              <span class="logo-fb">{community.name[0].toUpperCase()}</span>
            {/if}
          </div>
          <div class="info">
            <div class="name">{community.name}</div>
            <div class="type">{$t('events.detail.entityCommunity')}</div>
          </div>
        </a>
      {/if}

      {#if brand}
        <a class="entity" href={`/partners/${brand.id}`}>
          <div class="logo">
            {#if brand.logoUrl}
              <img src={photoSrc(brand.logoUrl)} alt={brand.name} />
            {:else}
              <span class="logo-fb">{brand.name[0].toUpperCase()}</span>
            {/if}
          </div>
          <div class="info">
            <div class="name">{brand.name}</div>
            <div class="type">{brand.type === "PERSONAL" ? $t('events.detail.entityPersonalBrand') : $t('events.detail.entityCompany')}</div>
          </div>
        </a>
      {/if}
    {/if}

    {#if hasSponsors}
      {#if hasEntity}
        <div class="divider"></div>
      {/if}

      <div class="head">
        <iconify-icon icon="lucide:heart-handshake" width="18" height="18"></iconify-icon>
        <span>{$t('events.detail.sponsors')}</span>
        <span class="count">{sponsors.length}</span>
      </div>

      {#each sponsors as s}
        {@const href = sponsorHref(s)}
        {@const logo = sponsorLogo(s)}
        {@const name = sponsorName(s)}

        <svelte:element
          this={href ? "a" : "div"}
          class="entity"
          {...href ? { href } : {}}
        >
          <div class="logo">
            {#if logo}
              <img src={logo} alt={name} />
            {:else}
              <span class="logo-fb">{name[0].toUpperCase()}</span>
            {/if}
          </div>
          <div class="info">
            <div class="name">{name}</div>
            <div class="type">{$t('events.detail.sponsorLabel')}</div>
          </div>
          {#if href}
            <iconify-icon icon="lucide:arrow-up-right" width="14" height="14" class="arrow"></iconify-icon>
          {/if}
        </svelte:element>
      {/each}
    {/if}
  </section>
{/if}

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
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

  .entity {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    padding: 12px;
    border-radius: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    transition: background 0.15s, border-color 0.15s;
    min-width: 0;
    overflow: hidden;
  }

  .entity:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .logo {
    width: 40px;
    height: 40px;
    min-width: 40px;
    border-radius: 10px;
    overflow: hidden;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .logo-fb {
    font-weight: 900;
    font-size: 15px;
    color: #64748b;
  }

  .info {
    min-width: 0;
  }

  .name {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .type {
    font-weight: 600;
    font-size: 12px;
    color: #4f46e5;
    margin-top: 2px;
  }

  .divider {
    height: 1px;
    background: #e2e8f0;
  }

  .count {
    margin-left: auto;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 800;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 8px;
  }

  .entity :global(.arrow) {
    color: #94a3b8;
    flex-shrink: 0;
    margin-left: auto;
    transition: color 0.15s;
  }

  a.entity:hover :global(.arrow) {
    color: #4f46e5;
  }
</style>
