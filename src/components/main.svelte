<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";
  import { withLang } from "$lib/utils/withLang";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "./ContextAssistant.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  export let data: any;

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString(getDateLocale(), {
      month: "short",
      day: "numeric",
    });
  }

  function resolvePhoto(photo: string | null, width?: number) {
    return photoSrc(photo, width);
  }

  function initial(name: string) {
    return (name || "?")[0].toUpperCase();
  }

  let brokenEventPhotos: Record<string, boolean> = {};
  let brokenMemberPhotos: Record<string, boolean> = {};
  let brokenBrandLogos: Record<string, boolean> = {};
  let brokenCommunityLogos: Record<string, boolean> = {};

  const ranks = [
    { name: "Explorer I", range: "0–299", color: "#3b82f6" },
    { name: "Explorer II", range: "300–599", color: "#3b82f6" },
    { name: "Explorer III", range: "600–899", color: "#3b82f6" },
    { name: "Mentor I", range: "900–1199", color: "#a855f7" },
    { name: "Mentor II", range: "1200–1499", color: "#a855f7" },
    { name: "Leader I", range: "1500–1999", color: "#f59e0b" },
    { name: "Leader II", range: "2000+", color: "#f59e0b" },
  ];

  $: earnActions = [
    { icon: "lucide:calendar-plus", label: $t('home.reputation.createEvent'), points: "+30" },
    { icon: "lucide:user-plus", label: $t('home.reputation.getFollowers'), points: "+3" },
    { icon: "lucide:wallet", label: $t('home.reputation.openWallet'), points: "+20" },
    { icon: "lucide:users", label: $t('home.reputation.joinCommunity'), points: "+5" },
  ];

  $: aiFeatures = [
    { icon: "lucide:message-square", label: $t('home.tech.ai.feat1') },
    { icon: "lucide:search", label: $t('home.tech.ai.feat2') },
    { icon: "lucide:lightbulb", label: $t('home.tech.ai.feat3') },
  ];

  $: web3Features = [
    { icon: "lucide:credit-card", label: $t('home.tech.wallet.feat1') },
    { icon: "lucide:arrow-left-right", label: $t('home.tech.wallet.feat2') },
    { icon: "lucide:shield", label: $t('home.tech.wallet.feat3') },
  ];
</script>

