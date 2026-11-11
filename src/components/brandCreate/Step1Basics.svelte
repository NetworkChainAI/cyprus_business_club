<script lang="ts">
  import { t } from "$lib/i18n";
  import SearchDropdown from "../SearchDropdown.svelte";

  type Category = { id: string; name: string };

  export let name: string;
  export let website: string;
  export let brandType: "PERSONAL" | "COMPANY";

  export let logoFile: File | null;
  export let logoPreviewUrl: string | null;

  export let categories: Category[] = [];
  export let loadingCategories = false;

  export let selectedCategoryIds: string[] = [];
  export let selectedCategoryNames: string[] = [];

  export let instagram: string;
  export let telegram: string;
  export let tiktok: string;
  export let youtube: string;
  export let linkedin: string;
  export let contactEmail: string;
  export let phone: string;

  export let customCategories: string[] = [];

  export let onLogoChange: (e: Event) => void;
  export let toggleCategory: (cat: Category) => Promise<void>;

  const ENGLISH_RE = /^[A-Za-z0-9 &\-\/,.]+$/;

  let newCustomCategory = "";
  let customCatError = "";

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function addCustomCategory() {
    customCatError = "";
    const raw = newCustomCategory.trim();
    if (!raw) return;

    if (!ENGLISH_RE.test(raw)) {
      customCatError = t.get('partners.create.errorEnglishOnly');
      return;
    }

    const val = capitalize(raw);

    if (categories.some((c) => c.name.toLowerCase() === val.toLowerCase())) {
      customCatError = t.get('partners.create.errorCategoryExists');
      return;
    }
    if (customCategories.some((c) => c.toLowerCase() === val.toLowerCase())) {
      customCatError = t.get('partners.create.errorAlreadyAdded');
      return;
    }

    customCategories = [...customCategories, val];
    newCustomCategory = "";
  }

  function removeCustomCategory(i: number) {
    customCategories = customCategories.filter((_, idx) => idx !== i);
  }

  function handleCustomCatKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomCategory();
    }
  }

  $: brandTypeOptions = [
    { id: "PERSONAL", name: $t('partners.create.personalBrand') },
    { id: "COMPANY", name: $t('partners.badge.company') }
  ];

  $: brandTypeSelected = brandType ? [brandType] : [];

  function handleBrandTypeChange(e: CustomEvent<{ selected: string[] }>) {
    const next = (e.detail.selected?.[0] as "PERSONAL" | "COMPANY" | undefined) ?? undefined;
    if (!next) return;
    brandType = next;
  }

  let prevCategoryIds: string[] = [];
  $: prevCategoryIds = prevCategoryIds.length ? prevCategoryIds : selectedCategoryIds;

  async function handleCategoriesChange(
    e: CustomEvent<{ selected: string[]; items: { id: string; name: string }[] }>
  ) {
    const nextIds = e.detail.selected ?? [];
    const prevIds = prevCategoryIds ?? [];
    const added = nextIds.filter((id) => !prevIds.includes(id));
    const removed = prevIds.filter((id) => !nextIds.includes(id));

    selectedCategoryNames = (e.detail.items ?? []).map((x) => x.name);
    selectedCategoryIds = nextIds;
    prevCategoryIds = nextIds;

    for (const id of [...added, ...removed]) {
      const cat = categories.find((c) => c.id === id);
      if (cat) await toggleCategory(cat);
    }
  }

  let dragging = false;
  let fileInput: HTMLInputElement;

  function handleDrop(e: DragEvent) {
    dragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    fileInput.files = dt.files;
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function removeLogo() {
    logoFile = null;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = null;
    if (fileInput) fileInput.value = "";
  }
</script>

<!-- Brand info -->
<section class="card">
  <div class="card-head">
    <iconify-icon icon="lucide:building-2" width="20" height="20" />
    <h2>{$t('partners.create.brandInfo')}</h2>
  </div>

  <div class="field">
    <span class="label">{$t('partners.create.brandName')} <span class="req">*</span></span>
    <input type="text" bind:value={name} placeholder={$t('partners.create.enterBrandName')} />
  </div>

  <div class="field">
    <span class="label">{$t('partners.create.brandType')} <span class="req">*</span></span>
    <SearchDropdown
      options={brandTypeOptions}
      selected={brandTypeSelected}
      multiple={false}
      placeholder={$t('partners.create.selectType')}
      searchPlaceholder={$t('partners.create.searchPlaceholder')}
      maxChips={1}
      on:change={handleBrandTypeChange}
    />
  </div>

  <div class="field">
    <span class="label">{$t('partners.create.logo')}</span>
    <input
      type="file"
      accept="image/*"
      on:change={onLogoChange}
      bind:this={fileInput}
      class="file-hidden"
    />
    {#if logoPreviewUrl}
      <div class="logo-result">
        <div class="logo-preview">
          <img src={logoPreviewUrl} alt="logo preview" />
        </div>
        <button type="button" class="logo-remove" on:click={removeLogo}>
          <iconify-icon icon="lucide:trash-2" width="14" height="14" />
          {$t('partners.create.remove')}
        </button>
      </div>
    {:else}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="dropzone"
        class:dragging
        on:click={() => fileInput.click()}
        on:dragover|preventDefault={() => (dragging = true)}
        on:dragleave={() => (dragging = false)}
        on:drop|preventDefault={handleDrop}
      >
        <iconify-icon icon="lucide:image-plus" width="28" height="28" />
        <span class="dropzone-text">{$t('partners.create.dropzoneText')}</span>
        <span class="dropzone-hint">{$t('partners.create.dropzoneHint')}</span>
      </div>
    {/if}
  </div>

  <div class="field">
    <span class="label">{$t('partners.create.websiteLabel')}</span>
    <div class="input-icon">
      <iconify-icon icon="lucide:globe" width="16" height="16" />
      <input type="url" bind:value={website} placeholder="https://..." />
    </div>
  </div>
</section>

<!-- Categories -->
<section class="card">
  <div class="card-head">
    <iconify-icon icon="lucide:tag" width="20" height="20" />
    <h2>{$t('partners.create.categories')} <span class="req">*</span></h2>
  </div>

  {#if loadingCategories}
    <div class="muted">{$t('partners.create.loadingCategories')}</div>
  {:else}
    <SearchDropdown
      options={categories}
      bind:selected={selectedCategoryIds}
      multiple={true}
      placeholder={$t('partners.create.selectCategories')}
      searchPlaceholder={$t('partners.create.searchPlaceholder')}
      maxItems={null}
      maxChips={3}
      on:change={(e) => {
        selectedCategoryNames = e.detail.items.map((x) => x.name);
      }}
    />
  {/if}

  {#if customCategories.length > 0}
    <div class="custom-chips">
      {#each customCategories as cat, i}
        <span class="custom-chip">
          {cat}
          <button type="button" class="custom-chip-x" on:click={() => removeCustomCategory(i)}>
            <iconify-icon icon="lucide:x" width="12" height="12" />
          </button>
        </span>
      {/each}
    </div>
  {/if}

  <div class="custom-add">
    <span class="custom-add-label">{$t('partners.create.cantFindCategory')}</span>
    <div class="custom-add-row">
      <input
        type="text"
        bind:value={newCustomCategory}
        on:keydown={handleCustomCatKey}
        placeholder={$t('partners.create.categoryPlaceholder')}
      />
      <button type="button" class="btn-custom-add" on:click={addCustomCategory}>
        <iconify-icon icon="lucide:plus" width="14" height="14" />
        {$t('partners.create.add')}
      </button>
    </div>
    {#if customCatError}
      <span class="custom-error">{customCatError}</span>
    {/if}
  </div>
</section>

<!-- Socials & contacts -->
<section class="card">
  <div class="card-head">
    <iconify-icon icon="lucide:share-2" width="20" height="20" />
    <h2>{$t('partners.create.socialsContacts')}</h2>
    <span class="badge-optional">{$t('partners.create.optional')}</span>
  </div>

  <div class="socials-grid">
    <div class="input-icon">
      <iconify-icon icon="lucide:instagram" width="16" height="16" />
      <input bind:value={instagram} placeholder="Instagram" />
    </div>
    <div class="input-icon">
      <iconify-icon icon="lucide:send" width="16" height="16" />
      <input bind:value={telegram} placeholder="Telegram" />
    </div>
    <div class="input-icon">
      <iconify-icon icon="lucide:clapperboard" width="16" height="16" />
      <input bind:value={tiktok} placeholder="TikTok" />
    </div>
    <div class="input-icon">
      <iconify-icon icon="lucide:youtube" width="16" height="16" />
      <input bind:value={youtube} placeholder="YouTube" />
    </div>
    <div class="input-icon">
      <iconify-icon icon="lucide:linkedin" width="16" height="16" />
      <input bind:value={linkedin} placeholder="LinkedIn" />
    </div>
  </div>

  <div class="divider"></div>

  <div class="socials-grid">
    <div class="input-icon">
      <iconify-icon icon="lucide:mail" width="16" height="16" />
      <input type="email" bind:value={contactEmail} placeholder={$t('partners.create.email')} />
    </div>
    <div class="input-icon">
      <iconify-icon icon="lucide:phone" width="16" height="16" />
      <input type="tel" bind:value={phone} placeholder={$t('partners.create.phone')} />
    </div>
  </div>
</section>

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .card-head {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0f172a;
  }

  .card-head h2 {
    font-size: 17px;
    font-weight: 800;
    margin: 0;
    color: #0f172a;
  }

  .card-head iconify-icon {
    color: #4f46e5;
  }

  .badge-optional {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    background: #f1f5f9;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }

  .req {
    color: #ef4444;
  }

  input[type="text"],
  input[type="url"],
  input[type="email"],
  input[type="tel"] {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    padding: 10px 12px;
    border-radius: 10px;
    outline: none;
    font-size: 14px;
    font-weight: 400;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  input::placeholder {
    color: #94a3b8;
  }

  input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    background: #fff;
  }

  .file-hidden {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;
  }

  /* Dropzone */
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

  .dropzone:hover,
  .dropzone.dragging {
    border-color: #4f46e5;
    background: #eef2ff;
    color: #4f46e5;
  }

  .dropzone-text {
    font-size: 14px;
    font-weight: 600;
    color: #475569;
  }

  .dropzone-hint {
    font-size: 12px;
    color: #94a3b8;
  }

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

  .logo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

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

  .logo-remove:hover {
    background: #fee2e2;
  }

  /* Input with icon */
  .input-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon iconify-icon {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  .input-icon input {
    padding-left: 36px;
  }

  /* Socials grid */
  .socials-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .divider {
    height: 1px;
    background: #f1f5f9;
  }

  .muted {
    color: #94a3b8;
    font-size: 14px;
  }

  /* Custom entries */
  .custom-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .custom-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px 4px 10px;
    border-radius: 8px;
    background: #4f46e5;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
  }

  .custom-chip-x {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    cursor: pointer;
    padding: 0;
    transition: background 0.15s;
  }

  .custom-chip-x:hover {
    background: rgba(255, 255, 255, 0.35);
  }

  .custom-add {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .custom-add-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
  }

  .custom-add-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .custom-add-row input {
    flex: 1;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    padding: 8px 12px;
    border-radius: 10px;
    outline: none;
    font-size: 13px;
    font-weight: 400;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }

  .custom-add-row input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    background: #fff;
  }

  .btn-custom-add {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    background: #4f46e5;
    border: none;
    border-radius: 10px;
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn-custom-add:hover {
    background: #4338ca;
  }

  .custom-error {
    font-size: 12px;
    color: #ef4444;
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .card {
      padding: 18px;
    }

    .socials-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
