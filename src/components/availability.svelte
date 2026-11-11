<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";

  let selectedDate: string | null = null;
  let startTime = "12:00";
  let endTime = "20:00";

  let availability: any[] = [];
  let isPartner = false;
  let loading = true;

  onMount(async () => {
    const res = await fetch("/api/user/availability");
    const data = await res.json();

    isPartner = data.isPartner;
    availability = data.availability;

    loading = false;
  });

  function selectDay(day: number) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;

    selectedDate = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  }

  async function createSlot() {
    if (!selectedDate) return;

    const start = `${selectedDate}T${startTime}:00`;
    const end = `${selectedDate}T${endTime}:00`;

    const res = await fetch("/api/user/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, end }),
    });

    if (res.ok) {
      const newSlot = await res.json();
      availability = [...availability, newSlot];
      selectedDate = null;
    } else {
      alert(t.get('common.error.generic') + " " + (await res.text()));
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
</script>

{#if loading}
  <p class="loading">{$t('common.btn.loading')}</p>
{:else}
  {#if !isPartner}
    <p class="error-msg">
      {$t('common.availability.accessDenied')}
    </p>
  {:else}
    <h2 class="title">{$t('common.availability.title')}</h2>

    <div class="calendar">
      {#each days as day}
        <div class="day">
          <button class="day-btn" on:click={() => selectDay(day)}>
            <span class="day-number">{day}</span>
          </button>
        </div>
      {/each}
    </div>

    {#if selectedDate}
      <div class="overlay" on:click={() => (selectedDate = null)}></div>

      <div class="modal-window">
        <h3 class="modal-title">Создать интервал на {selectedDate}</h3>

        <div class="field">
          <label>Начало</label>
          <input type="time" bind:value={startTime} />
        </div>

        <div class="field">
          <label>Конец</label>
          <input type="time" bind:value={endTime} />
        </div>

        <div class="modal-actions">
          <button class="btn primary" on:click={createSlot}>Создать</button>
          <button class="btn secondary" on:click={() => (selectedDate = null)}>
            Отмена
          </button>
        </div>
      </div>
    {/if}

    <h3 class="subtitle">Ваши интервалы:</h3>
    <ul class="slots">
      {#each availability as slot}
        <li class="slot-item">
          {new Date(slot.start).toLocaleString()} —
          {new Date(slot.end).toLocaleString()}
        </li>
      {/each}
    </ul>
  {/if}
{/if}

<style>
  .loading {
    text-align: center;
    font-size: 18px;
  }

  .error-msg {
    color: #c00113;
    background: #ffe5e8;
    padding: 10px;
    border-radius: 6px;
  }

  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
    margin-bottom: 25px;
    background: rgba(255, 255, 255, 0.6);
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    backdrop-filter: blur(6px);
  }

  .day {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .day-btn {
    width: 45px;
    height: 45px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #dbe3ff;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.2s ease;
    font-size: 15px;
    color: #475569;
  }

  .day-btn:hover {
    background: #4f69ff;
    border-color: #4f69ff;
    color: white;
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(79,105,255,0.25);
  }

  .day-number {
    font-weight: 500;
  }

  .day:hover {
    background: #f0f4ff;
    border-color: #4f69ff;
    transform: translateY(-2px);
  }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 5000;
    backdrop-filter: blur(2px);
  }

  .modal-window {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 25px;
    width: 330px;
    border-radius: 12px;
    z-index: 5001;
    box-shadow: 0px 10px 35px rgba(0, 0, 0, 0.2);
    animation: pop 0.25s ease;
  }

  @keyframes pop {
    from {
      opacity: 0;
      transform: translate(-50%, -45%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }

  .modal-title {
    margin-bottom: 15px;
    font-size: 18px;
    font-weight: 600;
  }

  .field {
    display: flex;
    flex-direction: column;
    margin-bottom: 12px;
  }

  .field label {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .field input {
    padding: 8px;
    font-size: 15px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
  }

  .modal-actions {
    margin-top: 18px;
    display: flex;
    gap: 10px;
  }

  .btn {
    padding: 0.7rem 1.2rem;
    border-radius: 9999px;
    cursor: pointer;
    font-weight: 600;
    border: none;
    width: 100%;
    transition: 0.2s;
  }

  .primary {
    background: #4f69ff;
    color: white;
  }

  .primary:hover {
    background: #344bff;
  }

  .secondary {
    background: #f1f5f9;
    color: #0b3954;
  }

  .secondary:hover {
    background: #e2e8f0;
  }

  .slots {
    margin-top: 20px;
    padding-left: 18px;
  }

  .slot-item {
    margin-bottom: 8px;
  }
</style>
