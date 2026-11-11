<script lang="ts">
  import Chat from "$components/chat.svelte";

  export let data;
  const chatId: string = data.chatId;
</script>

<Chat {chatId} />
