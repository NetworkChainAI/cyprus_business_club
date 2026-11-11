<script lang="ts">
  import { tick, onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { marked } from "marked";
  import { t } from "$lib/i18n";
  import { getDateLocale } from "$lib/utils/dateLocale";

  const dispatch = createEventDispatcher<{ apply: { field: string; value: string } }>();

  export let contextKey:
    | "global"
    | "event"
    | "event_create"
    | "expert"
    | "member"
    | "custody"
    | "custom"
    | "brand"
    | "brand_unified"
    | "brand_create"
    | "brand_search"
    | "community"
    | "community_list" = "global";

  export let payload: any = {};
  export let title = "AI Assistant";

  export let fabRight = 18;
  export let fabBottom = 18;

  export let open = false;
  let input = "";
  let loading = false;

  type Msg = { role: "user" | "assistant"; content: string; at: string };
  type Suggestion = { field: string; value: string; label: string; applied?: boolean };

  let messages: Msg[] = [];
  let pendingSuggestions: Suggestion[] = [];
  let msgsEl: HTMLDivElement | null = null;

  const renderer = new marked.Renderer();

  renderer.link = ({ href, title: linkTitle, tokens }) => {
    const safeHref = href ?? "#";
    const safeTitleAttr = linkTitle ? ` title="${linkTitle}"` : "";
    const inner = marked.parser(tokens);
    // Internal platform links navigate in-app; external links open in new tab
    const isExternal = safeHref.startsWith("http");
    const targetAttr = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${safeHref}"${safeTitleAttr}${targetAttr}>${inner}</a>`;
  };

  marked.setOptions({ breaks: true, gfm: true, renderer });

  function renderMessage(content: string): string {
    return marked.parse(content ?? "") as string;
  }

  function storageKey() {
    const id = payload?.id ?? payload?.address ?? payload?.slug ?? "global";
    return `assistant:${contextKey}:${id}`;
  }

  function suggestionsKey() {
    return `${storageKey()}:suggestions`;
  }

  function loadLocalHistory() {
    if (!browser) return;
    try {
      const raw = localStorage.getItem(storageKey());
      messages = raw ? JSON.parse(raw) : [];
    } catch {
      messages = [];
    }
    try {
      const raw = localStorage.getItem(suggestionsKey());
      pendingSuggestions = raw ? JSON.parse(raw) : [];
    } catch {
      pendingSuggestions = [];
    }
  }

  function saveLocalHistory() {
    if (!browser) return;
    localStorage.setItem(storageKey(), JSON.stringify(messages.slice(-30)));
    saveSuggestions();
  }

  function saveSuggestions() {
    if (!browser) return;
    if (pendingSuggestions.length > 0) {
      localStorage.setItem(suggestionsKey(), JSON.stringify(pendingSuggestions));
    } else {
      try { localStorage.removeItem(suggestionsKey()); } catch {}
    }
  }

  function clearChat() {
    messages = [];
    pendingSuggestions = [];
    input = "";
    loading = false;
    if (browser) {
      try { localStorage.removeItem(storageKey()); } catch {}
      try { localStorage.removeItem(suggestionsKey()); } catch {}
    }
    tick().then(scrollToBottom);
  }

  function scrollToBottom() {
    if (!msgsEl) return;
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  async function toggle() {
    open = !open;
    if (open) {
      loadLocalHistory();
      await tick();
      scrollToBottom();
    }
  }

  $: if (browser && open) {
    loadLocalHistory();
    tick().then(scrollToBottom);
  }

  async function send() {
    if (!browser) return;
    if (!input.trim() || loading) return;

    const prompt = input.trim();
    input = "";

    messages = [
      ...messages,
      { role: "user", content: prompt, at: new Date().toISOString() },
    ];
    saveLocalHistory();
    await tick();
    scrollToBottom();

    loading = true;

    const historyForServer = messages
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt,
          contextKey,
          payload,
          history: historyForServer,
        }),
      });

      const data = await res.json();
      const reply = data?.reply ?? t.get('common.ai.fallbackError');

      // Capture suggestions from AI response
      if (data?.suggestions?.length) {
        pendingSuggestions = data.suggestions.map((s: any) => ({
          field: s.field,
          value: s.value,
          label: s.label ?? s.field,
          applied: false,
        }));
      } else {
        pendingSuggestions = [];
      }

      messages = [
        ...messages,
        { role: "assistant", content: reply, at: new Date().toISOString() },
      ];
      saveLocalHistory();
      await tick();
      scrollToBottom();
    } catch {
      messages = [
        ...messages,
        {
          role: "assistant",
          content: t.get('common.ai.networkError'),
          at: new Date().toISOString(),
        },
      ];
      saveLocalHistory();
    } finally {
      loading = false;
    }
  }

  function applySuggestion(i: number) {
    const sug = pendingSuggestions[i];
    if (sug.applied) return;
    dispatch("apply", { field: sug.field, value: sug.value });
    pendingSuggestions[i] = { ...sug, applied: true };
    pendingSuggestions = [...pendingSuggestions];
    saveSuggestions();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function onGlobalKey(e: KeyboardEvent) {
    if (e.key === "Escape" && open) open = false;
  }

  onMount(() => {
    if (!browser) return;
    window.addEventListener("keydown", onGlobalKey);
  });

  onDestroy(() => {
    if (!browser) return;
    window.removeEventListener("keydown", onGlobalKey);
  });

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(getDateLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<div class="assistant-root" aria-live="polite">
  <button
    class="fab"
    class:open
    style="right:{fabRight}px; bottom:{fabBottom}px;"
    on:click={toggle}
    aria-label="AI assistant"
    title={title}
  >
    {#if open}
      <iconify-icon icon="lucide:x" width="18"></iconify-icon>
      <span class="fab-text">{$t('common.ai.close')}</span>
    {:else}
      <iconify-icon icon="lucide:sparkles" width="18"></iconify-icon>
      <span class="fab-text">{$t('common.ai.aiChat')}</span>
    {/if}
  </button>

  {#if open}
    <div class="popup" style="right:{fabRight}px;">
      <div class="popup-header">
        <div class="popup-title">
          <iconify-icon icon="lucide:bot" width="18"></iconify-icon>
          <span>{title}</span>
        </div>

        <div class="popup-actions">
          <button class="action-icon" on:click={clearChat} title={$t('common.ai.clearChat')}>
            <iconify-icon icon="lucide:trash-2" width="15"></iconify-icon>
          </button>
          <button class="action-icon" on:click={toggle} title={$t('common.ai.close')}>
            <iconify-icon icon="lucide:x" width="15"></iconify-icon>
          </button>
        </div>
      </div>

      <div class="msgs" bind:this={msgsEl}>
        {#if messages.length === 0}
          <div class="empty-state">
            <div class="empty-icon">
              <iconify-icon icon="lucide:sparkles" width="28"></iconify-icon>
            </div>
            <div class="empty-title">{$t('common.ai.assistant')}</div>
            <div class="empty-text">{$t('common.ai.askAnything')}</div>
          </div>
        {/if}

        {#each messages as m}
          <div class="msg {m.role}">
            {#if m.role === "assistant"}
              <div class="msg-avatar">
                <iconify-icon icon="lucide:bot" width="14"></iconify-icon>
              </div>
            {/if}
            <div class="msg-body">
              <div class="bubble">
                {#if m.role === "assistant"}
                  {@html renderMessage(m.content)}
                {:else}
                  {m.content}
                {/if}
              </div>
              <div class="time">{formatTime(m.at)}</div>
            </div>
          </div>
        {/each}

        {#if pendingSuggestions.length > 0}
          <div class="suggestions">
            {#each pendingSuggestions as sug, i}
              <div class="suggestion-card" class:applied={sug.applied}>
                <div class="sug-header">
                  <iconify-icon icon="lucide:sparkles" width="12"></iconify-icon>
                  <span class="sug-label">{sug.label}</span>
                </div>
                <div class="sug-value">{sug.value}</div>
                {#if !sug.applied}
                  <button class="sug-apply" on:click={() => applySuggestion(i)}>
                    <iconify-icon icon="lucide:check" width="14"></iconify-icon>
                    {$t('common.ai.apply')}
                  </button>
                {:else}
                  <span class="sug-done">
                    <iconify-icon icon="lucide:check-circle-2" width="13"></iconify-icon>
                    {$t('common.ai.applied')}
                  </span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}

        {#if loading}
          <div class="msg assistant">
            <div class="msg-avatar">
              <iconify-icon icon="lucide:bot" width="14"></iconify-icon>
            </div>
            <div class="msg-body">
              <div class="bubble typing">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="input-area">
        <textarea
          bind:value={input}
          rows="1"
          placeholder={$t('common.ai.askQuestion')}
          on:keydown={onKeyDown}
        />
        <button
          class="send-btn"
          disabled={loading || !input.trim()}
          on:click={send}
        >
          <iconify-icon icon="lucide:send" width="16"></iconify-icon>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .assistant-root {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 9999;
  }

  /* ===== FAB ===== */
  .fab {
    position: fixed;
    padding: 10px 18px;
    border-radius: 14px;
    border: none;
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 6px 24px rgba(79, 70, 229, 0.35), 0 2px 8px rgba(79, 70, 229, 0.15);
    pointer-events: auto;
    transition: all 0.2s;
    font-family: inherit;
  }

  .fab-text {
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
  }

  .fab:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(79, 70, 229, 0.45), 0 4px 12px rgba(79, 70, 229, 0.2);
  }

  .fab.open {
    background: #fff;
    color: #64748b;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  }

  .fab.open:hover {
    color: #0f172a;
    border-color: #cbd5e1;
    box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
  }

  /* ===== Popup ===== */
  .popup {
    position: fixed;
    bottom: 82px;
    width: 380px;
    max-width: calc(100vw - 36px);
    height: min(560px, 72vh);
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    box-shadow: 0 16px 48px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(15, 23, 42, 0.06);
    display: grid;
    grid-template-rows: auto 1fr auto;
    overflow: hidden;
    pointer-events: auto;
    animation: popupIn 0.15s ease-out;
  }

  @keyframes popupIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ===== Header ===== */
  .popup-header {
    padding: 14px 16px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .popup-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 900;
    color: #0f172a;
  }

  .popup-title :global(iconify-icon) {
    color: #4f46e5;
  }

  .popup-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .action-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.12s;
  }

  .action-icon:hover {
    background: #f1f5f9;
    color: #64748b;
  }

  /* ===== Messages ===== */
  .msgs {
    padding: 16px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f8fafc;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 16px 20px;
  }

  .empty-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(79, 70, 229, 0.08);
    display: grid;
    place-items: center;
    color: #4f46e5;
  }

  .empty-title {
    font-size: 15px;
    font-weight: 900;
    color: #0f172a;
  }

  .empty-text {
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
  }

  /* ===== Message bubbles ===== */
  .msg {
    display: flex;
    gap: 8px;
    max-width: 100%;
  }

  .msg.user {
    flex-direction: row-reverse;
  }

  .msg-avatar {
    width: 26px;
    height: 26px;
    border-radius: 8px;
    background: rgba(79, 70, 229, 0.08);
    display: grid;
    place-items: center;
    color: #4f46e5;
    flex: 0 0 auto;
    margin-top: 2px;
  }

  .msg-body {
    max-width: 82%;
    min-width: 0;
  }

  .bubble {
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.5;
    word-break: break-word;
  }

  .msg.user .bubble {
    background: #4f46e5;
    color: #fff;
    border-bottom-right-radius: 4px;
  }

  .msg.assistant .bubble {
    background: #fff;
    color: #0f172a;
    border: 1px solid #e2e8f0;
    border-bottom-left-radius: 4px;
  }

  /* Markdown inside assistant bubble */
  .msg.assistant .bubble :global(p) {
    margin: 0 0 6px;
  }

  .msg.assistant .bubble :global(p:last-child) {
    margin-bottom: 0;
  }

  .msg.assistant .bubble :global(ul),
  .msg.assistant .bubble :global(ol) {
    margin: 4px 0;
    padding-left: 18px;
  }

  .msg.assistant .bubble :global(li) {
    margin-bottom: 2px;
  }

  .msg.assistant .bubble :global(a) {
    color: #4f46e5;
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: rgba(79, 70, 229, 0.3);
  }

  .msg.assistant .bubble :global(a:hover) {
    text-decoration-color: #4f46e5;
  }

  .msg.assistant .bubble :global(strong) {
    font-weight: 800;
  }

  .msg.assistant .bubble :global(code) {
    background: #f1f5f9;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: 12px;
  }

  .time {
    font-size: 10px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 4px;
    padding: 0 4px;
  }

  .msg.user .time {
    text-align: right;
  }

  /* ===== Typing indicator ===== */
  .typing {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 12px 16px !important;
  }

  .dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
    animation: dotPulse 1.2s ease-in-out infinite;
  }

  .dot:nth-child(2) { animation-delay: 0.15s; }
  .dot:nth-child(3) { animation-delay: 0.3s; }

  @keyframes dotPulse {
    0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
    30% { opacity: 1; transform: scale(1); }
  }

  /* ===== Input area ===== */
  .input-area {
    padding: 12px;
    display: flex;
    gap: 8px;
    border-top: 1px solid #e2e8f0;
    background: #fff;
  }

  textarea {
    flex: 1;
    resize: none;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    color: #0f172a;
    outline: none;
    min-height: 40px;
    max-height: 100px;
    background: #fff;
    transition: border-color 0.15s;
  }

  textarea::placeholder {
    color: #cbd5e1;
    font-weight: 600;
  }

  textarea:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.06);
  }

  .send-btn {
    width: 40px;
    height: 40px;
    flex: 0 0 auto;
    border: none;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }

  .send-btn:hover:not(:disabled) {
    background: #4338ca;
    transform: translateY(-1px);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ===== Suggestion cards ===== */
  .suggestions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-left: 34px;
  }

  .suggestion-card {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: opacity 0.2s;
  }

  .suggestion-card.applied {
    opacity: 0.55;
  }

  .sug-header {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #15803d;
  }

  .sug-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .sug-value {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    line-height: 1.4;
    word-break: break-word;
  }

  .sug-apply {
    align-self: flex-end;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    background: #10b981;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 4px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: all 0.15s;
  }

  .sug-apply:hover {
    background: #059669;
    transform: translateY(-1px);
  }

  .sug-done {
    align-self: flex-end;
    font-size: 11px;
    font-weight: 700;
    color: #10b981;
    display: flex;
    align-items: center;
    gap: 3px;
  }

  /* ===== Responsive ===== */
  @media (max-width: 520px) {
    .popup {
      right: 8px !important;
      left: 8px;
      bottom: 72px;
      width: auto;
      max-width: none;
      height: min(560px, 75vh);
    }

    .fab {
      right: 12px !important;
      bottom: 12px !important;
      padding: 10px 14px;
    }

    .fab-text {
      display: none;
    }
  }
</style>
