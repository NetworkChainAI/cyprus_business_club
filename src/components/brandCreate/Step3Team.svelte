<script lang="ts">
  import { t } from "$lib/i18n";
  import { photoSrc } from "$lib/utils/photo";

  type TeamMember = {
    name: string;
    role: string;
    email: string;
    userId?: string | null;
    photo?: string | null;
  };
  export let team: TeamMember[] = [];

  // User search
  let searchQuery = "";
  let searchResults: any[] = [];
  let searching = false;
  let searchTimeout: ReturnType<typeof setTimeout> | null = null;
  let showDropdown = false;

  function onSearchInput() {
    const q = searchQuery.trim();
    if (q.length < 2) {
      searchResults = [];
      showDropdown = false;
      return;
    }
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => searchUsers(q), 300);
  }

  async function searchUsers(q: string) {
    searching = true;
    try {
      const res = await fetch(`/api/members/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const users = await res.json();
        // Filter out already added platform users
        const addedIds = new Set(team.filter((m) => m.userId).map((m) => m.userId));
        searchResults = users.filter((u: any) => !addedIds.has(u.id));
        showDropdown = searchResults.length > 0;
      }
    } catch {
      searchResults = [];
    } finally {
      searching = false;
    }
  }

  function addPlatformUser(user: any) {
    const member: TeamMember = {
      name: user.info?.name || user.email,
      role: "",
      email: user.email,
      userId: user.id,
      photo: user.info?.photo || null,
    };
    team = [...team, member];
    searchQuery = "";
    searchResults = [];
    showDropdown = false;
  }

  function addManualMember() {
    team = [...team, { name: "", role: "", email: "", userId: null, photo: null }];
  }

  function removeTeamMember(idx: number) {
    team = team.filter((_, i) => i !== idx);
  }

  let brokenPhotos: Record<string, boolean> = {};

  function handleBlur() {
    // Delay to allow click on dropdown items
    setTimeout(() => {
      showDropdown = false;
    }, 200);
  }
</script>

<section class="card">
  <div class="card-head">
    <iconify-icon icon="lucide:users" width="20" height="20" />
    <h2>{$t('partners.create.teamMembers')}</h2>
  </div>

  <!-- Add member controls -->
  <div class="add-row">
    <div class="field search-field">
      <span class="label">{$t('partners.create.searchMembers')}</span>
      <div class="search-wrap">
        <input
          type="text"
          placeholder={$t('partners.create.searchMembersPlaceholder')}
          bind:value={searchQuery}
          on:input={onSearchInput}
          on:focus={() => { if (searchResults.length > 0) showDropdown = true; }}
          on:blur={handleBlur}
        />
        {#if searching}
          <div class="search-spinner">
            <iconify-icon icon="lucide:loader-2" width="14" height="14" class="spin" />
          </div>
        {/if}

        {#if showDropdown}
          <div class="search-dropdown">
            {#each searchResults as user}
              <button type="button" class="search-item" on:mousedown|preventDefault={() => addPlatformUser(user)}>
                <div class="search-item-avatar">
                  {#if user.info?.photo && !brokenPhotos[user.id]}
                    <img src={photoSrc(user.info.photo, 64)} alt="" on:error={() => (brokenPhotos = { ...brokenPhotos, [user.id]: true })} />
                  {:else}
                    <div class="avatar-fallback">
                      {(user.info?.name || user.email || "?")[0].toUpperCase()}
                    </div>
                  {/if}
                </div>
                <div class="search-item-info">
                  <div class="search-item-name">{user.info?.name || $t('partners.create.noName')}</div>
                  <div class="search-item-email">{user.email}</div>
                </div>
                {#if user.info?.status}
                  <span class="search-item-status">{user.info.status}</span>
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <span class="or-divider">{$t('partners.create.or')}</span>

    <button type="button" class="btn-add" on:click={addManualMember}>
      <iconify-icon icon="lucide:user-plus" width="14" height="14" />
      {$t('partners.create.addManually')}
    </button>
  </div>

  {#if team.length === 0}
    <div class="empty">
      <div class="empty-icon">
        <iconify-icon icon="lucide:users" width="32" height="32" />
      </div>
      <div class="empty-text">{$t('partners.create.noTeamYet')}</div>
      <div class="empty-hint">{$t('partners.create.noTeamHint')}</div>
    </div>
  {/if}

  {#each team as m, i}
    <div class="member-card" class:platform={!!m.userId}>
      <div class="member-avatar">
        {#if m.userId && m.photo && !brokenPhotos[m.userId]}
          <img src={photoSrc(m.photo, 64)} alt="" on:error={() => (brokenPhotos = { ...brokenPhotos, [m.userId]: true })} />
        {:else if m.userId}
          <div class="avatar-circle platform-avatar">
            {(m.name || "?")[0].toUpperCase()}
          </div>
        {:else}
          <iconify-icon icon="lucide:user-circle" width="28" height="28" />
        {/if}
      </div>

      <div class="member-fields">
        {#if m.userId}
          <!-- Platform user: name is read-only, role is editable -->
          <div class="platform-name-row">
            <span class="platform-name">{m.name}</span>
            <span class="platform-badge">
              <iconify-icon icon="lucide:badge-check" width="12" height="12" />
              {$t('partners.create.member')}
            </span>
          </div>
          <div class="input-icon">
            <iconify-icon icon="lucide:briefcase" width="14" height="14" />
            <input bind:value={m.role} placeholder={$t('partners.create.rolePlaceholder')} />
          </div>
        {:else}
          <!-- Manual entry: all fields editable -->
          <div class="input-icon">
            <iconify-icon icon="lucide:user" width="14" height="14" />
            <input bind:value={m.name} placeholder={$t('partners.create.namePlaceholder')} />
          </div>
          <div class="input-icon">
            <iconify-icon icon="lucide:briefcase" width="14" height="14" />
            <input bind:value={m.role} placeholder={$t('partners.create.roleShort')} />
          </div>
          <div class="input-icon">
            <iconify-icon icon="lucide:mail" width="14" height="14" />
            <input type="email" bind:value={m.email} placeholder={$t('partners.create.memberEmail')} />
          </div>
        {/if}
      </div>

      <button type="button" class="btn-remove" on:click={() => removeTeamMember(i)} title={$t('partners.create.remove')}>
        <iconify-icon icon="lucide:trash-2" width="14" height="14" />
      </button>
    </div>
  {/each}
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
    flex: 1;
  }

  .card-head > :global(iconify-icon) {
    color: #4f46e5;
  }

  /* Add row */
  .add-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .search-field {
    flex: 1;
  }

  .label {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
  }

  .or-divider {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    flex-shrink: 0;
    padding-bottom: 10px;
  }

  /* Search */
  .search-wrap {
    position: relative;
  }

  .search-spinner {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    display: flex;
  }

  :global(.spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Dropdown */
  .search-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
    max-height: 240px;
    overflow-y: auto;
    z-index: 50;
  }

  .search-item {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.1s;
  }

  .search-item:hover {
    background: #f8fafc;
  }

  .search-item:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }

  .search-item-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .search-item-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .avatar-fallback {
    width: 100%;
    height: 100%;
    background: #4f46e5;
    color: #fff;
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 13px;
  }

  .search-item-info {
    flex: 1;
    min-width: 0;
  }

  .search-item-name {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
  }

  .search-item-email {
    font-size: 11px;
    color: #94a3b8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .search-item-status {
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
    background: #f1f5f9;
    padding: 2px 8px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  /* Empty state */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 28px 16px;
    border: 2px dashed #e2e8f0;
    border-radius: 14px;
    background: #f8fafc;
  }

  .empty-icon {
    color: #cbd5e1;
  }

  .empty-text {
    font-size: 15px;
    font-weight: 700;
    color: #475569;
  }

  .empty-hint {
    font-size: 13px;
    color: #94a3b8;
  }

  /* Member card */
  .member-card {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    transition: border-color 0.15s;
  }

  .member-card:hover {
    border-color: #cbd5e1;
  }

  .member-card.platform {
    border-color: #c7d2fe;
    background: #faf5ff08;
  }

  .member-avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 10px;
    background: #eef2ff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4f46e5;
    overflow: hidden;
  }

  .member-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .avatar-circle {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 16px;
  }

  .platform-avatar {
    background: #4f46e5;
    color: #fff;
  }

  .member-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  /* Platform user name row */
  .platform-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .platform-name {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
  }

  .platform-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 11px;
    font-weight: 700;
    color: #4f46e5;
    background: #eef2ff;
    padding: 2px 8px;
    border-radius: 6px;
  }

  /* Input with icon */
  .input-icon {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon :global(iconify-icon) {
    position: absolute;
    left: 10px;
    color: #94a3b8;
    pointer-events: none;
    z-index: 1;
  }

  .input-icon input {
    padding-left: 32px;
  }

  input {
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

  input::placeholder {
    color: #94a3b8;
  }

  input:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
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
    border-radius: 10px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
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

  @media (max-width: 640px) {
    .card {
      padding: 18px;
    }

    .add-row {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
    }

    .or-divider {
      text-align: center;
      padding-bottom: 0;
    }

    .btn-add {
      justify-content: center;
    }

    .member-card {
      flex-direction: column;
    }

    .member-avatar {
      display: none;
    }
  }
</style>
