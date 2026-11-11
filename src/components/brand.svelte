<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";
  import { t } from "$lib/i18n";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  const brand = data?.brand;

  const answers = brand?.answers || {};
  const about = answers.about || {};
  const audience = answers.audience || {};
  const links = answers.links || {};
  const socials = links.socials || {};
  const contacts = links.contacts || {};
  const team = answers.team || [];

  // ✅ Новые блоки (если ты сохранил в answers)
  const problems = answers.problems || {};
  const pains: string[] = problems.pains || [];
  const solutions: string[] = problems.solutions || [];

  const clients = answers.clients || {};
  const potentialClients: string[] = clients.potential || [];

  const monetization = answers.monetization || {};
  const monetizationModels: string[] = monetization.models || [];

  const segments: string[] = audience.segments || [];

  function hasAny(arr?: any[]) {
    return Array.isArray(arr) && arr.length > 0;
  }

  function hasAnyText(obj: any) {
    if (!obj || typeof obj !== "object") return false;
    return Object.values(obj).some(Boolean);
  }

  const prettySocialLabel: Record<string, string> = {
    instagram: "Instagram",
    telegram: "Telegram",
    tiktok: "TikTok",
    youtube: "YouTube",
    linkedin: "LinkedIn"
  };
</script>

{#if !brand}
  <div class="wrap">
    <div class="muted">{$t('partners.brandDetail.notFound')}</div>
  </div>
{:else}
  <div class="wrap">
    <header class="head">
      {#if brand.logoUrl}
        <img class="logo" src={brand.logoUrl} alt="logo" />
      {/if}

      <div class="title">
        <h1>{brand.name}</h1>

        {#if brand.website}
          <a class="site" href={brand.website} target="_blank" rel="noreferrer">
            {brand.website}
          </a>
        {/if}
      </div>
    </header>

    <section class="card">
      <h2>{$t('partners.brandDetail.categories')}</h2>
      {#if brand.categories?.length}
        <div class="chips">
          {#each brand.categories as c}
            <span class="chip">{c.name}</span>
          {/each}
        </div>
      {:else}
        <div class="muted">{$t('partners.brandDetail.noCategories')}</div>
      {/if}
    </section>

    <section class="card">
      <h2>{$t('partners.brandDetail.about')}</h2>
      <p class="text">{about.description || "—"}</p>

      {#if about.products?.length}
        <h3>{$t('partners.brandDetail.productsServices')}</h3>
        <ul class="list">
          {#each about.products as p}
            <li>{p}</li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="card">
      <h2>{$t('partners.brandDetail.targetAudience')}</h2>

      <div class="grid">
        <div class="cell">
          <div class="label">{$t('partners.brandDetail.gender')}</div>
          <div class="value">
            {audience.gender?.length ? audience.gender.join(", ") : "—"}
          </div>
        </div>

        <div class="cell">
          <div class="label">{$t('partners.brandDetail.age')}</div>
          <div class="value">
            {audience.ageRange?.from ?? "—"} – {audience.ageRange?.to ?? "—"}
          </div>
        </div>

        <div class="cell">
          <div class="label">{$t('partners.brandDetail.geography')}</div>
          <div class="value">
            {audience.geo?.length ? audience.geo.join(", ") : "—"}
          </div>
        </div>

        <div class="cell">
          <div class="label">{$t('partners.brandDetail.interests')}</div>
          <div class="value">
            {audience.interests?.length ? audience.interests.join(", ") : "—"}
          </div>
        </div>
      </div>

      {#if hasAny(segments)}
        <h3>{$t('partners.brandDetail.audienceSegments')}</h3>
        <div class="chips">
          {#each segments as s}
            <span class="chip">{s}</span>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ✅ НОВОЕ: проблемы + решения -->
    {#if hasAny(pains) || hasAny(solutions)}
      <section class="card">
        <h2>{$t('partners.brandDetail.problemsSolutions')}</h2>

        <div class="split">
          <div class="mini">
            <div class="mini-title">{$t('partners.brandDetail.painPoints')}</div>
            {#if hasAny(pains)}
              <div class="chips">
                {#each pains as p}
                  <span class="chip">{p}</span>
                {/each}
              </div>
            {:else}
              <div class="muted">—</div>
            {/if}
          </div>

          <div class="mini">
            <div class="mini-title">{$t('partners.brandDetail.solutions')}</div>
            {#if hasAny(solutions)}
              <div class="chips">
                {#each solutions as s}
                  <span class="chip">{s}</span>
                {/each}
              </div>
            {:else}
              <div class="muted">—</div>
            {/if}
          </div>
        </div>
      </section>
    {/if}

    <!-- ✅ НОВОЕ: потенциальные клиенты -->
    {#if hasAny(potentialClients)}
      <section class="card">
        <h2>{$t('partners.brandDetail.potentialClients')}</h2>
        <div class="chips">
          {#each potentialClients as c}
            <span class="chip">{c}</span>
          {/each}
        </div>
      </section>
    {/if}

    <!-- ✅ НОВОЕ: монетизация -->
    {#if hasAny(monetizationModels)}
      <section class="card">
        <h2>{$t('partners.brandDetail.monetization')}</h2>
        <div class="chips">
          {#each monetizationModels as m}
            <span class="chip">{m}</span>
          {/each}
        </div>
      </section>
    {/if}

    <section class="card">
      <h2>{$t('partners.brandDetail.linksContacts')}</h2>

      {#if brand.website}
        <div class="row">
          <span class="label-inline">{$t('partners.brandDetail.website')}:</span>
          <a href={brand.website} target="_blank" rel="noreferrer">
            {brand.website}
          </a>
        </div>
      {/if}

      {#if hasAnyText(socials)}
        <div class="socials">
          {#each Object.entries(socials) as [k, v]}
            {#if v}
              <a class="social" href={v as string} target="_blank" rel="noreferrer">
                {prettySocialLabel[k] || k}
              </a>
            {/if}
          {/each}
        </div>
      {/if}

      {#if contacts.email}
        <div class="row">
          <span class="label-inline">Email:</span>
          <span>{contacts.email}</span>
        </div>
      {/if}

      {#if contacts.phone}
        <div class="row">
          <span class="label-inline">{$t('partners.brandDetail.phone')}:</span>
          <span>{contacts.phone}</span>
        </div>
      {/if}

      {#if !brand.website && !hasAnyText(socials) && !contacts.email && !contacts.phone}
        <div class="muted">{$t('partners.brandDetail.noLinks')}</div>
      {/if}
    </section>

    <section class="card">
      <h2>{$t('partners.brandDetail.team')}</h2>

      {#if team.length}
        <div class="team">
          {#each team as m}
            <div class="team-card">
              <div class="team-name">{m.name || "—"}</div>
              <div class="team-role">{m.role || "—"}</div>
              {#if m.email}
                <div class="team-email">{m.email}</div>
              {/if}
            </div>
          {/each}
        </div>
      {:else}
        <div class="muted">{$t('partners.brandDetail.noTeam')}</div>
      {/if}
    </section>

    <section class="card">
      <h2>{$t('partners.brandDetail.brandOwner')}</h2>

      <div class="owner">
        {#if brand.owner?.info?.photo}
          <img class="avatar" src={brand.owner.info.photo} alt="owner" />
        {/if}

        <div>
          <div class="owner-name">
            {brand.owner?.info?.name || brand.owner?.email}
          </div>

          {#if brand.owner?.info?.bio}
            <div class="muted">{brand.owner.info.bio}</div>
          {/if}

          {#if brand.owner?.info?.location}
            <div class="muted">{brand.owner.info.location}</div>
          {/if}
        </div>
      </div>
    </section>
  </div>
{/if}

<ContextAssistant
  contextKey="brand_unified"
  payload={{ brand }}
  title={$t('partners.brandDetail.assistant')}
/>

<style>
  .wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px;
    display: grid;
    gap: 18px;
    color: #0b3954;
  }

  .head {
    display: flex;
    gap: 18px;
    align-items: center;
    padding: 6px 2px;
  }

  .logo {
    width: 140px;
    height: 140px;
    border-radius: 18px;
    object-fit: cover;
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
    border: 1px solid rgba(0,0,0,0.06);
    background: #fff;
  }

  .title h1 {
    margin: 0;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: -0.3px;
  }

  .site {
    display: inline-block;
    margin-top: 6px;
    font-size: 14px;
    color: #0b3954;
    opacity: 0.8;
    word-break: break-all;
    text-decoration: underline;
  }

  .card {
    background: #fff;
    border-radius: 1rem;
    padding: 2rem;
    width: 100%;
    max-width: 1100px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(0, 0, 0, 0.05);
    color: #0b3954;
    transition: box-shadow 0.25s ease;
    position: relative;
  }
  .card:hover {
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  }

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 700;
  }
  h3 {
    margin: 14px 0 6px;
    font-size: 16px;
    font-weight: 700;
  }

  .muted {
    color: #0b3954;
    opacity: 0.6;
    font-size: 14px;
  }

  .text {
    font-size: 16px;
    line-height: 1.6;
    margin: 0;
  }

  .list {
    margin: 0;
    padding-left: 18px;
    display: grid;
    gap: 6px;
    font-size: 15px;
  }

  .chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 6px;
  }
  .chip {
    background: rgba(11,57,84,0.06);
    border: 1px solid rgba(11,57,84,0.12);
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .cell {
    background: rgba(11,57,84,0.04);
    border: 1px solid rgba(11,57,84,0.1);
    padding: 12px 14px;
    border-radius: 12px;
  }
  .label {
    font-size: 12px;
    opacity: 0.65;
    margin-bottom: 4px;
    font-weight: 600;
  }
  .value {
    font-size: 15px;
    font-weight: 600;
  }

  .row {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 15px;
  }
  .label-inline {
    font-size: 12px;
    opacity: 0.65;
    font-weight: 700;
  }

  .socials {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }
  .social {
    background: rgba(11,57,84,0.06);
    border: 1px solid rgba(11,57,84,0.12);
    padding: 7px 10px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    text-transform: capitalize;
    color: #0b3954;
    text-decoration: none;
  }

  .team {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 12px;
  }
  .team-card {
    background: rgba(11,57,84,0.04);
    border: 1px solid rgba(11,57,84,0.1);
    padding: 12px 14px;
    border-radius: 12px;
    display: grid;
    gap: 4px;
  }
  .team-name {
    font-weight: 700;
    font-size: 15px;
  }
  .team-role {
    opacity: 0.75;
    font-size: 14px;
    font-weight: 600;
  }
  .team-email {
    font-size: 13px;
    opacity: 0.8;
  }

  .owner {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 999px;
    object-fit: cover;
    border: 1px solid rgba(0,0,0,0.06);
  }
  .owner-name {
    font-weight: 700;
    font-size: 15px;
  }

  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-top: 10px;
  }
  @media (max-width: 820px) {
    .split {
      grid-template-columns: 1fr;
    }
  }
  .mini {
    background: rgba(11,57,84,0.04);
    border: 1px solid rgba(11,57,84,0.1);
    padding: 12px 14px;
    border-radius: 12px;
  }
  .mini-title {
    font-size: 12px;
    opacity: 0.75;
    font-weight: 800;
    margin-bottom: 6px;
  }
</style>
