<script lang="ts">
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

  // socials & contacts
  export let instagram: string;
  export let telegram: string;
  export let tiktok: string;
  export let youtube: string;
  export let linkedin: string;
  export let contactEmail: string;
  export let phone: string;

  export let onLogoChange: (e: Event) => void;
  export let toggleCategory: (cat: Category) => Promise<void>;

  // ===== Brand type options for SearchDropdown =====
  const brandTypeOptions = [
    { id: "PERSONAL", name: "Personal brand" },
    { id: "COMPANY", name: "Company" }
  ] as const;

  // SearchDropdown работает со string[] selected
  $: brandTypeSelected = brandType ? [brandType] : [];

  function handleBrandTypeChange(e: CustomEvent<{ selected: string[] }>) {
    const next = (e.detail.selected?.[0] as "PERSONAL" | "COMPANY" | undefined) ?? undefined;
    if (!next) return; // если сняли выбор — ничего не делаем (можно поменять логику при желании)
    brandType = next;
  }

  // ===== Categories change handling with diff =====
  let prevCategoryIds: string[] = [];

  $: prevCategoryIds = prevCategoryIds.length ? prevCategoryIds : selectedCategoryIds;

  async function handleCategoriesChange(
    e: CustomEvent<{ selected: string[]; items: { id: string; name: string }[] }>
  ) {
    const nextIds = e.detail.selected ?? [];
    const prevIds = prevCategoryIds ?? [];

    const added = nextIds.filter((id) => !prevIds.includes(id));
    const removed = prevIds.filter((id) => !nextIds.includes(id));

    // обновляем имена (UI)
    selectedCategoryNames = (e.detail.items ?? []).map((x) => x.name);

    // чтобы bind:selectedCategoryIds тоже обновился
    selectedCategoryIds = nextIds;
    prevCategoryIds = nextIds;

    // дергаем твою текущую логику (синхронизация/сервер/и т.п.)
    for (const id of [...added, ...removed]) {
      const cat = categories.find((c) => c.id === id);
      if (cat) await toggleCategory(cat);
    }
  }
</script>

