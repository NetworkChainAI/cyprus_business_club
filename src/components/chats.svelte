<script lang="ts">
  import { onMount, tick } from "svelte";
  import { t } from "$lib/i18n";
  import { goto } from "$app/navigation";

export let chatId: string | null = null;

  let chats: any[] = [];
  let selectedChat: any = null;

  let messages: any[] = [];
  let lastTimestamp: string | null = null;
  let inputText = "";

  let messagesContainer: HTMLDivElement;

  // Первый рендер сообщений (открытие чата)
  let isInitialLoad = false;

  // Таймер поллинга
  let pollingTimer: any = null;

  // Пользователь листает вверх → не автоскроллить входящие сообщения
  let userScrolledUp = false;

  // Нужно ли принудительно проскроллить вниз (например, после отправки своего сообщения)
  let forceScrollToBottom = false;

  // ======================================================================
  // Контроль скролла
  // ======================================================================
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

    const threshold = 40; // расстояние от низа
    const distanceFromBottom =
      messagesContainer.scrollHeight -
      messagesContainer.scrollTop -
      messagesContainer.clientHeight;

    // true, если мы УШЛИ от низа больше чем на threshold
    userScrolledUp = distanceFromBottom > threshold;
  }

  // ======================================================================
  // Загрузка списка чатов
  // ======================================================================
  async function loadChats() {
    const res = await fetch("/api/chat");
    if (!res.ok) return;

    const data = await res.json();
    chats = data.chats || [];
  }

