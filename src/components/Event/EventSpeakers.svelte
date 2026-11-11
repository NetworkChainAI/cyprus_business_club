<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";

  export let data: any;

  const speakers: any[] = data?.event?.speakers ?? [];

  function speakerName(s: any): string {
    if (s.user) return s.user.info?.name ?? s.user.email ?? t.get('events.detail.speakerFallback');
    return s.name ?? t.get('events.detail.speakerFallback');
  }

  function speakerPhoto(s: any): string | null {
    if (s.user) return s.user.info?.photo ? photoSrc(s.user.info.photo) : null;
    return s.photoUrl ? photoSrc(s.photoUrl) : null;
  }

  function speakerSubtitle(s: any): string {
    if (s.title) return s.title;
    if (s.user?.info?.status) return s.user.info.status;
    if (s.email) return s.email;
    return t.get('events.detail.speakerFallback');
  }

  function speakerHref(s: any): string | null {
    if (s.userId) return `/members/${s.userId}`;
    return null;
  }
</script>

{#if speakers.length > 0}
  <section class="card">
    <div class="head">
      <iconify-icon icon="lucide:mic" width="18" height="18"></iconify-icon>
      <span>{$t('events.detail.speakers')}</span>
      <span class="count">{speakers.length}</span>
    </div>

    <div class="list">
      {#each speakers as s}
        {@const href = speakerHref(s)}
        {@const photo = speakerPhoto(s)}
        {@const name = speakerName(s)}
        {@const subtitle = speakerSubtitle(s)}

        <svelte:element
          this={href ? "a" : "div"}
          class="speaker"
          {...href ? { href } : {}}
        >
          <div class="avatar">
            {#if photo}
              <img src={photo} alt={name} />
            {:else}
              <span class="fb">{name[0].toUpperCase()}</span>
            {/if}
          </div>
          <div class="info">
            <div class="name">{name}</div>
            <div class="subtitle">{subtitle}</div>
          </div>
          {#if href}
            <iconify-icon icon="lucide:arrow-up-right" width="14" height="14" class="arrow"></iconify-icon>
          {/if}
        </svelte:element>
      {/each}
    </div>
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

  .count {
    margin-left: auto;
    background: #eef2ff;
    color: #4f46e5;
    font-weight: 800;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 8px;
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .speaker {
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

  a.speaker:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .avatar {
    width: 42px;
    height: 42px;
    min-width: 42px;
    border-radius: 50%;
    overflow: hidden;
    background: #e2e8f0;
    border: 2px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .avatar img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .fb {
    font-weight: 900;
    font-size: 15px;
    color: #64748b;
  }

  .info {
    min-width: 0;
    flex: 1;
  }

  .name {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .subtitle {
    font-weight: 600;
    font-size: 12px;
    color: #64748b;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .speaker :global(.arrow) {
    color: #94a3b8;
    flex-shrink: 0;
    transition: color 0.15s;
  }

  a.speaker:hover :global(.arrow) {
    color: #4f46e5;
  }
</style>