<!-- ================= BASICS ================= -->
<section class="card">
  <h2>Basics</h2>

  <label>
    Brand name *
    <input bind:value={name} placeholder="Brand name" />
  </label>

  <label>
    Brand type *
    <SearchDropdown
      options={brandTypeOptions as unknown as { id: string; name: string }[]}
      selected={brandTypeSelected}
      multiple={false}
      placeholder="Select type"
      searchPlaceholder="Search..."
      maxChips={1}
      on:change={handleBrandTypeChange}
    />
  </label>

  <label>
    Logo (file)
    <input type="file" accept="image/*" on:change={onLogoChange} />
  </label>

  {#if logoPreviewUrl}
    <div class="logo-preview">
      <img src={logoPreviewUrl} alt="logo preview" />
    </div>
  {/if}

  <label>
    Website (URL)
    <input bind:value={website} placeholder="https://..." />
  </label>
</section>

<section class="card">
  <h2>Categories / activity area *</h2>

  {#if loadingCategories}
    <div class="muted">Loading categories...</div>
  {:else}
   <SearchDropdown
  options={categories}
  bind:selected={selectedCategoryIds}
  multiple={true}
  placeholder="Select categories"
  searchPlaceholder="Search..."
  maxItems={null}
  maxChips={3}
  on:change={(e) => {
    selectedCategoryNames = e.detail.items.map((x) => x.name);
  }}
/>

  {/if}
</section>

<section class="card">
  <h2>Socials & contacts (optional)</h2>

  <label>
    Instagram
    <input bind:value={instagram} placeholder="https://instagram.com/..." />
  </label>

  <label>
    Telegram
    <input bind:value={telegram} placeholder="https://t.me/..." />
  </label>

  <label>
    TikTok
    <input bind:value={tiktok} placeholder="https://tiktok.com/..." />
  </label>

  <label>
    YouTube
    <input bind:value={youtube} placeholder="https://youtube.com/..." />
  </label>

  <label>
    LinkedIn
    <input bind:value={linkedin} placeholder="https://linkedin.com/..." />
  </label>

  <label>
    Email
    <input bind:value={contactEmail} placeholder="hello@brand.com" />
  </label>

  <label>
    Phone
    <input bind:value={phone} placeholder="+357..." />
  </label>
</section>

<style>
  .card {
    background: #fff;
    border-radius: 1rem;
    padding: 2rem;
    width: 100%;
    max-width: 1100px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
    border: 1px solid rgba(15, 23, 42, 0.05);
    color: #0b3954;
    transition: box-shadow 0.25s ease, transform 0.15s ease;
    position: relative;
    display: grid;
    gap: 14px;
  }

  .card:hover {
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
  }

  .card h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px;
    color: #0b3954;
  }

  label {
    display: grid;
    gap: 6px;
    font-size: 14px;
    color: #111827;
    font-weight: 500;
  }

  input {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #0f172a;
    padding: 10px 12px;
    border-radius: 0.7rem;
    outline: none;
    font-size: 14px;
    font-weight: 400;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
  }

  input::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }

  input:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.35);
    background: #ffffff;
  }

  .logo-preview {
    width: 120px;
    height: 120px;
    border-radius: 0.9rem;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .logo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .muted {
    color: #6b7280;
    font-size: 14px;
    font-weight: 400;
  }

  button {
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    border-radius: 0.75rem;
    border: 1px solid transparent;
    padding: 8px 14px;
    cursor: pointer;
    background: #2563eb;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.12s ease,
      border-color 0.2s ease;
  }

  button:hover {
    background: #1d4ed8;
    box-shadow: 0 3px 10px rgba(37, 99, 235, 0.25);
    transform: translateY(-0.5px);
  }

  button:active {
    transform: translateY(0);
    box-shadow: none;
  }

  .dropdown {
    position: relative;
  }

  .dropdown-btn {
    width: 100%;
    justify-content: space-between;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    color: #111827;
    padding: 10px 12px;
    border-radius: 0.7rem;
    font-weight: 400;
  }

  .dropdown-btn:hover {
    background: #ffffff;
    border-color: #cbd5f5;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  }

  .chev {
    opacity: 0.7;
    font-size: 12px;
  }

  .dropdown-menu {
    position: absolute;
    z-index: 9999;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 0.9rem;
    padding: 8px;
    display: grid;
    gap: 8px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
  }

  .search {
    width: 100%;
    font-weight: 400;
  }

  .menu-list {
    max-height: 220px;
    overflow: auto;
    display: grid;
    gap: 6px;
    padding-right: 4px;
  }

  .menu-item {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    padding: 6px;
    border-radius: 0.6rem;
    color: #111827;
    font-weight: 400;
  }

  .menu-item:hover {
    background: #f3f4f6;
  }

  .menu-item input[type="checkbox"] {
    width: 14px;
    height: 14px;
    accent-color: #2563eb;
  }

  .menu-btn {
    width: 100%;
    justify-content: flex-start;
    background: #ffffff;
    color: #111827;
    border-color: #e5e7eb;
    padding: 10px 12px;
    border-radius: 0.7rem;
    box-shadow: none;
    transform: none;
    font-weight: 400;
  }

  .menu-btn:hover {
    background: #f3f4f6;
    box-shadow: none;
    transform: none;
  }

  .menu-btn.active {
    background: rgba(37, 99, 235, 0.08);
    border-color: rgba(37, 99, 235, 0.35);
    color: #1d4ed8;
  }

  /* ✅ chips styles */
  .selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .chip {
    background: #eff6ff;
    border: 1px solid rgba(37, 99, 235, 0.25);
    color: #1d4ed8;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .chip:hover {
    background: #dbeafe;
    box-shadow: none;
    transform: none;
  }

  .chip .x {
    font-size: 14px;
    line-height: 1;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    .card {
      padding: 1.4rem;
    }
  }
</style>
