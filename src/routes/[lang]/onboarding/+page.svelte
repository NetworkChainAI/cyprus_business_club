<script lang="ts">
  import { t } from '$lib/i18n';
  import { withLang } from '$lib/utils/withLang';

  export let data: { categories: Array<{ id: string; name: string }> };

  let step = 1;
  const TOTAL = 2;

  // ── Step 1 – interests ──────────────────────────────────────
  let selectedIds = new Set<string>();
  function toggleCategory(id: string) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    selectedIds = new Set(selectedIds);
  }

  const MIN_INTERESTS = 3;
  $: step1Valid = selectedIds.size >= MIN_INTERESTS;

  // ── Step 2 – profile ────────────────────────────────────────
  let bio = '';

  // Photo
  let photoFile: File | null = null;
  let photoPreview: string | null = null;
  let photoDragging = false;
  let photoInput: HTMLInputElement;

  function handlePhotoSelect(file: File) {
    if (!file.type.startsWith('image/')) return;
    photoFile = file;
    photoPreview = URL.createObjectURL(file);
  }
  function onPhotoChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handlePhotoSelect(f);
  }
  function onPhotoDrop(e: DragEvent) {
    e.preventDefault();
    photoDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) handlePhotoSelect(f);
  }
  function removePhoto() {
    photoFile = null;
    photoPreview = null;
    if (photoInput) photoInput.value = '';
  }

  // Location autocomplete (Nominatim)
  let locationInput = '';
  let locationDisplay = ''; // shown in input
  let locationSuggestions: any[] = [];
  let locationLoading = false;
  let showLocationSuggestions = false;
  let locationDebounce: ReturnType<typeof setTimeout>;

  function onLocationInput() {
    clearTimeout(locationDebounce);
    locationDisplay = locationInput;
    if (locationInput.trim().length < 2) { locationSuggestions = []; showLocationSuggestions = false; return; }
    locationDebounce = setTimeout(searchLocation, 350);
  }

  async function searchLocation() {
    locationLoading = true;
    try {
      const q = encodeURIComponent(locationInput.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&addressdetails=1&limit=6`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const json = await res.json();
      locationSuggestions = json.filter((r: any) =>
        r.address?.city || r.address?.town || r.address?.village || r.address?.municipality
      );
      showLocationSuggestions = locationSuggestions.length > 0;
    } catch { /* ignore */ }
    locationLoading = false;
  }

  function selectLocation(item: any) {
    const city = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || '';
    const country = item.address?.country || '';
    locationDisplay = [city, country].filter(Boolean).join(', ');
    locationInput = locationDisplay;
    locationSuggestions = [];
    showLocationSuggestions = false;
  }

  function onLocationBlur() {
    setTimeout(() => { showLocationSuggestions = false; }, 150);
  }

  // ── Navigation ───────────────────────────────────────────────
  let saving = false;

  function back() { if (step > 1) step--; }

  let errorMsg = '';

  async function finish() {
    saving = true;
    errorMsg = '';
    const fd = new FormData();
    fd.append('categoryIds', JSON.stringify([...selectedIds]));
    if (bio.trim()) fd.append('bio', bio.trim());
    if (locationDisplay.trim()) fd.append('location', locationDisplay.trim());
    if (photoFile) fd.append('photo', photoFile);
    try {
      const res = await fetch('/api/user/onboarding', { method: 'POST', body: fd });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        errorMsg = data.error || 'Something went wrong. Please try again.';
        saving = false;
        return;
      }
      window.location.href = withLang('/');
    } catch {
      errorMsg = 'Network error. Please try again.';
      saving = false;
    }
  }

  async function next() {
    if (step === 1 && !step1Valid) return;
    if (step < TOTAL) { step++; return; }
    await finish();
  }

  async function skip() {
    if (step < TOTAL) { step++; return; }
    await finish();
  }

  $: progress = (step / TOTAL) * 100;
</script>

<div class="page">
  <div class="card">
    <!-- Progress bar -->
    <div class="progress-wrap">
      <div class="progress-bar" style="width:{progress}%"></div>
    </div>
    <div class="step-label">
      {$t('onboarding.stepOf').replace('{current}', String(step)).replace('{total}', String(TOTAL))}
    </div>

    <!-- ── Step 1: Interests ── -->
    {#if step === 1}
      <h2>{$t('onboarding.step1Title')}</h2>
      <p class="subtitle">{$t('onboarding.step1Subtitle')}</p>

      <div class="chips-hint" class:met={step1Valid}>
        {#if step1Valid}
          <iconify-icon icon="lucide:check-circle-2" width="13"></iconify-icon>
          {selectedIds.size} selected
        {:else}
          <iconify-icon icon="lucide:info" width="13"></iconify-icon>
          Select at least {MIN_INTERESTS} ({selectedIds.size}/{MIN_INTERESTS})
        {/if}
      </div>

      <div class="chips-scroll">
        <div class="chips">
          {#each data.categories as cat}
            <button
              type="button"
              class="chip"
              class:active={selectedIds.has(cat.id)}
              on:click={() => toggleCategory(cat.id)}
            >
              {cat.name}
            </button>
          {/each}
        </div>
      </div>

    <!-- ── Step 2: Profile ── -->
    {:else if step === 2}
      <h2>{$t('onboarding.step2Title')}</h2>
      <p class="subtitle">{$t('onboarding.step2Subtitle')}</p>

      <!-- Photo (optional) -->
      <input type="file" accept="image/*" bind:this={photoInput} on:change={onPhotoChange} style="display:none" />
      <div class="field">
        <label>
          {$t('onboarding.photoLabel')}
          <span class="optional">{$t('onboarding.optional')}</span>
        </label>
        {#if photoPreview}
          <div class="photo-preview-wrap">
            <div class="photo-preview">
              <img src={photoPreview} alt="avatar" />
              <button type="button" class="photo-remove" on:click={removePhoto}>
                <iconify-icon icon="lucide:x" width="12"></iconify-icon>
              </button>
            </div>
          </div>
        {:else}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="photo-drop"
            class:dragging={photoDragging}
            on:click={() => photoInput.click()}
            on:dragover|preventDefault={() => (photoDragging = true)}
            on:dragleave={() => (photoDragging = false)}
            on:drop={onPhotoDrop}
          >
            <iconify-icon icon="lucide:user-circle" width="26"></iconify-icon>
            <span>{$t('onboarding.photoHint')}</span>
          </div>
        {/if}
      </div>

      <!-- Bio (optional) -->
      <div class="field">
        <label>
          {$t('onboarding.bioLabel')}
          <span class="optional">{$t('onboarding.optional')}</span>
        </label>
        <textarea bind:value={bio} placeholder={$t('onboarding.bioPlaceholder')} rows="3"></textarea>
      </div>

      <!-- Location autocomplete (optional) -->
      <div class="field">
        <label>
          {$t('onboarding.locationLabel')}
          <span class="optional">{$t('onboarding.optional')}</span>
        </label>
        <div class="loc-wrap">
          <iconify-icon icon="lucide:map-pin" width="15" class="loc-icon"></iconify-icon>
          {#if locationLoading}
            <iconify-icon icon="lucide:loader-2" width="14" class="loc-spinner spin"></iconify-icon>
          {/if}
          <input
            type="text"
            bind:value={locationInput}
            placeholder={$t('onboarding.locationPlaceholder')}
            on:input={onLocationInput}
            on:blur={onLocationBlur}
            autocomplete="off"
          />
          {#if showLocationSuggestions}
            <div class="loc-suggestions">
              {#each locationSuggestions as item}
                {@const city = item.address?.city || item.address?.town || item.address?.village || item.address?.municipality || ''}
                {@const country = item.address?.country || ''}
                <button type="button" class="loc-item" on:click={() => selectLocation(item)}>
                  <iconify-icon icon="lucide:map-pin" width="13"></iconify-icon>
                  <span class="loc-city">{city}</span>
                  {#if country}<span class="loc-country">{country}</span>{/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if errorMsg}
      <div class="error-msg">{errorMsg}</div>
    {/if}

    <!-- ── Actions ── -->
    <div class="actions">
      {#if step === 1}
        <button type="button" class="btn-ghost" on:click={skip} disabled={saving}>
          {$t('onboarding.skip')}
        </button>
      {:else}
        <button type="button" class="btn-back" on:click={back} disabled={saving}>
          <iconify-icon icon="lucide:arrow-left" width="14"></iconify-icon>
          {$t('onboarding.back')}
        </button>
      {/if}

      <button type="button" class="btn-next" on:click={next} disabled={saving || (step === 1 && !step1Valid)}>
        {#if saving}
          <iconify-icon icon="lucide:loader-2" width="14" class="spin"></iconify-icon>
          {$t('onboarding.saving')}
        {:else if step < TOTAL}
          {$t('onboarding.next')}
          <iconify-icon icon="lucide:arrow-right" width="14"></iconify-icon>
        {:else}
          {$t('onboarding.finish')}
          <iconify-icon icon="lucide:check" width="14"></iconify-icon>
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8fafc;
    padding: 24px 16px;
  }

  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 36px 32px 28px;
    width: 100%;
    max-width: 520px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.06);
  }

  /* Progress */
  .progress-wrap {
    height: 4px;
    background: #e2e8f0;
    border-radius: 99px;
    margin-bottom: 10px;
    overflow: hidden;
  }
  .progress-bar {
    height: 100%;
    background: #4f46e5;
    border-radius: 99px;
    transition: width 0.3s ease;
  }
  .step-label {
    font-size: 12px;
    color: #94a3b8;
    font-weight: 600;
    margin-bottom: 20px;
  }

  h2 {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 6px;
  }
  .subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0 0 20px;
    line-height: 1.5;
  }

  /* Chips */
  .chips-hint {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 10px;
    transition: color 0.2s;
  }
  .chips-hint.met { color: #22c55e; }

  .chips-scroll {
    max-height: 220px;
    overflow-y: auto;
    margin-bottom: 24px;
    padding-right: 4px;
  }
  .chips-scroll::-webkit-scrollbar { width: 4px; }
  .chips-scroll::-webkit-scrollbar-track { background: transparent; }
  .chips-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 99px; }

  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1.5px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }
  .chip:hover { border-color: #4f46e5; color: #4f46e5; }
  .chip.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }

  /* Fields */
  .field { margin-bottom: 16px; }
  .field label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #374151;
    margin-bottom: 6px;
  }
  .optional {
    font-size: 11px;
    font-weight: 500;
    color: #94a3b8;
  }
  .field textarea {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: inherit;
    color: #0f172a;
    background: #f8fafc;
    box-sizing: border-box;
    resize: vertical;
    transition: border-color 0.15s;
  }
  .field textarea:focus {
    outline: none;
    border-color: #4f46e5;
    background: #fff;
  }

  /* Photo */
  .photo-drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 90px;
    border: 2px dashed #e2e8f0;
    border-radius: 14px;
    cursor: pointer;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
    background: #f8fafc;
    transition: all 0.15s;
  }
  .photo-drop:hover, .photo-drop.dragging {
    border-color: #4f46e5;
    background: #eef2ff;
    color: #4f46e5;
  }
  .photo-preview-wrap { display: flex; align-items: center; gap: 12px; }
  .photo-preview {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    overflow: hidden;
    border: 3px solid #e2e8f0;
    flex-shrink: 0;
  }
  .photo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .photo-remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgba(0,0,0,0.55);
    border: none;
    color: #fff;
    cursor: pointer;
    display: grid;
    place-items: center;
  }

  /* Location autocomplete */
  .loc-wrap {
    position: relative;
  }
  .loc-wrap :global(.loc-icon) {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
  }
  .loc-wrap :global(.loc-spinner) {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
  }
  .loc-wrap input {
    width: 100%;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px 10px 34px;
    font-size: 14px;
    font-family: inherit;
    color: #0f172a;
    background: #f8fafc;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }
  .loc-wrap input:focus {
    outline: none;
    border-color: #4f46e5;
    background: #fff;
  }
  .loc-suggestions {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    z-index: 100;
    overflow: hidden;
  }
  .loc-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 9px 14px;
    background: none;
    border: none;
    font-family: inherit;
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    color: #374151;
    transition: background 0.1s;
  }
  .loc-item:hover { background: #f8fafc; }
  .loc-city { font-weight: 600; color: #0f172a; }
  .loc-country { color: #94a3b8; font-size: 12px; }

  /* Actions */
  .actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24px;
    gap: 12px;
  }
  .btn-ghost {
    background: none;
    border: none;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }
  .btn-ghost:hover:not(:disabled) { color: #64748b; }
  .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-back {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 700;
    font-family: inherit;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-back:hover:not(:disabled) { border-color: #4f46e5; color: #4f46e5; }
  .btn-back:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-next {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: 10px 22px;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }
  .btn-next:hover:not(:disabled) { background: #4338ca; }
  .btn-next:disabled { opacity: 0.6; cursor: not-allowed; }

  .error-msg {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    font-size: 13px;
    font-weight: 600;
    padding: 10px 14px;
    border-radius: 10px;
    margin-bottom: 8px;
  }

  :global(.spin) { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
