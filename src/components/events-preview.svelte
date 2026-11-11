<script lang="ts">
  import { onMount } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import { formatDate } from "$lib/utils/dateLocale";

  type Event = {
    id: string;
    title: string;
    description?: string;
    categories?: { name: string }[];
    date: string;
    location: string;
    price?: number | null;
    photo?: string | null;
  };

  let events: Event[] = [];
  let loading = true;
  let error: string | null = null;

  const LIMIT = 3;

  onMount(() => {
    (async () => {
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error(t.get('events.preview.loadError'));
        const data = await res.json();
        events = data;
      } catch (e) {
        console.error(e);
        error = t.get('events.preview.loadError');
      } finally {
        loading = false;
      }
    })();
  });

  $: latestEvents = [...events]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, LIMIT);
</script>

<section class="section">
  {#if loading}
    <p class="loading"></p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <div class="grid">
      {#each latestEvents as event (event.id)}
        <a href={`/events/${event.id}`} class="card">
          <div class="img-wrapper">
            <img
              src={photoSrc(event.photo, 400) || "/assets/images/placeholder-event.jpg"}
              alt={event.title}
              loading="lazy"
              decoding="async"
            />
            <div class="badge">
              {event.price ? `\u20AC${event.price}` : $t('events.detail.free')}
            </div>
          </div>

          <div class="card-content">
            <h3>{event.title}</h3>

            {#if event.categories?.length}
              <div class="card-chips">
                {#each event.categories.slice(0, 2) as c}
                  <span class="chip">{c.name}</span>
                {/each}

                {#if event.categories.length > 2}
                  <span class="chip ghost">+{event.categories.length - 2}</span>
                {/if}
              </div>
            {/if}

            <div class="meta">
              <p class="location">
                <span class="icon">📍</span>
                {event.location}
              </p>

              <p class="date">
                <span class="icon">📅</span>
                {formatDate(event.date, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  .section {
    max-width: 1100px;
    margin: 0 auto 3rem auto;
    padding: 0 1rem;
  }

  .header {
    margin: 2.5rem 0 1rem 0;
  }

  h2 {
    margin: 0;
    color: #0b3954;
    font-size: 1.6rem;
    font-weight: 800;
  }

  .sub {
    margin: 0.35rem 0 0 0;
    color: #475569;
    font-size: 0.95rem;
  }

  .icon {
    margin-right: 4px;
    opacity: 0.7;
  }

  .card-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 2px;
  }

  .chip {
    font-size: 12px;
    padding: 5px 9px;
    border-radius: 999px;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
    color: #111827;
    line-height: 1;
  }

  .chip.ghost {
    background: #fff;
    color: #6b7280;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 1rem;
    padding: 0 0.5rem;
  }

  .card {
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 0.75rem;
    overflow: hidden;
    height: 340px;
    width: 100%;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    cursor: pointer;
  }

  .card:hover {
    transform: translateY(-3px);
    box-shadow: 0 5px 10px rgba(0, 0, 0, 0.07);
  }

  .img-wrapper {
    flex: 0 0 160px;
    height: 160px;
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .img-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  .card:hover .img-wrapper img {
    transform: scale(1.05);
  }

  .badge {
    position: absolute;
    right: 10px;
    top: 10px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: rgba(17, 24, 39, 0.55);
    color: #fff;
    backdrop-filter: blur(6px);
  }

  .card-content {
    padding: 0.8rem 1rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .card h3 {
    margin-bottom: 0.2rem;
    color: #0b3954;
    font-size: 1rem;
    font-weight: 600;
  }

  .meta {
    margin-top: auto;
    display: grid;
    gap: 2px;
  }

  .location {
    font-size: 0.85rem;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .date {
    font-size: 0.85rem;
    color: #0b3954;
    font-weight: 500;
  }

  .meta p {
    margin: 0;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 1.25rem;
  }

  .btn {
    background: #0b3954;
    color: #fff;
    text-decoration: none;
    border-radius: 999px;
    padding: 0.65rem 1.2rem;
    font-weight: 600;
    font-size: 0.95rem;
    border: 1px solid #0b3954;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
    opacity: 0.95;
  }
</style>