async function openChat(chat: any) {
  // Обновляем URL
  goto(`/chat/${chat.id}`, { replaceState: false });

  selectedChat = chat;

  if (pollingTimer) clearTimeout(pollingTimer);

  messages = [];
  lastTimestamp = null;
  isInitialLoad = true;
  userScrolledUp = false;
  forceScrollToBottom = false;

  await tick();
  loadMessages();

  setTimeout(loadChats, 200);
}


  // ======================================================================
  // Загрузка сообщений
  // ======================================================================
  async function loadMessages() {
    if (!selectedChat) return;

    // на всякий случай сбиваем старый таймер, чтобы не плодить их
    if (pollingTimer) clearTimeout(pollingTimer);

    let url = `/api/chat/${selectedChat.id}/messages`;
    if (lastTimestamp) url += `?after=${lastTimestamp}`;

    const res = await fetch(url);
    if (!res.ok) {
      pollingTimer = setTimeout(loadMessages, 1000);
      return;
    }

    const data = await res.json();

    if (data.messages.length > 0) {
      messages = [...messages, ...data.messages];
      lastTimestamp = data.messages[data.messages.length - 1].createdAt;

      // помечаем прочитанными
      fetch(`/api/chat/${selectedChat.id}/read`, { method: "POST" });
    }

    await tick();

    // ============================================================
    // СКРОЛЛ-ЛОГИКА
    // ============================================================
    if (isInitialLoad) {
      // первое открытие чата — всегда в самый низ
      scrollToBottom();
      requestAnimationFrame(scrollToBottom);
      isInitialLoad = false;
      forceScrollToBottom = false;
    } else if (forceScrollToBottom) {
      // отправили СВОЁ сообщение — жёстко вниз
      scrollToBottomSmooth();
      forceScrollToBottom = false;
    } else {
      // входящие сообщения: только если пользователь у низа
      if (!userScrolledUp) {
        scrollToBottomSmooth();
      }
    }

    loadChats();

    // поллинг
    pollingTimer = setTimeout(loadMessages, 1000);
  }

  // ======================================================================
  // Отправка сообщения
  // ======================================================================
  async function sendMessage(content: string) {
    if (!content.trim() || !selectedChat) return;

    const chatId = selectedChat.id;

    await fetch(`/api/chat/${chatId}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    inputText = "";
    await tick();

    // если всё ещё в этом чате
    if (!selectedChat || selectedChat.id !== chatId) return;

    // хотим уйти вниз, даже если до этого крутили вверх
    userScrolledUp = false;
    forceScrollToBottom = true;

    // сразу дергаем загрузку новых сообщений, не ждём поллинг
    loadMessages();
  }

  function submit() {
    sendMessage(inputText);
  }

onMount(async () => {
  await loadChats();

  if (chatId) {
    const target = chats.find((c) => c.id == chatId);
    if (target) {
      openChat(target);
    }
  }
});

</script>

<div class="chat-wrapper">
  <!-- LEFT SIDEBAR -->
  <aside class="sidebar">
    <h3 class="sidebar-title">{$t('chat.messages')}</h3>

    <div class="chat-list">
      {#each chats as chat}
        <div
          class="chat-list-item {selectedChat?.id === chat.id ? 'active' : ''}"
          on:click={() => openChat(chat)}
        >
          <div class="chat-info">
            <div class="chat-name">
              {chat.otherUser?.info?.name || chat.otherUser?.email}
            </div>
            <div class="chat-preview">
              {chat.lastMessage || $t('chat.noMessages')}
            </div>
          </div>

          {#if chat.unreadCount > 0}
            <span class="chat-unread">{chat.unreadCount}</span>
          {/if}
        </div>
      {/each}
    </div>
  </aside>

  <!-- RIGHT SIDE -->
  <main class="chat-view">
    {#if selectedChat}
      <div
        class="messages"
        bind:this={messagesContainer}
        on:scroll={handleScroll}
      >
        {#each messages as msg}
          <div class="msg-row {msg.isMine ? 'mine' : ''}">
            <div class="msg-bubble">
              <span>{msg.content}</span>
              <div class="msg-time">
                {new Date(msg.createdAt).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        {/each}
      </div>

      <div class="input-area">
        <input
          bind:value={inputText}
          placeholder={$t('chat.typeMessage')}
          on:keydown={(e) => e.key === "Enter" && submit()}
        />
        <button on:click={submit}>➤</button>
      </div>
    {:else}
      <div class="chat-placeholder">{$t('chat.selectChat')}</div>
    {/if}
  </main>
</div>

<style>
  .chat-wrapper {
    display: flex;
    height: 100vh;
    justify-content: center;
    background: var(--bg-color, transparent);

    max-width: 1100px;
    margin: 0 auto;
    width: 100%;
    border-left: 1px solid var(--border-color, #ddd);
    border-right: 1px solid var(--border-color, #ddd);
  }

  .sidebar {
    width: 300px;
    border-right: 1px solid var(--border-color, #ddd);
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sidebar-title {
    font-size: 18px;
    font-weight: 600;
  }

  .chat-list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .chat-list-item {
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid var(--border-color, #ddd);
    cursor: pointer;
    transition: 0.15s;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .chat-list-item.active {
    border-width: 2px;
  }

  .chat-unread {
    background: #ef4444;
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 12px;
    margin-left: auto;
  }

  .chat-name {
    font-weight: 600;
    font-size: 15px;
  }

  .chat-preview {
    font-size: 13px;
    opacity: 0.6;
  }

  .chat-view {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .chat-placeholder {
    margin: auto;
    opacity: 0.5;
    font-size: 18px;
  }

  .messages {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .msg-row {
    display: flex;
    max-width: 70%;
  }

  .msg-row.mine {
    margin-left: auto;
    justify-content: flex-end;
  }

  .msg-bubble {
    position: relative;
    border: 1px solid var(--border-color, #ddd);
    padding: 8px 10px 16px;
    border-radius: 10px;
    font-size: 14px;
    line-height: 1.3;
    max-width: 100%;
  }

  .msg-time {
    position: absolute;
    bottom: 2px;
    right: 6px;
    font-size: 10px;
    opacity: 0.6;
  }

  .input-area {
    border-top: 1px solid var(--border-color, #ddd);
    padding: 12px;
    display: flex;
    gap: 10px;
  }

  .input-area input {
    flex: 1;
    padding: 10px;
    font-size: 15px;
    border-radius: 8px;
    border: 1px solid var(--border-color, #ddd);
  }

  .input-area button {
    padding: 10px 16px;
    font-size: 18px;
    border-radius: 8px;
  }
</style>
