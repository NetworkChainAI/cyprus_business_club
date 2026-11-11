<script lang="ts">
  import { t } from "$lib/i18n";
  import SearchDropdown from "../SearchDropdown.svelte";

  type BrandTagType =
    | "AUDIENCE"
    | "PAIN"
    | "SOLUTION"
    | "MONETIZATION"
    | "CLIENT";

  type BrandTag = { id: string; type: BrandTagType; title: string };

  export let description: string;
  export let products: string[];

  export let gender: string[];
  export let ageFrom: number | null;
  export let ageTo: number | null;
  export let ageAny: boolean = false;

  export let geo: string[];
  export let interests: string[];

  export let tagsByType: Record<BrandTagType, BrandTag[]>;
  export let loadingTags: boolean;
  export let selectedTagIds: string[];

  export let customTagsByType: Record<BrandTagType, string[]> = {
    AUDIENCE: [],
    PAIN: [],
    SOLUTION: [],
    CLIENT: [],
    MONETIZATION: [],
  };

  export let toggleTagId: (id: string) => Promise<void>;
  export let toggleGender: (val: string) => void;

  const ENGLISH_RE = /^[A-Za-z0-9 &\-\/,.]+$/;

  let customInputs: Record<BrandTagType, string> = {
    AUDIENCE: "",
    PAIN: "",
    SOLUTION: "",
    CLIENT: "",
    MONETIZATION: "",
  };
  let customErrors: Record<BrandTagType, string> = {
    AUDIENCE: "",
    PAIN: "",
    SOLUTION: "",
    CLIENT: "",
    MONETIZATION: "",
  };

  function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function addCustomTag(type: BrandTagType) {
    customErrors[type] = "";
    const raw = customInputs[type].trim();
    if (!raw) return;

    if (!ENGLISH_RE.test(raw)) {
      customErrors = { ...customErrors, [type]: t.get('partners.create.errorEnglishOnly') };
      return;
    }

    const val = capitalize(raw);

    const dbTitles = (tagsByType[type] || []).map((t) => t.title.toLowerCase());
    if (dbTitles.includes(val.toLowerCase())) {
      customErrors = { ...customErrors, [type]: t.get('partners.create.errorOptionExists') };
      return;
    }
    if ((customTagsByType[type] || []).some((t) => t.toLowerCase() === val.toLowerCase())) {
      customErrors = { ...customErrors, [type]: t.get('partners.create.errorAlreadyAdded') };
      return;
    }

    customTagsByType = {
      ...customTagsByType,
      [type]: [...(customTagsByType[type] || []), val],
    };
    customInputs = { ...customInputs, [type]: "" };
  }

  function removeCustomTag(type: BrandTagType, i: number) {
    customTagsByType = {
      ...customTagsByType,
      [type]: (customTagsByType[type] || []).filter((_, idx) => idx !== i),
    };
  }

  function handleCustomTagKey(type: BrandTagType, e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag(type);
    }
  }

  const OTHER_TYPES: BrandTagType[] = [
    "PAIN",
    "SOLUTION",
    "CLIENT",
    "MONETIZATION",
  ];

  $: typeLabels = {
    PAIN: { label: $t('partners.create.tagPain'), icon: "lucide:alert-triangle" },
    SOLUTION: { label: $t('partners.create.tagSolution'), icon: "lucide:lightbulb" },
    CLIENT: { label: $t('partners.create.tagClient'), icon: "lucide:user-check" },
    MONETIZATION: { label: $t('partners.create.tagMonetization'), icon: "lucide:wallet" },
  } as Record<string, { label: string; icon: string }>;

  function addProductField() {
    products = [...products, ""];
  }
  function removeProductField(i: number) {
    if (products.length > 1) products = products.filter((_, idx) => idx !== i);
  }

  function addGeoField() {
    geo = [...geo, ""];
  }
  function removeGeoField(i: number) {
    if (geo.length > 1) geo = geo.filter((_, idx) => idx !== i);
  }

  function addInterestField() {
    interests = [...interests, ""];
  }
  function removeInterestField(i: number) {
    if (interests.length > 1) interests = interests.filter((_, idx) => idx !== i);
  }

  let selectedByTypeIds: Record<BrandTagType, string[]> = {
    AUDIENCE: [],
    PAIN: [],
    SOLUTION: [],
    CLIENT: [],
    MONETIZATION: [],
  };

  $: selectedByTypeIds = {
    AUDIENCE: (tagsByType?.AUDIENCE || [])
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.id),
    PAIN: (tagsByType?.PAIN || [])
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.id),
    SOLUTION: (tagsByType?.SOLUTION || [])
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.id),
    CLIENT: (tagsByType?.CLIENT || [])
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.id),
    MONETIZATION: (tagsByType?.MONETIZATION || [])
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.id),
  };

  let prevSelectedByTypeIds: Record<BrandTagType, string[]> = {
    AUDIENCE: [],
    PAIN: [],
    SOLUTION: [],
    CLIENT: [],
    MONETIZATION: [],
  };

  $: if (tagsByType) {
    prevSelectedByTypeIds = {
      AUDIENCE: selectedByTypeIds.AUDIENCE,
      PAIN: selectedByTypeIds.PAIN,
      SOLUTION: selectedByTypeIds.SOLUTION,
      CLIENT: selectedByTypeIds.CLIENT,
      MONETIZATION: selectedByTypeIds.MONETIZATION,
    };
  }

  function toDropdownOptions(type: BrandTagType) {
    return (tagsByType?.[type] || []).map((t) => ({ id: t.id, name: t.title }));
  }

  async function handleTagsChange(
    type: BrandTagType,
    e: CustomEvent<{ selected: string[]; items: { id: string; name: string }[] }>
  ) {
    const next = e.detail.selected ?? [];
    const prev = prevSelectedByTypeIds[type] ?? [];

    const added = next.filter((id) => !prev.includes(id));
    const removed = prev.filter((id) => !next.includes(id));

    prevSelectedByTypeIds = { ...prevSelectedByTypeIds, [type]: next };

    for (const id of [...added, ...removed]) {
      await toggleTagId(id);
    }
  }

  $: genderOptions = [
    { value: "Male", label: $t('partners.create.genderMale'), icon: "lucide:user" },
    { value: "Female", label: $t('partners.create.genderFemale'), icon: "lucide:user" },
    { value: "All", label: $t('partners.create.genderAll'), icon: "lucide:users" },
  ];
