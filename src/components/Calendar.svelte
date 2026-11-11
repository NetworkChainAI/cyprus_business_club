<script lang="ts">
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";

  type Event = {
    id: string;
    title: string;
    date: string; 
    description?: string;
    location?: string;
    isRegistered?: boolean;
    photo?: string | null;
  };

  type UserMini = {
    id: string;
    email: string;
    name: string | null;
    photo: string;
  };

  type Meeting = {
    id: string;
    start: string;
    end: string;   
    host: UserMini;
    client: UserMini;
  };

  type CalendarEvent = Event & { type: "event" };
  type CalendarMeeting = Meeting & { type: "meeting" };
  type CalendarItem = CalendarEvent | CalendarMeeting;

  export let data: {
    currentUserId: string | null;
    events: Event[];
    meetings: Meeting[];
    error: string | null;
  };

  $: events = data.events ?? [];
  $: meetings = data.meetings ?? [];
  $: currentUserId = data.currentUserId ?? null;

  let currentMonth: number = new Date().getMonth();
  let currentYear: number = new Date().getFullYear();
  let selectedDay: number | null = null;

  type FilterMode = "all" | "mine";
  let filterMode: FilterMode = "all";

  $: monthNames = Array.from({ length: 12 }, (_, i) => $t(`calendar.months.${i}`));
  $: weekDays = Array.from({ length: 7 }, (_, i) => $t(`calendar.weekDays.${i}`));

  function parseISO(iso: string): Date {
    const d = new Date(iso.includes(" ") ? iso.replace(" ", "T") : iso);
    return Number.isNaN(d.getTime()) ? new Date(0) : d;
  }

  function getTime(iso: string): string {
    return parseISO(iso).toLocaleTimeString(getDateLocale(), {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function dayKeyLocal(iso: string): string {
    const d = parseISO(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function cellKeyLocal(year: number, month: number, day: number): string {
    const d = new Date(year, month, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getStartOffset(year: number, month: number): number {
    return new Date(year, month, 1).getDay(); // 0..6
  }

  function changeMonth(delta: number) {
    const d = new Date(currentYear, currentMonth + delta, 1);
    currentMonth = d.getMonth();
    currentYear = d.getFullYear();
    selectedDay = null;
  }

  function goToday() {
    const t = new Date();
    currentMonth = t.getMonth();
    currentYear = t.getFullYear();
    selectedDay = t.getDate();
  }

  function isToday(day: number) {
    const t = new Date();
    return (
      t.getFullYear() === currentYear &&
      t.getMonth() === currentMonth &&
      t.getDate() === day
    );
  }

  function selectDay(day: number) {
    selectedDay = day;
  }

  function closePanel() {
    selectedDay = null;
  }

  function getMeetingPartner(m: Meeting): UserMini {
    if (!currentUserId) return m.host;
    return m.host.id === currentUserId ? m.client : m.host;
  }

  function itemLabel(item: CalendarItem) {
    if (item.type === "meeting") {
      const partner = getMeetingPartner(item);
      return `${$t('calendar.meetingWith')} ${partner.name ?? partner.email}`;
    }
    return item.title;
  }

  function itemTime(item: CalendarItem) {
    return item.type === "event" ? getTime(item.date) : getTime(item.start);
  }

  function openItem(item: CalendarItem) {
    if (item.type === "event") {
      window.location.href = `/events/${item.id}`;
    }
  }

  function filterItems(items: CalendarItem[]): CalendarItem[] {
    if (filterMode === "all") return items;
    return items.filter((it) => (it.type === "meeting" ? true : Boolean(it.isRegistered)));
  }

  function itemsForDay(day: number): CalendarItem[] {
    const key = cellKeyLocal(currentYear, currentMonth, day);

    const dailyEvents: CalendarEvent[] = events
      .filter((e) => dayKeyLocal(e.date) === key)
      .map((e) => ({ ...e, type: "event" }));

    const dailyMeetings: CalendarMeeting[] = meetings
      .filter((m) => dayKeyLocal(m.start) === key)
      .map((m) => ({ ...m, type: "meeting" }));

    const all: CalendarItem[] = [...dailyEvents, ...dailyMeetings];

    all.sort((a, b) => {
      const ta = a.type === "event" ? parseISO(a.date).getTime() : parseISO(a.start).getTime();
      const tb = b.type === "event" ? parseISO(b.date).getTime() : parseISO(b.start).getTime();
      return ta - tb;
    });

    return filterItems(all);
  }

  function isFutureOrNow(item: CalendarItem) {
    const now = Date.now();
    const t = item.type === "event" ? parseISO(item.date).getTime() : parseISO(item.start).getTime();
    return t >= now;
  }

  $: monthKey = `${currentYear}-${currentMonth}`;

  $: startOffset = getStartOffset(currentYear, currentMonth);
  $: daysInMonth = getDaysInMonth(currentYear, currentMonth);

  $: pad = Array.from({ length: startOffset }, (_, i) => i);
  $: monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  $: selectedItemsRaw = selectedDay ? itemsForDay(selectedDay) : [];
  $: upcomingItems = selectedItemsRaw.filter(isFutureOrNow);
  $: pastItems = selectedItemsRaw.filter((x) => !isFutureOrNow(x));

  let panelTitle = "";

  $: panelDate =
    selectedItemsRaw.length > 0
      ? parseISO(
          selectedItemsRaw[0].type === "event"
            ? selectedItemsRaw[0].date
            : selectedItemsRaw[0].start
        )
      : selectedDay
        ? new Date(currentYear, currentMonth, selectedDay)
        : null;

  $: panelTitle = panelDate
    ? panelDate.toLocaleDateString(getDateLocale(), {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    : "";
</script>


<div class="page">
  <div class="hero">
    <div class="hero-left">
      <h1>
        <iconify-icon icon="lucide:calendar" width="28" height="28"></iconify-icon>
        {$t('calendar.title')}
      </h1>

      <div class="month-switch">
        <button
          class="arrow"
          type="button"
          on:click={() => changeMonth(-1)}
          aria-label="Previous month"
        >
          <iconify-icon icon="lucide:chevron-left" width="16" height="16"></iconify-icon>
        </button>
        <button class="today-btn" type="button" on:click={goToday}>{$t('calendar.today')}</button>
        <button
          class="arrow"
          type="button"
          on:click={() => changeMonth(1)}
          aria-label="Next month"
        >
          <iconify-icon icon="lucide:chevron-right" width="16" height="16"></iconify-icon>
        </button>
      </div>

      <div class="month-label">{monthNames[currentMonth]} {currentYear}</div>
    </div>

    <div class="tabs">
      <button
        class="tab"
        class:active={filterMode === "all"}
        type="button"
        on:click={() => (filterMode = "all")}
      >
        {$t('calendar.allEvents')}
      </button>
      <button
        class="tab"
        class:active={filterMode === "mine"}
        type="button"
        on:click={() => (filterMode = "mine")}
      >
        {$t('calendar.myEvents')}
      </button>
    </div>
  </div>

    {#if data.error}
      <div class="error">{$t('calendar.error')}: {data.error}</div>
    {:else}
      <div class="calendar-layout {selectedDay ? 'with-panel' : 'full'}">
        <div class="calendar-card">
          <div class="weekdays">
            {#each weekDays as day}
              <div class="weekday">{day}</div>
            {/each}
          </div>

          <div class="grid">
            {#each pad as _ (monthKey + ":pad:" + _)}
              <div class="cell empty"></div>
            {/each}

            {#each monthDays as day (monthKey + ":day:" + day)}
              {@const dayItems = itemsForDay(day)}
              <button
                type="button"
                class="cell day {selectedDay === day ? 'selected' : ''}"
                on:click={() => selectDay(day)}
              >
                <div class="num">
                  <span class="num-text {isToday(day) ? 'today-circle' : ''}"
                    >{day}</span
                  >
                </div>

              <div class="lines">
  <div class="lines-list">
    {#each dayItems.slice(0, 3) as item}
      <div
        class="line
          {item.type === 'meeting' ? 'line-meeting' : ''}
          {item.type === 'event' && item.isRegistered ? 'line-registered' : ''}"
      >
        <span class="dot"></span>
        <span class="line-text">{itemLabel(item)}</span>
      </div>
    {/each}
  </div>

  {#if dayItems.length > 3}
    <div class="more">+{dayItems.length - 3}</div>
  {/if}
</div>

              </button>
            {/each}
          </div>
        </div>

        {#if selectedDay}
          <aside class="side-panel">
            <div class="panel-head">
              <div class="panel-title">{panelTitle}</div>
              <button
                class="close"
                type="button"
                on:click={closePanel}
                aria-label="Close"
              >
                <iconify-icon icon="lucide:x" width="16" height="16"></iconify-icon>
              </button>
            </div>

            {#if selectedItemsRaw.length === 0}
              <div class="panel-empty">
                <iconify-icon icon="lucide:calendar-off" width="36" height="36"></iconify-icon>
                <div class="empty-text">{$t('calendar.noEvents')}</div>
              </div>
            {:else}
              {#if upcomingItems.length > 0}
                <div class="section">
                  <div class="section-title">{$t('calendar.upcoming')}</div>

                  <div class="cards">
                    {#each upcomingItems as item}
                      <button
                        class="event-card"
                        type="button"
                        on:click={() => openItem(item)}
                      >
                        <div class="time">{itemTime(item)}</div>

                        <div class="name">
                          {item.type === "event" ? item.title : $t('calendar.meeting')}
                        </div>

                        {#if item.type === "event" && item.location}
                          <div class="sub">
                            <iconify-icon icon="lucide:map-pin" width="13" height="13"></iconify-icon>
                            {item.location}
                          </div>
                        {:else if item.type === "meeting"}
                          {@const partner = getMeetingPartner(item)}
                          <div class="meeting">
                            <img
                              class="avatar"
                              src={partner.photo}
                              alt={partner.name ?? partner.email}
                            />
                            <div class="partner">
                              {partner.name ?? partner.email}
                            </div>
                          </div>
                          <div class="sub">
                            {getTime(item.start)} – {getTime(item.end)}
                          </div>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}

              {#if pastItems.length > 0}
                <div class="section">
                  <div class="section-title">{$t('calendar.past')}</div>

                  <div class="cards">
                    {#each pastItems as item}
                      <button
                        class="event-card past"
                        type="button"
                        on:click={() => openItem(item)}
                      >
                        <div class="time">{itemTime(item)}</div>

                        <div class="name">
                          {item.type === "event" ? item.title : $t('calendar.meeting')}
                        </div>

                        {#if item.type === "event" && item.location}
                          <div class="sub">
                            <iconify-icon icon="lucide:map-pin" width="13" height="13"></iconify-icon>
                            {item.location}
                          </div>
                        {:else if item.type === "meeting"}
                          {@const partner = getMeetingPartner(item)}
                          <div class="meeting">
                            <img
                              class="avatar"
                              src={partner.photo}
                              alt={partner.name ?? partner.email}
                            />
                            <div class="partner">
                              {partner.name ?? partner.email}
                            </div>
                          </div>
                          <div class="sub">
                            {getTime(item.start)} – {getTime(item.end)}
                          </div>
                        {/if}
                      </button>
                    {/each}
                  </div>
                </div>
              {/if}
            {/if}
          </aside>
        {/if}
      </div>
    {/if}
</div>


<style>
  /* ============ PAGE ============ */
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 18px 60px;
  }

  /* ============ HERO ============ */
  .hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .hero-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  h1 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  h1 :global(iconify-icon) {
    color: #4f46e5;
  }

  .month-switch {
    display: inline-flex;
    align-items: center;
    gap: 0;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    background: #fff;
    height: 38px;
  }

  .arrow {
    width: 36px;
    height: 38px;
    border: none;
    background: #fff;
    cursor: pointer;
    color: #64748b;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }

  .arrow:hover {
    background: #f1f5f9;
    color: #4f46e5;
  }

  .today-btn {
    height: 38px;
    border: none;
    border-left: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    color: #0f172a;
    font-weight: 700;
    font-size: 13px;
    font-family: inherit;
    padding: 0 14px;
    transition: all 0.15s;
  }

  .today-btn:hover {
    background: #f1f5f9;
    color: #4f46e5;
  }

  .month-label {
    height: 38px;
    padding: 0 14px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-weight: 800;
    font-size: 14px;
    display: inline-flex;
    align-items: center;
  }

  /* ============ TABS ============ */
  .tabs {
    display: flex;
    gap: 6px;
  }

  .tab {
    height: 38px;
    padding: 0 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    font-family: inherit;
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    transition: all 0.15s;
  }

  .tab:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .tab.active {
    background: #4f46e5;
    color: #fff;
    border-color: #4f46e5;
  }

  /* ============ ERROR ============ */
  .error {
    padding: 14px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    border-radius: 14px;
    font-weight: 700;
    font-size: 14px;
  }

  /* ============ LAYOUT ============ */
  .calendar-layout {
    display: grid;
    gap: 18px;
    align-items: start;
  }

  .calendar-layout.full {
    grid-template-columns: 1fr;
  }

  .calendar-layout.with-panel {
    grid-template-columns: 1fr 360px;
  }

  /* ============ CALENDAR CARD ============ */
  .calendar-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    overflow: hidden;
  }

  .weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    border-bottom: 1px solid #e2e8f0;
    background: #fff;
  }

  .weekday {
    text-align: center;
    padding: 12px 8px;
    font-weight: 800;
    font-size: 11px;
    color: #94a3b8;
    letter-spacing: 0.1em;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0;
  }

  .cell {
    border: none;
    background: #fff;
    height: 118px;
    border-right: 1px solid #f1f5f9;
    border-bottom: 1px solid #f1f5f9;
    overflow: hidden;
  }

  .cell:nth-child(7n) {
    border-right: none;
  }

  .cell.empty {
    background: #fafbfc;
    cursor: default;
  }

  .day {
    cursor: pointer;
    position: relative;
    padding: 10px 10px;
    text-align: left;
    transition: background 0.12s;
  }

  .day:hover {
    background: #f8fafc;
  }

  .day.selected {
    box-shadow: inset 0 0 0 2px #4f46e5;
    background: rgba(79, 70, 229, 0.04);
  }

  .num {
    position: absolute;
    top: 10px;
    left: 10px;
  }

  .num-text {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    font-weight: 800;
    font-size: 13px;
    color: #0f172a;
    line-height: 1;
  }

  .num-text.today-circle {
    background: #4f46e5;
    color: #fff;
    font-weight: 900;
  }

  /* ============ DAY LINES ============ */
  .lines {
    margin-top: 34px;
    height: 52px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
  }

  .lines-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
    overflow: hidden;
  }

  .line {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
  }

  .line-text {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .dot {
    width: 5px;
    height: 5px;
    border-radius: 999px;
    background: #cbd5e1;
    flex: 0 0 auto;
  }

  .line-registered .dot {
    background: #16a34a;
  }

  .line-meeting .dot {
    background: #8b5cf6;
  }

  .more {
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    padding-left: 10px;
    line-height: 1;
  }

  /* ============ SIDE PANEL ============ */
  .side-panel {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
    position: sticky;
    top: 82px;
  }

  .panel-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 16px;
  }

  .panel-title {
    font-size: 16px;
    font-weight: 900;
    color: #0f172a;
  }

  .close {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    cursor: pointer;
    color: #64748b;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }

  .close:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .panel-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 10px 24px;
    color: #94a3b8;
  }

  .empty-text {
    font-weight: 700;
    font-size: 14px;
    color: #64748b;
  }

  .section {
    margin-top: 14px;
  }

  .section-title {
    font-size: 11px;
    font-weight: 900;
    color: #94a3b8;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .event-card {
    text-align: left;
    border: 1px solid #e2e8f0;
    background: #fff;
    border-radius: 14px;
    padding: 14px;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
  }

  .event-card:hover {
    border-color: #c7d2fe;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
    transform: translateY(-1px);
  }

  .event-card.past {
    opacity: 0.6;
  }

  .time {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 10px;
    border-radius: 8px;
    background: rgba(79, 70, 229, 0.08);
    color: #4f46e5;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 0.04em;
    margin-bottom: 8px;
  }

  .name {
    font-size: 14px;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.3;
    margin-bottom: 6px;
  }

  .sub {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: #94a3b8;
    font-weight: 700;
    font-size: 12px;
  }

  .meeting {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 8px 0 4px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    object-fit: cover;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
  }

  .partner {
    font-size: 13px;
    font-weight: 800;
    color: #0f172a;
  }

  /* ============ RESPONSIVE ============ */
  @media (max-width: 1100px) {
    .calendar-layout.with-panel {
      grid-template-columns: 1fr;
    }

    .side-panel {
      position: relative;
      top: 0;
    }
  }

  @media (max-width: 720px) {
    .page {
      padding: 20px 12px 40px;
    }

    .hero {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    h1 {
      font-size: 22px;
    }

    .cell {
      height: 80px;
    }

    .lines {
      display: none;
    }

    .panel-title {
      font-size: 14px;
    }
  }
</style>
