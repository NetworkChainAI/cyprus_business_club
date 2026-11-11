<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import { formatDate } from "$lib/utils/dateLocale";

  export let data: any;
  const events = data?.similarEvents ?? [];

  function formatShort(d: string | Date) {
    return formatDate(d, { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function priceLabel(price: number | null | undefined) {
    if (!price || price === 0) return t.get('events.detail.free');
    const n = Number(price);
    return `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`;
  }
</script>

{#if events.length > 0}
  <section class="block">
    <div class="title">{$t('events.detail.similarEvents')}</div>

    <div class="list">
      {#each events as e (e.id)}
        <a class="item" href={`/events/${e.id}`}>
          <img
            class="img"
            src={photoSrc(e.photo, 200) || "/assets/images/placeholder-event.jpg"}
            alt={e.title}
            loading="lazy"
            decoding="async"
          />
          <div class="info">
            <div class="name">{e.title}</div>
            <div class="meta">{formatShort(e.date)}</div>
            <div class="price">{priceLabel(e.price)}</div>
          </div>
        </a>
      {/each}
    </div>
  </section>
{/if}

<style>
  .block { margin-top: 6px; }
  .title { font-weight: 900; color:#0f172a; margin: 8px 0 12px; }
  .list { display:flex; flex-direction:column; gap:10px; }
  .item {
    display:flex; gap:12px; align-items:center;
    background:#fff; border:1px solid #e2e8f0; border-radius:14px;
    padding:10px; text-decoration:none; color:inherit;
    transition: box-shadow 160ms ease, transform 160ms ease, border-color 160ms ease;
  }
  .item:hover { box-shadow: 0 16px 34px rgba(15,23,42,.10); border-color:#dbeafe; transform: translateY(-1px); }
  .img { width:64px; height:48px; border-radius:10px; object-fit:cover; }
  .name { font-weight: 900; color:#0f172a; font-size: 13px; }
  .meta { color:#94a3b8; font-weight:800; font-size: 12px; margin-top:2px; }
  .price { color: rgb(79 70 229); font-weight: 900; font-size: 12px; margin-top: 2px; }
</style>
