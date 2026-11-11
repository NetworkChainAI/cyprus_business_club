<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";
  import { browser } from "$app/environment";

  export let editCommunity: any = null;

  $: isEdit = !!editCommunity;

  const DRAFT_KEY = "community_create_draft";

  let draftReady = false;

  // Form state
  let name = "";
  let isPrivate = false;
  let logoFile: File | null = null;
  let logoPreviewUrl: string | null = null;

  // Location state
  let locationQuery = "";
  let locationSuggestions: any[] = [];
  let locationLoading = false;
  let locationDebounce: ReturnType<typeof setTimeout>;
  let showSuggestions = false;

  let addrCountry = "";
  let addrCity = "";
  let addrStreet = "";
  let lat: number | null = null;
  let lng: number | null = null;

  $: hasLocation = !!(lat && lng);

  // Street autocomplete
  let streetSuggestions: any[] = [];
  let streetLoading = false;
  let streetDebounce: ReturnType<typeof setTimeout>;
  let showStreetSuggestions = false;

  // Logo dropzone state
  let fileInput: HTMLInputElement | undefined;
  let dragging = false;

  function handleDrop(e: DragEvent) {
    dragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInput) {
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // UI state
  let submitting = false;
  let errorMsg: string | null = null;
  let successMsg: string | null = null;

  // Draft persistence
  function saveDraft() {
    if (!browser || isEdit || !draftReady) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, isPrivate, addrCountry, addrCity, addrStreet, lat, lng, locationQuery }));
    } catch {}
  }

  function loadDraft() {
    if (!browser || isEdit) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      name = d.name ?? "";
      isPrivate = d.isPrivate ?? false;
      addrCountry = d.addrCountry ?? "";
      addrCity = d.addrCity ?? "";
      addrStreet = d.addrStreet ?? "";
      lat = d.lat ?? null;
      lng = d.lng ?? null;
      locationQuery = d.locationQuery ?? "";
    } catch {}
  }

  function clearDraft() {
    if (!browser) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  $: if (browser && !isEdit) {
    void [name, isPrivate, addrCountry, addrCity, addrStreet, lat, lng, locationQuery];
    saveDraft();
  }

  function onLogoChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    logoFile = file;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = URL.createObjectURL(file);
  }

  function removeLogo() {
    logoFile = null;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = null;
    logoBroken = false;
    if (fileInput) fileInput.value = "";
  }

  // Street autocomplete
  async function searchStreet() {
    const q = addrStreet.trim();
    if (q.length < 3) { streetSuggestions = []; showStreetSuggestions = false; return; }

    const context = [addrCity, addrCountry].filter(Boolean).join(", ");
    const query = context ? `${q}, ${context}` : q;

    streetLoading = true;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=6`,
        { headers: { "Accept-Language": "en" } }
      );
      streetSuggestions = await res.json();
      showStreetSuggestions = streetSuggestions.length > 0;
    } catch {
      streetSuggestions = [];
    } finally {
      streetLoading = false;
    }
  }

  function onStreetInput() {
    clearTimeout(streetDebounce);
    streetDebounce = setTimeout(searchStreet, 350);
  }

  function selectStreetSuggestion(s: any) {
    const a = s.address ?? {};
    addrStreet = [a.house_number, a.road].filter(Boolean).join(" ") || addrStreet;
    if (a.country) addrCountry = a.country;
    const city = a.city ?? a.town ?? a.village ?? "";
    if (city) addrCity = city;
    lat = parseFloat(s.lat);
    lng = parseFloat(s.lon);
    showStreetSuggestions = false;
    streetSuggestions = [];
  }

  function initEditMode() {
    if (!editCommunity) return;
    name = editCommunity.name || "";
    isPrivate = editCommunity.isPrivate ?? false;
    if (editCommunity.logoUrl) {
      const src = photoSrc(editCommunity.logoUrl);
      if (src) logoPreviewUrl = src;
    }
    if (editCommunity.address) {
      addrCountry = editCommunity.address.country ?? "";
      addrCity = editCommunity.address.city ?? "";
      addrStreet = editCommunity.address.street ?? "";
      locationQuery = editCommunity.address.full ?? [addrStreet, addrCity, addrCountry].filter(Boolean).join(", ");
    }
    lat = editCommunity.lat ?? null;
    lng = editCommunity.lng ?? null;
  }

  onMount(() => {
    if (isEdit) initEditMode();
    else loadDraft();
    draftReady = true;
  });

  // --- Nominatim autocomplete ---
  async function searchLocation() {
    const q = locationQuery.trim();
    if (q.length < 3) { locationSuggestions = []; showSuggestions = false; return; }

    locationLoading = true;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(q)}&limit=6`,
        { headers: { "Accept-Language": "en" } }
      );
      locationSuggestions = await res.json();
      showSuggestions = locationSuggestions.length > 0;
    } catch {
      locationSuggestions = [];
    } finally {
      locationLoading = false;
    }
  }

  function onLocationInput() {
    clearTimeout(locationDebounce);
    locationDebounce = setTimeout(searchLocation, 350);
    lat = null;
    lng = null;
  }

  function selectSuggestion(s: any) {
    const a = s.address ?? {};
    addrCountry = a.country ?? "";
    addrCity = a.city ?? a.town ?? a.village ?? a.county ?? "";
    addrStreet = [a.house_number, a.road].filter(Boolean).join(" ");
    lat = parseFloat(s.lat);
    lng = parseFloat(s.lon);
    locationQuery = s.display_name;
    showSuggestions = false;
    locationSuggestions = [];
  }

  function clearLocation() {
    locationQuery = "";
    addrCountry = "";
    addrCity = "";
    addrStreet = "";
    lat = null;
    lng = null;
    locationSuggestions = [];
    showSuggestions = false;
  }

  async function submit() {
    errorMsg = null;
    successMsg = null;

    if (!name.trim()) {
      errorMsg = $t('communities.form.nameRequired');
      return;
    }

    submitting = true;

    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("isPrivate", String(isPrivate));

      if (logoFile) {
        fd.append("logo", logoFile);
      } else if (isEdit && editCommunity.logoUrl) {
        fd.append("existingLogo", editCommunity.logoUrl);
      }

      if (lat && lng) {
        fd.append("address", JSON.stringify({
          country: addrCountry,
          city: addrCity,
          street: addrStreet,
          full: locationQuery,
        }));
        fd.append("lat", String(lat));
        fd.append("lng", String(lng));
      }

      const url = isEdit ? `/api/community/${editCommunity.id}` : "/api/community";
      const method = isEdit ? "PATCH" : "POST";

      const r = await fetch(url, { method, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || (isEdit ? $t('communities.form.updateFailed') : $t('communities.form.createFailed')));

      if (isEdit) {
        successMsg = $t('communities.form.updateSuccess');
      } else {
        successMsg = $t('communities.form.createSuccess');
        clearDraft();
        name = "";
        isPrivate = false;
        logoFile = null;
        if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        logoPreviewUrl = null;
        clearLocation();
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      errorMsg = e.message || (isEdit ? $t('communities.form.updateError') : $t('communities.form.createError'));
    } finally {
      submitting = false;
    }
  }

  let logoBroken = false;
</script>

<div class="page">
  <div class="header">
    <h1>{isEdit ? $t('communities.form.editTitle') : $t('communities.form.createTitle')}</h1>
    <p class="subtitle">{isEdit ? $t('communities.form.editSubtitle') : $t('communities.form.createSubtitle')}</p>
  </div>

  {#if errorMsg}
    <div class="alert alert-error">
      <iconify-icon icon="lucide:alert-circle" width="18"></iconify-icon>
      <span>{errorMsg}</span>
    </div>
  {/if}

  {#if successMsg}
    <div class="alert alert-success">
      <iconify-icon icon="lucide:check-circle-2" width="18"></iconify-icon>
      <span>{successMsg}</span>
    </div>
  {/if}

  <!-- Basic details -->
  <div class="card">
    <div class="card-title">
      <iconify-icon icon="lucide:users" width="18"></iconify-icon>
      {$t('communities.form.details')}
    </div>

    <div class="field">
      <label for="comm-name">{$t('communities.form.name')} <span class="req">*</span></label>
      <input id="comm-name" type="text" bind:value={name} placeholder={$t('communities.form.namePlaceholder')} />
    </div>

    <div class="field">
      <label for="logo-input">{$t('communities.form.logo')}</label>
      <input id="logo-input" type="file" accept="image/*" on:change={onLogoChange} bind:this={fileInput} class="file-hidden" />
      {#if logoPreviewUrl && !logoBroken}
        <div class="logo-result">
          <div class="logo-preview">
            <img src={logoPreviewUrl} alt={$t('communities.form.logoPreview')} on:error={() => (logoBroken = true)} />
          </div>
          <button type="button" class="logo-remove" on:click={removeLogo}>
            <iconify-icon icon="lucide:trash-2" width="14"></iconify-icon>
            {$t('communities.form.removeLogo')}
          </button>
        </div>
      {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="dropzone"
          class:dragging
          on:click={() => fileInput?.click()}
          on:dragover|preventDefault={() => (dragging = true)}
          on:dragleave={() => (dragging = false)}
          on:drop|preventDefault={handleDrop}
        >
          <iconify-icon icon="lucide:image-plus" width="28"></iconify-icon>
          <span class="dropzone-text">{$t('communities.form.uploadLogo')}</span>
          <span class="dropzone-hint">PNG, JPG, WEBP</span>
        </div>
      {/if}
    </div>

    <div class="field">
      <label>{$t('communities.form.privacy')}</label>
      <div class="toggle-row">
        <button
          type="button"
          class="toggle-btn"
          class:active={!isPrivate}
          on:click={() => (isPrivate = false)}
        >
          <iconify-icon icon="lucide:globe" width="16"></iconify-icon>
          {$t('communities.public')}
        </button>
        <button
          type="button"
          class="toggle-btn"
          class:active={isPrivate}
          on:click={() => (isPrivate = true)}
        >
          <iconify-icon icon="lucide:lock" width="16"></iconify-icon>
          {$t('communities.private')}
        </button>
      </div>
      <p class="hint">
        {isPrivate
          ? $t('communities.form.privateHint')
          : $t('communities.form.publicHint')}
      </p>
    </div>
  </div>

  <!-- Location -->
  <div class="card">
    <div class="card-title">
      <iconify-icon icon="lucide:map-pin" width="18"></iconify-icon>
      Location
      <span class="optional-badge">Optional</span>
    </div>

    <div class="field loc-field">
      <label for="loc-search">Search address</label>
      <div class="loc-input-wrap">
        <iconify-icon icon="lucide:search" width="16" class="loc-icon"></iconify-icon>
        <input
          id="loc-search"
          type="text"
          class="loc-input"
          bind:value={locationQuery}
          on:input={onLocationInput}
          on:focus={() => { if (locationSuggestions.length) showSuggestions = true; }}
          on:blur={() => setTimeout(() => (showSuggestions = false), 150)}
          placeholder="e.g. Limassol, Cyprus"
          autocomplete="off"
        />
        {#if locationLoading}
          <iconify-icon icon="lucide:loader-2" width="16" class="loc-spinner spin"></iconify-icon>
        {:else if hasLocation}
          <button type="button" class="loc-clear" on:click={clearLocation}>
            <iconify-icon icon="lucide:x" width="14"></iconify-icon>
          </button>
        {/if}
      </div>

      {#if showSuggestions && locationSuggestions.length}
        <div class="suggestions">
          {#each locationSuggestions as s}
            <button
              type="button"
              class="suggestion"
              on:mousedown|preventDefault={() => selectSuggestion(s)}
            >
              <iconify-icon icon="lucide:map-pin" width="14" class="sug-icon"></iconify-icon>
              <span class="sug-text">{s.display_name}</span>
            </button>
          {/each}
        </div>
      {/if}
    </div>

    {#if hasLocation || addrCountry || addrCity || addrStreet}
      <div class="loc-fields">
        <div class="loc-row">
          <div class="field">
            <label for="loc-country">Country</label>
            <input id="loc-country" type="text" bind:value={addrCountry} placeholder="Country" />
          </div>
          <div class="field">
            <label for="loc-city">City</label>
            <input id="loc-city" type="text" bind:value={addrCity} placeholder="City" />
          </div>
        </div>
        <div class="field loc-field">
          <label for="loc-street">Street / Address</label>
          <div class="loc-input-wrap">
            <iconify-icon icon="lucide:map-pin" width="16" class="loc-icon"></iconify-icon>
            <input
              id="loc-street"
              type="text"
              class="loc-input"
              bind:value={addrStreet}
              on:input={onStreetInput}
              on:focus={() => { if (streetSuggestions.length) showStreetSuggestions = true; }}
              on:blur={() => setTimeout(() => (showStreetSuggestions = false), 150)}
              placeholder="Street address"
              autocomplete="off"
            />
            {#if streetLoading}
              <iconify-icon icon="lucide:loader-2" width="16" class="loc-spinner spin"></iconify-icon>
            {/if}
          </div>
          {#if showStreetSuggestions && streetSuggestions.length}
            <div class="suggestions">
              {#each streetSuggestions as s}
                <button
                  type="button"
                  class="suggestion"
                  on:mousedown|preventDefault={() => selectStreetSuggestion(s)}
                >
                  <iconify-icon icon="lucide:map-pin" width="14" class="sug-icon"></iconify-icon>
                  <span class="sug-text">{s.display_name}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        {#if hasLocation}
          <div class="coords-chip">
            <iconify-icon icon="lucide:navigation" width="13"></iconify-icon>
            {lat?.toFixed(5)}, {lng?.toFixed(5)}
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <div class="actions">
    <a href="/admin/communities" class="btn btn-secondary">
      <iconify-icon icon="lucide:arrow-left" width="16"></iconify-icon>
      {$t('common.btn.cancel')}
    </a>
    <button type="button" class="btn btn-primary" disabled={submitting} on:click={submit}>
      {#if submitting}
        <iconify-icon icon="lucide:loader-2" width="16" class="spin"></iconify-icon>
        {isEdit ? $t('communities.form.saving') : $t('communities.form.creating')}
      {:else}
        <iconify-icon icon={isEdit ? "lucide:save" : "lucide:rocket"} width="16"></iconify-icon>
        {isEdit ? $t('communities.form.saveChanges') : $t('communities.form.createBtn')}
      {/if}
    </button>
  </div>
</div>

<style>
  .page {
    max-width: 600px;
    margin: 0 auto;
    padding: 32px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .header { text-align: center; padding-bottom: 4px; }
  h1 { font-size: 28px; font-weight: 900; margin: 0; color: #0f172a; }
  .subtitle { margin: 6px 0 0; color: #64748b; font-size: 15px; }

  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 500;
  }
  .alert-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
  .alert-success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #059669; }

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 900;
    font-size: 16px;
    color: #0f172a;
  }
  .card-title :global(iconify-icon) { color: #4f46e5; }

  .optional-badge {
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 6px;
  }

  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label { font-weight: 800; font-size: 13px; color: #334155; }
  .req { color: #ef4444; }

  .field input[type="text"] {
    height: 44px;
    padding: 0 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;
    background: #fff;
    transition: border-color 0.15s;
  }
  .field input[type="text"]:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  /* Location */
  .loc-field { position: relative; }

  .loc-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .loc-input-wrap :global(.loc-icon) {
    position: absolute;
    left: 14px;
    color: #94a3b8;
    pointer-events: none;
  }

  .loc-input {
    width: 100%;
    height: 44px;
    padding: 0 40px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;
    background: #fff;
    transition: border-color 0.15s;
  }
  .loc-input:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .loc-input-wrap :global(.loc-spinner) {
    position: absolute;
    right: 14px;
    color: #94a3b8;
  }

  .loc-clear {
    position: absolute;
    right: 10px;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }
  .loc-clear:hover { background: #e2e8f0; }

  .suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
    z-index: 20;
    overflow: hidden;
    max-height: 280px;
    overflow-y: auto;
  }

  .suggestion {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    background: none;
    border: none;
    border-bottom: 1px solid #f1f5f9;
    text-align: left;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.1s;
  }
  .suggestion:last-child { border-bottom: none; }
  .suggestion:hover { background: #f8fafc; }
  .suggestion :global(.sug-icon) { color: #94a3b8; flex-shrink: 0; margin-top: 2px; }
  .sug-text { font-size: 13px; font-weight: 600; color: #334155; line-height: 1.4; }

  .loc-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 14px;
    border: 1px solid #f1f5f9;
  }

  .loc-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .coords-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 700;
    color: #4f46e5;
    background: rgba(79, 70, 229, 0.06);
    border: 1px solid rgba(79, 70, 229, 0.15);
    border-radius: 8px;
    padding: 4px 10px;
    align-self: flex-start;
  }

  /* Logo */
  .file-hidden {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;
  }

  .dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 28px 16px;
    border: 2px dashed #cbd5e1;
    border-radius: 14px;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s;
    color: #94a3b8;
  }
  .dropzone:hover, .dropzone.dragging {
    border-color: #4f46e5;
    background: #eef2ff;
    color: #4f46e5;
  }
  .dropzone-text { font-size: 14px; font-weight: 600; color: #475569; }
  .dropzone-hint { font-size: 12px; color: #94a3b8; }

  .logo-result {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .logo-preview {
    width: 80px;
    height: 80px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-shrink: 0;
  }
  .logo-preview img { width: 100%; height: 100%; object-fit: cover; }

  .logo-remove {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    color: #ef4444;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 6px 12px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .logo-remove:hover { background: #fee2e2; }

  .toggle-row { display: flex; gap: 8px; }
  .toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .toggle-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
  .toggle-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }
  .toggle-btn.active :global(iconify-icon) { color: #fff; }

  .hint { margin: 4px 0 0; font-size: 12px; font-weight: 600; color: #94a3b8; }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 4px;
  }

  .btn {
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    border-radius: 12px;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    text-decoration: none;
  }

  .btn-primary { background: #4f46e5; color: #fff; }
  .btn-primary:hover { background: #4338ca; box-shadow: 0 4px 14px rgba(79,70,229,0.3); transform: translateY(-1px); }
  .btn-primary:active { transform: translateY(0); box-shadow: none; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-secondary { background: #fff; color: #0f172a; border: 1px solid #e2e8f0; }
  .btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @media (max-width: 640px) {
    .page { padding: 20px 12px 40px; gap: 18px; }
    h1 { font-size: 24px; }
    .loc-row { grid-template-columns: 1fr; }
  }
</style>
