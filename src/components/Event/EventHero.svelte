<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import { formatDate, formatTime } from "$lib/utils/dateLocale";

  export let data: any;
  const event = data?.event;
</script>

<section class="hero">
  <img
    class="bg"
    src={photoSrc(event?.photo, 1200) || "/assets/images/placeholder-event.jpg"}
    alt={event?.title ?? $t('events.detail.eventFallback')}
    decoding="async"
  />

  <div class="overlay"></div>

  <div class="content">
    <div class="chips">
      {#each event?.categories ?? [] as c (c.id)}
        <span class="chip">{c.name.toUpperCase()}</span>
      {/each}
    </div>

    <h1 class="title">{event?.title}</h1>

    <div class="meta">
      <div class="meta-item">
        <iconify-icon icon="lucide:calendar" width="16"></iconify-icon>
        <span>{formatDate(event?.date, { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>

      <div class="meta-item">
        <iconify-icon icon="lucide:clock" width="16"></iconify-icon>
        <span>{formatTime(event?.date, { hour: "2-digit", minute: "2-digit" })}</span>
      </div>

      <div class="meta-item">
        <iconify-icon icon="lucide:map-pin" width="16"></iconify-icon>
        <span>{event?.location}</span>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    position: relative;
    border-radius: 18px;
    overflow: hidden;
    min-height: 360px;
    background: #0b1220;
  }

  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.02);
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(15, 23, 42, 0.85) 0%, rgba(15, 23, 42, 0.25) 60%, rgba(15, 23, 42, 0.1) 100%);
  }

  .content {
    position: relative;
    padding: 26px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    color: #fff;
    max-width: 760px;
  }

  .chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chip {
    background: rgba(255, 255, 255, 0.14);
    border: 1px solid rgba(255, 255, 255, 0.18);
    padding: 6px 10px;
    border-radius: 999px;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 0.04em;
  }

  .title {
    margin: 0;
    font-size: 40px;
    line-height: 1.05;
    font-weight: 900;
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 6px;
    color: rgba(255, 255, 255, 0.92);
    font-weight: 700;
    font-size: 13px;
  }

  .meta-item {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  @media (max-width: 720px) {
    .hero {
      min-height: 320px;
    }
    .title {
      font-size: 30px;
    }
  }
</style>
