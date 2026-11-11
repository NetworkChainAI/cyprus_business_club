<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";

  import Step1Basics from "./Step1Basics.svelte";
  import Step2ClientsBusiness from "./Step2ClientsBusiness.svelte";
  import Step3Team from "./Step3Team.svelte";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "../ContextAssistant.svelte";
  import AskAiButton from "../AskAiButton.svelte";

  import { browser } from "$app/environment";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  let assistantOpen = false;

  export let editBrand: any = null;

  $: isEdit = !!editBrand;

  const DRAFT_KEY = "brand_create_draft";

  function saveDraft() {
    if (!browser || isEdit || !draftReady) return;
    try {
      const draft = {
        name, website, brandType, description, products, gender,
        ageFrom, ageTo, ageAny, geo, interests,
        instagram, telegram, tiktok, youtube, linkedin, contactEmail, phone,
        team, selectedCategoryIds, selectedCategoryNames,
        selectedTagIds, customCategories, customTagsByType, step,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }

  function loadDraft() {
    if (!browser || isEdit) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);

      name = d.name ?? "";
      website = d.website ?? "";
      brandType = d.brandType ?? "COMPANY";
      description = d.description ?? "";
      products = d.products?.length ? d.products : [""];
      gender = d.gender ?? [];
      ageFrom = d.ageFrom ?? null;
      ageTo = d.ageTo ?? null;
      ageAny = d.ageAny ?? true;
      geo = d.geo?.length ? d.geo : [""];
      interests = d.interests?.length ? d.interests : [""];
      instagram = d.instagram ?? "";
      telegram = d.telegram ?? "";
      tiktok = d.tiktok ?? "";
      youtube = d.youtube ?? "";
      linkedin = d.linkedin ?? "";
      contactEmail = d.contactEmail ?? "";
      phone = d.phone ?? "";
      team = d.team ?? [];
      selectedCategoryIds = d.selectedCategoryIds ?? [];
      selectedCategoryNames = d.selectedCategoryNames ?? [];
      selectedTagIds = d.selectedTagIds ?? [];
      customCategories = d.customCategories ?? [];
      customTagsByType = d.customTagsByType ?? { AUDIENCE: [], PAIN: [], SOLUTION: [], CLIENT: [], MONETIZATION: [] };
      step = d.step ?? 1;
    } catch {}
  }

  function clearDraft() {
    if (!browser) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }

  type Category = { id: string; name: string };
  type TeamMember = { name: string; role: string; email: string; userId?: string | null; photo?: string | null };

  type BrandTagType =
    | "AUDIENCE"
    | "PAIN"
    | "SOLUTION"
    | "MONETIZATION"
    | "CLIENT";
  type BrandTag = { id: string; type: BrandTagType; title: string };

  // Data loading state
  let categories: Category[] = [];
  let loadingCategories = true;

  let loadingTags = true;
  let tagsByType: Record<BrandTagType, BrandTag[]> = {
    AUDIENCE: [],
    PAIN: [],
    SOLUTION: [],
    MONETIZATION: [],
    CLIENT: [],
  };

  // Form state
  let selectedCategoryIds: string[] = [];
  let selectedCategoryNames: string[] = [];
  let selectedTagIds: string[] = [];

  let name = "";
  let website = "";
  let brandType: "PERSONAL" | "COMPANY" = "COMPANY";

  let logoFile: File | null = null;
  let logoPreviewUrl: string | null = null;

  let description = "";
  let products: string[] = [""];

  let gender: string[] = [];
  let ageFrom: number | null = null;
  let ageTo: number | null = null;
  let ageAny = true;

  let geo: string[] = [""];
  let interests: string[] = [""];

  let instagram = "";
  let telegram = "";
  let tiktok = "";
  let youtube = "";
  let linkedin = "";
  let contactEmail = "";
  let phone = "";

  let team: TeamMember[] = [];

  // Custom entries (not from DB)
  let customCategories: string[] = [];
  let customTagsByType: Record<BrandTagType, string[]> = {
    AUDIENCE: [],
    PAIN: [],
    SOLUTION: [],
    CLIENT: [],
    MONETIZATION: [],
  };

  // UI state
  let draftReady = false;
  let step = 1;
  let submitting = false;
  let errorMsg: string | null = null;
  let successMsg: string | null = null;

  // Reactive form snapshot for AI assistant context
  $: formSnapshot = {
    name,
    website,
    brandType,
    description,
    products: products.filter((p) => p.trim()),
    gender,
    ageRange: ageAny ? "any" : `${ageFrom ?? "?"}-${ageTo ?? "?"}`,
    geo: geo.filter((g) => g.trim()),
    interests: interests.filter((i) => i.trim()),
    categories: selectedCategoryNames,
    pains: [...selectedTitles("PAIN"), ...customTagsByType.PAIN],
    solutions: [...selectedTitles("SOLUTION"), ...customTagsByType.SOLUTION],
    clients: [...selectedTitles("CLIENT"), ...customTagsByType.CLIENT],
    monetization: [...selectedTitles("MONETIZATION"), ...customTagsByType.MONETIZATION],
    step,
  };

  function handleApplySuggestion(e: CustomEvent<{ field: string; value: string }>) {
    const { field, value } = e.detail;
    switch (field) {
      case "description":
        description = value;
        break;
      case "products":
        if (products.length === 1 && !products[0].trim()) products = [value];
        else products = [...products, value];
        break;
      case "geo":
        if (geo.length === 1 && !geo[0].trim()) geo = [value];
        else geo = [...geo, value];
        break;
      case "interests":
        if (interests.length === 1 && !interests[0].trim()) interests = [value];
        else interests = [...interests, value];
        break;
      case "pains":
        customTagsByType = { ...customTagsByType, PAIN: [...customTagsByType.PAIN, value] };
        break;
      case "solutions":
        customTagsByType = { ...customTagsByType, SOLUTION: [...customTagsByType.SOLUTION, value] };
        break;
      case "clients":
        customTagsByType = { ...customTagsByType, CLIENT: [...customTagsByType.CLIENT, value] };
        break;
      case "monetization":
        customTagsByType = { ...customTagsByType, MONETIZATION: [...customTagsByType.MONETIZATION, value] };
        break;
    }
  }

  $: steps = [
    { num: 1, label: $t('partners.create.stepBrand'), icon: "lucide:building-2" },
    { num: 2, label: $t('partners.create.stepBusiness'), icon: "lucide:target" },
    { num: 3, label: $t('partners.create.stepTeam'), icon: "lucide:users" },
  ];

  // Helpers
  async function safeJson(r: Response) {
    try {
      return await r.json();
    } catch {
      return null;
    }
  }

  function cleanArray(list: string[]) {
    return list.map((x) => x.trim()).filter((x) => x.length > 0);
  }

  async function toggleCategory(cat: Category) {
    if (selectedCategoryIds.includes(cat.id)) {
      selectedCategoryIds = selectedCategoryIds.filter((x) => x !== cat.id);
      selectedCategoryNames = selectedCategoryNames.filter(
        (x) => x !== cat.name
      );
    } else {
      selectedCategoryIds = [...selectedCategoryIds, cat.id];
      selectedCategoryNames = [...selectedCategoryNames, cat.name];
    }
    await tick();
  }

  async function toggleTagId(id: string) {
    if (selectedTagIds.includes(id)) {
      selectedTagIds = selectedTagIds.filter((x) => x !== id);
    } else {
      selectedTagIds = [...selectedTagIds, id];
    }
    await tick();
  }

  function selectedTitles(type: BrandTagType) {
    const list = tagsByType[type] || [];
    return list
      .filter((t) => selectedTagIds.includes(t.id))
      .map((t) => t.title);
  }

  function toggleGender(val: string) {
    if (gender.includes(val)) gender = gender.filter((g) => g !== val);
    else gender = [...gender, val];
  }

  function onLogoChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    logoFile = file;
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    logoPreviewUrl = URL.createObjectURL(file);
  }

  $: if (ageAny) {
    ageFrom = null;
    ageTo = null;
  }

  // Auto-save draft to localStorage whenever form fields change
  $: if (browser && !isEdit) {
    // Reference all fields so Svelte tracks them
    void [name, website, brandType, description, products, gender,
      ageFrom, ageTo, ageAny, geo, interests,
      instagram, telegram, tiktok, youtube, linkedin, contactEmail, phone,
      team, selectedCategoryIds, selectedCategoryNames,
      selectedTagIds, customCategories, customTagsByType, step];
    saveDraft();
  }

  function goToStep(n: number) {
    errorMsg = null;
    step = n;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function nextStep() {
    if (step < 3) goToStep(step + 1);
  }
  function prevStep() {
    if (step > 1) goToStep(step - 1);
  }

  // Load data
  async function loadCategories() {
    loadingCategories = true;
    try {
      const r = await fetch("/api/categories");
      if (!r.ok) throw new Error("Failed to load categories");
      categories = await r.json();
    } catch (e: any) {
      errorMsg = e.message || "Error loading categories";
    } finally {
      loadingCategories = false;
    }
  }

  async function loadTags() {
    loadingTags = true;
    try {
      const types: BrandTagType[] = [
        "AUDIENCE",
        "PAIN",
        "SOLUTION",
        "CLIENT",
        "MONETIZATION",
      ];
      const rs = await Promise.all(
        types.map((t) => fetch(`/api/brands/tags?type=${t}`))
      );

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
      errorMsg = e.message || "Error loading tags";
    } finally {
      loadingTags = false;
    }
  }

  function initEditMode() {
    if (!editBrand) return;

    name = editBrand.name || "";
    website = editBrand.website || "";
    brandType = editBrand.type === "PERSONAL" ? "PERSONAL" : "COMPANY";

    // Logo
    if (editBrand.logoUrl) {
      const src = photoSrc(editBrand.logoUrl);
      if (src) logoPreviewUrl = src;
    }

    // Categories
    if (editBrand.categories?.length) {
      selectedCategoryIds = editBrand.categories.map((c: any) => c.id);
      selectedCategoryNames = editBrand.categories.map((c: any) => c.name);
    }

    // Tags
    if (editBrand.tags?.length) {
      selectedTagIds = editBrand.tags.map((t: any) => t.tag?.id || t.tagId).filter(Boolean);
    }

    // Answers
    const ans = (editBrand.answers as any) ?? {};

    description = ans.about?.description || "";
    products = ans.about?.products?.length ? [...ans.about.products] : [""];

    gender = ans.audience?.gender ?? [];
    const ageRange = ans.audience?.ageRange;
    if (ageRange && (ageRange.from !== null || ageRange.to !== null)) {
      ageAny = false;
      ageFrom = ageRange.from ?? null;
      ageTo = ageRange.to ?? null;
    }
    geo = ans.audience?.geo?.length ? [...ans.audience.geo] : [""];
    interests = ans.audience?.interests?.length ? [...ans.audience.interests] : [""];

    // Socials & contacts
    const socials = ans.links?.socials ?? {};
    instagram = socials.instagram || "";
    telegram = socials.telegram || "";
    tiktok = socials.tiktok || "";
    youtube = socials.youtube || "";
    linkedin = socials.linkedin || "";

    const contacts = ans.links?.contacts ?? {};
    contactEmail = contacts.email || "";
    phone = contacts.phone || "";

    // Team
    if (ans.team?.length) {
      team = ans.team.map((m: any) => ({
        name: m.name || "",
        role: m.role || "",
        email: m.email || "",
        userId: m.userId || null,
        photo: m.photo || null,
      }));
    }

    // Restore custom categories
    if (ans.customCategories?.length) {
      customCategories = [...ans.customCategories];
    }

    // Restore custom tags from answers (titles not found in DB tags)
    const answerTitlesByType: Record<string, string[]> = {
      AUDIENCE: ans.audience?.segments || [],
      PAIN: ans.problems?.pains || [],
      SOLUTION: ans.problems?.solutions || [],
      CLIENT: ans.clients?.potential || [],
      MONETIZATION: ans.monetization?.models || [],
    };

    const tagTypes: BrandTagType[] = ["AUDIENCE", "PAIN", "SOLUTION", "CLIENT", "MONETIZATION"];
    for (const type of tagTypes) {
      const savedTitles = answerTitlesByType[type] || [];
      const allDbTitles = (tagsByType[type] || []).map((t) => t.title.toLowerCase());
      customTagsByType[type] = savedTitles.filter(
        (title) => !allDbTitles.includes(title.toLowerCase())
      );
    }
    customTagsByType = { ...customTagsByType };
  }

  onMount(async () => {
    await loadCategories();
    await loadTags();
    if (isEdit) initEditMode();
    else loadDraft();
    draftReady = true;
  });

  // Submit
  async function submit() {
    errorMsg = null;
    successMsg = null;

    if (!name.trim()) {
      errorMsg = t.get('partners.create.errorNameRequired');
      step = 1;
      return;
    }

    if (selectedCategoryIds.length === 0 && customCategories.length === 0) {
      errorMsg = t.get('partners.create.errorCategoryRequired');
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
          segments: [...selectedTitles("AUDIENCE"), ...customTagsByType.AUDIENCE],
        },
        problems: {
          pains: [...selectedTitles("PAIN"), ...customTagsByType.PAIN],
          solutions: [...selectedTitles("SOLUTION"), ...customTagsByType.SOLUTION],
        },
        clients: {
          potential: [...selectedTitles("CLIENT"), ...customTagsByType.CLIENT],
        },
        monetization: {
          models: [...selectedTitles("MONETIZATION"), ...customTagsByType.MONETIZATION],
          notes: null,
        },
        customCategories: customCategories.length > 0 ? [...customCategories] : undefined,
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
            userId: m.userId || null,
            photo: m.photo || null,
          })),
      };

      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("website", website.trim() || "");
      fd.append("type", brandType);
      fd.append("categoryIds", JSON.stringify(selectedCategoryIds));
      fd.append("answers", JSON.stringify(answers));
      fd.append("tagIds", JSON.stringify(selectedTagIds));

      if (logoFile) {
        fd.append("logo", logoFile);
      } else if (isEdit && editBrand.logoUrl) {
        fd.append("existingLogo", editBrand.logoUrl);
      }

      const url = isEdit ? `/api/brands/${editBrand.id}` : "/api/brands";
      const method = isEdit ? "PATCH" : "POST";

      const r = await fetch(url, { method, body: fd });
      const data = await safeJson(r);
      if (!r.ok) throw new Error(data?.error || (isEdit ? t.get('partners.create.errorUpdate') : t.get('partners.create.errorCreate')));

      if (isEdit) {
        successMsg = t.get('partners.create.successUpdate');
      } else {
        successMsg = t.get('partners.create.successCreate');
        clearDraft();

        name = "";
        website = "";
        brandType = "COMPANY";
        description = "";
        products = [""];
        gender = [];
        ageAny = true;
        geo = [""];
        interests = [""];
        instagram = telegram = tiktok = youtube = linkedin = "";
        contactEmail = phone = "";
        selectedCategoryIds = [];
        selectedCategoryNames = [];
        selectedTagIds = [];
        logoFile = null;
        if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
        logoPreviewUrl = null;
        team = [];
        customCategories = [];
        customTagsByType = { AUDIENCE: [], PAIN: [], SOLUTION: [], CLIENT: [], MONETIZATION: [] };
        step = 1;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      errorMsg = e.message || (isEdit ? t.get('partners.create.errorUpdate') : t.get('partners.create.errorCreate'));
    } finally {
      submitting = false;
    }
  }
