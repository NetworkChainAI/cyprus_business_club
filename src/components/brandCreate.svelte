<script lang="ts">
  import { onMount, tick } from "svelte";
  import { t } from "$lib/i18n";

  type Category = { id: string; name: string };
  type TeamMember = { name: string; role: string; email: string };

  type BrandTagType = "AUDIENCE" | "PAIN" | "SOLUTION" | "MONETIZATION" | "CLIENT";
  type BrandTag = { id: string; type: BrandTagType; title: string };

  // -----------------------------
  // Categories
  // -----------------------------
  let categories: Category[] = [];
  let selectedCategoryIds: string[] = [];
  let selectedCategoryNames: string[] = [];

  let loadingCategories = true;

  // -----------------------------
  // Tags
  // -----------------------------
  let loadingTags = true;

  let tagsByType: Record<BrandTagType, BrandTag[]> = {
    AUDIENCE: [],
    PAIN: [],
    SOLUTION: [],
    MONETIZATION: [],
    CLIENT: [],
  };

  // ✅ IMPORTANT: array (not Set) for reliable reactivity
  let selectedTagIds: string[] = [];

  // dropdown per tag type
  let tagOpen: Record<BrandTagType, boolean> = {
    AUDIENCE: false,
    PAIN: false,
    SOLUTION: false,
    MONETIZATION: false,
    CLIENT: false,
  };

let audienceSearch = "";
let painSearch = "";
let solutionSearch = "";
let clientSearch = "";
let monetizationSearch = "";

function getSearch(type: BrandTagType) {
  if (type === "AUDIENCE") return audienceSearch;
  if (type === "PAIN") return painSearch;
  if (type === "SOLUTION") return solutionSearch;
  if (type === "CLIENT") return clientSearch;
  return monetizationSearch;
}

  function isTagSelected(id: string) {
    return selectedTagIds.includes(id);
  }

  async function toggleTagId(id: string) {
    if (selectedTagIds.includes(id)) {
      selectedTagIds = selectedTagIds.filter((x) => x !== id);
    } else {
      selectedTagIds = [...selectedTagIds, id];
    }
    // ✅ force immediate UI refresh
    await tick();
  }

  function selectedTitles(type: BrandTagType) {
    const list = tagsByType[type];
    return list.filter((t) => selectedTagIds.includes(t.id)).map((t) => t.title);
  }

