<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { t } from "$lib/i18n";
  import "leaflet/dist/leaflet.css";
  import { pageHasAssistant } from "$lib/stores/assistant";
  import ContextAssistant from "../ContextAssistant.svelte";
  import AskAiButton from "../AskAiButton.svelte";

  onMount(() => pageHasAssistant.set(true));
  onDestroy(() => pageHasAssistant.set(false));

  let assistantOpen = false;

  interface Category {
    id: string;
    name: string;
  }

  interface OwnedBrand {
    id: string;
    name: string;
    type: string;
    logoUrl: string | null;
  }

  interface OwnedCommunity {
    id: string;
    name: string;
    logoUrl: string | null;
  }

  type AgendaItem = {
    start: string; // "HH:MM"
    end?: string; // "HH:MM"
    title: string;
    description?: string;
  };

  type SponsorItem = {
    mode: "platform" | "custom";
    brandId?: string;
    brandName?: string;
    brandLogo?: string;
    name?: string;
    logoFile?: File | null;
    logoPreview?: string;
    logoDragging?: boolean;
  };

  type SpeakerItem = {
    mode: "platform" | "custom";
    userId?: string;
    userName?: string;
    userPhoto?: string;
    name?: string;
    email?: string;
    photoFile?: File | null;
    photoPreview?: string;
    photoDragging?: boolean;
    title?: string;
  };

  export let ownedBrands: OwnedBrand[] = [];
  export let ownedCommunities: OwnedCommunity[] = [];
  export let serverCategories: Category[] = [];
  export let editEvent: any = null;

  $: isEdit = !!editEvent;

  // "Create as" state: "personal" | "community:ID" | "brand:ID"
  let createAs = "personal";

  let title = "";
  let description = "";
  let date = "";
  let location = "";
  let selectedCategories: string[] = [];
  let price = "";
  let photo: File | null = null;
  let documentFile: File | null = null;
  let photoPreview = "";
  let success = false;
  let error = "";
  let loading = false;
  let dropdownOpen = false;
  let categories: Category[] = [];

  let agendaItems: AgendaItem[] = [];

  // ---------- Sponsors ----------
  let sponsorItems: SponsorItem[] = [];
  let sponsorSearchQuery = "";
  let sponsorSearchResults: Array<{ id: string; name: string; logoUrl: string | null; type: string }> = [];
  let sponsorSearching = false;
  let activeSponsorIdx: number | null = null;
  let sponsorDebounce: ReturnType<typeof setTimeout> | null = null;

  function addSponsor() {
    sponsorItems = [...sponsorItems, { mode: "custom" }];
  }

  function removeSponsor(idx: number) {
    sponsorItems = sponsorItems.filter((_, i) => i !== idx);
    if (activeSponsorIdx === idx) activeSponsorIdx = null;
  }

  function setSponsorMode(idx: number, mode: "platform" | "custom") {
    sponsorItems = sponsorItems.map((s, i) =>
      i === idx ? { mode, ...(mode === "custom" ? {} : {}) } : s
    );
    if (mode === "platform") activeSponsorIdx = idx;
    else activeSponsorIdx = null;
  }

  async function searchBrands(q: string) {
    if (q.length < 2) { sponsorSearchResults = []; return; }
    sponsorSearching = true;
    try {
      const res = await fetch(`/api/brands/search?q=${encodeURIComponent(q)}`);
      if (res.ok) sponsorSearchResults = await res.json();
    } finally { sponsorSearching = false; }
  }

  function onSponsorSearchInput(idx: number) {
    activeSponsorIdx = idx;
    if (sponsorDebounce) clearTimeout(sponsorDebounce);
    sponsorDebounce = setTimeout(() => searchBrands(sponsorSearchQuery), 300);
  }

  function selectBrandForSponsor(idx: number, brand: typeof sponsorSearchResults[0]) {
    sponsorItems = sponsorItems.map((s, i) =>
      i === idx ? { mode: "platform", brandId: brand.id, brandName: brand.name, brandLogo: brand.logoUrl ?? undefined } : s
    );
    sponsorSearchQuery = "";
    sponsorSearchResults = [];
    activeSponsorIdx = null;
  }

  let sponsorFileInputs: Record<number, HTMLInputElement> = {};

  function handleSponsorLogoSelect(idx: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    sponsorItems = sponsorItems.map((s, i) =>
      i === idx ? { ...s, logoFile: file, logoPreview: URL.createObjectURL(file) } : s
    );
  }

  function handleSponsorLogoDrop(idx: number, e: DragEvent) {
    sponsorItems = sponsorItems.map((s, i) => i === idx ? { ...s, logoDragging: false } : s);
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    sponsorItems = sponsorItems.map((s, i) =>
      i === idx ? { ...s, logoFile: file, logoPreview: URL.createObjectURL(file) } : s
    );
  }

  function removeSponsorLogo(idx: number) {
    const sp = sponsorItems[idx];
    if (sp?.logoPreview) URL.revokeObjectURL(sp.logoPreview);
    sponsorItems = sponsorItems.map((s, i) =>
      i === idx ? { ...s, logoFile: null, logoPreview: undefined } : s
    );
    if (sponsorFileInputs[idx]) sponsorFileInputs[idx].value = "";
  }

  // ---------- Speakers ----------
  let speakerItems: SpeakerItem[] = [];
  let speakerSearchQuery = "";
  let speakerSearchResults: Array<{ id: string; email: string; info: { name: string | null; photo: string | null; status: string | null } | null }> = [];
  let speakerSearching = false;
  let activeSpeakerIdx: number | null = null;
  let speakerDebounce: ReturnType<typeof setTimeout> | null = null;

  function addSpeaker() {
    speakerItems = [...speakerItems, { mode: "custom" }];
  }

  function removeSpeaker(idx: number) {
    speakerItems = speakerItems.filter((_, i) => i !== idx);
    if (activeSpeakerIdx === idx) activeSpeakerIdx = null;
  }

  function setSpeakerMode(idx: number, mode: "platform" | "custom") {
    speakerItems = speakerItems.map((s, i) =>
      i === idx ? { mode, ...(mode === "custom" ? {} : {}) } : s
    );
    if (mode === "platform") activeSpeakerIdx = idx;
    else activeSpeakerIdx = null;
  }

  async function searchMembers(q: string) {
    if (q.length < 2) { speakerSearchResults = []; return; }
    speakerSearching = true;
    try {
      const res = await fetch(`/api/members/search?q=${encodeURIComponent(q)}`);
      if (res.ok) speakerSearchResults = await res.json();
    } finally { speakerSearching = false; }
  }

  function onSpeakerSearchInput(idx: number) {
    activeSpeakerIdx = idx;
    if (speakerDebounce) clearTimeout(speakerDebounce);
    speakerDebounce = setTimeout(() => searchMembers(speakerSearchQuery), 300);
  }

  function selectUserForSpeaker(idx: number, user: typeof speakerSearchResults[0]) {
    speakerItems = speakerItems.map((s, i) =>
      i === idx ? { mode: "platform", userId: user.id, userName: user.info?.name ?? user.email, userPhoto: user.info?.photo ?? undefined } : s
    );
    speakerSearchQuery = "";
    speakerSearchResults = [];
    activeSpeakerIdx = null;
  }

  let speakerFileInputs: Record<number, HTMLInputElement> = {};

  function handleSpeakerPhotoSelect(idx: number, e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    speakerItems = speakerItems.map((s, i) =>
      i === idx ? { ...s, photoFile: file, photoPreview: URL.createObjectURL(file) } : s
    );
  }

  function handleSpeakerPhotoDrop(idx: number, e: DragEvent) {
    speakerItems = speakerItems.map((s, i) => i === idx ? { ...s, photoDragging: false } : s);
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    speakerItems = speakerItems.map((s, i) =>
      i === idx ? { ...s, photoFile: file, photoPreview: URL.createObjectURL(file) } : s
    );
  }

  function removeSpeakerPhoto(idx: number) {
    const sp = speakerItems[idx];
    if (sp?.photoPreview) URL.revokeObjectURL(sp.photoPreview);
    speakerItems = speakerItems.map((s, i) =>
      i === idx ? { ...s, photoFile: null, photoPreview: undefined } : s
    );
    if (speakerFileInputs[idx]) speakerFileInputs[idx].value = "";
  }

  let latitude = "";
  let longitude = "";
  let isMapVisible = false;
  let mapContainer: HTMLDivElement;
  let map: any;
  let marker: any;
  const toggleDropdown = (e: MouseEvent) => {
    e.stopPropagation();
    dropdownOpen = !dropdownOpen;
  };

  function initEditMode() {
    if (!editEvent) return;
    title = editEvent.title ?? "";
    description = editEvent.description ?? "";
    location = editEvent.location ?? "";
    price = editEvent.price != null ? String(editEvent.price) : "";
    latitude = editEvent.latitude != null ? String(editEvent.latitude) : "";
    longitude = editEvent.longitude != null ? String(editEvent.longitude) : "";

    // Format date for datetime-local input
    if (editEvent.date) {
      const d = new Date(editEvent.date);
      const pad = (n: number) => String(n).padStart(2, "0");
      date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    // Categories
    if (editEvent.categories?.length) {
      selectedCategories = editEvent.categories.map((c: any) => c.id);
    }

    // Photo preview
    if (editEvent.photo) {
      photoPreview = photoSrc(editEvent.photo, 600) ?? "";
    }

    // Agenda
    if (editEvent.agenda && Array.isArray(editEvent.agenda)) {
      agendaItems = editEvent.agenda.map((a: any) => ({
        start: a.start ?? "",
        end: a.end ?? "",
        title: a.title ?? "",
        description: a.description ?? "",
      }));
    }

    // Create as
    if (editEvent.communityId) {
      createAs = `community:${editEvent.communityId}`;
    } else if (editEvent.brandId) {
      createAs = `brand:${editEvent.brandId}`;
    } else {
      createAs = "personal";
    }

    // Sponsors
    if (editEvent.sponsors?.length) {
      sponsorItems = editEvent.sponsors.map((s: any) => {
        if (s.brandId && s.brand) {
          return {
            mode: "platform" as const,
            brandId: s.brand.id,
            brandName: s.brand.name,
            brandLogo: s.brand.logoUrl ? (photoSrc(s.brand.logoUrl) ?? undefined) : undefined,
          };
        }
        return {
          mode: "custom" as const,
          name: s.name ?? "",
          logoPreview: s.logoUrl ? (photoSrc(s.logoUrl) ?? undefined) : undefined,
        };
      });
    }

    // Speakers
    if (editEvent.speakers?.length) {
      speakerItems = editEvent.speakers.map((s: any) => {
        if (s.userId && s.user) {
          return {
            mode: "platform" as const,
            userId: s.user.id,
            userName: s.user.info?.name ?? "User",
            userPhoto: s.user.info?.photo ? (photoSrc(s.user.info.photo) ?? undefined) : undefined,
            title: s.title ?? "",
          };
        }
        return {
          mode: "custom" as const,
          name: s.name ?? "",
          email: s.email ?? "",
          title: s.title ?? "",
          photoPreview: s.photoUrl ? (photoSrc(s.photoUrl) ?? undefined) : undefined,
        };
      });
    }
  }

  onMount(() => {
    let alive = true;

    const onDocClick = () => (dropdownOpen = false);
    document.addEventListener("click", onDocClick);

    if (serverCategories.length > 0) {
      categories = serverCategories;
    } else {
      (async () => {
        const res = await fetch("/api/categories");
        if (!alive) return;
        if (res.ok) categories = await res.json();
      })();
    }

    initEditMode();

    return () => {
      alive = false;
      document.removeEventListener("click", onDocClick);
    };
  });

  const toggleCategory = (id: string) => {
    const selected = selectedCategories.includes(id);

    if (selected) {
      selectedCategories = selectedCategories.filter((c) => c !== id);
      return;
    }

    if (selectedCategories.length >= MAX_CATEGORIES) {
      error = t.get('admin.event.maxCategories');
      return;
    }

    selectedCategories = [...selectedCategories, id];
  };

  let photoInput: HTMLInputElement;
  let docInput: HTMLInputElement;
  let photoDragging = false;

  const handlePhotoUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      photo = target.files[0];
      photoPreview = URL.createObjectURL(photo);
    }
  };

  function handlePhotoDrop(e: DragEvent) {
    photoDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    photoInput.files = dt.files;
    photoInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function removePhoto() {
    photo = null;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    photoPreview = "";
    if (photoInput) photoInput.value = "";
  }

  const handleDocumentUpload = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files?.length) {
      documentFile = target.files[0];
    }
  };

  function removeDocument() {
    documentFile = null;
    if (docInput) docInput.value = "";
  }
  let categoryQuery = "";
  const MAX_CATEGORIES = 12;

  $: filteredCategories =
    categoryQuery.trim().length === 0
      ? categories
      : categories.filter((c) =>
          c.name.toLowerCase().includes(categoryQuery.trim().toLowerCase())
        );

  const isLimitReached = () => selectedCategories.length >= MAX_CATEGORIES;

  // ---------- Agenda ----------
  const addAgendaItem = () => {
    agendaItems = [
      ...agendaItems,
      { start: "10:00", end: "11:00", title: "", description: "" },
    ];
  };

  const removeAgendaItem = (idx: number) => {
    agendaItems = agendaItems.filter((_, i) => i !== idx);
  };

  const updateAgendaItem = (idx: number, patch: Partial<AgendaItem>) => {
    agendaItems = agendaItems.map((it, i) =>
      i === idx ? { ...it, ...patch } : it
    );
  };

  const isValidHHMM = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

  // ---------- Location autocomplete ----------
  interface NominatimResult {
    place_id: number;
    display_name: string;
    lat: string;
    lon: string;
  }

  let locationSuggestions: NominatimResult[] = [];
  let showSuggestions = false;
  let locationSearching = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let locationInputEl: HTMLInputElement;

  function onLocationInput() {
    const q = location.trim();
    if (q.length < 3) {
      locationSuggestions = [];
      showSuggestions = false;
      return;
    }
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => searchLocation(q), 350);
  }

  async function searchLocation(query: string) {
    locationSearching = true;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&accept-language=en`
      );
      const data: NominatimResult[] = await res.json();
      locationSuggestions = data;
      showSuggestions = data.length > 0;
    } catch {
      locationSuggestions = [];
      showSuggestions = false;
    } finally {
      locationSearching = false;
    }
  }

  async function selectLocation(result: NominatimResult) {
    location = result.display_name;
    latitude = parseFloat(result.lat).toFixed(6);
    longitude = parseFloat(result.lon).toFixed(6);
    showSuggestions = false;
    locationSuggestions = [];

    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Auto-show map and move to selected location
    if (!isMapVisible) {
      isMapVisible = true;
      await initMap();
      setTimeout(() => {
        map.invalidateSize();
        marker.setLatLng([lat, lng]);
        map.setView([lat, lng], 16);
      }, 200);
    } else if (map && marker) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 16);
    }
  }

  function onLocationBlur() {
    // Delay hiding so click on suggestion can fire first
    setTimeout(() => (showSuggestions = false), 200);
  }

  function onLocationFocus() {
    if (locationSuggestions.length > 0) showSuggestions = true;
  }

  // ---------- Map ----------
  async function getAddress(lat: number, lng: number) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=en`
    );
    const data = await res.json();
    if (data?.display_name) location = data.display_name;
    else location = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }

  async function initMap() {
    if (map) return;

    const L = await import("leaflet");

    // Start from existing coords or default to Limassol
    const initLat = latitude ? parseFloat(latitude) : 34.6841;
    const initLng = longitude ? parseFloat(longitude) : 33.0379;
    const initZoom = latitude ? 16 : 10;

    map = L.map(mapContainer, { zoomControl: false }).setView([initLat, initLng], initZoom);

    // Clean white map — CartoDB Positron (minimal, light, just buildings & streets)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);

    // Zoom control in bottom-right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);

    marker.on("dragend", async () => {
      const { lat, lng } = marker.getLatLng();
      latitude = lat.toFixed(6);
      longitude = lng.toFixed(6);
      await getAddress(lat, lng);
    });

    map.on("click", async (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      latitude = lat.toFixed(6);
      longitude = lng.toFixed(6);
      await getAddress(lat, lng);
    });
  }

  const toggleMap = async () => {
    isMapVisible = !isMapVisible;
    if (isMapVisible) {
      await initMap();
      setTimeout(() => map.invalidateSize(), 200);
    }
  };

  // ---------- AI suggestion handler ----------
  function handleApplySuggestion(e: CustomEvent<{ field: string; value: string }>) {
    const { field, value } = e.detail;
    switch (field) {
      case "event_title":
        title = value;
        break;
      case "event_description":
        description = value;
        break;
      case "agenda_item":
        // Parse "HH:MM - Title" format or just add as title
        const dashIdx = value.indexOf(" - ");
        if (dashIdx > 0) {
          const timePart = value.substring(0, dashIdx).trim();
          const titlePart = value.substring(dashIdx + 3).trim();
          agendaItems = [...agendaItems, { start: timePart, title: titlePart }];
        } else {
          agendaItems = [...agendaItems, { start: "", title: value }];
        }
        break;
    }
  }

  // ---------- Submit ----------
  // Reactive form snapshot for AI assistant context
  $: eventFormSnapshot = {
    title,
    description,
    date,
    location,
    categories: categories.filter(c => selectedCategories.includes(c.id)).map(c => c.name),
    price,
    agenda: agendaItems.filter(a => a.title.trim()),
    sponsors: sponsorItems.map(s => s.mode === "platform" ? s.brandName : s.name).filter(Boolean),
    speakers: speakerItems.map(s => s.mode === "platform" ? s.userName : s.name).filter(Boolean),
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !description ||
      !date ||
      !location ||
      selectedCategories.length === 0
    ) {
      error = t.get('admin.event.fillRequired');
      return;
    }

    // минимальная валидация agenda на фронте (чтобы не ловить 400)
    for (let i = 0; i < agendaItems.length; i++) {
      const it = agendaItems[i];
      if (!isValidHHMM(it.start)) {
        error = `${t.get('admin.event.agendaItem')} #${i + 1}: ${t.get('admin.event.invalidStartTime')}`;
        return;
      }
      if (it.end && !isValidHHMM(it.end)) {
        error = `${t.get('admin.event.agendaItem')} #${i + 1}: ${t.get('admin.event.invalidEndTime')}`;
        return;
      }
      if (!it.title.trim()) {
        error = `${t.get('admin.event.agendaItem')} #${i + 1}: ${t.get('admin.event.titleRequired')}`;
        return;
      }
    }

    loading = true;
    error = "";
    success = false;

    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("date", date);
    form.append("location", location);
    form.append("price", price);

    form.append("latitude", latitude);
    form.append("longitude", longitude);

    selectedCategories.forEach((id) => form.append("categories", id));

    if (agendaItems.length > 0) {
      // Бэкенд сам нормализует index и сортировку
      const payload = agendaItems.map((it, idx) => ({
        index: idx + 1,
        start: it.start,
        end: it.end?.trim() ? it.end : undefined,
        title: it.title.trim(),
        description: it.description?.trim() ? it.description.trim() : undefined,
      }));
      form.append("agenda", JSON.stringify(payload));
    }

    if (photo) {
      form.append("photo", photo);
    } else if (isEdit && editEvent.photo && photoPreview) {
      form.append("existingPhoto", editEvent.photo);
    }

    if (documentFile) {
      form.append("document", documentFile);
    } else if (isEdit && editEvent.documentPath) {
      form.append("existingDocument", editEvent.documentPath);
    }

    // Sponsors
    if (sponsorItems.length > 0) {
      const sponsors = sponsorItems.map((s, i) => {
        if (s.mode === "platform" && s.brandId) return { brandId: s.brandId };
        const item: any = { name: s.name, hasLogo: !!s.logoFile };
        // Keep existing logo if no new file uploaded
        if (!s.logoFile && s.logoPreview && !s.logoPreview.startsWith("blob:")) {
          item.logoUrl = s.logoPreview;
        }
        return item;
      });
      form.append("sponsors", JSON.stringify(sponsors));
      sponsorItems.forEach((s, i) => {
        if (s.mode === "custom" && s.logoFile) {
          form.append(`sponsor_logo_${i}`, s.logoFile);
        }
      });
    }

    // Speakers
    if (speakerItems.length > 0) {
      const speakers = speakerItems.map((s, i) => {
        if (s.mode === "platform" && s.userId) return { userId: s.userId, title: s.title };
        const item: any = { name: s.name, email: s.email, title: s.title, hasPhoto: !!s.photoFile };
        // Keep existing photo if no new file uploaded
        if (!s.photoFile && s.photoPreview && !s.photoPreview.startsWith("blob:")) {
          item.photoUrl = s.photoPreview;
        }
        return item;
      });
      form.append("speakers", JSON.stringify(speakers));
      speakerItems.forEach((s, i) => {
        if (s.mode === "custom" && s.photoFile) {
          form.append(`speaker_photo_${i}`, s.photoFile);
        }
      });
    }

    // Attach community/brand ownership
    if (createAs.startsWith("community:")) {
      form.append("communityId", createAs.replace("community:", ""));
    } else if (createAs.startsWith("brand:")) {
      form.append("brandId", createAs.replace("brand:", ""));
    }

    const url = isEdit ? `/api/events/${editEvent.id}` : "/api/add-event";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, { method, body: form });
    loading = false;

    if (res.ok) {
      success = true;
      const data = await res.json();
      if (isEdit) {
        setTimeout(() => goto(`/events/${editEvent.id}`), 700);
      } else {
        setTimeout(() => goto(`/events/${data.event.id}`), 700);
      }
    } else {
      error = isEdit ? t.get('admin.event.errorSaving') : t.get('admin.event.errorCreating');
    }
  };