</script>

<!-- About -->
<section class="card">
  <div class="card-head">
    <iconify-icon icon="lucide:file-text" width="20" height="20" />
    <h2>{$t('partners.create.aboutBrand')}</h2>
  </div>

  <div class="field">
    <span class="label">{$t('partners.create.whatDoesBrandDo')}</span>
    <textarea bind:value={description} rows="3" placeholder={$t('partners.create.descriptionPlaceholder')} />
  </div>

  <div class="field">
    <div class="label-row">
      <span class="label">{$t('partners.create.productsServices')}</span>
      <button type="button" class="btn-add" on:click={addProductField}>
        <iconify-icon icon="lucide:plus" width="14" height="14" />
        {$t('partners.create.add')}
      </button>
    </div>
    {#each products as p, i}
      <div class="row-field">
        <input bind:value={products[i]} placeholder={$t('partners.create.productPlaceholder')} />
        {#if products.length > 1}
          <button type="button" class="btn-remove" on:click={() => removeProductField(i)}>
            <iconify-icon icon="lucide:x" width="14" height="14" />
          </button>
        {/if}
      </div>
    {/each}
  </div>
</section>

<!-- Target audience -->
<section class="card">
  <div class="card-head">
    <iconify-icon icon="lucide:target" width="20" height="20" />
    <h2>{$t('partners.create.targetAudience')}</h2>
  </div>

  <div class="field">
    <span class="label">{$t('partners.create.gender')}</span>
    <div class="toggle-group">
      {#each genderOptions as g}
        <button
          type="button"
          class="toggle-btn"
          class:active={gender.includes(g.value)}
          on:click={() => toggleGender(g.value)}
        >
          <iconify-icon icon={g.icon} width="14" height="14" />
          {g.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="field">
    <div class="label-row">
      <span class="label">{$t('partners.create.ageRange')}</span>
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={ageAny} />
        <span>{$t('partners.create.anyAge')}</span>
      </label>
    </div>
    {#if !ageAny}
      <div class="age-row">
        <input type="number" bind:value={ageFrom} placeholder={$t('partners.create.from')} />
        <span class="age-sep">-</span>
        <input type="number" bind:value={ageTo} placeholder={$t('partners.create.to')} />
      </div>
    {:else}
      <div class="hint">{$t('partners.create.anyAgeHint')}</div>
    {/if}
  </div>

  <div class="field">
    <div class="label-row">
      <span class="label">{$t('partners.create.geography')}</span>
      <button type="button" class="btn-add" on:click={addGeoField}>
        <iconify-icon icon="lucide:plus" width="14" height="14" />
        {$t('partners.create.add')}
      </button>
    </div>
    {#each geo as g, i}
      <div class="row-field">
        <div class="input-icon">
          <iconify-icon icon="lucide:map-pin" width="14" height="14" />
          <input bind:value={geo[i]} placeholder={$t('partners.create.geoPlaceholder')} />
        </div>
        {#if geo.length > 1}
          <button type="button" class="btn-remove" on:click={() => removeGeoField(i)}>
            <iconify-icon icon="lucide:x" width="14" height="14" />
          </button>
        {/if}
      </div>
    {/each}
  </div>

  <div class="field">
    <div class="label-row">
      <span class="label">{$t('partners.create.interests')}</span>
      <button type="button" class="btn-add" on:click={addInterestField}>
        <iconify-icon icon="lucide:plus" width="14" height="14" />
        {$t('partners.create.add')}
      </button>
    </div>
    {#each interests as it, i}
      <div class="row-field">
        <input bind:value={interests[i]} placeholder={$t('partners.create.interestPlaceholder')} />
        {#if interests.length > 1}
          <button type="button" class="btn-remove" on:click={() => removeInterestField(i)}>
            <iconify-icon icon="lucide:x" width="14" height="14" />
          </button>
        {/if}
      </div>
    {/each}
  </div>

  {#if !loadingTags}
    <div class="field">
      <span class="label">{$t('partners.create.audienceSegments')}</span>
      <SearchDropdown
        options={toDropdownOptions("AUDIENCE")}
        selected={selectedByTypeIds.AUDIENCE}
        multiple={true}
        placeholder={$t('partners.create.selectSegments')}
        searchPlaceholder={$t('partners.create.searchPlaceholder')}
        maxItems={null}
        maxChips={3}
        on:change={(e) => handleTagsChange("AUDIENCE", e)}
      />

      {#if (customTagsByType.AUDIENCE || []).length > 0}
        <div class="custom-chips">
          {#each customTagsByType.AUDIENCE as tag, i}
            <span class="custom-chip">
              {tag}
              <button type="button" class="custom-chip-x" on:click={() => removeCustomTag("AUDIENCE", i)}>
                <iconify-icon icon="lucide:x" width="12" height="12" />
              </button>
            </span>
          {/each}
        </div>
      {/if}

      <div class="custom-add">
        <span class="custom-add-label">{$t('partners.create.cantFindAddOwn')}</span>
        <div class="custom-add-row">
          <input
            type="text"
            bind:value={customInputs.AUDIENCE}
            on:keydown={(e) => handleCustomTagKey("AUDIENCE", e)}
            placeholder={$t('partners.create.segmentPlaceholder')}
          />
          <button type="button" class="btn-custom-add" on:click={() => addCustomTag("AUDIENCE")}>
            <iconify-icon icon="lucide:plus" width="14" height="14" />
            {$t('partners.create.add')}
          </button>
        </div>
        {#if customErrors.AUDIENCE}
          <span class="custom-error">{customErrors.AUDIENCE}</span>
        {/if}
      </div>
    </div>
  {:else}
    <div class="hint">{$t('partners.create.loadingSuggestions')}</div>
  {/if}
</section>

<!-- Tags -->
<section class="card">
  <div class="card-head">
    <iconify-icon icon="lucide:puzzle" width="20" height="20" />
    <h2>{$t('partners.create.businessModel')}</h2>
  </div>

  {#if loadingTags}
    <div class="hint">{$t('partners.create.loadingSuggestions')}</div>
  {:else}
    {#each OTHER_TYPES as type}
      <div class="field">
        <div class="label-row">
          <iconify-icon icon={typeLabels[type].icon} width="15" height="15" style="color: #64748b" />
          <span class="label">{typeLabels[type].label}</span>
        </div>
        <SearchDropdown
          options={toDropdownOptions(type)}
          selected={selectedByTypeIds[type]}
          multiple={true}
          placeholder={$t('partners.create.select') + ' ' + type.toLowerCase()}
          searchPlaceholder={$t('partners.create.searchPlaceholder')}
          maxItems={null}
          maxChips={3}
          on:change={(e) => handleTagsChange(type, e)}
        />

        {#if (customTagsByType[type] || []).length > 0}
          <div class="custom-chips">
            {#each customTagsByType[type] as tag, i}
              <span class="custom-chip">
                {tag}
                <button type="button" class="custom-chip-x" on:click={() => removeCustomTag(type, i)}>
                  <iconify-icon icon="lucide:x" width="12" height="12" />
                </button>
              </span>
            {/each}
          </div>
        {/if}

        <div class="custom-add">
          <span class="custom-add-label">{$t('partners.create.cantFindAddOwn')}</span>
          <div class="custom-add-row">
            <input
              type="text"
              bind:value={customInputs[type]}
              on:keydown={(e) => handleCustomTagKey(type, e)}
              placeholder={$t('partners.create.typeAndEnter')}
            />
            <button type="button" class="btn-custom-add" on:click={() => addCustomTag(type)}>
              <iconify-icon icon="lucide:plus" width="14" height="14" />
              {$t('partners.create.add')}
            </button>
          </div>
          {#if customErrors[type]}
            <span class="custom-error">{customErrors[type]}</span>
          {/if}
        </div>
      </div>
    {/each}
  {/if}
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

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .label {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .label-row .label {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hint {
    font-size: 12px;
    color: #94a3b8;
  }

  input,
  textarea {
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
    font-family: inherit;
  }

  input::placeholder,
  textarea::placeholder {
    color: #94a3b8;
  }

  input:focus,
  textarea:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    background: #fff;
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  /* Input with icon */
  .input-icon {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
  }

  .input-icon iconify-icon {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  .input-icon input {
    padding-left: 34px;
  }

  /* Row field */
  .row-field {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .row-field input {
    flex: 1;
  }

  /* Toggle group */
  .toggle-group {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .toggle-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s;
  }

  .toggle-btn:hover {
    background: #eef2ff;
    border-color: #c7d2fe;
  }

  .toggle-btn.active {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }

  /* Age row */
  .age-row {
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 240px;
  }

  .age-sep {
    color: #94a3b8;
    font-weight: 700;
  }

  /* Checkbox label */
  .checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    color: #64748b;
    cursor: pointer;
  }

  .checkbox-label input {
    width: 15px;
    height: 15px;
    padding: 0;
    accent-color: #4f46e5;
  }

  /* Buttons */
  .btn-add {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    color: #4f46e5;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 8px;
    padding: 4px 10px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-add:hover {
    background: #e0e7ff;
  }

  .btn-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: inherit;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 8px;
    border: 1px solid #fecaca;
    background: #fef2f2;
    color: #ef4444;
    cursor: pointer;
    padding: 0;
    transition: all 0.15s;
  }

  .btn-remove:hover {
    background: #fee2e2;
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
    padding: 10px 14px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
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
  }
</style>
