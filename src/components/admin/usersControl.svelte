<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";

  type User = {
    id: string;
    email: string;
    createdAt: string;
    info?: {
      id: string;
      status: string;
      name?: string;
    };
  };

  let users: User[] = [];
  let loading = true;

  const statusOptions = [
    { value: "Member", key: "admin.users.statusMember" },
    { value: "Resident", key: "admin.users.statusResident" },
    { value: "Partner", key: "admin.users.statusPartner" },
  ];

  // Track edited status per user
  let editedStatus: Record<string, string> = {};
  let saving: Record<string, boolean> = {};

  onMount(async () => {
    await loadUsers();
  });

  async function loadUsers() {
    loading = true;
    try {
      const res = await fetch("/api/status");
      users = await res.json();
    } catch (err) {
      console.error("User load error:", err);
    } finally {
      loading = false;
    }
  }

  function markEdited(userId: string, value: string) {
    editedStatus[userId] = value;
  }

  async function saveStatus(userId: string) {
    const newStatus = editedStatus[userId];
    if (!newStatus) return;

    saving[userId] = true;

    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(t.get('admin.users.error') + ": " + (data.error || t.get('admin.users.unknownError')));
        return;
      }

      // Update actual user object
      const user = users.find((u) => u.id === userId);
      if (user) {
        if (!user.info) user.info = { id: "", status: newStatus };
        user.info.status = newStatus;
      }

      delete editedStatus[userId];
    } catch (err) {
      console.error("Saving error:", err);
      alert(t.get('admin.users.errorSavingStatus'));
    } finally {
      saving[userId] = false;
    }
  }
</script>

{#if loading}
  <p>{$t('admin.users.loading')}</p>
{:else}
  <table class="users-table">
    <thead>
      <tr>
        <th>{$t('admin.users.name')}</th>
        <th>{$t('admin.users.email')}</th>
        <th>{$t('admin.users.status')}</th>
        <th>{$t('admin.users.registrationDate')}</th>
        <th></th>
      </tr>
    </thead>

    <tbody>
      {#each users as user}
        <tr>
          <td>{user.info?.name || "—"}</td>
          <td>{user.email}</td>

          <td>
            <select
              class="status-select"
              value={editedStatus[user.id] || user.info?.status || "Member"}
              on:change={(e) =>
                markEdited(user.id, (e.target as HTMLSelectElement).value)
              }
            >
              {#each statusOptions as option}
                <option value={option.value}>{$t(option.key)}</option>
              {/each}
            </select>
          </td>

          <td>{new Date(user.createdAt).toLocaleDateString(getDateLocale())}</td>

          <td>
            {#if editedStatus[user.id]}
              <button
                class="save-btn"
                on:click={() => saveStatus(user.id)}
                disabled={saving[user.id]}
              >
                {saving[user.id] ? $t('admin.users.saving') : $t('admin.users.save')}
              </button>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .users-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
  }

  th, td {
    padding: 12px 18px;
    border-bottom: 1px solid #e5e7eb;
    text-align: left;
  }

  th {
    background: #f8fafc;
    color: #475569;
    font-weight: 600;
  }

  tr:hover {
    background: #f1f5f9;
  }

  .status-select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    background: white;
    cursor: pointer;
  }

  .save-btn {
    background: #007aff;
    border: none;
    color: white;
    padding: 6px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: 0.15s;
  }

  .save-btn:hover {
    background: #0063d8;
  }

  .save-btn:disabled {
    background: #9bbcf5;
    cursor: not-allowed;
  }
</style>