function filteredTags(type: BrandTagType) {
  const q = getSearch(type).trim().toLowerCase();
  const list = tagsByType[type];
  if (!q) return list;
  return list.filter((t) => (t.title || "").toLowerCase().includes(q));
}

  function openTagDropdown(type: BrandTagType) {
    // close others, toggle current
    tagOpen = {
      AUDIENCE: false,
      PAIN: false,
      SOLUTION: false,
      MONETIZATION: false,
      CLIENT: false,
      [type]: !tagOpen[type],
    } as any;
  }

  // -----------------------------
  // UI state
  // -----------------------------
  let submitting = false;
  let errorMsg: string | null = null;
  let successMsg: string | null = null;

  // Multi-step
  let step = 1; // 1: brand, 2: clients & business, 3: team

  // dropdown (categories)
  let catsOpen = false;
  let catsSearch = "";
  function setCatsSearch(v: string) {
    catsSearch = v;
  }

  // Brand fields
  let name = "";
  let website = "";
  let brandType: "PERSONAL" | "COMPANY" = "COMPANY";

  // Brand type dropdown (custom, like others)
  let brandTypeOpen = false;
  let brandTypeOptions: { value: "PERSONAL" | "COMPANY"; label: string }[] = [];
  $: brandTypeOptions = [
    { value: "PERSONAL", label: $t('partners.create.personalBrand') },
    { value: "COMPANY", label: $t('partners.create.company') },
  ];

  // ✅ reactive label (NOT a function call)
  let brandTypeText = "";
  $: brandTypeText =
    brandTypeOptions.find((o) => o.value === brandType)?.label || $t('partners.create.selectType');

  function toggleBrandTypeDropdown() {
    brandTypeOpen = !brandTypeOpen;
  }

  async function pickBrandType(val: "PERSONAL" | "COMPANY") {
    brandType = val;
    await tick(); // ✅ immediate button text update
    brandTypeOpen = false;
  }

  // logo
  let logoFile: File | null = null;
  let logoPreviewUrl: string | null = null;

  // answers
  let description = "";
  let products: string[] = [""];

  let gender: string[] = []; // male/female/all
  let ageFrom: number | null = null;
  let ageTo: number | null = null;
  let ageAny = true;

  let geo: string[] = [""];
  let interests: string[] = [""];

  // socials
  let instagram = "";
  let telegram = "";
  let tiktok = "";
  let youtube = "";
  let linkedin = "";
  let contactEmail = "";
  let phone = "";

  let team: TeamMember[] = [];

  // -----------------------------
  // Derived selections for instant UI
  // -----------------------------
  let selectedTagTitles: Record<BrandTagType, string[]> = {
    AUDIENCE: [],
    PAIN: [],
    SOLUTION: [],
    MONETIZATION: [],
    CLIENT: [],
  };

  $: selectedTagTitles = {
    AUDIENCE: selectedTitles("AUDIENCE"),
    PAIN: selectedTitles("PAIN"),
    SOLUTION: selectedTitles("SOLUTION"),
    MONETIZATION: selectedTitles("MONETIZATION"),
    CLIENT: selectedTitles("CLIENT"),
  };

  // -----------------------------
  // Helpers
  // -----------------------------
  async function safeJson(r: Response) {
    try {
      return await r.json();
    } catch {
      return null;
    }
  }

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

  function cleanArray(list: string[]) {
    return list.map((x) => x.trim()).filter((x) => x.length > 0);
  }

  function toggleGender(val: string) {
    if (gender.includes(val)) gender = gender.filter((g) => g !== val);
    else gender = [...gender, val];
  }

  async function toggleCategory(cat: Category) {
    if (selectedCategoryIds.includes(cat.id)) {
      selectedCategoryIds = selectedCategoryIds.filter((x) => x !== cat.id);
      selectedCategoryNames = selectedCategoryNames.filter((x) => x !== cat.name);
    } else {
      selectedCategoryIds = [...selectedCategoryIds, cat.id];
      selectedCategoryNames = [...selectedCategoryNames, cat.name];
    }
    await tick(); // ✅ instant fill into button
  }

  const filteredCats = () =>
    categories.filter((c) => c.name.toLowerCase().includes(catsSearch.toLowerCase()));

  function addTeamMember() {
    team = [...team, { name: "", role: "", email: "" }];
  }
  function removeTeamMember(idx: number) {
    team = team.filter((_, i) => i !== idx);
  }

  function onLogoChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    logoFile = file;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = URL.createObjectURL(file);
  }

  // ageAny logic
  $: if (ageAny) {
    ageFrom = null;
    ageTo = null;
  }

  function nextStep() {
    errorMsg = null;
    if (step < 3) {
      step += 1;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function prevStep() {
    errorMsg = null;
    if (step > 1) {
      step -= 1;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // -----------------------------
  // Load data
  // -----------------------------
  async function loadCategories() {
    loadingCategories = true;
    try {
      const r = await fetch("/api/categories");
      if (!r.ok) throw new Error("Failed to load categories");
      categories = await r.json();
    } catch (e: any) {
      errorMsg = e.message || $t('partners.create.errorLoadingCategories');
    } finally {
      loadingCategories = false;
    }
  }

  async function loadTags() {
    loadingTags = true;
    try {
      const types: BrandTagType[] = ["AUDIENCE", "PAIN", "SOLUTION", "CLIENT", "MONETIZATION"];
      const rs = await Promise.all(types.map((t) => fetch(`/api/brands/tags?type=${t}`)));

      for (let i = 0; i < rs.length; i++) {
        const r = rs[i];
        const type = types[i];

        if (!r.ok) {
          const data = await safeJson(r);
          throw new Error(data?.error || `Failed to load ${type} tags`);
        }

        const data = (await r.json()) as BrandTag[];
        tagsByType = { ...tagsByType, [type]: data };
      }
    } catch (e: any) {
      errorMsg = e.message || $t('partners.create.errorLoadingTags');
    } finally {
      loadingTags = false;
    }
  }

  onMount(async () => {
    await loadCategories();
    await loadTags();
  });

  // -----------------------------
  // Submit
  // -----------------------------
  async function submit() {
    errorMsg = null;
    successMsg = null;

    if (!name.trim()) {
      errorMsg = $t('partners.create.nameRequired');
      step = 1;
      return;
    }

    if (selectedCategoryIds.length === 0) {
      errorMsg = $t('partners.create.categoryRequired');
      step = 1;
      return;
    }

    submitting = true;

    try {
      const answers = {
        about: {
          description: description.trim() || null,
          sphere: null,
          products: cleanArray(products),
        },
        audience: {
          gender,
          ageRange: {
            from: ageAny ? null : (ageFrom ?? null),
            to: ageAny ? null : (ageTo ?? null),
          },
          geo: cleanArray(geo),
          interests: cleanArray(interests),
          segments: selectedTitles("AUDIENCE"),
        },
        problems: {
          pains: selectedTitles("PAIN"),
          solutions: selectedTitles("SOLUTION"),
        },
        clients: {
          potential: selectedTitles("CLIENT"),
        },
        monetization: {
          models: selectedTitles("MONETIZATION"),
          notes: null,
        },
        links: {
          website: website.trim() || null,
          socials: {
            instagram: instagram.trim() || null,
            telegram: telegram.trim() || null,
            tiktok: tiktok.trim() || null,
            youtube: youtube.trim() || null,
            linkedin: linkedin.trim() || null,
          },
          contacts: {
            email: contactEmail.trim() || null,
            phone: phone.trim() || null,
          },
        },
        team: team
          .filter((m) => m.name.trim() || m.role.trim() || m.email.trim())
          .map((m) => ({
            name: m.name.trim() || null,
            role: m.role.trim() || null,
            email: m.email.trim() || null,
          })),
      };

      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("website", website.trim() || "");
      fd.append("type", brandType);
      fd.append("categoryIds", JSON.stringify(selectedCategoryIds));
      fd.append("answers", JSON.stringify(answers));
      fd.append("tagIds", JSON.stringify(selectedTagIds));
      if (logoFile) fd.append("logo", logoFile);

      const r = await fetch("/api/brands", { method: "POST", body: fd });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data?.error || "Failed to create brand");

      successMsg = $t('partners.create.brandCreated');

      // reset
      name = "";
      website = "";
      brandType = "COMPANY";
      brandTypeOpen = false;

      description = "";
      products = [""];

      gender = [];
      ageAny = true;
      ageFrom = null;
      ageTo = null;

      geo = [""];
      interests = [""];

      instagram = telegram = tiktok = youtube = linkedin = "";
      contactEmail = phone = "";

      selectedCategoryIds = [];
      selectedCategoryNames = [];
      catsSearch = "";
      catsOpen = false;

      selectedTagIds = [];
      tagOpen = { AUDIENCE: false, PAIN: false, SOLUTION: false, MONETIZATION: false, CLIENT: false };

      logoFile = null;
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      logoPreviewUrl = null;

      team = [];
      step = 1;
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      errorMsg = e.message || $t('partners.create.brandError');
    } finally {
      submitting = false;
    }
  }
  let selectedLabel: Record<BrandTagType, string> = {
  AUDIENCE: "",
  PAIN: "",
  SOLUTION: "",
  CLIENT: "",
  MONETIZATION: "",
};

$: selectedLabel = {
  AUDIENCE: selectedTitles("AUDIENCE").join(", "),
  PAIN: selectedTitles("PAIN").join(", "),
  SOLUTION: selectedTitles("SOLUTION").join(", "),
  CLIENT: selectedTitles("CLIENT").join(", "),
  MONETIZATION: selectedTitles("MONETIZATION").join(", "),
};

</script>

<div class="wrap">
  <h1>{$t('partners.create.title')}</h1>

  <div class="steps-indicator">
    <span class:active={step === 1} on:click={() => (step = 1)}>1. {$t('partners.create.stepBrand')}</span>
    <span class:active={step === 2} on:click={() => (step = 2)}>2. {$t('partners.create.stepBusiness')}</span>
    <span class:active={step === 3} on:click={() => (step = 3)}>3. {$t('partners.create.stepTeam')}</span>
  </div>

  {#if errorMsg}
    <div class="alert error">{errorMsg}</div>
  {/if}
  {#if successMsg}
    <div class="alert success">{successMsg}</div>
  {/if}

  {#if step === 1}
    <section class="card">
      <h2>{$t('partners.create.basics')}</h2>

      <label>
        {$t('partners.create.brandName')} *
        <input bind:value={name} placeholder={$t('partners.create.brandName')} />
      </label>

      <label>
        {$t('partners.create.brandType')} *
        <div class="dropdown">
          <button type="button" class="dropdown-btn" on:click={toggleBrandTypeDropdown}>
            {brandTypeText}
            <span class="chev">{brandTypeOpen ? "▲" : "▼"}</span>
          </button>

          {#if brandTypeOpen}
            <div class="dropdown-menu">
              <div class="menu-list">
                {#each brandTypeOptions as opt}
                  <button
                    type="button"
                    class="menu-btn"
                    class:active={brandType === opt.value}
                    on:click={() => pickBrandType(opt.value)}
                  >
                    {opt.label}
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </label>

      <label>
        {$t('partners.create.logo')}
        <input type="file" accept="image/*" on:change={onLogoChange} />
      </label>

      {#if logoPreviewUrl}
        <div class="logo-preview">
          <img src={logoPreviewUrl} alt="logo preview" />
        </div>
      {/if}

      <label>
        {$t('partners.create.website')}
        <input bind:value={website} placeholder="https://..." />
      </label>
    </section>

    <section class="card">
      <h2>{$t('partners.create.categoriesTitle')} *</h2>

      {#if loadingCategories}
        <div class="muted">{$t('partners.create.loadingCategories')}</div>
      {:else}
        <div class="dropdown">
          <button type="button" class="dropdown-btn" on:click={() => (catsOpen = !catsOpen)}>
            {#if selectedCategoryNames.length}
              {selectedCategoryNames.join(", ")}
            {:else}
              {$t('partners.create.selectCategories')}
            {/if}
            <span class="chev">{catsOpen ? "▲" : "▼"}</span>
          </button>

          {#if catsOpen}
            <div class="dropdown-menu">
              <input
                class="search"
                placeholder={$t('partners.create.searchCategory')}
                value={catsSearch}
                on:input={(e) => setCatsSearch((e.currentTarget as HTMLInputElement).value)}
              />

              <div class="menu-list">
                {#each filteredCats() as c}
                  <label class="menu-item">
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds.includes(c.id)}
                      on:change={() => toggleCategory(c)}
                    />
                    <span>{c.name}</span>
                  </label>
                {/each}

                {#if filteredCats().length === 0}
                  <div class="muted">{$t('partners.create.nothingFound')}</div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <section class="card">
      <h2>{$t('partners.create.socialsTitle')}</h2>
      <label>Instagram <input bind:value={instagram} placeholder="https://instagram.com/..." /></label>
      <label>Telegram <input bind:value={telegram} placeholder="https://t.me/..." /></label>
      <label>TikTok <input bind:value={tiktok} placeholder="https://tiktok.com/..." /></label>
      <label>YouTube <input bind:value={youtube} placeholder="https://youtube.com/..." /></label>
      <label>LinkedIn <input bind:value={linkedin} placeholder="https://linkedin.com/..." /></label>
      <label>{$t('partners.create.email')} <input bind:value={contactEmail} placeholder="hello@brand.com" /></label>
      <label>{$t('partners.create.phone')} <input bind:value={phone} placeholder="+357..." /></label>
    </section>

  {:else if step === 2}
    <section class="card">
      <h2>{$t('partners.create.about')}</h2>

      <label>
        {$t('partners.create.whatDoes')}
        <textarea bind:value={description} rows="3" placeholder={$t('partners.create.shortDescription')} />
      </label>

      <h3>{$t('partners.create.products')}</h3>
      <div class="dynamic">
        {#each products as p, i}
          <div class="row-field">
            <input bind:value={products[i]} placeholder={$t('partners.create.productPlaceholder')} />
            {#if products.length > 1}
              <button type="button" class="remove" on:click={() => removeProductField(i)}>🗑</button>
            {/if}
          </div>
        {/each}
        <button type="button" class="add" on:click={addProductField}>+ {$t('partners.create.add')}</button>
      </div>
    </section>

    <section class="card">
      <h2>{$t('partners.create.targetAudience')}</h2>

      <div class="row">
        <div>
          {$t('partners.create.audienceGender')}
          <div class="chips">
            {#each ["male", "female", "all"] as g}
              <button type="button" class:active={gender.includes(g)} on:click={() => toggleGender(g)}>
                {g}
              </button>
            {/each}
          </div>
        </div>

        <div class="age">
          <div class="age-header">
            <span>{$t('partners.create.age')}</span>
            <label class="age-any">
              <input type="checkbox" bind:checked={ageAny} />
              <span>{$t('partners.create.anyAge')}</span>
            </label>
          </div>

          {#if !ageAny}
            <div class="age-inputs">
              <input type="number" bind:value={ageFrom} placeholder="from" />
              <input type="number" bind:value={ageTo} placeholder="to" />
            </div>
          {:else}
            <div class="muted small">{$t('partners.create.anyAgeOk')}</div>
          {/if}
        </div>
      </div>

      <h3>{$t('partners.create.geography')}</h3>
      <div class="dynamic">
        {#each geo as g, i}
          <div class="row-field">
            <input bind:value={geo[i]} placeholder={$t('partners.create.geoPlaceholder')} />
            {#if geo.length > 1}
              <button type="button" class="remove" on:click={() => removeGeoField(i)}>🗑</button>
            {/if}
          </div>
        {/each}
        <button type="button" class="add" on:click={addGeoField}>+ {$t('partners.create.add')}</button>
      </div>

      <h3>{$t('partners.create.interests')}</h3>
      <div class="dynamic">
        {#each interests as g, i}
          <div class="row-field">
            <input bind:value={interests[i]} placeholder={$t('partners.create.interestPlaceholder')} />
            {#if interests.length > 1}
              <button type="button" class="remove" on:click={() => removeInterestField(i)}>🗑</button>
            {/if}
          </div>
        {/each}
        <button type="button" class="add" on:click={addInterestField}>+ {$t('partners.create.add')}</button>
      </div>

      <h3>{$t('partners.create.audienceSegments')}</h3>
      {#if loadingTags}
        <div class="muted">{$t('partners.create.loadingSuggestions')}</div>
      {:else}
        <div class="dropdown">
          <button type="button" class="dropdown-btn" on:click={() => openTagDropdown("AUDIENCE")}>
            {#if selectedTagTitles.AUDIENCE.length}
              {selectedTagTitles.AUDIENCE.join(", ")}
            {:else}
              {$t('partners.create.selectSegments')}
            {/if}
            <span class="chev">{tagOpen.AUDIENCE ? "▲" : "▼"}</span>
          </button>

          {#if tagOpen.AUDIENCE}
            <div class="dropdown-menu">
         <input class="search" placeholder={$t('common.filter.search')} bind:value={audienceSearch} />


              <div class="menu-list">
                {#each filteredTags("AUDIENCE") as t}
                  <label class="menu-item">
                    <input
                      type="checkbox"
                      checked={isTagSelected(t.id)}
                      on:change={() => toggleTagId(t.id)}
                    />
                    <span>{t.title}</span>
                  </label>
                {/each}

                {#if filteredTags("AUDIENCE").length === 0}
                  <div class="muted">{$t('partners.create.nothingFound')}</div>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <section class="card">
      <h2>{$t('partners.create.problemsTitle')}</h2>

      <h3>{$t('partners.create.problems')}</h3>
      <div class="dropdown">
        <button type="button" class="dropdown-btn" on:click={() => openTagDropdown("PAIN")}>
          {#if selectedTagTitles.PAIN.length}
            {selectedTagTitles.PAIN.join(", ")}
          {:else}
            {$t('partners.create.selectProblems')}
          {/if}
          <span class="chev">{tagOpen.PAIN ? "▲" : "▼"}</span>
        </button>

        {#if tagOpen.PAIN}
          <div class="dropdown-menu">
        <input class="search" placeholder={$t('common.filter.search')} bind:value={painSearch} />

            <div class="menu-list">
              {#each filteredTags("PAIN") as t}
                <label class="menu-item">
                  <input
                    type="checkbox"
                    checked={isTagSelected(t.id)}
                    on:change={() => toggleTagId(t.id)}
                  />
                  <span>{t.title}</span>
                </label>
              {/each}
              {#if filteredTags("PAIN").length === 0}
                <div class="muted">{$t('partners.create.nothingFound')}</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <h3>{$t('partners.create.solutions')}</h3>
      <div class="dropdown">
        <button type="button" class="dropdown-btn" on:click={() => openTagDropdown("SOLUTION")}>
          {#if selectedTagTitles.SOLUTION.length}
            {selectedTagTitles.SOLUTION.join(", ")}
          {:else}
            {$t('partners.create.selectSolutions')}
          {/if}
          <span class="chev">{tagOpen.SOLUTION ? "▲" : "▼"}</span>
        </button>

        {#if tagOpen.SOLUTION}
          <div class="dropdown-menu">
      <input class="search" placeholder={$t('common.filter.search')} bind:value={solutionSearch} />

            <div class="menu-list">
              {#each filteredTags("SOLUTION") as t}
                <label class="menu-item">
                  <input
                    type="checkbox"
                    checked={isTagSelected(t.id)}
                    on:change={() => toggleTagId(t.id)}
                  />
                  <span>{t.title}</span>
                </label>
              {/each}
              {#if filteredTags("SOLUTION").length === 0}
                <div class="muted">{$t('partners.create.nothingFound')}</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <h3>{$t('partners.create.potentialClients')}</h3>
      <div class="dropdown">
        <button type="button" class="dropdown-btn" on:click={() => openTagDropdown("CLIENT")}>
          {#if selectedTagTitles.CLIENT.length}
            {selectedTagTitles.CLIENT.join(", ")}
          {:else}
            {$t('partners.create.selectClients')}
          {/if}
          <span class="chev">{tagOpen.CLIENT ? "▲" : "▼"}</span>
        </button>

        {#if tagOpen.CLIENT}
          <div class="dropdown-menu">
       <input class="search" placeholder={$t('common.filter.search')} bind:value={clientSearch} />

            <div class="menu-list">
              {#each filteredTags("CLIENT") as t}
                <label class="menu-item">
                  <input
                    type="checkbox"
                    checked={isTagSelected(t.id)}
                    on:change={() => toggleTagId(t.id)}
                  />
                  <span>{t.title}</span>
                </label>
              {/each}
              {#if filteredTags("CLIENT").length === 0}
                <div class="muted">{$t('partners.create.nothingFound')}</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <h3>{$t('partners.create.monetization')}</h3>
      <div class="dropdown">
        <button type="button" class="dropdown-btn" on:click={() => openTagDropdown("MONETIZATION")}>
          {#if selectedTagTitles.MONETIZATION.length}
            {selectedTagTitles.MONETIZATION.join(", ")}
          {:else}
            {$t('partners.create.selectMonetization')}
          {/if}
          <span class="chev">{tagOpen.MONETIZATION ? "▲" : "▼"}</span>
        </button>

        {#if tagOpen.MONETIZATION}
          <div class="dropdown-menu">
          <input class="search" placeholder={$t('common.filter.search')} bind:value={monetizationSearch} />

            <div class="menu-list">
              {#each filteredTags("MONETIZATION") as t}
                <label class="menu-item">
                  <input
                    type="checkbox"
                    checked={isTagSelected(t.id)}
                    on:change={() => toggleTagId(t.id)}
                  />
                  <span>{t.title}</span>
                </label>
              {/each}
              {#if filteredTags("MONETIZATION").length === 0}
                <div class="muted">{$t('partners.create.nothingFound')}</div>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </section>

  {:else}
    <section class="card">
      <h2>{$t('partners.create.team')}</h2>

      {#if team.length === 0}
        <div class="muted">{$t('partners.create.noMembers')}</div>
      {/if}

      {#each team as m, i}
        <div class="team-row">
          <input bind:value={m.name} placeholder={$t('partners.create.memberName')} />
          <input bind:value={m.role} placeholder={$t('partners.create.memberRole')} />
          <input bind:value={m.email} placeholder={$t('partners.create.memberEmail')} />
          <button type="button" class="danger" on:click={() => removeTeamMember(i)}>{$t('partners.create.remove')}</button>
        </div>
      {/each}

      <button type="button" on:click={addTeamMember}>+ {$t('partners.create.addMember')}</button>
    </section>
  {/if}

  <div class="actions">
    {#if step > 1}
      <button type="button" class="secondary" on:click={prevStep}>{$t('partners.create.back')}</button>
    {/if}

    {#if step < 3}
      <button type="button" on:click={nextStep}>{$t('partners.create.next')}</button>
    {:else}
      <button type="button" disabled={submitting} on:click={submit}>
        {submitting ? $t('partners.create.creating') : $t('partners.create.createBrand')}
      </button>
    {/if}
  </div>
</div>

<style>
  .wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 32px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  h1 {
    font-size: 32px;
    font-weight: 600;
    margin: 0 0 4px;
    color: #0b3954;
  }

  .steps-indicator {
    display: inline-flex;
    gap: 8px;
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
  }

  .steps-indicator span {
    padding: 4px 10px;
    border-radius: 999px;
    border: 1px solid transparent;
    cursor: pointer;
    background: transparent;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    font-weight: 500;
  }

  .steps-indicator span:hover {
    border-color: rgba(37, 99, 235, 0.3);
  }

  .steps-indicator span.active {
    border-color: #2563eb;
    color: #1d4ed8;
    background: rgba(37, 99, 235, 0.08);
  }

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

  .card h2,
  .card h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 4px;
    color: #0b3954;
  }

  .card h3 {
    margin-top: 10px;
  }

  label {
    display: grid;
    gap: 6px;
    font-size: 14px;
    color: #111827;
    font-weight: 500;
  }

  input,
  textarea {
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

  input::placeholder,
  textarea::placeholder {
    color: #9ca3af;
    font-weight: 400;
  }

  input:focus,
  textarea:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.35);
    background: #ffffff;
  }

  textarea {
    resize: vertical;
    min-height: 80px;
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

  .muted.small {
    font-size: 12px;
  }

  .row {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    align-items: flex-start;
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

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
  }

  .secondary {
    background: #ffffff;
    color: #111827;
    border-color: #d1d5db;
  }

  .secondary:hover {
    background: #f3f4f6;
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  }

  .danger {
    background: #ef4444;
    border-color: #b91c1c;
    color: #fef2f2;
  }

  .danger:hover {
    background: #dc2626;
    box-shadow: 0 3px 10px rgba(220, 38, 38, 0.25);
  }

  .add {
    background: #ffffff;
    color: #2563eb;
    border-color: rgba(37, 99, 235, 0.35);
  }

  .add:hover {
    background: #eff6ff;
  }

  .remove {
    background: #fee2e2;
    color: #b91c1c;
    border-color: #fecaca;
    padding-inline: 10px;
  }

  .remove:hover {
    background: #fecaca;
  }

  .chips {
    display: flex;
    gap: 8px;
    margin-top: 6px;
    flex-wrap: wrap;
  }

  .chips button {
    background: #f9fafb;
    border-color: #e5e7eb;
    color: #374151;
    font-weight: 500;
    padding-inline: 10px;
  }

  .chips button:hover {
    background: #eff6ff;
    border-color: #bfdbfe;
  }

  .chips button.active {
    background: #2563eb;
    border-color: #2563eb;
    color: #ffffff;
  }

  .age {
    min-width: 200px;
  }

  .age-inputs {
    display: flex;
    gap: 8px;
  }

  .age-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .age-any {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: #6b7280;
    font-weight: 400;
  }

  .age-any input {
    width: auto;
    padding: 0;
  }

  .dynamic {
    display: grid;
    gap: 10px;
    margin-bottom: 4px;
  }

  .row-field {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .row-field input {
    flex: 1;
  }

  .team-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 10px;
    align-items: center;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 4px;
  }

  .alert {
    padding: 10px 12px;
    border-radius: 0.8rem;
    font-size: 14px;
    max-width: 1100px;
    font-weight: 400;
  }

  .alert.error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
  }

  .alert.success {
    background: #ecfdf3;
    border: 1px solid #bbf7d0;
    color: #166534;
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

  @media (max-width: 768px) {
    .card {
      padding: 1.4rem;
    }

    .team-row {
      grid-template-columns: 1fr;
    }

    .wrap {
      padding-inline: 12px;
    }
  }
</style>
