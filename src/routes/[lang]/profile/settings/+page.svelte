<script lang="ts">
  import { photoSrc } from "$lib/utils/photo";
  import { invalidateAll } from "$app/navigation";
  import { t } from "$lib/i18n";

  export let data: any;

  const user = data?.user;

  // --- Profile fields ---
  let fullName = user?.info?.name ?? "";
  let statusText = user?.info?.status ?? "Member";
  let bio = user?.info?.bio ?? "";
  let location = user?.info?.location ?? "";
  let phone = user?.info?.phoneNumber ?? "";
  let dob = user?.info?.dateOfBirth
    ? new Date(user.info.dateOfBirth).toISOString().split("T")[0]
    : "";

  // --- Photo ---
  let photoPreview: string | null = null;
  let photoFile: File | null = null;
  let fileInput: HTMLInputElement;

  function currentPhoto() {
    if (photoPreview) return photoPreview;
    return photoSrc(user?.info?.photo ?? null, 200);
  }

  function compressImage(file: File, maxSize = 800, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round(height * maxSize / width);
            width = maxSize;
          } else {
            width = Math.round(width * maxSize / height);
            height = maxSize;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));
            resolve(new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  }

  async function handlePhotoSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      photoFile = await compressImage(file);
    } catch {
      photoFile = file;
    }
    photoPreview = URL.createObjectURL(photoFile);
  }

  function removePhoto() {
    photoFile = null;
    photoPreview = null;
    if (fileInput) fileInput.value = "";
  }

  // --- Location suggestions ---
  const cyprusCities = [
    "Nicosia",
    "Limassol",
    "Larnaca",
    "Paphos",
    "Famagusta",
    "Kyrenia",
    "Ayia Napa",
    "Paralimni",
    "Protaras",
    "Polis",
    "Troodos",
    "Pissouri",
    "Episkopi",
    "Chloraka",
    "Geroskipou",
    "Kato Polemidia",
    "Mesa Geitonia",
    "Latsia",
    "Strovolos",
    "Aglantzia",
    "Lakatamia",
    "Engomi",
  ];

  let locationFocused = false;
  let filteredCities: string[] = [];

  $: filteredCities = location.trim()
    ? cyprusCities.filter((c) =>
        c.toLowerCase().includes(location.toLowerCase())
      )
    : cyprusCities;

  function selectCity(city: string) {
    location = city;
    locationFocused = false;
  }

  // --- Privacy toggles ---
  let isPrivate = user?.settings?.isPrivate ?? false;
  let emailSend = user?.settings?.emailSend ?? false;
  let chatBotSend = user?.settings?.chatBotSend ?? false;

  // --- Save ---
  let saving = false;
  let saved = false;

  async function saveProfile() {
    saving = true;
    saved = false;

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("status", statusText);
    formData.append("bio", bio);
    formData.append("location", location);
    formData.append("phone", phone);
    formData.append("dob", dob);
    formData.append("isPrivate", String(isPrivate));

    if (photoFile) {
      formData.append("photo", photoFile);
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        saved = true;
        await invalidateAll();
        setTimeout(() => (saved = false), 2500);
      }
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      saving = false;
    }
  }

  async function toggleSetting(key: string, value: boolean) {
    try {
      await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {}
  }
</script>

<!-- Profile Card -->
<div class="card">
  <div class="section-title">
    <iconify-icon icon="lucide:user-pen" width="18" height="18"></iconify-icon>
    {$t('admin.settings.editProfile')}
  </div>

  <!-- Avatar -->
  <div class="avatar-section">
    <div class="avatar-wrap">
      <div class="avatar">
        {#if currentPhoto()}
          <img src={currentPhoto()} alt="Avatar" />
        {:else}
          <div class="avatar-fallback">
            {(fullName || user?.email || "U")[0].toUpperCase()}
          </div>
        {/if}
      </div>
      <button class="avatar-edit" on:click={() => fileInput.click()}>
        <iconify-icon icon="lucide:camera" width="14"></iconify-icon>
      </button>
    </div>
    <input
      type="file"
      accept="image/*"
      bind:this={fileInput}
      on:change={handlePhotoSelect}
      style="display:none"
    />
    <div class="avatar-actions">
      <button class="btn-outline small" on:click={() => fileInput.click()}>
        <iconify-icon icon="lucide:upload" width="13"></iconify-icon>
        {$t('admin.settings.uploadPhoto')}
      </button>
      {#if photoPreview || user?.info?.photo}
        <button class="btn-outline small danger" on:click={removePhoto}>
          <iconify-icon icon="lucide:trash-2" width="13"></iconify-icon>
          {$t('admin.settings.remove')}
        </button>
      {/if}
    </div>
  </div>

  <div class="divider"></div>

  <!-- Full Name -->
  <div class="field">
    <label class="field-label" for="fullName">
      <iconify-icon icon="lucide:user" width="14"></iconify-icon>
      {$t('admin.settings.fullName')}
    </label>
    <input
      id="fullName"
      type="text"
      class="input"
      bind:value={fullName}
      placeholder={$t('admin.settings.fullNamePlaceholder')}
    />
  </div>

  <!-- Status -->
  <div class="field">
    <label class="field-label" for="statusText">
      <iconify-icon icon="lucide:sparkles" width="14"></iconify-icon>
      {$t('admin.settings.status')}
    </label>
    <input
      id="statusText"
      type="text"
      class="input"
      bind:value={statusText}
      placeholder={$t('admin.settings.statusPlaceholder')}
      maxlength="80"
    />
    <div class="field-hint">{statusText.length}/80 — {$t('admin.settings.statusHint')}</div>
  </div>

  <!-- Bio -->
  <div class="field">
    <label class="field-label" for="bio">
      <iconify-icon icon="lucide:align-left" width="14"></iconify-icon>
      {$t('admin.settings.bio')}
    </label>
    <textarea
      id="bio"
      class="input textarea"
      bind:value={bio}
      placeholder={$t('admin.settings.bioPlaceholder')}
      rows="3"
    ></textarea>
  </div>

  <!-- Location -->
  <div class="field">
    <label class="field-label" for="location">
      <iconify-icon icon="lucide:map-pin" width="14"></iconify-icon>
      {$t('admin.settings.city')}
    </label>
    <div class="location-wrap">
      <input
        id="location"
        type="text"
        class="input"
        bind:value={location}
        placeholder={$t('admin.settings.cityPlaceholder')}
        on:focus={() => (locationFocused = true)}
        on:blur={() => setTimeout(() => (locationFocused = false), 200)}
        autocomplete="off"
      />
      {#if locationFocused && filteredCities.length > 0}
        <div class="dropdown">
          {#each filteredCities as city}
            <button
              class="dropdown-item"
              class:selected={city === location}
              on:mousedown|preventDefault={() => selectCity(city)}
            >
              <iconify-icon icon="lucide:map-pin" width="13"></iconify-icon>
              {city}
              {#if city === location}
                <iconify-icon icon="lucide:check" width="14" class="check-icon"></iconify-icon>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>

  <!-- Date of Birth -->
  <div class="field">
    <label class="field-label" for="dob">
      <iconify-icon icon="lucide:cake" width="14"></iconify-icon>
      {$t('admin.settings.dateOfBirth')}
    </label>
    <input
      id="dob"
      type="date"
      class="input"
      bind:value={dob}
    />
  </div>

  <!-- Phone -->
  <div class="field">
    <label class="field-label" for="phone">
      <iconify-icon icon="lucide:phone" width="14"></iconify-icon>
      {$t('admin.settings.phoneNumber')}
    </label>
    <input
      id="phone"
      type="tel"
      class="input"
      bind:value={phone}
      placeholder={$t('admin.settings.phonePlaceholder')}
    />
  </div>

  <!-- Save Button -->
  <button class="save-btn" on:click={saveProfile} disabled={saving}>
    {#if saving}
      <iconify-icon icon="lucide:loader-2" width="16" class="spin"></iconify-icon>
      {$t('admin.settings.saving')}
    {:else}
      <iconify-icon icon="lucide:check" width="16"></iconify-icon>
      {$t('admin.settings.saveChanges')}
    {/if}
  </button>
</div>

<!-- Privacy Card -->
<div class="card">
  <div class="section-title">
    <iconify-icon icon="lucide:shield" width="18" height="18"></iconify-icon>
    {$t('admin.settings.privacy')}
  </div>

  <label class="toggle-row">
    <div class="toggle-info">
      <div class="toggle-label">{$t('admin.settings.privateProfile')}</div>
      <div class="toggle-desc">{$t('admin.settings.privateProfileDesc')}</div>
    </div>
    <button
      class="toggle" class:on={isPrivate}
      on:click={() => { isPrivate = !isPrivate; toggleSetting('isPrivate', isPrivate); }}
      aria-pressed={isPrivate}
    >
      <span class="toggle-knob"></span>
    </button>
  </label>
</div>

<!-- Notifications Card -->
<div class="card">
  <div class="section-title">
    <iconify-icon icon="lucide:bell" width="18" height="18"></iconify-icon>
    {$t('admin.settings.notifications')}
  </div>

  <label class="toggle-row">
    <div class="toggle-info">
      <div class="toggle-label">{$t('admin.settings.emailNotifications')}</div>
      <div class="toggle-desc">{$t('admin.settings.emailNotificationsDesc')}</div>
    </div>
    <button
      class="toggle" class:on={emailSend}
      on:click={() => { emailSend = !emailSend; toggleSetting('emailSend', emailSend); }}
      aria-pressed={emailSend}
    >
      <span class="toggle-knob"></span>
    </button>
  </label>

  <div class="divider"></div>

  <label class="toggle-row">
    <div class="toggle-info">
      <div class="toggle-label">{$t('admin.settings.chatBotNotifications')}</div>
      <div class="toggle-desc">{$t('admin.settings.chatBotNotificationsDesc')}</div>
    </div>
    <button
      class="toggle" class:on={chatBotSend}
      on:click={() => { chatBotSend = !chatBotSend; toggleSetting('chatBotSend', chatBotSend); }}
      aria-pressed={chatBotSend}
    >
      <span class="toggle-knob"></span>
    </button>
  </label>
</div>

<!-- Account Card -->
<div class="card">
  <div class="section-title">
    <iconify-icon icon="lucide:user-cog" width="18" height="18"></iconify-icon>
    {$t('admin.settings.account')}
  </div>

  <div class="info-row">
    <div class="info-label">{$t('admin.settings.email')}</div>
    <div class="info-value">{data.user?.email ?? '—'}</div>
  </div>

  <div class="divider"></div>

  <div class="info-row">
    <div class="info-label">{$t('admin.settings.memberSince')}</div>
    <div class="info-value">
      {new Date(data.user?.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
    </div>
  </div>
</div>

{#if saved}
  <div class="toast">
    <iconify-icon icon="lucide:check-circle" width="16" height="16"></iconify-icon>
    {$t('admin.settings.profileSaved')}
  </div>
{/if}

<style>
  .card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 22px;
    margin-bottom: 16px;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 900;
    font-size: 16px;
    color: #0f172a;
    margin-bottom: 18px;
  }

  .section-title :global(iconify-icon) {
    color: #4f46e5;
  }

  /* ===== Avatar ===== */
  .avatar-section {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .avatar-wrap {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 999px;
    overflow: hidden;
    background: #f1f5f9;
    border: 3px solid #fff;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.1);
  }

  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: 28px;
    color: #64748b;
    background: #e2e8f0;
  }

  .avatar-edit {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #4f46e5;
    border: 2px solid #fff;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;
    padding: 0;
  }

  .avatar-edit:hover {
    background: #4338ca;
  }

  .avatar-edit :global(iconify-icon) {
    color: #fff;
  }

  .avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
  }

  .btn-outline:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .btn-outline.danger {
    color: #dc2626;
  }

  .btn-outline.danger :global(iconify-icon) {
    color: #dc2626;
  }

  .btn-outline.danger:hover {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  /* ===== Fields ===== */
  .field {
    margin-top: 18px;
  }

  .field-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 800;
    font-size: 13px;
    color: #475569;
    margin-bottom: 6px;
  }

  .field-label :global(iconify-icon) {
    color: #94a3b8;
  }

  .input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    font-family: inherit;
    font-weight: 700;
    font-size: 14px;
    color: #0f172a;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }

  .input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
    background: #fff;
  }

  .input::placeholder {
    color: #94a3b8;
    font-weight: 600;
  }

  .field-hint {
    margin-top: 4px;
    font-weight: 600;
    font-size: 11px;
    color: #94a3b8;
  }

  .textarea {
    resize: vertical;
    min-height: 72px;
    line-height: 1.5;
  }

  /* ===== Location dropdown ===== */
  .location-wrap {
    position: relative;
  }

  .dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    max-height: 220px;
    overflow-y: auto;
    z-index: 100;
    padding: 4px;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 700;
    font-size: 13px;
    color: #0f172a;
    transition: background 0.1s;
    text-align: left;
  }

  .dropdown-item :global(iconify-icon) {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .dropdown-item:hover {
    background: #f1f5f9;
  }

  .dropdown-item.selected {
    background: #eef2ff;
    color: #4f46e5;
  }

  .dropdown-item.selected :global(iconify-icon) {
    color: #4f46e5;
  }

  .dropdown-item :global(.check-icon) {
    margin-left: auto;
    color: #4f46e5;
  }

  /* ===== Save button ===== */
  .save-btn {
    margin-top: 22px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    font-family: inherit;
    font-weight: 800;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: background 0.15s;
  }

  .save-btn:hover {
    background: #4338ca;
  }

  .save-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .save-btn :global(iconify-icon) {
    color: #fff;
  }

  .save-btn :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ===== Divider ===== */
  .divider {
    height: 1px;
    background: #f1f5f9;
    margin: 16px 0;
  }

  /* ===== Toggle row ===== */
  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
    padding: 4px 0;
  }

  .toggle-info {
    flex: 1;
    min-width: 0;
  }

  .toggle-label {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  .toggle-desc {
    font-weight: 600;
    font-size: 12px;
    color: #94a3b8;
    margin-top: 2px;
  }

  /* ===== Toggle switch ===== */
  .toggle {
    width: 44px;
    height: 24px;
    border-radius: 12px;
    border: none;
    background: #e2e8f0;
    cursor: pointer;
    position: relative;
    flex: 0 0 auto;
    transition: background 0.2s;
    padding: 0;
  }

  .toggle.on {
    background: #4f46e5;
  }

  .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s;
  }

  .toggle.on .toggle-knob {
    transform: translateX(20px);
  }

  /* ===== Info row ===== */
  .info-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }

  .info-label {
    font-weight: 800;
    font-size: 14px;
    color: #64748b;
  }

  .info-value {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
  }

  /* ===== Toast ===== */
  .toast {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 22px;
    border-radius: 12px;
    background: #0f172a;
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.20);
    z-index: 9000;
    animation: toastIn 0.25s ease-out;
  }

  .toast :global(iconify-icon) {
    color: #22c55e;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  /* ===== Mobile ===== */
  @media (max-width: 520px) {
    .avatar-section {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .avatar-actions {
      flex-direction: row;
    }
  }
</style>
