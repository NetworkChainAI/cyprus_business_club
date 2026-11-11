<script lang="ts">
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";

  export let availability: any[] = [];
  export let member: any = null;

  export let onClose: () => void;
  export let onBooked: (meeting: any) => void = () => {};

  let loading = false;
  let step = 1;
  let selectedSlot: any = null;
  let selectedStart: Date | null = null;
  let selectedEnd: Date | null = null;
  let errorMsg = "";

  function formatDate(d: Date) {
    return d.toLocaleDateString(getDateLocale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString(getDateLocale(), {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // генерация временных точек внутри интервала с шагом 1 час
  function generateTimes(slot: any) {
    const start = new Date(slot.start);
    const end = new Date(slot.end);

    const result: Date[] = [];
    const t = new Date(start);

    while (t < end) {
      result.push(new Date(t));
      t.setHours(t.getHours() + 1); // шаг 1 час
    }
    return result;
  }

  function openStartSelector(slot: any) {
    selectedSlot = slot;
    selectedStart = null;
    selectedEnd = null;
    step = 2;
    errorMsg = "";
  }

  function chooseStart(time: Date) {
    selectedStart = time;
    selectedEnd = null;
    step = 3;
    errorMsg = "";
  }

  function possibleEndTimes() {
    if (!selectedSlot || !selectedStart) return [];

    const times = generateTimes(selectedSlot);
    // конец должен быть > старта
    return times.filter((t) => t > selectedStart!);
  }

  async function confirmBooking() {
    if (!selectedSlot || !selectedStart || !selectedEnd) return;

    loading = true;
    errorMsg = "";

    try {
      const res = await fetch("/api/user/meeting/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostId: member.id,
          start: selectedStart.toISOString(),
          end: selectedEnd.toISOString()
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        errorMsg = txt || t.get('common.booking.error');
        return;
      }

      const meeting = await res.json();
      onBooked(meeting);
      onClose();
    } catch (err) {
      console.error("Booking error:", err);
      errorMsg = t.get('common.booking.unexpectedError');
    } finally {
      loading = false;
    }
  }
</script>

<div class="modal-wrapper">
  <div class="modal-backdrop1" on:click={onClose}></div>

  <div class="modal-container">
    <h3 class="modal-title">
      {$t('common.booking.title')} {member?.info?.name}
    </h3>

    {#if errorMsg}
      <p class="error-msg">{errorMsg}</p>
    {/if}

    {#if step === 1}
      <!-- Шаг 1: выбор окна Availability -->
      {#if availability.length === 0}
        <p>{$t('common.booking.noAvailability')}</p>
      {:else}
        {#each availability as slot}
          <div class="slot-item">
            <div class="slot-time">
              <strong>{formatDate(new Date(slot.start))}</strong><br />
              {formatTime(new Date(slot.start))} — {formatTime(new Date(slot.end))}
            </div>
            <button class="slot-btn" on:click={() => openStartSelector(slot)}>
              {$t('common.booking.select')}
            </button>
          </div>
        {/each}
      {/if}
    {/if}

    {#if step === 2}
      <!-- Шаг 2: выбор начала встречи -->
      <p class="step-title">
        {formatDate(new Date(selectedSlot.start))}
      </p>
      <p class="step-sub">
        {$t('common.booking.chooseStart')}:
      </p>

      <div class="times-grid">
        {#each generateTimes(selectedSlot) as time}
          <button
            class="time-btn"
            disabled={loading}
            on:click={() => chooseStart(time)}
          >
            {formatTime(time)}
          </button>
        {/each}
      </div>

      <button class="back-btn" on:click={() => (step = 1)}>
        ← {$t('common.btn.back')}
      </button>
    {/if}

    {#if step === 3}
      <!-- Шаг 3: выбор конца встречи -->
      <p class="step-title">
        {formatDate(new Date(selectedSlot.start))}
      </p>
      <p class="step-sub">
        {$t('common.booking.start')}: {selectedStart && formatTime(selectedStart)}<br />
        {$t('common.booking.chooseEnd')}:
      </p>

      <div class="times-grid">
        {#each possibleEndTimes() as time}
          <button
            class:active={selectedEnd && time.getTime() === selectedEnd.getTime()}
            class="time-btn"
            disabled={loading}
            on:click={() => (selectedEnd = time)}
          >
            {formatTime(time)}
          </button>
        {/each}
      </div>

      <div class="modal-actions">
        <button class="back-btn" on:click={() => (step = 2)} disabled={loading}>
          ← {$t('common.btn.back')}
        </button>
        <button
          class="primary-btn"
          on:click={confirmBooking}
          disabled={loading || !selectedEnd}
        >
          {loading ? $t('common.booking.booking') : $t('common.btn.confirm')}
        </button>
      </div>
    {/if}

    <button class="close-btn" on:click={onClose}>
      {$t('common.btn.close')}
    </button>
  </div>
</div>
<style>
  .modal-wrapper {
    position: fixed;
    inset: 0;
    z-index: 9999;
    font-family: "Inter", sans-serif;
  }

  .modal-backdrop1 {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(2px);
  }

  .modal-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 440px;
    max-width: 90%;
    background: #fff;
    padding: 28px 24px;
    border-radius: 14px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  }

  .modal-title {
    font-size: 26px;
    font-weight: 600;
    margin-bottom: 20px;
    line-height: 1.25;
  }

  .error-msg {
    background: #ffe2e2;
    color: #b30000;
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-size: 14px;
  }

  /* ——— Шаг 1 ——— */

  .slot-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #e5e5e5;
  }

  .slot-time {
    font-size: 15px;
    line-height: 1.35;
  }

  .slot-btn {
    background: #2563eb;
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: 0.2s;
  }

  .slot-btn:hover {
    background: #1e4ec7;
  }

  /* ——— Шаги 2–3 ——— */

  .step-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .step-sub {
    color: #555;
    font-size: 15px;
    margin-bottom: 16px;
  }

  .times-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .time-btn {
    padding: 10px 18px;
    min-width: 80px;
    text-align: center;
    border-radius: 8px;
    border: 1px solid #333;
    background: #fff;
    cursor: pointer;
    font-size: 15px;
    transition: all 0.2s;
  }

  .time-btn:hover:not(:disabled) {
    background: #f3f3f3;
  }

  .time-btn.active {
    background: #2563eb;
    color: white;
    border-color: #2563eb;
  }

  /* ——— Нижние кнопки ——— */

  .modal-actions {
    display: flex;
    gap: 10px;
  }

  .primary-btn,
  .back-btn,
  .close-btn {
    width: 100%;
    padding: 14px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-size: 16px;
    transition: 0.2s;
  }

  .primary-btn {
    background: #2563eb;
    color: white;
  }

  .primary-btn:hover:not(:disabled) {
    background: #1e4ec7;
  }

  .back-btn,
  .close-btn {
    background: #e6e6e6;
    color: #333;
  }

  .back-btn:hover,
  .close-btn:hover {
    background: #dadada;
  }

  .back-btn:disabled,
  .primary-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }
</style>
