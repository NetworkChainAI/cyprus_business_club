<script lang="ts">
  import { t } from "$lib/i18n";
  import { onMount } from "svelte";
  import "leaflet/dist/leaflet.css";

  export let data: any;
  const event = data?.event;

  const hasCoords =
    typeof event?.latitude === "number" && typeof event?.longitude === "number";

  let mapEl: HTMLDivElement;

  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
    : event?.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
      : "#";

  onMount(async () => {
    if (!hasCoords || !mapEl) return;

    const L = await import("leaflet");

    const map = L.map(mapEl, {
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      attributionControl: false,
    }).setView([event.latitude, event.longitude], 15);

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
      { maxZoom: 19 }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.marker([event.latitude, event.longitude]).addTo(map);

    setTimeout(() => map.invalidateSize(), 100);
  });
</script>

{#if event?.location || hasCoords}
  <section class="card">
    <div class="head">
      <div class="head-left">
        <iconify-icon icon="lucide:map-pin" width="20" height="20"></iconify-icon>
        <span>{$t('events.detail.location')}</span>
      </div>
      <a class="maps-link" href={mapsUrl} target="_blank" rel="noreferrer">
        {$t('events.detail.openInMaps')}
        <iconify-icon icon="lucide:external-link" width="14" height="14"></iconify-icon>
      </a>
    </div>

    <div class="address">
      <iconify-icon icon="lucide:navigation" width="14" height="14"></iconify-icon>
      <span>{event.location}</span>
    </div>

    {#if hasCoords}
      <div class="map-container">
        <div bind:this={mapEl} class="map"></div>
      </div>
      <div class="coords">
        {event.latitude.toFixed(6)}, {event.longitude.toFixed(6)}
      </div>
    {/if}
  </section>
{/if}

<style>
  .card {
    position: relative;
    z-index: 0;
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
    justify-content: space-between;
  }

  .head-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 16px;
    color: #0f172a;
  }

  .head-left :global(iconify-icon) {
    color: #4f46e5;
  }

  .maps-link {
    font-weight: 700;
    font-size: 13px;
    color: #4f46e5;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    transition: opacity 0.15s;
  }

  .maps-link:hover {
    opacity: 0.75;
  }

  .address {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    line-height: 1.45;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  .address :global(iconify-icon) {
    color: #4f46e5;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .address span {
    min-width: 0;
    word-break: break-word;
  }

  .map-container {
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .map {
    width: 100%;
    height: 280px;
  }

  .coords {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    text-align: right;
  }
</style>