</script>

<div class="page">
  <div class="header">
    <h1>{isEdit ? $t('admin.event.editTitle') : $t('admin.event.createTitle')}</h1>
    <p class="subtitle">{isEdit ? $t('admin.event.editSubtitle') : $t('admin.event.createSubtitle')}</p>
    <div style="margin-top: 8px;">
      <AskAiButton label={$t('admin.event.askAiHelp')} on:click={() => (assistantOpen = true)} />
    </div>
  </div>

  {#if error}
    <div class="alert alert-error">
      <iconify-icon icon="lucide:alert-circle" width="18" height="18"></iconify-icon>
      <span>{error}</span>
    </div>
  {/if}

  {#if success}
    <div class="alert alert-success">
      <iconify-icon icon="lucide:check-circle-2" width="18" height="18"></iconify-icon>
      <span>{isEdit ? $t('admin.event.updated') : $t('admin.event.created')}</span>
    </div>
  {/if}

  <!-- Create as -->
  {#if ownedCommunities.length > 0 || ownedBrands.length > 0}
    <section class="card">
      <div class="card-head">
        <iconify-icon icon="lucide:shield" width="20" height="20"></iconify-icon>
        <h2>{$t('admin.event.createAs')}</h2>
      </div>

      <div class="create-as-options">
        <button
          type="button"
          class="as-option"
          class:active={createAs === "personal"}
          on:click={() => (createAs = "personal")}
        >
          <iconify-icon icon="lucide:user" width="16" height="16"></iconify-icon>
          {$t('admin.event.personal')}
        </button>

        {#each ownedCommunities as c}
          <button
            type="button"
            class="as-option"
            class:active={createAs === `community:${c.id}`}
            on:click={() => (createAs = `community:${c.id}`)}
          >
            {#if c.logoUrl}
              <img src={photoSrc(c.logoUrl)} alt={c.name} class="as-logo" />
            {:else}
              <iconify-icon icon="lucide:users" width="16" height="16"></iconify-icon>
            {/if}
            {c.name}
          </button>
        {/each}

        {#each ownedBrands as b}
          <button
            type="button"
            class="as-option"
            class:active={createAs === `brand:${b.id}`}
            on:click={() => (createAs = `brand:${b.id}`)}
          >
            {#if b.logoUrl}
              <img src={photoSrc(b.logoUrl)} alt={b.name} class="as-logo" />
            {:else}
              <iconify-icon icon="lucide:building-2" width="16" height="16"></iconify-icon>
            {/if}
            {b.name}
            <span class="brand-type">{b.type === 'PERSONAL' ? $t('admin.event.personal') : $t('admin.event.company')}</span>
          </button>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Event details -->
  <section class="card">
    <div class="card-head">
      <iconify-icon icon="lucide:calendar-days" width="20" height="20"></iconify-icon>
      <h2>{$t('admin.event.details')}</h2>
    </div>

    <div class="field">
      <span class="label">{$t('admin.event.titleLabel')} <span class="req">*</span></span>
      <input type="text" bind:value={title} placeholder={$t('admin.event.titlePlaceholder')} />
    </div>

    <div class="field">
      <span class="label">{$t('admin.event.descriptionLabel')} <span class="req">*</span></span>
      <textarea bind:value={description} rows="4" placeholder={$t('admin.event.descriptionPlaceholder')}></textarea>
    </div>

    <div class="field-row">
      <div class="field">
        <span class="label">{$t('admin.event.dateTime')} <span class="req">*</span></span>
        <input type="datetime-local" bind:value={date} />
      </div>
      <div class="field">
        <span class="label">{$t('admin.event.priceLabel')}</span>
        <div class="input-icon">
          <iconify-icon icon="lucide:euro" width="16" height="16"></iconify-icon>
          <input type="number" step="0.01" bind:value={price} placeholder={$t('admin.event.free')} />
        </div>
      </div>
    </div>
  </section>

  <!-- Location -->
  <section class="card">
    <div class="card-head">
      <iconify-icon icon="lucide:map-pin" width="20" height="20"></iconify-icon>
      <h2>{$t('admin.event.location')}</h2>
    </div>

    <div class="field location-field">
      <span class="label">{$t('admin.event.address')} <span class="req">*</span></span>
      <div class="location-wrap">
        <div class="input-icon">
          <iconify-icon icon="lucide:search" width="16" height="16"></iconify-icon>
          <input
            type="text"
            bind:value={location}
            bind:this={locationInputEl}
            on:input={onLocationInput}
            on:focus={onLocationFocus}
            on:blur={onLocationBlur}
            placeholder={$t('admin.event.searchAddress')}
            autocomplete="off"
          />
          {#if locationSearching}
            <iconify-icon icon="lucide:loader-2" width="16" height="16" class="location-spinner"></iconify-icon>
          {/if}
        </div>
        {#if showSuggestions}
          <div class="location-suggestions">
            {#each locationSuggestions as s}
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="location-item" on:click={() => selectLocation(s)}>
                <iconify-icon icon="lucide:map-pin" width="14" height="14"></iconify-icon>
                <span>{s.display_name}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    {#if !isMapVisible}
      <button class="btn btn-secondary" type="button" on:click={toggleMap}>
        <iconify-icon icon="lucide:map" width="16" height="16"></iconify-icon>
        {$t('admin.event.pickOnMap')}
      </button>
    {/if}

    {#if isMapVisible}
      <div bind:this={mapContainer} class="map"></div>
      {#if latitude && longitude}
        <div class="coords">
          <iconify-icon icon="lucide:navigation" width="14" height="14"></iconify-icon>
          {latitude}, {longitude}
        </div>
      {/if}
    {/if}
  </section>

  <!-- Categories -->
  <section class="card" style="position:relative;">
    <div class="card-head">
      <iconify-icon icon="lucide:tag" width="20" height="20"></iconify-icon>
      <h2>{$t('admin.event.categories')} <span class="req">*</span></h2>
    </div>

    <div class="dropdown">
      <button
        class="select-btn"
        type="button"
        on:click|stopPropagation={toggleDropdown}
      >
        <span class="ellipsis">
          {#if selectedCategories.length > 0}
            {selectedCategories
              .map((id) => categories.find((c) => c.id === id)?.name)
              .filter(Boolean)
              .join(", ")}
          {:else}
            {$t('admin.event.selectCategories')}
          {/if}
        </span>
        <iconify-icon icon={dropdownOpen ? "lucide:chevron-up" : "lucide:chevron-down"} width="16" height="16"></iconify-icon>
      </button>

      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      {#if dropdownOpen}
        <div class="menu" on:click|stopPropagation>
          <div class="menuTop">
            <input
              class="search"
              type="text"
              placeholder={$t('admin.event.searchCategory')}
              bind:value={categoryQuery}
            />
            <div class="limitHint">
              {selectedCategories.length}/{MAX_CATEGORIES}
            </div>
          </div>

          <div class="menuList">
            {#if filteredCategories.length === 0}
              <div class="menu-empty">{$t('admin.event.noResults')}</div>
            {:else}
              {#each filteredCategories as cat}
                {@const checked = selectedCategories.includes(cat.id)}
                {@const disabled = !checked && selectedCategories.length >= MAX_CATEGORIES}

                <label class="menuRow" class:disabled>
                  <span class="menuRowName">{cat.name}</span>
                  <input
                    type="checkbox"
                    {checked}
                    {disabled}
                    on:change={() => toggleCategory(cat.id)}
                  />
                </label>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </section>

  <!-- Media -->
  <section class="card">
    <div class="card-head">
      <iconify-icon icon="lucide:image" width="20" height="20"></iconify-icon>
      <h2>{$t('admin.event.media')}</h2>
      <span class="badge-optional">{$t('admin.event.optional')}</span>
    </div>

    <div class="field">
      <span class="label">{$t('admin.event.coverPhoto')}</span>
      <input
        type="file"
        accept="image/*"
        on:change={handlePhotoUpload}
        bind:this={photoInput}
        class="file-hidden"
      />
      {#if photoPreview}
        <div class="photo-result">
          <div class="photo-preview">
            <img src={photoPreview} alt="Preview" />
          </div>
          <button type="button" class="remove-btn" on:click={removePhoto}>
            <iconify-icon icon="lucide:trash-2" width="14" height="14"></iconify-icon>
            {$t('admin.event.remove')}
          </button>
        </div>
      {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="dropzone"
          class:dragging={photoDragging}
          on:click={() => photoInput.click()}
          on:dragover|preventDefault={() => (photoDragging = true)}
          on:dragleave={() => (photoDragging = false)}
          on:drop|preventDefault={handlePhotoDrop}
        >
          <iconify-icon icon="lucide:image-plus" width="28" height="28"></iconify-icon>
          <span class="dropzone-text">{$t('admin.event.clickOrDragImage')}</span>
          <span class="dropzone-hint">{$t('admin.event.imageHint')}</span>
        </div>
      {/if}
    </div>

    <div class="divider"></div>

    <div class="field">
      <span class="label">{$t('admin.event.document')}</span>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        on:change={handleDocumentUpload}
        bind:this={docInput}
        class="file-hidden"
      />
      {#if documentFile}
        <div class="doc-result">
          <div class="doc-info">
            <iconify-icon icon="lucide:file-text" width="18" height="18"></iconify-icon>
            <span>{documentFile.name}</span>
          </div>
          <button type="button" class="remove-btn" on:click={removeDocument}>
            <iconify-icon icon="lucide:trash-2" width="14" height="14"></iconify-icon>
            {$t('admin.event.remove')}
          </button>
        </div>
      {:else}
        <button class="btn btn-secondary" type="button" on:click={() => docInput.click()}>
          <iconify-icon icon="lucide:upload" width="16" height="16"></iconify-icon>
          {$t('admin.event.uploadDocument')}
        </button>
      {/if}
    </div>
  </section>

  <!-- Agenda -->
  <section class="card">
    <div class="card-head">
      <iconify-icon icon="lucide:list-ordered" width="20" height="20"></iconify-icon>
      <h2>{$t('admin.event.agenda')}</h2>
      <span class="badge-optional">{$t('admin.event.optional')}</span>
      <button class="btn-add" type="button" on:click={addAgendaItem}>
        <iconify-icon icon="lucide:plus" width="14" height="14"></iconify-icon>
        {$t('admin.event.addItem')}
      </button>
    </div>

    {#if agendaItems.length === 0}
      <div class="muted">{$t('admin.event.noAgenda')}</div>
    {:else}
      <div class="agenda">
        {#each agendaItems as it, i}
          <div class="agendaItem">
            <button
              class="iconBtn"
              type="button"
              aria-label={$t('admin.event.removeAgendaItem')}
              on:click={() => removeAgendaItem(i)}
              title="Remove"
            >
              <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
            </button>

            <div class="agendaTime">
              <input
                type="time"
                value={it.start}
                on:input={(e) =>
                  updateAgendaItem(i, {
                    start: (e.target as HTMLInputElement).value,
                  })}
              />
              <span class="dash">—</span>
              <input
                type="time"
                value={it.end ?? ""}
                on:input={(e) =>
                  updateAgendaItem(i, {
                    end: (e.target as HTMLInputElement).value || undefined,
                  })}
              />
            </div>

            <input
              type="text"
              placeholder={`${$t('admin.event.titleLabel')} *`}
              value={it.title}
              on:input={(e) =>
                updateAgendaItem(i, {
                  title: (e.target as HTMLInputElement).value,
                })}
            />

            <textarea
              rows="2"
              placeholder={$t('admin.event.descriptionLabel')}
              value={it.description ?? ""}
              on:input={(e) =>
                updateAgendaItem(i, {
                  description: (e.target as HTMLTextAreaElement).value,
                })}
            />
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Sponsors -->
  <section class="card">
    <div class="card-head">
      <iconify-icon icon="lucide:handshake" width="20" height="20"></iconify-icon>
      <h2>{$t('admin.event.sponsors')}</h2>
      <span class="badge-optional">{$t('admin.event.optional')}</span>
      <button class="btn-add" type="button" on:click={addSponsor}>
        <iconify-icon icon="lucide:plus" width="14" height="14"></iconify-icon>
        {$t('admin.event.addSponsor')}
      </button>
    </div>

    {#if sponsorItems.length === 0}
      <div class="muted">{$t('admin.event.noSponsors')}</div>
    {:else}
      <div class="agenda">
        {#each sponsorItems as sp, i}
          <div class="agendaItem">
            <button class="iconBtn" type="button" on:click={() => removeSponsor(i)} title="Remove">
              <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
            </button>

            <div class="mode-toggle">
              <button type="button" class:active={sp.mode === "platform"} on:click={() => setSponsorMode(i, "platform")}>
                <iconify-icon icon="lucide:building-2" width="13" height="13"></iconify-icon>
                {$t('admin.event.fromPlatform')}
              </button>
              <button type="button" class:active={sp.mode === "custom"} on:click={() => setSponsorMode(i, "custom")}>
                <iconify-icon icon="lucide:pen-line" width="13" height="13"></iconify-icon>
                {$t('admin.event.custom')}
              </button>
            </div>

            {#if sp.mode === "platform"}
              {#if sp.brandId}
                <div class="selected-entity">
                  {#if sp.brandLogo}
                    <img src={photoSrc(sp.brandLogo)} alt={sp.brandName} class="entity-logo" />
                  {:else}
                    <div class="entity-fb">{sp.brandName?.[0]?.toUpperCase() ?? "?"}</div>
                  {/if}
                  <span class="entity-name">{sp.brandName}</span>
                  <button type="button" class="entity-clear" on:click={() => { sponsorItems = sponsorItems.map((s, idx) => idx === i ? { mode: "platform" } : s); }}>
                    <iconify-icon icon="lucide:x" width="12" height="12"></iconify-icon>
                  </button>
                </div>
              {:else}
                <div class="search-wrap">
                  <div class="input-icon">
                    <iconify-icon icon="lucide:search" width="16" height="16"></iconify-icon>
                    <input
                      type="text"
                      placeholder={$t('admin.event.searchBrand')}
                      bind:value={sponsorSearchQuery}
                      on:input={() => onSponsorSearchInput(i)}
                      on:focus={() => { activeSponsorIdx = i; }}
                    />
                  </div>
                  {#if activeSponsorIdx === i && sponsorSearchResults.length > 0}
                    <div class="search-results">
                      {#each sponsorSearchResults as brand}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="search-item" on:click={() => selectBrandForSponsor(i, brand)}>
                          {#if brand.logoUrl}
                            <img src={photoSrc(brand.logoUrl)} alt={brand.name} class="search-item-logo" />
                          {:else}
                            <div class="search-item-fb">{brand.name[0].toUpperCase()}</div>
                          {/if}
                          <span>{brand.name}</span>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
            {:else}
              <div class="input-icon">
                <iconify-icon icon="lucide:building-2" width="16" height="16"></iconify-icon>
                <input type="text" placeholder={`${$t('admin.event.sponsorName')} *`} bind:value={sp.name} />
              </div>

              <input type="file" accept="image/*" class="file-hidden" bind:this={sponsorFileInputs[i]} on:change={(e) => handleSponsorLogoSelect(i, e)} />
              {#if sp.logoPreview}
                <div class="mini-photo-result">
                  <img src={sp.logoPreview} alt="Logo" class="mini-photo-thumb" />
                  <span class="mini-photo-name">{sp.logoFile?.name ?? "Logo"}</span>
                  <button type="button" class="mini-photo-remove" on:click={() => removeSponsorLogo(i)}>
                    <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
                  </button>
                </div>
              {:else}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="mini-dropzone"
                  class:dragging={sp.logoDragging}
                  on:click={() => sponsorFileInputs[i]?.click()}
                  on:dragover|preventDefault={() => { sponsorItems = sponsorItems.map((s, idx) => idx === i ? { ...s, logoDragging: true } : s); }}
                  on:dragleave={() => { sponsorItems = sponsorItems.map((s, idx) => idx === i ? { ...s, logoDragging: false } : s); }}
                  on:drop|preventDefault={(e) => handleSponsorLogoDrop(i, e)}
                >
                  <iconify-icon icon="lucide:image-plus" width="18" height="18"></iconify-icon>
                  <span>{$t('admin.event.logoOptional')}</span>
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Speakers -->
  <section class="card">
    <div class="card-head">
      <iconify-icon icon="lucide:mic" width="20" height="20"></iconify-icon>
      <h2>{$t('admin.event.speakers')}</h2>
      <span class="badge-optional">{$t('admin.event.optional')}</span>
      <button class="btn-add" type="button" on:click={addSpeaker}>
        <iconify-icon icon="lucide:plus" width="14" height="14"></iconify-icon>
        {$t('admin.event.addSpeaker')}
      </button>
    </div>

    {#if speakerItems.length === 0}
      <div class="muted">{$t('admin.event.noSpeakers')}</div>
    {:else}
      <div class="agenda">
        {#each speakerItems as sp, i}
          <div class="agendaItem">
            <button class="iconBtn" type="button" on:click={() => removeSpeaker(i)} title="Remove">
              <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
            </button>

            <div class="mode-toggle">
              <button type="button" class:active={sp.mode === "platform"} on:click={() => setSpeakerMode(i, "platform")}>
                <iconify-icon icon="lucide:user" width="13" height="13"></iconify-icon>
                {$t('admin.event.fromPlatform')}
              </button>
              <button type="button" class:active={sp.mode === "custom"} on:click={() => setSpeakerMode(i, "custom")}>
                <iconify-icon icon="lucide:pen-line" width="13" height="13"></iconify-icon>
                {$t('admin.event.custom')}
              </button>
            </div>

            {#if sp.mode === "platform"}
              {#if sp.userId}
                <div class="selected-entity">
                  {#if sp.userPhoto}
                    <img src={photoSrc(sp.userPhoto)} alt={sp.userName} class="entity-avatar" />
                  {:else}
                    <div class="entity-fb round">{sp.userName?.[0]?.toUpperCase() ?? "?"}</div>
                  {/if}
                  <span class="entity-name">{sp.userName}</span>
                  <button type="button" class="entity-clear" on:click={() => { speakerItems = speakerItems.map((s, idx) => idx === i ? { mode: "platform" } : s); }}>
                    <iconify-icon icon="lucide:x" width="12" height="12"></iconify-icon>
                  </button>
                </div>
              {:else}
                <div class="search-wrap">
                  <div class="input-icon">
                    <iconify-icon icon="lucide:search" width="16" height="16"></iconify-icon>
                    <input
                      type="text"
                      placeholder={$t('admin.event.searchMember')}
                      bind:value={speakerSearchQuery}
                      on:input={() => onSpeakerSearchInput(i)}
                      on:focus={() => { activeSpeakerIdx = i; }}
                    />
                  </div>
                  {#if activeSpeakerIdx === i && speakerSearchResults.length > 0}
                    <div class="search-results">
                      {#each speakerSearchResults as user}
                        <!-- svelte-ignore a11y_click_events_have_key_events -->
                        <!-- svelte-ignore a11y_no_static_element_interactions -->
                        <div class="search-item" on:click={() => selectUserForSpeaker(i, user)}>
                          {#if user.info?.photo}
                            <img src={photoSrc(user.info.photo)} alt={user.info?.name ?? user.email} class="search-item-avatar" />
                          {:else}
                            <div class="search-item-fb round">{(user.info?.name ?? user.email)[0].toUpperCase()}</div>
                          {/if}
                          <div class="search-item-info">
                            <span class="search-item-name">{user.info?.name ?? user.email}</span>
                            {#if user.info?.name}
                              <span class="search-item-email">{user.email}</span>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/if}
              <div class="input-icon">
                <iconify-icon icon="lucide:briefcase" width="16" height="16"></iconify-icon>
                <input type="text" placeholder={$t('admin.event.titleRoleOptional')} bind:value={sp.title} />
              </div>
            {:else}
              <div class="input-icon">
                <iconify-icon icon="lucide:user" width="16" height="16"></iconify-icon>
                <input type="text" placeholder={`${$t('admin.event.speakerName')} *`} bind:value={sp.name} />
              </div>
              <div class="input-icon">
                <iconify-icon icon="lucide:mail" width="16" height="16"></iconify-icon>
                <input type="email" placeholder={$t('admin.event.emailOptional')} bind:value={sp.email} />
              </div>
              <div class="input-icon">
                <iconify-icon icon="lucide:briefcase" width="16" height="16"></iconify-icon>
                <input type="text" placeholder={$t('admin.event.titleRoleOptional')} bind:value={sp.title} />
              </div>

              <input type="file" accept="image/*" class="file-hidden" bind:this={speakerFileInputs[i]} on:change={(e) => handleSpeakerPhotoSelect(i, e)} />
              {#if sp.photoPreview}
                <div class="mini-photo-result">
                  <img src={sp.photoPreview} alt="Photo" class="mini-photo-thumb round" />
                  <span class="mini-photo-name">{sp.photoFile?.name ?? "Photo"}</span>
                  <button type="button" class="mini-photo-remove" on:click={() => removeSpeakerPhoto(i)}>
                    <iconify-icon icon="lucide:x" width="14" height="14"></iconify-icon>
                  </button>
                </div>
              {:else}
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  class="mini-dropzone"
                  class:dragging={sp.photoDragging}
                  on:click={() => speakerFileInputs[i]?.click()}
                  on:dragover|preventDefault={() => { speakerItems = speakerItems.map((s, idx) => idx === i ? { ...s, photoDragging: true } : s); }}
                  on:dragleave={() => { speakerItems = speakerItems.map((s, idx) => idx === i ? { ...s, photoDragging: false } : s); }}
                  on:drop|preventDefault={(e) => handleSpeakerPhotoDrop(i, e)}
                >
                  <iconify-icon icon="lucide:camera" width="18" height="18"></iconify-icon>
                  <span>{$t('admin.event.photoOptional')}</span>
                </div>
              {/if}
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- Actions -->
  <div class="actions">
    <a href="/events" class="btn btn-secondary">
      <iconify-icon icon="lucide:arrow-left" width="16" height="16"></iconify-icon>
      {$t('common.btn.cancel')}
    </a>
    <button type="button" class="btn btn-primary" disabled={loading} on:click={handleSubmit}>
      {#if loading}
        <iconify-icon icon="lucide:loader-2" width="16" height="16" class="spin"></iconify-icon>
        {isEdit ? $t('admin.event.saving') : $t('admin.event.creating')}
      {:else}
        <iconify-icon icon={isEdit ? "lucide:save" : "lucide:rocket"} width="16" height="16"></iconify-icon>
        {isEdit ? $t('admin.event.saveChanges') : $t('admin.event.createTitle')}
      {/if}
    </button>
  </div>
</div>

<ContextAssistant
  bind:open={assistantOpen}
  contextKey="event_create"
  payload={eventFormSnapshot}
  title={$t('admin.event.assistantTitle')}
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

  /* ===== Alerts ===== */
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

  /* ===== Cards ===== */
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

  .card-head :global(iconify-icon) {
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

  /* ===== Fields ===== */
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
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
  input[type="number"],
  input[type="datetime-local"],
  input[type="time"],
  textarea {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #0f172a;
    padding: 10px 12px;
    border-radius: 10px;
    outline: none;
    font-size: 14px;
    font-family: inherit;
    font-weight: 400;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    width: 100%;
    box-sizing: border-box;
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

  .input-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon :global(iconify-icon) {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  .input-icon input {
    padding-left: 36px;
  }

  .divider {
    height: 1px;
    background: #f1f5f9;
  }

  .muted {
    color: #94a3b8;
    font-size: 14px;
  }

  /* ===== Create-as ===== */
  .create-as-options {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .as-option {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    font-weight: 700;
    font-size: 13px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
  }

  .as-option:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .as-option.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  .as-option.active :global(iconify-icon) {
    color: #fff;
  }

  .as-logo {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    object-fit: cover;
  }

  .brand-type {
    font-weight: 600;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.06);
    color: inherit;
  }

  .as-option.active .brand-type {
    background: rgba(255, 255, 255, 0.2);
  }

  /* ===== Location autocomplete ===== */
  .location-field {
    position: relative;
  }

  .location-wrap {
    position: relative;
  }

  .location-wrap .input-icon {
    position: relative;
  }

  :global(.location-spinner) {
    position: absolute !important;
    right: 12px;
    left: auto !important;
    color: #94a3b8 !important;
    pointer-events: none;
    animation: spin 1s linear infinite;
  }

  .location-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-top: 4px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
  }

  .location-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.12s;
    font-size: 13px;
    color: #334155;
    line-height: 1.4;
  }

  .location-item:hover {
    background: #f1f5f9;
  }

  .location-item :global(iconify-icon) {
    color: #4f46e5;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .location-item span {
    flex: 1;
    min-width: 0;
  }

  /* ===== Map ===== */
  .map {
    width: 100%;
    height: 320px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .coords {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
  }

  .coords :global(iconify-icon) {
    color: #4f46e5;
  }

  /* ===== Dropdown ===== */
  .dropdown {
    position: relative;
  }

  .select-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    background: #f8fafc;
    cursor: pointer;
    font-size: 14px;
    font-family: inherit;
    color: #0f172a;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .select-btn:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .select-btn :global(iconify-icon) {
    color: #94a3b8;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    width: 100%;
    z-index: 50;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 10px;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.1);
  }

  .menuTop {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  .search {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 10px 12px;
    font-size: 14px;
    outline: none;
    background: #f8fafc;
    font-family: inherit;
  }

  .search:focus {
    border-color: #4f46e5;
    background: #fff;
  }

  .limitHint {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    white-space: nowrap;
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f8fafc;
  }

  .menuList {
    max-height: 260px;
    overflow: auto;
    padding-right: 4px;
  }

  .menuRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 8px;
    border-radius: 10px;
    cursor: pointer;
  }

  .menuRow:hover {
    background: #f8fafc;
  }

  .menuRow input[type="checkbox"] {
    width: 18px !important;
    height: 18px !important;
    flex: 0 0 auto;
    accent-color: #4f46e5;
    cursor: pointer;
  }

  .menuRow.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .menuRow.disabled:hover {
    background: transparent;
  }

  .menuRowName {
    flex: 1;
    color: #0f172a;
    font-size: 14px;
  }

  .menu-empty {
    padding: 10px 6px;
    color: #94a3b8;
    font-size: 14px;
  }

  /* ===== Dropzone ===== */
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

  .photo-result {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .photo-preview {
    width: 120px;
    height: 80px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-shrink: 0;
  }

  .photo-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .remove-btn {
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

  .remove-btn:hover {
    background: #fee2e2;
  }

  .doc-result {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }

  .doc-info {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    min-width: 0;
  }

  .doc-info span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .doc-info :global(iconify-icon) {
    color: #4f46e5;
    flex-shrink: 0;
  }

  /* ===== Agenda ===== */
  .btn-add {
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 8px;
    padding: 5px 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-add:hover {
    background: #e0e7ff;
  }

  .agenda {
    display: grid;
    gap: 10px;
  }

  .agendaItem {
    position: relative;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    padding: 14px;
    display: grid;
    gap: 10px;
    background: #f8fafc;
  }

  .agendaTime {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .agendaTime input[type="time"] {
    width: 140px;
  }

  .dash {
    color: #94a3b8;
    font-weight: 700;
  }

  .iconBtn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .iconBtn:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #ef4444;
  }

  /* ===== Buttons ===== */
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
    text-decoration: none;
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

  /* ===== Actions ===== */
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 4px;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ===== Mode toggle (sponsors/speakers) ===== */
  .mode-toggle {
    display: flex;
    gap: 4px;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 3px;
  }

  .mode-toggle button {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #64748b;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s;
  }

  .mode-toggle button.active {
    background: #fff;
    color: #0f172a;
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
  }

  /* ===== Selected entity chip ===== */
  .selected-entity {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #eef2ff;
    border: 1px solid #c7d2fe;
    border-radius: 10px;
  }

  .entity-logo {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .entity-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .entity-fb {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 12px;
    color: #64748b;
    flex-shrink: 0;
  }

  .entity-fb.round {
    border-radius: 50%;
  }

  .entity-name {
    flex: 1;
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .entity-clear {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: none;
    background: rgba(79, 70, 229, 0.1);
    color: #4f46e5;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .entity-clear:hover {
    background: rgba(79, 70, 229, 0.2);
  }

  /* ===== Search within sponsor/speaker ===== */
  .search-wrap {
    position: relative;
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-top: 4px;
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.1);
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
  }

  .search-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: #0f172a;
    font-weight: 600;
    transition: background 0.12s;
  }

  .search-item:hover {
    background: #f1f5f9;
  }

  .search-item-logo {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .search-item-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }

  .search-item-fb {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 11px;
    color: #64748b;
    flex-shrink: 0;
  }

  .search-item-fb.round {
    border-radius: 50%;
  }

  .search-item-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .search-item-name {
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
  }

  .search-item-email {
    font-weight: 500;
    font-size: 11px;
    color: #94a3b8;
  }

  /* ===== Mini dropzone for sponsor logo / speaker photo ===== */
  .mini-dropzone {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
  }

  .mini-dropzone:hover,
  .mini-dropzone.dragging {
    border-color: #4f46e5;
    background: #eef2ff;
    color: #4f46e5;
  }

  .mini-dropzone :global(iconify-icon) {
    flex-shrink: 0;
  }

  .mini-photo-result {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
  }

  .mini-photo-thumb {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    object-fit: cover;
    flex-shrink: 0;
  }

  .mini-photo-thumb.round {
    border-radius: 50%;
  }

  .mini-photo-name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mini-photo-remove {
    width: 28px;
    height: 28px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
  }

  .mini-photo-remove:hover {
    background: #fef2f2;
    color: #dc2626;
  }

  /* ===== Responsive ===== */
  @media (max-width: 640px) {
    .page {
      padding: 20px 12px 40px;
      gap: 18px;
    }

    h1 {
      font-size: 24px;
    }

    .card {
      padding: 18px;
    }

    .field-row {
      grid-template-columns: 1fr;
    }

    .agendaTime {
      flex-wrap: wrap;
    }

    .agendaTime input[type="time"] {
      width: 100%;
    }
  }
</style>