</script>

<div class="page">
  <div class="header">
    <div class="header-content">
      <h1>{isEdit ? $t('partners.create.editTitle') : $t('partners.create.createTitle')}</h1>
      <p class="subtitle">{isEdit ? $t('partners.create.editSubtitle') : $t('partners.create.createSubtitle')}</p>
      <div style="margin-top: 8px;">
        <AskAiButton label={$t('partners.create.askAi')} on:click={() => (assistantOpen = true)} />
      </div>
    </div>
  </div>

  <div class="stepper">
    {#each steps as s, i}
      <button
        type="button"
        class="step"
        class:active={step === s.num}
        class:done={step > s.num}
        on:click={() => goToStep(s.num)}
      >
        <div class="step-circle">
          {#if step > s.num}
            <iconify-icon icon="lucide:check" width="16" height="16" />
          {:else}
            <iconify-icon icon={s.icon} width="16" height="16" />
          {/if}
        </div>
        <span class="step-label">{s.label}</span>
      </button>
      {#if i < steps.length - 1}
        <div class="step-line" class:filled={step > s.num}></div>
      {/if}
    {/each}
  </div>

  {#if errorMsg}
    <div class="alert alert-error">
      <iconify-icon icon="lucide:alert-circle" width="18" height="18" />
      <span>{errorMsg}</span>
    </div>
  {/if}

  {#if successMsg}
    <div class="alert alert-success">
      <iconify-icon icon="lucide:check-circle-2" width="18" height="18" />
      <span>{successMsg}</span>
    </div>
  {/if}

  <div class="body">
    {#if step === 1}
      <Step1Basics
        bind:name
        bind:website
        bind:brandType
        bind:logoFile
        bind:logoPreviewUrl
        {categories}
        {loadingCategories}
        bind:selectedCategoryIds
        bind:selectedCategoryNames
        bind:customCategories
        bind:instagram
        bind:telegram
        bind:tiktok
        bind:youtube
        bind:linkedin
        bind:contactEmail
        bind:phone
        {onLogoChange}
        {toggleCategory}
      />
    {:else if step === 2}
      <Step2ClientsBusiness
        bind:description
        bind:products
        bind:gender
        bind:ageFrom
        bind:ageTo
        bind:ageAny
        bind:geo
        bind:interests
        {tagsByType}
        {loadingTags}
        bind:selectedTagIds
        bind:customTagsByType
        {toggleTagId}
        {toggleGender}
      />
    {:else}
      <Step3Team bind:team />
    {/if}
  </div>

  <div class="actions">
    {#if step > 1}
      <button type="button" class="btn btn-secondary" on:click={prevStep}>
        <iconify-icon icon="lucide:arrow-left" width="16" height="16" />
        {$t('partners.create.back')}
      </button>
    {/if}

    {#if step < 3}
      <button type="button" class="btn btn-primary" on:click={nextStep}>
        {$t('partners.create.continue')}
        <iconify-icon icon="lucide:arrow-right" width="16" height="16" />
      </button>
    {:else}
      <button type="button" class="btn btn-primary" disabled={submitting} on:click={submit}>
        {#if submitting}
          <iconify-icon icon="lucide:loader-2" width="16" height="16" class="spin" />
          {isEdit ? $t('partners.create.saving') : $t('partners.create.creating')}
        {:else}
          <iconify-icon icon={isEdit ? "lucide:save" : "lucide:rocket"} width="16" height="16" />
          {isEdit ? $t('partners.create.saveChanges') : $t('partners.create.createBrand')}
        {/if}
      </button>
    {/if}
  </div>
</div>

<ContextAssistant
  bind:open={assistantOpen}
  contextKey="brand_create"
  payload={formSnapshot}
  title={$t('partners.create.assistantTitle')}
  on:apply={handleApplySuggestion}
/>

<style>
  .page {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px 16px 60px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .header {
    text-align: center;
    padding-bottom: 4px;
  }

  h1 {
    font-size: 28px;
    font-weight: 900;
    margin: 0;
    color: #0f172a;
  }

  .subtitle {
    margin: 6px 0 0;
    color: #64748b;
    font-size: 15px;
    font-weight: 400;
  }

  /* Stepper */
  .stepper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 0 20px;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    min-width: 72px;
  }

  .step-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f1f5f9;
    border: 2px solid #e2e8f0;
    color: #94a3b8;
    transition: all 0.25s ease;
  }

  .step.active .step-circle {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
  }

  .step.done .step-circle {
    background: #10b981;
    border-color: #10b981;
    color: #fff;
  }

  .step-label {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    transition: color 0.2s;
  }

  .step.active .step-label {
    color: #4f46e5;
  }

  .step.done .step-label {
    color: #10b981;
  }

  .step-line {
    flex: 1;
    height: 2px;
    background: #e2e8f0;
    margin: 0 8px;
    margin-bottom: 22px;
    border-radius: 1px;
    transition: background 0.3s;
    max-width: 80px;
  }

  .step-line.filled {
    background: #10b981;
  }

  /* Alerts */
  .alert {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 500;
  }

  .alert-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .alert-success {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    color: #059669;
  }

  /* Body */
  .body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Actions */
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
    transition: all 0.2s ease;
  }

  .btn-primary {
    background: #4f46e5;
    color: #fff;
  }

  .btn-primary:hover {
    background: #4338ca;
    box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3);
    transform: translateY(-1px);
  }

  .btn-primary:active {
    transform: translateY(0);
    box-shadow: none;
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .btn-secondary {
    background: #fff;
    color: #0f172a;
    border: 1px solid #e2e8f0;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .page {
      padding: 20px 12px 40px;
      gap: 18px;
    }

    h1 {
      font-size: 24px;
    }

    .step-label {
      font-size: 11px;
    }

    .step-circle {
      width: 36px;
      height: 36px;
    }
  }
</style>
