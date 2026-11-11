<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { goto } from "$app/navigation";
  import { t } from "$lib/i18n";
  import { onlineStatus } from "$lib/utils/onlineStatus";
  import { photoSrc } from "$lib/utils/photo";
  import { formatDate, formatTime, getDateLocale } from "$lib/utils/dateLocale";
  import TransferMessage from "./chat/TransferMessage.svelte";

  export let chatId: string | null = null;

  type ChatTab = "dm" | "event";
  let activeTab: ChatTab = "dm";

  let chats: any[] = [];
  let selectedChat: any = null;
  let isMobile = false;
  let fileInput: HTMLInputElement;

  let messages: any[] = [];
  let lastTimestamp: string | null = null;
  let inputText = "";
  let status = "";
  let searchQuery = "";

  let messagesContainer: HTMLDivElement;

  let isInitialLoad = false;
  let pollingTimer: any = null;
  let chatsInterval: any = null;
  let messagesLoading = false;
  let sending = false;
  let msgAbortCtrl: AbortController | null = null;

  let userScrolledUp = false;
  let forceScrollToBottom = false;

  let selectedFile: File | null = null;
  let pendingMessage: { type: string; fileName?: string; previewUrl?: string } | null = null;

  // ---------- helpers: type guards ----------
  function isEventChat(chat: any) {
    return !!chat?.event;
  }

  // derived lists for tabs
  $: dmChats = chats.filter((c) => !isEventChat(c));
  $: eventChats = chats.filter((c) => isEventChat(c));
  $: visibleChats = (activeTab === "dm" ? dmChats : eventChats).filter((c) => {
    if (!searchQuery.trim()) return true;
    const title = getChatTitle(c).toLowerCase();
    return title.includes(searchQuery.trim().toLowerCase());
  });

  // ---------- upload ----------
  function handleFile(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    selectedFile = file;
  }

  function autoResize(e: any) {
    const el = e.target as HTMLTextAreaElement;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }

  // ---------- scroll ----------
  function scrollToBottom() {
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  function scrollToBottomSmooth() {
    if (!messagesContainer) return;
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }

  function handleScroll() {
    if (!messagesContainer) return;

    const threshold = 40;
    const distanceFromBottom =
      messagesContainer.scrollHeight -
      messagesContainer.scrollTop -
      messagesContainer.clientHeight;

    userScrolledUp = distanceFromBottom > threshold;
  }

  // ---------- navigation ----------
  // Update URL without SvelteKit navigation to prevent component remount
  function chatNav(path: string, replace = false) {
    const lang = window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en';
    const url = `/${lang}${path}`;
    if (replace) history.replaceState({}, '', url);
    else history.pushState({}, '', url);
  }

  function openMember(userId: string) {
    goto(`/members/${userId}`);
  }

  // ---------- message content helpers ----------
  function isImage(msg: any) {
    if (typeof msg.content !== "string") return false;
    const ext = msg.content.toLowerCase().split(".").pop();
    return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "");
  }

  function isFile(msg: any) {
    if (typeof msg.content !== "string") return false;
    if (!msg.content.startsWith("/uploads/")) return false;
    if (isImage(msg)) return false;
    return true;
  }

  // ---------- avatars + titles ----------
  function getUserAvatar(user: any, width = 80) {
    const src = photoSrc(user?.info?.photo ?? null, width);
    if (src) return src;

    const name = user?.info?.name || user?.email || "User";
    return "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(name);
  }

  function getEventAvatar(event: any, width = 100) {
    const src = photoSrc(event?.photo ?? null, width);
    if (src) return src;

    const title = event?.title || "Event";
    return "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(title);
  }

  function getMessageAvatar(msg: any) {
    return getUserAvatar(msg?.sender, 64);
  }

  function getChatTitle(chat: any) {
    if (chat?.event?.title) return chat.event.title;
    if (chat?.otherUser?.info?.name) return chat.otherUser.info.name;
    if (chat?.otherUser?.email) return chat.otherUser.email;
    return "Chat";
  }

  function getChatPreview(chat: any) {
    return chat?.lastMessage || t.get('chat.noMessagesYet');
  }

  function getChatAvatar(chat: any) {
    if (chat?.event) return getEventAvatar(chat.event);
    if (chat?.otherUser) return getUserAvatar(chat.otherUser);
    return "https://api.dicebear.com/7.x/initials/svg?seed=Chat";
  }

  function formatChatTime(chat: any) {
    if (!chat?.lastMessageCreatedAt) return "";
    const d = new Date(chat.lastMessageCreatedAt);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const loc = getDateLocale();

    if (days === 0) {
      return d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return t.get('chat.yesterday');
    } else if (days < 7) {
      return d.toLocaleDateString(loc, { weekday: "short" });
    }
    return d.toLocaleDateString(loc, { day: "2-digit", month: "short" });
  }

  // ---------- data loading ----------
  async function loadChats() {
    const res = await fetch("/api/chat");
    if (!res.ok) return;

    const data = await res.json();
    const newChats = data.chats || [];
    // Update in place to preserve references (prevents DOM teardown)
    const chatMap = new Map(chats.map((c: any) => [c.id, c]));
    chats = newChats.map((nc: any) => {
      const existing = chatMap.get(nc.id);
      // Only replace if something actually changed
      if (
        existing &&
        existing.lastMessageCreatedAt === nc.lastMessageCreatedAt &&
        existing.unreadCount === nc.unreadCount
      ) {
        return existing; // keep same reference → Svelte won't re-render
      }
      return nc;
    });
  }

  async function openChat(chat: any) {
    chatNav(`/chat/${chat.id}`);

    selectedChat = chat;

    msgAbortCtrl?.abort();
    msgAbortCtrl = null;
    if (pollingTimer) clearTimeout(pollingTimer);

    messages = [];
    lastTimestamp = null;
    isInitialLoad = true;
    messagesLoading = true;
    userScrolledUp = false;
    forceScrollToBottom = false;

    await tick();
    loadMessages();

    setTimeout(loadChats, 200);
  }

  async function loadMessages() {
    if (!selectedChat) return;

    // Abort any in-flight poll — prevents concurrent fetches piling up
    msgAbortCtrl?.abort();
    msgAbortCtrl = new AbortController();

    if (pollingTimer) { clearTimeout(pollingTimer); pollingTimer = null; }

    const thisChatId = selectedChat.id;

    let url = `/api/chat/${selectedChat.id}/messages`;
    if (lastTimestamp) url += `?after=${lastTimestamp}`;

    try {
      const res = await fetch(url, { signal: msgAbortCtrl.signal });
      if (!res.ok) {
        pollingTimer = setTimeout(loadMessages, 2000);
        return;
      }

      // Guard: if the user switched chats while we were fetching, discard stale response
      if (selectedChat?.id !== thisChatId) return;

      const data = await res.json();

      if (data.messages?.length > 0) {
        messages = [...messages, ...data.messages];
        lastTimestamp = data.messages[data.messages.length - 1].createdAt;

        fetch(`/api/chat/${selectedChat.id}/read`, { method: "POST" });
      }

      await tick();

      if (isInitialLoad) {
        messagesLoading = false;
        scrollToBottom();
        requestAnimationFrame(scrollToBottom);
        isInitialLoad = false;
        forceScrollToBottom = false;
      } else if (forceScrollToBottom) {
        scrollToBottomSmooth();
        forceScrollToBottom = false;
      } else {
        if (!userScrolledUp) {
          scrollToBottomSmooth();
        }
      }

      pollingTimer = setTimeout(loadMessages, 2000);
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // intentionally cancelled, don't reschedule
      pollingTimer = setTimeout(loadMessages, 2000);
    }
  }

  async function sendMessage(content: string) {
    if (sending) return;
    if ((!content.trim() && !selectedFile) || !selectedChat) return;

    sending = true;

    const chatIdLocal = selectedChat.id;

    const form = new FormData();
    if (content.trim()) form.append("content", content);
    if (selectedFile) {
      const ext = (selectedFile.name.split('.').pop() ?? '').toLowerCase();
      const isImg = ['png','jpg','jpeg','gif','webp'].includes(ext);
      pendingMessage = {
        type: isImg ? 'image' : 'file',
        fileName: selectedFile.name,
        previewUrl: isImg ? URL.createObjectURL(selectedFile) : undefined
      };
      form.append("file", selectedFile);
    }

    inputText = "";
    selectedFile = null;
    if (fileInput) fileInput.value = "";

    await tick();
    scrollToBottom();

    try {
      await fetch(`/api/chat/${chatIdLocal}/send`, {
        method: "POST",
        body: form,
      });
    } finally {
      if (pendingMessage?.previewUrl) URL.revokeObjectURL(pendingMessage.previewUrl);
      pendingMessage = null;
      sending = false;
    }

    await tick();

    const textarea = document.querySelector(
      ".input-area textarea"
    ) as HTMLTextAreaElement;
    if (textarea) textarea.style.height = "36px";

    if (!selectedChat || selectedChat.id !== chatIdLocal) return;

    userScrolledUp = false;
    forceScrollToBottom = true;

    loadMessages();
  }

  function submit() {
    sendMessage(inputText);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function goBack() {
    selectedChat = null;
    chatNav('/chat', true);
  }

  // ---------- date separators ----------
  function getDateLabel(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return t.get('chat.today');
    if (days === 1) return t.get('chat.yesterday');
    return d.toLocaleDateString(getDateLocale(), { day: "2-digit", month: "long", year: "numeric" });
  }

  function shouldShowDate(index: number) {
    if (index === 0) return true;
    const curr = new Date(messages[index].createdAt).toDateString();
    const prev = new Date(messages[index - 1].createdAt).toDateString();
    return curr !== prev;
  }

  // ---------- message grouping (Telegram-style) ----------
  function isSameSender(a: any, b: any): boolean {
    if (!a || !b) return false;
    if (a.type === 'transfer' || b.type === 'transfer') return false;
    if (a.isMine && b.isMine) return true;
    return a.sender?.id && b.sender?.id && a.sender.id === b.sender.id;
  }

  function isFirstInGroup(i: number): boolean {
    if (i === 0) return true;
    if (shouldShowDate(i)) return true;
    return !isSameSender(messages[i], messages[i - 1]);
  }

  function isLastInGroup(i: number): boolean {
    if (i === messages.length - 1) return true;
    if (i + 1 < messages.length && shouldShowDate(i + 1)) return true;
    return !isSameSender(messages[i], messages[i + 1]);
  }

  // ---------- reactive status (replaces statusInterval) ----------
  $: if (selectedChat && !isEventChat(selectedChat)) {
    status = onlineStatus(selectedChat.otherUser?.lastOnline);
  } else {
    status = "";
  }

  // ---------- mount ----------
  onMount(() => {
    const updateMobile = () => (isMobile = window.innerWidth < 768);
    updateMobile();
    window.addEventListener("resize", updateMobile);

    (async () => {
      await loadChats();

      if (chatId) {
        const target = chats.find((c) => c.id == chatId);
        if (target) {
          activeTab = isEventChat(target) ? "event" : "dm";
          await openChat(target);
          return;
        }
      }

      activeTab = "dm";
    })();

    // Refresh chat list every 15 seconds (separate from message polling)
    chatsInterval = setInterval(loadChats, 15000);

    return () => {
      window.removeEventListener("resize", updateMobile);
    };
  });

  onDestroy(() => {
    msgAbortCtrl?.abort();
    if (pollingTimer) clearTimeout(pollingTimer);
    if (chatsInterval) clearInterval(chatsInterval);
  });
</script>

<div class="chat-page">
  <div class="chat-container">
    <!-- LEFT SIDEBAR -->
    <aside class="sidebar" class:hidden={isMobile && selectedChat}>
      <div class="sidebar-header">
        <h2 class="sidebar-title">{$t('chat.messages')}</h2>
      </div>

      <div class="sidebar-tabs">
        <button
          class="tab-btn"
          class:active={activeTab === "dm"}
          on:click={() => (activeTab = "dm")}
        >
          <iconify-icon icon="lucide:message-circle" width="16"></iconify-icon>
          {$t('chat.tabs.dm')}
        </button>

        <button
          class="tab-btn"
          class:active={activeTab === "event"}
          on:click={() => (activeTab = "event")}
        >
          <iconify-icon icon="lucide:calendar-days" width="16"></iconify-icon>
          {$t('chat.tabs.event')}
        </button>
      </div>

      <div class="search-box">
        <iconify-icon icon="lucide:search" width="16"></iconify-icon>
        <input
          placeholder={$t('chat.search')}
          bind:value={searchQuery}
        />
      </div>

      <div class="chat-list">
        {#each visibleChats as chat (chat.id)}
          <button
            class="chat-item"
            class:active={selectedChat?.id === chat.id}
            on:click={() => openChat(chat)}
          >
            <div class="chat-item-avatar">
              <img src={getChatAvatar(chat)} alt="avatar" loading="lazy" decoding="async" />
              {#if !isEventChat(chat) && chat.otherUser?.lastOnline}
                {@const isOnline = (Date.now() - new Date(chat.otherUser.lastOnline).getTime()) < 120000}
                {#if isOnline}
                  <span class="online-dot"></span>
                {/if}
              {/if}
            </div>

            <div class="chat-item-body">
              <div class="chat-item-top">
                <span class="chat-item-name">{getChatTitle(chat)}</span>
                <span class="chat-item-time">{formatChatTime(chat)}</span>
              </div>

              {#if chat.event?.date}
                <div class="chat-item-meta">
                  <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                  {formatDate(chat.event.date, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              {/if}

              <div class="chat-item-preview">{getChatPreview(chat)}</div>
            </div>

            {#if chat.unreadCount > 0}
              <span class="unread-badge">{chat.unreadCount}</span>
            {/if}
          </button>
        {/each}

        {#if visibleChats.length === 0}
          <div class="empty-state">
            <iconify-icon icon="lucide:message-square-off" width="32"></iconify-icon>
            <span>{activeTab === "dm" ? $t('chat.noPersonalChats') : $t('chat.noEventChats')}</span>
          </div>
        {/if}
      </div>
    </aside>

    <!-- RIGHT: CHAT VIEW -->
    <main class="chat-main" class:hidden={isMobile && !selectedChat}>
      {#if selectedChat}
        <!-- Chat Header -->
        <div class="chat-header">
          {#if isMobile}
            <button class="back-btn" on:click={goBack}>
              <iconify-icon icon="lucide:arrow-left" width="20"></iconify-icon>
            </button>
          {/if}

          <div class="header-avatar">
            <img src={getChatAvatar(selectedChat)} alt="Avatar" />
          </div>

          <div class="header-info">
            <div class="header-name">{getChatTitle(selectedChat)}</div>
            {#if selectedChat.event?.date}
              <div class="header-status">
                <iconify-icon icon="lucide:calendar" width="12"></iconify-icon>
                {formatDate(selectedChat.event.date, {
                  weekday: "short",
                  day: "2-digit",
                  month: "short",
                })}
              </div>
            {:else if status}
              <div class="header-status {status.toLowerCase().includes('онлайн') && !status.toLowerCase().includes('был') ? 'online' : ''}">
                {status}
              </div>
            {/if}
          </div>

          {#if !isEventChat(selectedChat) && selectedChat?.otherUser?.id}
            <button class="header-action" on:click={() => openMember(selectedChat.otherUser.id)}>
              <iconify-icon icon="lucide:user" width="18"></iconify-icon>
            </button>
          {/if}
        </div>

        <!-- Messages Area -->
        <div
          class="messages-area"
          bind:this={messagesContainer}
          on:scroll={handleScroll}
        >
          {#if messagesLoading}
            <div class="loading-state">
              <div class="spinner"></div>
              <span>{$t('chat.loadingMessages')}</span>
            </div>
          {/if}

          {#each messages as msg, i (msg.id)}
            {#if shouldShowDate(i)}
              <div class="date-separator">
                <span>{getDateLabel(msg.createdAt)}</span>
              </div>
            {/if}

            {#if msg.type === "transfer"}
              <TransferMessage {msg} />
            {:else}
              <div class="msg-row {msg.isMine ? 'mine' : 'their'}" class:grouped={!isFirstInGroup(i)} class:last-in-group={isLastInGroup(i)}>
                {#if !msg.isMine}
                  {#if isLastInGroup(i)}
                    <img
                      class="msg-avatar"
                      src={getMessageAvatar(msg)}
                      alt="avatar"
                      on:click={() => openMember(msg.sender.id)}
                    />
                  {:else}
                    <div class="msg-avatar-spacer"></div>
                  {/if}
                {/if}

                <div class="msg-bubble">
                  {#if !msg.isMine && msg.sender?.info?.name && isFirstInGroup(i)}
                    <div
                      class="msg-sender"
                      on:click={() => openMember(msg.sender.id)}
                    >
                      {msg.sender.info.name}
                    </div>
                  {/if}

                  {#if isImage(msg)}
                    <div class="img-wrapper">
                      <img
                        src={photoSrc(msg.content) || msg.content}
                        alt="image"
                        class="msg-image"
                      />
                      <a href={msg.content} download class="download-link">
                        <iconify-icon icon="lucide:download" width="12"></iconify-icon>
                        {$t('chat.download')}
                      </a>
                    </div>
                  {:else if isFile(msg)}
                    <a class="msg-file" href={msg.content} download>
                      <iconify-icon icon="lucide:file" width="18"></iconify-icon>
                      <span>{msg.content.split("/").pop()}</span>
                    </a>
                  {:else}
                    <span class="msg-text">{msg.content}</span>
                  {/if}

                  <div class="msg-time">
                    {formatTime(msg.createdAt, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {#if msg.isMine}
                  {#if isLastInGroup(i)}
                    <img
                      class="msg-avatar mine"
                      src={getMessageAvatar(msg)}
                      alt="avatar"
                    />
                  {:else}
                    <div class="msg-avatar-spacer"></div>
                  {/if}
                {/if}
              </div>
            {/if}
          {/each}

          {#if pendingMessage}
            <div class="msg-row mine last-in-group">
              <div class="msg-bubble">
                {#if pendingMessage.type === 'image' && pendingMessage.previewUrl}
                  <div class="img-wrapper upload-pending">
                    <img src={pendingMessage.previewUrl} alt="uploading" class="msg-image" />
                    <div class="upload-overlay">
                      <div class="spinner-small"></div>
                    </div>
                  </div>
                {:else}
                  <div class="pending-file">
                    <div class="spinner-small"></div>
                    <span>{pendingMessage.fileName}</span>
                  </div>
                {/if}
                <div class="msg-time">{$t('chat.sending')}</div>
              </div>
            </div>
          {/if}
        </div>

        <!-- Input Area -->
        {#if selectedFile}
          <div class="file-chip">
            <iconify-icon icon="lucide:paperclip" width="14"></iconify-icon>
            <span class="file-name">{selectedFile.name}</span>
            <button class="file-remove" on:click={() => (selectedFile = null)}>
              <iconify-icon icon="lucide:x" width="14"></iconify-icon>
            </button>
          </div>
        {/if}

        <div class="input-area">
          <input
            type="file"
            bind:this={fileInput}
            on:change={handleFile}
            style="display:none;"
          />

          <button class="input-btn attach" on:click={() => fileInput?.click()}>
            <iconify-icon icon="lucide:paperclip" width="18"></iconify-icon>
          </button>

          <textarea
            bind:value={inputText}
            rows="1"
            placeholder={$t('chat.typeMessage')}
            on:input={autoResize}
            on:keydown={handleKeydown}
          />

          <button class="input-btn send" on:click={submit} disabled={sending || (!inputText.trim() && !selectedFile)}>
            <iconify-icon icon="lucide:send" width="18"></iconify-icon>
          </button>
        </div>
      {:else}
        <!-- No chat selected placeholder -->
        <div class="placeholder">
          <div class="placeholder-icon">
            <iconify-icon icon="lucide:messages-square" width="48"></iconify-icon>
          </div>
          <div class="placeholder-title">{$t('chat.selectChat')}</div>
          <div class="placeholder-text">{$t('chat.selectChatHint')}</div>
        </div>
      {/if}
    </main>
  </div>
</div>

<style>
  /* ===== Page Container ===== */
  .chat-page {
    position: absolute;
    inset: 0;
    background: #f8fafc;
    display: flex;
    align-items: stretch;
  }

  .chat-container {
    display: flex;
    width: 100%;
    height: 100%;
    background: #fff;
    overflow: hidden;
  }

  /* ===== Sidebar ===== */
  .sidebar {
    width: 340px;
    flex: 0 0 340px;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e2e8f0;
    background: #fff;
    height: 100%;
    min-height: 0;
  }

  .sidebar.hidden {
    display: none;
  }

  .sidebar-header {
    padding: 18px 20px 0;
  }

  .sidebar-title {
    margin: 0;
    font-size: 22px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  /* Tabs */
  .sidebar-tabs {
    display: flex;
    gap: 6px;
    padding: 14px 20px 0;
  }

  .tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .tab-btn:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .tab-btn.active {
    background: #eef2ff;
    border-color: rgba(79, 70, 229, 0.3);
    color: #4f46e5;
  }

  /* Search */
  .search-box {
    margin: 12px 20px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0 12px;
    height: 38px;
    color: #94a3b8;
    transition: border-color 0.15s;
  }

  .search-box:focus-within {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.08);
  }

  .search-box input {
    border: none;
    outline: none;
    background: transparent;
    flex: 1;
    font-weight: 600;
    font-size: 13px;
    color: #0f172a;
    min-width: 0;
  }

  .search-box input::placeholder {
    color: #94a3b8;
  }

  /* Chat List */
  .chat-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 10px;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .chat-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 10px;
    border-radius: 12px;
    cursor: pointer;
    border: 1px solid transparent;
    background: transparent;
    text-align: left;
    transition: all 0.15s ease;
    position: relative;
  }

  .chat-item:hover {
    background: #f8fafc;
  }

  .chat-item.active {
    background: #eef2ff;
    border-color: rgba(79, 70, 229, 0.15);
  }

  .chat-item-avatar {
    position: relative;
    flex: 0 0 auto;
  }

  .chat-item-avatar img {
    width: 46px;
    height: 46px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid #f1f5f9;
  }

  .online-dot {
    position: absolute;
    bottom: 1px;
    right: 1px;
    width: 12px;
    height: 12px;
    background: #10b981;
    border: 2px solid #fff;
    border-radius: 999px;
  }

  .chat-item-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .chat-item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .chat-item-name {
    font-weight: 800;
    font-size: 14px;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-item-time {
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    flex: 0 0 auto;
  }

  .chat-item-meta {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: #94a3b8;
    font-weight: 600;
  }

  .chat-item-preview {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .unread-badge {
    background: #4f46e5;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 40px 20px;
    color: #94a3b8;
    font-weight: 600;
    font-size: 13px;
  }

  /* ===== Chat Main Area ===== */
  .chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 0;
    background: #fafbfc;
  }

  .chat-main.hidden {
    display: none;
  }

  /* Chat Header */
  .chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    flex: 0 0 auto;
  }

  .back-btn {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: #0f172a;
    transition: all 0.15s;
    flex: 0 0 auto;
  }

  .back-btn:hover {
    background: #eef2ff;
    border-color: rgba(79, 70, 229, 0.2);
  }

  .header-avatar img {
    width: 40px;
    height: 40px;
    border-radius: 999px;
    object-fit: cover;
    border: 2px solid #f1f5f9;
  }

  .header-info {
    flex: 1;
    min-width: 0;
  }

  .header-name {
    font-size: 15px;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-status {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 1px;
  }

  .header-status.online {
    color: #10b981;
  }

  .header-action {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    cursor: pointer;
    display: grid;
    place-items: center;
    color: #64748b;
    transition: all 0.15s;
    flex: 0 0 auto;
  }

  .header-action:hover {
    background: #eef2ff;
    border-color: rgba(79, 70, 229, 0.2);
    color: #4f46e5;
  }

  /* Messages Area */
  .messages-area {
    flex: 1;
    padding: 16px 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }

  .date-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 0;
  }

  .date-separator span {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    padding: 4px 14px;
    font-size: 11px;
    font-weight: 700;
    color: #64748b;
  }

  /* Message Row */
  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    margin: 2px 0;
    max-width: 100%;
  }

  .msg-row.mine {
    flex-direction: row-reverse;
  }

  .msg-avatar {
    width: 28px;
    height: 28px;
    border-radius: 999px;
    object-fit: cover;
    flex: 0 0 auto;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    border: 1px solid #e2e8f0;
  }

  .msg-avatar:not(.mine):hover {
    transform: scale(1.08);
    box-shadow: 0 0 0 2px #c7d2fe;
  }

  .msg-avatar.mine {
    cursor: default;
  }

  .msg-avatar-spacer {
    width: 28px;
    flex: 0 0 28px;
  }

  /* Grouped messages: tighter spacing */
  .msg-row.grouped {
    margin-top: 1px;
  }

  /* Grouped: inner corners become small for connected look */
  .msg-row.their.grouped .msg-bubble {
    border-top-left-radius: 4px;
  }

  .msg-row.mine.grouped .msg-bubble {
    border-top-right-radius: 4px;
  }

  /* Message Bubble */
  .msg-bubble {
    position: relative;
    display: inline-flex;
    flex-direction: column;
    min-width: 80px;
    max-width: 420px;
    padding: 8px 12px 22px;
    border-radius: 14px;
    font-size: 14px;
    line-height: 1.45;
    word-wrap: break-word;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .msg-row.their .msg-bubble {
    background: #fff;
    border: 1px solid #e2e8f0;
    color: #0f172a;
  }

  .msg-row.their.last-in-group .msg-bubble {
    border-bottom-left-radius: 4px;
  }

  .msg-row.mine .msg-bubble {
    background: #4f46e5;
    border: 1px solid #4338ca;
    color: #fff;
  }

  .msg-row.mine.last-in-group .msg-bubble {
    border-bottom-right-radius: 4px;
  }

  .msg-sender {
    font-size: 12px;
    font-weight: 700;
    color: #4f46e5;
    margin-bottom: 2px;
    cursor: pointer;
  }

  .msg-sender:hover {
    text-decoration: underline;
  }

  .msg-text {
    font-weight: 500;
  }

  .msg-time {
    position: absolute;
    bottom: 4px;
    right: 10px;
    font-size: 10px;
    font-weight: 600;
    opacity: 0.5;
  }

  /* Image message */
  .img-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .msg-image {
    max-width: 260px;
    border-radius: 10px;
    object-fit: cover;
  }

  .download-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    text-decoration: none;
    color: inherit;
    opacity: 0.7;
    transition: opacity 0.15s;
  }

  .download-link:hover {
    opacity: 1;
    text-decoration: underline;
  }

  /* File message */
  .msg-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    text-decoration: none;
    color: inherit;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.15s;
  }

  .msg-file:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  /* Upload pending indicator */
  .upload-pending {
    position: relative;
  }

  .upload-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 10px;
  }

  .spinner-small {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 999px;
    animation: spin 0.6s linear infinite;
  }

  .pending-file {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    font-size: 13px;
    font-weight: 600;
  }

  /* File Chip */
  .file-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    margin: 0 20px;
    background: #eef2ff;
    border: 1px solid rgba(79, 70, 229, 0.15);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #4f46e5;
    flex: 0 0 auto;
  }

  .file-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-remove {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: none;
    background: rgba(79, 70, 229, 0.1);
    cursor: pointer;
    display: grid;
    place-items: center;
    color: #4f46e5;
    transition: background 0.15s;
    flex: 0 0 auto;
  }

  .file-remove:hover {
    background: rgba(79, 70, 229, 0.2);
  }

  /* Input Area */
  .input-area {
    display: flex;
    align-items: flex-end;
    gap: 8px;
    padding: 12px 20px;
    background: #fff;
    border-top: 1px solid #e2e8f0;
    flex: 0 0 auto;
  }

  .input-area textarea {
    flex: 1;
    padding: 8px 14px;
    font-size: 14px;
    font-weight: 500;
    min-height: 36px;
    max-height: 120px;
    resize: none;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    line-height: 1.4;
    overflow-y: auto;
    transition: border-color 0.15s, box-shadow 0.15s;
    font-family: inherit;
  }

  .input-area textarea:focus {
    border-color: #4f46e5;
    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.08);
    outline: none;
    background: #fff;
  }

  .input-area textarea::placeholder {
    color: #94a3b8;
  }

  .input-btn {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #64748b;
    cursor: pointer;
    transition: all 0.15s;
    flex: 0 0 auto;
  }

  .input-btn:hover {
    background: #eef2ff;
    border-color: rgba(79, 70, 229, 0.2);
    color: #4f46e5;
  }

  .input-btn.send {
    background: #4f46e5;
    border-color: #4338ca;
    color: #fff;
  }

  .input-btn.send:hover {
    background: #4338ca;
  }

  .input-btn.send:disabled {
    background: #e2e8f0;
    border-color: #e2e8f0;
    color: #94a3b8;
    cursor: not-allowed;
  }

  .input-btn:active {
    transform: scale(0.95);
  }

  /* Placeholder */
  .placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px;
  }

  .placeholder-icon {
    width: 80px;
    height: 80px;
    border-radius: 20px;
    background: #eef2ff;
    display: grid;
    place-items: center;
    color: #4f46e5;
  }

  .placeholder-title {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
  }

  .placeholder-text {
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
  }

  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 40px 20px;
    flex: 1;
    color: #94a3b8;
    font-weight: 600;
    font-size: 13px;
  }

  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid #e2e8f0;
    border-top-color: #4f46e5;
    border-radius: 999px;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* ===== Responsive: Mobile ===== */
  @media (max-width: 768px) {
    .chat-page {
      position: absolute;
      inset: 0;
    }

    .chat-container {
      max-width: 100%;
      border: none;
    }

    .sidebar {
      width: 100%;
      flex: 1;
      border-right: none;
    }

    .chat-main {
      position: absolute;
      inset: 0;
      z-index: 10;
      background: #fafbfc;
    }

    .chat-main.hidden {
      display: none;
    }

    .messages-area {
      padding: 12px 14px;
    }

    .input-area {
      padding: 10px 14px;
    }

    .msg-bubble {
      max-width: 80%;
    }

    .file-chip {
      margin: 0 14px;
    }
  }

  /* ===== Scrollbar ===== */
  .chat-list::-webkit-scrollbar,
  .messages-area::-webkit-scrollbar {
    width: 4px;
  }

  .chat-list::-webkit-scrollbar-track,
  .messages-area::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-list::-webkit-scrollbar-thumb,
  .messages-area::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 999px;
  }

  .chat-list::-webkit-scrollbar-thumb:hover,
  .messages-area::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
</style>