<main class="page">
  <!-- Hero -->
  <section class="hero">
    <div class="hero-content">
      {#if $t('home.hero.badge')}
      <div class="hero-badge">
        <iconify-icon icon="lucide:globe" width="14"></iconify-icon>
        {$t('home.hero.badge')}
      </div>
      {/if}
      <h1>{@html $t('home.hero.title')}</h1>
      <p class="hero-sub">
        {$t('home.hero.subtitle')}
      </p>
      <div class="hero-actions">
        <a href={withLang('/login')} class="btn btn-primary">
          {$t('home.hero.getStarted')}
          <iconify-icon icon="lucide:arrow-right" width="16"></iconify-icon>
        </a>
        <a href={withLang('/events')} class="btn btn-ghost">
          <iconify-icon icon="lucide:calendar-days" width="16"></iconify-icon>
          {$t('home.hero.browseEvents')}
        </a>
      </div>
    </div>

    <div class="hero-visual" aria-hidden="true">
      <div class="hero-glow"></div>
      <div class="hero-grid-bg"></div>

      <div class="hero-pill hp-1">
        <iconify-icon icon="lucide:sparkles" width="14"></iconify-icon> {$t('home.pills.ai')}
      </div>
      <div class="hero-pill hp-2">
        <iconify-icon icon="lucide:wallet" width="14"></iconify-icon> {$t('home.pills.wallet')}
      </div>
      <div class="hero-pill hp-3">
        <iconify-icon icon="lucide:calendar-days" width="14"></iconify-icon> {$t('home.pills.events')}
      </div>
      <div class="hero-pill hp-4">
        <iconify-icon icon="lucide:message-circle" width="14"></iconify-icon> {$t('home.pills.chat')}
      </div>

      <div class="hero-card hc-1">
        <div class="hc-icon members-icon">
          <iconify-icon icon="lucide:users" width="18"></iconify-icon>
        </div>
        <div>
          <div class="hc-stat">{data.stats.members}+</div>
          <div class="hc-label">{$t('home.heroCards.activeMembers')}</div>
        </div>
      </div>

      <div class="hero-card hc-2">
        <div class="hc-icon events-icon">
          <iconify-icon icon="lucide:calendar-check" width="18"></iconify-icon>
        </div>
        <div>
          <div class="hc-stat">{data.stats.events}</div>
          <div class="hc-label">{$t('home.heroCards.eventsHosted')}</div>
        </div>
      </div>

      <div class="hero-card hc-3">
        <div class="hc-icon brands-icon">
          <iconify-icon icon="lucide:building-2" width="18"></iconify-icon>
        </div>
        <div>
          <div class="hc-stat">{data.stats.brands}</div>
          <div class="hc-label">{$t('home.heroCards.partners')}</div>
        </div>
      </div>

      <div class="hero-card hc-4">
        <div class="hc-icon comm-icon">
          <iconify-icon icon="lucide:heart-handshake" width="18"></iconify-icon>
        </div>
        <div>
          <div class="hc-stat">{data.stats.communities}</div>
          <div class="hc-label">{$t('home.heroCards.communities')}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats -->
  <section class="stats-strip">
    <div class="stat-item">
      <iconify-icon icon="lucide:users" width="20"></iconify-icon>
      <div class="stat-num">{data.stats.members}</div>
      <div class="stat-label">{$t('home.stats.members')}</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <iconify-icon icon="lucide:calendar" width="20"></iconify-icon>
      <div class="stat-num">{data.stats.events}</div>
      <div class="stat-label">{$t('home.stats.events')}</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <iconify-icon icon="lucide:building-2" width="20"></iconify-icon>
      <div class="stat-num">{data.stats.brands}</div>
      <div class="stat-label">{$t('home.stats.partners')}</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <iconify-icon icon="lucide:heart-handshake" width="20"></iconify-icon>
      <div class="stat-num">{data.stats.communities}</div>
      <div class="stat-label">{$t('home.stats.communities')}</div>
    </div>
  </section>

  <!-- Events -->
  {#if data.events.length > 0}
    <section class="section">
      <div class="section-head">
        <div>
          <h2>{$t('home.sections.upcomingEvents')}</h2>
          <p class="section-sub">{$t('home.sections.upcomingEventsSub')}</p>
        </div>
        <a href={withLang('/events')} class="btn btn-ghost btn-sm">
          {$t('home.sections.allEvents')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </a>
      </div>

      <div class="events-grid">
        {#each data.events as event, i (event.id)}
          <a href={withLang(`/events/${event.id}`)} class="event-card" class:featured={i === 0}>
            <div class="event-img">
              {#if resolvePhoto(event.photo, 400) && !brokenEventPhotos[event.id]}
                <img
                  src={resolvePhoto(event.photo, 400)}
                  alt={event.title}
                  loading="lazy"
                  decoding="async"
                  on:error={() => (brokenEventPhotos = { ...brokenEventPhotos, [event.id]: true })}
                />
              {:else}
                <div class="event-img-placeholder">
                  <iconify-icon icon="lucide:calendar-days" width="32"></iconify-icon>
                </div>
              {/if}
              <div class="event-img-overlay"></div>
              <div class="event-date-badge">
                <span class="edb-day">{new Date(event.date).getDate()}</span>
                <span class="edb-month">{new Date(event.date).toLocaleDateString(getDateLocale(), { month: "short" })}</span>
              </div>
              <div class="event-price" class:free={!event.price}>
                {event.price ? `€${event.price}` : $t('home.event.free')}
              </div>
              {#if i === 0}
                <div class="event-featured-badge">
                  <iconify-icon icon="lucide:star" width="11"></iconify-icon>
                  {$t('home.event.featured')}
                </div>
              {/if}
            </div>
            <div class="event-body">
              <h3>{event.title}</h3>
              {#if event.categories.length > 0}
                <div class="event-cats">
                  {#each event.categories.slice(0, 2) as cat}
                    <span class="cat-chip">{cat}</span>
                  {/each}
                </div>
              {/if}
              <div class="event-meta">
                <span class="meta-item">
                  <iconify-icon icon="lucide:map-pin" width="13"></iconify-icon>
                  {event.location}
                </span>
                <span class="meta-item">
                  <iconify-icon icon="lucide:clock" width="13"></iconify-icon>
                  {formatDate(event.date)}
                </span>
              </div>
              {#if event.goingCount > 0}
                <div class="event-going">
                  <iconify-icon icon="lucide:users" width="12"></iconify-icon>
                  {event.goingCount} {$t('home.event.going')}
                </div>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Partners -->
  {#if data.brands.length > 0}
    <section class="section">
      <div class="section-head">
        <div>
          <h2>{$t('home.sections.ourPartners')}</h2>
          <p class="section-sub">{$t('home.sections.ourPartnersSub')}</p>
        </div>
        <a href={withLang('/partners')} class="btn btn-ghost btn-sm">
          {$t('home.sections.allPartners')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </a>
      </div>

      <div class="brands-grid">
        {#each data.brands as brand (brand.id)}
          <a href={withLang(`/partners/${brand.id}`)} class="brand-card">
            <div class="brand-logo">
              {#if brand.logoUrl && !brokenBrandLogos[brand.id]}
                <img
                  src={resolvePhoto(brand.logoUrl, 120)}
                  alt={brand.name}
                  loading="lazy"
                  decoding="async"
                  on:error={() => (brokenBrandLogos = { ...brokenBrandLogos, [brand.id]: true })}
                />
              {:else}
                <span class="brand-initial">{initial(brand.name)}</span>
              {/if}
            </div>
            <div class="brand-info">
              <div class="brand-name">{brand.name}</div>
              <div class="brand-meta">
                {#if brand.type}
                  <span class="brand-type" class:company={brand.type === "COMPANY"}>
                    <iconify-icon icon={brand.type === "COMPANY" ? "lucide:building-2" : "lucide:user"} width="11"></iconify-icon>
                    {brand.type === "COMPANY" ? $t('home.event.company') : $t('home.event.personal')}
                  </span>
                {/if}
                {#if brand.category}
                  <span class="brand-cat">{brand.category}</span>
                {/if}
              </div>
            </div>
            <iconify-icon icon="lucide:chevron-right" width="16" class="brand-arrow"></iconify-icon>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Communities -->
  {#if data.communities.length > 0}
    <section class="section">
      <div class="section-head">
        <div>
          <h2>{$t('home.sections.communities')}</h2>
          <p class="section-sub">{$t('home.sections.communitiesSub')}</p>
        </div>
        <a href={withLang('/communities')} class="btn btn-ghost btn-sm">
          {$t('home.sections.allCommunities')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </a>
      </div>

      <div class="communities-grid">
        {#each data.communities as community (community.id)}
          <a href={withLang(`/communities/${encodeURIComponent(community.name)}`)} class="community-card">
            <div class="community-cover">
              {#if community.logoUrl && !brokenCommunityLogos[community.id]}
                <img
                  src={resolvePhoto(community.logoUrl, 200)}
                  alt={community.name}
                  loading="lazy"
                  decoding="async"
                  on:error={() => (brokenCommunityLogos = { ...brokenCommunityLogos, [community.id]: true })}
                />
              {:else}
                <div class="community-cover-fallback">
                  <iconify-icon icon="lucide:users" width="28"></iconify-icon>
                </div>
              {/if}
              <div class="community-privacy-badge" class:private={community.isPrivate}>
                <iconify-icon icon={community.isPrivate ? "lucide:lock" : "lucide:globe"} width="11"></iconify-icon>
                {community.isPrivate ? $t('home.community.private') : $t('home.community.public')}
              </div>
            </div>
            <div class="community-body">
              <div class="community-name">{community.name}</div>
              <div class="community-members-pill">
                <iconify-icon icon="lucide:users" width="12"></iconify-icon>
                {community.memberCount} {$t('home.community.members')}
              </div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Members -->
  {#if data.members.length > 0}
    <section class="section">
      <div class="section-head">
        <div>
          <h2>{$t('home.sections.communityMembers')}</h2>
          <p class="section-sub">{$t('home.sections.communityMembersSub')}</p>
        </div>
        <a href={withLang('/members')} class="btn btn-ghost btn-sm">
          {$t('home.sections.allMembers')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </a>
      </div>

      <div class="members-grid">
        {#each data.members as member (member.id)}
          <a href={withLang(`/members/${member.id}`)} class="member-card">
            <div class="member-avatar">
              {#if resolvePhoto(member.photo, 128) && !brokenMemberPhotos[member.id]}
                <img
                  src={resolvePhoto(member.photo, 128)}
                  alt={member.name}
                  loading="lazy"
                  decoding="async"
                  on:error={() => (brokenMemberPhotos = { ...brokenMemberPhotos, [member.id]: true })}
                />
              {:else}
                <span class="member-initial">{initial(member.name)}</span>
              {/if}
            </div>
            <div class="member-name">{member.name}</div>
            <div class="member-status">{member.status}</div>
            {#if member.followers > 0}
              <div class="member-followers">{member.followers} {$t('home.member.followers')}</div>
            {/if}
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Reputation & Ranks -->
  <section class="section">
    <div class="rep-card">
      <div class="section-head">
        <div>
          <h2>
            <iconify-icon icon="lucide:trophy" width="22"></iconify-icon>
            {$t('home.reputation.title')}
          </h2>
          <p class="section-sub">{$t('home.reputation.subtitle')}</p>
        </div>
        <a href={withLang('/reputation')} class="btn btn-ghost btn-sm">
          {$t('home.reputation.learnMore')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </a>
      </div>

      <div class="ranks-row">
        {#each ranks as rank}
          <div class="rank-badge" style="--rank-color: {rank.color}">
            <span class="rank-name">{rank.name}</span>
            <span class="rank-range">{rank.range} SC</span>
          </div>
        {/each}
      </div>

      <h3 class="earn-title">
        <iconify-icon icon="lucide:sparkles" width="16"></iconify-icon>
        {$t('home.reputation.earnTitle')}
      </h3>

      <div class="earn-row">
        {#each earnActions as action}
          <div class="earn-item">
            <div class="earn-icon">
              <iconify-icon icon={action.icon} width="18"></iconify-icon>
            </div>
            <span class="earn-label">{action.label}</span>
            <span class="earn-points">{action.points}</span>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Platform Technologies -->
  <section class="section">
    <div class="section-head center">
      <h2>{$t('home.tech.title')}</h2>
      <p class="section-sub">{$t('home.tech.subtitle')}</p>
    </div>

    <div class="tech-grid">
      <div class="tech-card">
        <div class="tech-head">
          <div class="tech-icon ai">
            <iconify-icon icon="lucide:bot" width="24"></iconify-icon>
          </div>
          <div>
            <h3>{$t('home.tech.ai.title')}</h3>
            <p class="tech-desc">{$t('home.tech.ai.desc')}</p>
          </div>
        </div>
        <div class="tech-features">
          {#each aiFeatures as f}
            <div class="tech-feat">
              <iconify-icon icon={f.icon} width="16"></iconify-icon>
              <span>{f.label}</span>
            </div>
          {/each}
        </div>
        <a href={withLang('/technologies')} class="btn btn-ghost btn-sm tech-btn">
          {$t('home.tech.learnMore')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </a>
      </div>

      <div class="tech-card">
        <div class="tech-head">
          <div class="tech-icon web3">
            <iconify-icon icon="lucide:wallet" width="24"></iconify-icon>
          </div>
          <div>
            <h3>{$t('home.tech.wallet.title')}</h3>
            <p class="tech-desc">{$t('home.tech.wallet.desc')}</p>
          </div>
        </div>
        <div class="tech-features">
          {#each web3Features as f}
            <div class="tech-feat">
              <iconify-icon icon={f.icon} width="16"></iconify-icon>
              <span>{f.label}</span>
            </div>
          {/each}
        </div>
        <a href={withLang('/technologies')} class="btn btn-ghost btn-sm tech-btn">
          {$t('home.tech.learnMore')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        </a>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="cta">
    <div class="cta-inner">
      <iconify-icon icon="lucide:rocket" width="28"></iconify-icon>
      <h2>{$t('home.cta.title')}</h2>
      <p>{$t('home.cta.subtitle')}</p>
      <div class="cta-actions">
        <a href={withLang('/register')} class="btn btn-primary btn-lg">
          {$t('home.cta.createAccount')}
          <iconify-icon icon="lucide:arrow-right" width="16"></iconify-icon>
        </a>
        <a href={withLang('/events')} class="btn btn-ghost">{$t('home.cta.exploreEvents')}</a>
      </div>
    </div>
  </section>
</main>

<ContextAssistant contextKey="global" payload={{}} title="Platform Assistant" />

<style>
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 18px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* ============ HERO ============ */
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
    padding: 60px 0 48px;
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 999px;
    padding: 5px 14px;
    margin-bottom: 16px;
  }

  h1 {
    font-size: 42px;
    font-weight: 900;
    color: #0f172a;
    line-height: 1.12;
    margin: 0 0 14px;
    letter-spacing: -0.02em;
  }

  .hero-sub {
    font-size: 16px;
    color: #64748b;
    line-height: 1.6;
    margin: 0 0 24px;
    max-width: 440px;
  }

  .hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }

  .hero-visual {
    position: relative;
    min-height: 320px;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0f9ff 100%);
    overflow: hidden;
  }

  .hero-glow {
    position: absolute;
    inset: -40%;
    background:
      radial-gradient(circle at 30% 30%, rgba(79, 70, 229, 0.08), transparent 55%),
      radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.08), transparent 55%);
    filter: blur(20px);
  }

  .hero-grid-bg {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(circle at 40% 40%, black 30%, transparent 70%);
  }

  /* Hero floating pills */
  .hero-pill {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(226, 232, 240, 0.6);
    backdrop-filter: blur(8px);
    color: #4f46e5;
    animation: float 6s ease-in-out infinite;
  }

  .hp-1 { top: 18px; left: 16px; animation-delay: 0s; }
  .hp-2 { top: 18px; right: 16px; color: #3b82f6; animation-delay: 1.5s; }
  .hp-3 { top: 56px; left: 50%; transform: translateX(-50%); color: #059669; animation-delay: 3s; }
  .hp-4 { top: 56px; right: 24px; color: #a855f7; animation-delay: 4.5s; }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  .hp-3 {
    animation: float3 6s ease-in-out 3s infinite;
  }

  @keyframes float3 {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(-6px); }
  }

  /* Hero stat cards */
  .hero-card {
    position: absolute;
    border-radius: 14px;
    border: 1px solid rgba(226, 232, 240, 0.8);
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .hc-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .members-icon { background: rgba(79, 70, 229, 0.1); color: #4f46e5; }
  .events-icon { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  .brands-icon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
  .comm-icon { background: rgba(16, 185, 129, 0.1); color: #10b981; }

  .hc-1 { bottom: 20px; left: 20px; }
  .hc-2 { bottom: 20px; right: 20px; }
  .hc-3 { bottom: 84px; left: 20px; }
  .hc-4 { bottom: 84px; right: 20px; }

  .hc-stat { font-size: 20px; font-weight: 900; color: #0f172a; line-height: 1; }
  .hc-label { font-size: 11px; color: #94a3b8; font-weight: 600; }

  /* ============ STATS ============ */
  .stats-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 32px;
    padding: 24px 0;
    border-top: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    margin-bottom: 16px;
  }

  .stat-item { display: flex; align-items: center; gap: 10px; }
  .stat-item :global(iconify-icon) { color: #4f46e5; }
  .stat-num { font-size: 22px; font-weight: 900; color: #0f172a; }
  .stat-label { font-size: 13px; font-weight: 600; color: #94a3b8; }
  .stat-divider { width: 1px; height: 28px; background: #e2e8f0; }

  /* ============ SECTIONS ============ */
  .section { padding: 40px 0; }

  .section-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
  }

  .section-head.center {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  h2 { font-size: 22px; font-weight: 900; color: #0f172a; margin: 0; }
  .section-sub { font-size: 14px; color: #64748b; margin: 4px 0 0; }

  /* ============ BUTTONS ============ */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-decoration: none;
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    border-radius: 12px;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-primary { background: #4f46e5; color: #fff; }
  .btn-primary:hover { background: #4338ca; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3); transform: translateY(-1px); }
  .btn-ghost { background: #fff; color: #0f172a; border: 1px solid #e2e8f0; }
  .btn-ghost:hover { background: #f8fafc; border-color: #cbd5e1; }
  .btn-sm { padding: 7px 14px; font-size: 13px; border-radius: 10px; }
  .btn-lg { padding: 12px 24px; font-size: 15px; }

  /* ============ EVENTS ============ */
  .events-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .event-card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.25s ease;
  }

  .event-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
    border-color: #c7d2fe;
  }

  .event-card.featured {
    grid-column: span 2;
  }

  .event-card.featured .event-img { height: 220px; }

  .event-card.featured .event-body h3 { font-size: 18px; }

  .event-img {
    position: relative;
    height: 170px;
    overflow: hidden;
    background: #f1f5f9;
  }

  .event-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .event-card:hover .event-img img { transform: scale(1.05); }

  .event-img-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: linear-gradient(to top, rgba(15, 23, 42, 0.15), transparent);
    pointer-events: none;
  }

  .event-img-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cbd5e1;
    background: linear-gradient(135deg, #f1f5f9, #eef2ff);
  }

  .event-date-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-radius: 10px;
    padding: 6px 10px;
    line-height: 1;
    border: 1px solid rgba(255, 255, 255, 0.5);
  }

  .edb-day { font-size: 18px; font-weight: 900; color: #0f172a; }
  .edb-month { font-size: 11px; font-weight: 700; color: #4f46e5; text-transform: uppercase; }

  .event-price {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 12px;
    font-weight: 700;
    padding: 5px 10px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.65);
    color: #fff;
    backdrop-filter: blur(8px);
  }

  .event-price.free {
    background: rgba(5, 150, 105, 0.85);
  }

  .event-featured-badge {
    position: absolute;
    bottom: 10px;
    left: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 8px;
    background: rgba(245, 158, 11, 0.9);
    color: #fff;
    backdrop-filter: blur(8px);
  }

  .event-body {
    padding: 14px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .event-body h3 {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .event-cats { display: flex; gap: 4px; flex-wrap: wrap; }
  .cat-chip {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    background: #eef2ff;
    color: #4f46e5;
  }

  .event-meta { display: flex; flex-direction: column; gap: 3px; margin-top: auto; }
  .meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #64748b; font-weight: 600; }
  .meta-item :global(iconify-icon) { color: #94a3b8; }

  .event-going {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 700;
    color: #059669;
    background: rgba(5, 150, 105, 0.06);
    padding: 3px 8px;
    border-radius: 6px;
    width: fit-content;
    margin-top: 2px;
  }

  /* ============ BRANDS / PARTNERS ============ */
  .brands-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  .brand-card {
    display: flex;
    align-items: center;
    gap: 14px;
    text-decoration: none;
    color: inherit;
    padding: 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    transition: all 0.25s ease;
  }

  .brand-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    border-color: #c7d2fe;
  }

  .brand-logo {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .brand-logo img { width: 100%; height: 100%; object-fit: cover; }

  .brand-initial {
    font-size: 20px;
    font-weight: 900;
    color: #4f46e5;
  }

  .brand-info { flex: 1; min-width: 0; }

  .brand-name {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .brand-meta {
    margin-top: 4px;
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .brand-type {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    background: #f1f5f9;
    color: #64748b;
  }

  .brand-type.company {
    background: rgba(79, 70, 229, 0.06);
    color: #4f46e5;
  }

  .brand-cat {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
  }

  .brand-card :global(.brand-arrow) {
    color: #cbd5e1;
    flex-shrink: 0;
    transition: color 0.15s, transform 0.15s;
  }

  .brand-card:hover :global(.brand-arrow) {
    color: #4f46e5;
    transform: translateX(2px);
  }

  /* ============ COMMUNITIES ============ */
  .communities-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .community-card {
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
    text-decoration: none;
    color: inherit;
    transition: all 0.25s ease;
  }

  .community-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
    border-color: #c7d2fe;
  }

  .community-cover {
    position: relative;
    height: 100px;
    overflow: hidden;
    background: linear-gradient(135deg, #eef2ff, #f0f9ff, #ecfdf5);
  }

  .community-cover img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .community-card:hover .community-cover img { transform: scale(1.05); }

  .community-cover-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a5b4fc;
  }

  .community-privacy-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(6px);
    color: #22c55e;
  }

  .community-privacy-badge.private { color: #f59e0b; }

  .community-body {
    padding: 12px 14px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .community-name {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .community-members-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
  }

  .community-members-pill :global(iconify-icon) { color: #94a3b8; }

  /* ============ MEMBERS ============ */
  .members-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .member-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: inherit;
    padding: 20px 12px 16px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    transition: all 0.25s ease;
    text-align: center;
  }

  .member-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    border-color: #c7d2fe;
  }

  .member-avatar {
    position: relative;
    width: 56px;
    height: 56px;
    min-width: 56px;
    min-height: 56px;
    border-radius: 50%;
    overflow: hidden;
    background: #eef2ff;
    border: 2px solid #e2e8f0;
  }

  .member-avatar img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .member-initial {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 18px;
    color: #4f46e5;
  }

  .member-name {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .member-status {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .member-followers { font-size: 11px; color: #94a3b8; font-weight: 600; }

  /* ============ REPUTATION ============ */
  .rep-card {
    background: linear-gradient(135deg, #eef2ff, #f0f9ff, #ecfdf5);
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 32px;
  }

  .rep-card h2 {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .rep-card h2 :global(iconify-icon) { color: #f59e0b; }

  .ranks-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 20px;
  }

  .rank-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 10px 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid color-mix(in srgb, var(--rank-color) 20%, transparent);
    flex: 1;
    min-width: 100px;
    text-align: center;
    transition: all 0.2s ease;
  }

  .rank-badge:hover {
    background: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px color-mix(in srgb, var(--rank-color) 15%, transparent);
  }

  .rank-name {
    font-size: 13px;
    font-weight: 800;
    color: var(--rank-color);
  }

  .rank-range {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
  }

  .earn-title {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    margin: 24px 0 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .earn-title :global(iconify-icon) { color: #4f46e5; }

  .earn-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  .earn-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 14px 10px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.85);
    border: 1px solid rgba(226, 232, 240, 0.6);
    text-align: center;
    transition: all 0.2s ease;
  }

  .earn-item:hover {
    background: #fff;
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  }

  .earn-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
    display: grid;
    place-items: center;
  }

  .earn-label {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
  }

  .earn-points {
    font-size: 14px;
    font-weight: 900;
    color: #4f46e5;
    background: rgba(79, 70, 229, 0.08);
    padding: 2px 10px;
    border-radius: 8px;
  }

  /* ============ TECHNOLOGIES ============ */
  .tech-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .tech-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: all 0.25s ease;
  }

  .tech-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
  }

  .tech-head {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .tech-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .tech-icon.ai {
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.15);
    color: #4f46e5;
  }

  .tech-icon.web3 {
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.15);
    color: #3b82f6;
  }

  .tech-head h3 {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }

  .tech-desc {
    font-size: 13px;
    color: #64748b;
    margin: 4px 0 0;
    line-height: 1.5;
  }

  .tech-features {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }

  .tech-feat {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    padding: 8px 12px;
    border-radius: 10px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
  }

  .tech-feat :global(iconify-icon) { color: #4f46e5; flex-shrink: 0; }

  .tech-btn { align-self: flex-start; margin-top: auto; }

  /* ============ CTA ============ */
  .cta { padding: 40px 0 60px; }

  .cta-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 10px;
    padding: 40px 24px;
    background: linear-gradient(135deg, #eef2ff, #f0f9ff, #ecfdf5);
    border: 1px solid #e2e8f0;
    border-radius: 20px;
  }

  .cta-inner :global(iconify-icon) { color: #4f46e5; }
  .cta-inner h2 { font-size: 24px; }
  .cta-inner p { font-size: 15px; color: #64748b; margin: 0 0 8px; max-width: 400px; }
  .cta-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; padding: 40px 0 32px; gap: 28px; }
    h1 { font-size: 32px; }
    .hero-visual { min-height: 240px; }
    .events-grid { grid-template-columns: 1fr 1fr; }
    .event-card.featured { grid-column: span 2; }
    .brands-grid { grid-template-columns: repeat(2, 1fr); }
    .communities-grid { grid-template-columns: repeat(2, 1fr); }
    .members-grid { grid-template-columns: repeat(4, 1fr); }
    .tech-grid { grid-template-columns: 1fr; }
    .earn-row { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 640px) {
    .hero { padding: 28px 0 24px; }
    h1 { font-size: 28px; }
    .hero-visual { min-height: 220px; }
    .hero-pill { font-size: 10px; padding: 4px 10px; }
    .hp-4 { display: none; }
    .hc-3, .hc-4 { display: none; }

    .stats-strip { gap: 16px; flex-wrap: wrap; }
    .stat-num { font-size: 18px; }
    .stat-label { display: none; }

    .events-grid { grid-template-columns: 1fr; }
    .event-card.featured { grid-column: span 1; }
    .event-card.featured .event-img { height: 180px; }

    .brands-grid { grid-template-columns: 1fr; }
    .communities-grid { grid-template-columns: 1fr 1fr; }
    .community-cover { height: 80px; }
    .members-grid { grid-template-columns: repeat(2, 1fr); }

    .section-head { flex-direction: column; align-items: flex-start; gap: 10px; }

    .rep-card { padding: 20px 16px; }
    .rank-badge { min-width: 80px; padding: 8px 10px; }
    .rank-name { font-size: 12px; }
    .earn-row { grid-template-columns: repeat(2, 1fr); }
  }
</style>
