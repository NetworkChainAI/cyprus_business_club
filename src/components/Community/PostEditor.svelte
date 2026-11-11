<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { Editor } from "@tiptap/core";
  import StarterKit from "@tiptap/starter-kit";
  import Placeholder from "@tiptap/extension-placeholder";

  export let communityId: string;
  export let editPost: any = null; // pass existing post to edit

  const dispatch = createEventDispatcher<{
    saved: any;
    cancelled: void;
  }>();

  let title = editPost?.title ?? "";
  let excerpt = editPost?.excerpt ?? "";

  // Image upload
  let imageFile: File | null = null;
  let imagePreview: string | null = editPost?.image ?? null;
  let imageDragging = false;
  let imageInput: HTMLInputElement;

  function handleImageSelect(file: File) {
    if (!file.type.startsWith("image/")) { error = "File must be an image"; return; }
    imageFile = file;
    imagePreview = URL.createObjectURL(file);
  }

  function onImageChange(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) handleImageSelect(f);
  }

  function onImageDrop(e: DragEvent) {
    e.preventDefault();
    imageDragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) handleImageSelect(f);
  }

  function removeImage() {
    imageFile = null;
    imagePreview = null;
    if (imageInput) imageInput.value = "";
  }

  let editorEl: HTMLDivElement;
  let editor: Editor;
  let saving = false;
  let error = "";

  onMount(() => {
    editor = new Editor({
      element: editorEl,
      extensions: [
        StarterKit,
        Placeholder.configure({ placeholder: "Write your post content here…" }),
      ],
      content: editPost?.content ?? "",
      editorProps: {
        attributes: { class: "tiptap-content" },
      },
    });
  });

  onDestroy(() => {
    editor?.destroy();
  });

  async function save() {
    if (!title.trim()) { error = "Title is required"; return; }
    const content = editor.getJSON();
    if (!content.content?.length) { error = "Content is required"; return; }

    saving = true;
    error = "";
    try {
      const url = editPost
        ? `/api/community/${communityId}/posts/${editPost.id}`
        : `/api/community/${communityId}/posts`;
      const method = editPost ? "PATCH" : "POST";

      let res: Response;
      if (imageFile) {
        const fd = new FormData();
        fd.append("title", title.trim());
        fd.append("excerpt", excerpt.trim() || "");
        fd.append("content", JSON.stringify(content));
        fd.append("image", imageFile);
        res = await fetch(url, { method, body: fd });
      } else {
        // No new file — pass imagePreview as existing URL (null means remove)
        res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            excerpt: excerpt.trim() || null,
            content,
            image: imagePreview ?? null,
          }),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      dispatch("saved", data);
    } catch (e: any) {
      error = e.message;
    } finally {
      saving = false;
    }
  }
</script>

<div class="editor-card">
  <div class="editor-header">
    <h3>{editPost ? "Edit post" : "New post"}</h3>
    <button type="button" class="cancel-btn" on:click={() => dispatch("cancelled")}>
      <iconify-icon icon="lucide:x" width="18"></iconify-icon>
    </button>
  </div>

  <div class="field">
    <label for="post-title">Title <span class="req">*</span></label>
    <input id="post-title" type="text" bind:value={title} placeholder="Post title" />
  </div>

  <div class="field">
    <label for="post-excerpt">Short description</label>
    <input id="post-excerpt" type="text" bind:value={excerpt} placeholder="Optional summary shown in preview" />
  </div>

  <div class="field">
    <label>Cover image</label>
    <input
      type="file"
      accept="image/*"
      bind:this={imageInput}
      on:change={onImageChange}
      style="display:none"
    />
    {#if imagePreview}
      <div class="img-preview">
        <img src={imagePreview} alt="Post cover" />
        <button type="button" class="img-remove" on:click={removeImage} title="Remove image">
          <iconify-icon icon="lucide:x" width="14"></iconify-icon>
        </button>
      </div>
    {:else}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="img-dropzone"
        class:dragging={imageDragging}
        on:click={() => imageInput.click()}
        on:dragover|preventDefault={() => (imageDragging = true)}
        on:dragleave={() => (imageDragging = false)}
        on:drop={onImageDrop}
      >
        <iconify-icon icon="lucide:image" width="22"></iconify-icon>
        <span>Click or drag to upload cover image</span>
      </div>
    {/if}
  </div>

  <div class="field">
    <label>Content <span class="req">*</span></label>
    <div class="toolbar">
      <button type="button" class="tb-btn" class:active={editor?.isActive('bold')} on:click={() => editor.chain().focus().toggleBold().run()} title="Bold">
        <iconify-icon icon="lucide:bold" width="14"></iconify-icon>
      </button>
      <button type="button" class="tb-btn" class:active={editor?.isActive('italic')} on:click={() => editor.chain().focus().toggleItalic().run()} title="Italic">
        <iconify-icon icon="lucide:italic" width="14"></iconify-icon>
      </button>
      <div class="tb-sep"></div>
      <button type="button" class="tb-btn" class:active={editor?.isActive('heading', { level: 2 })} on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
        H2
      </button>
      <button type="button" class="tb-btn" class:active={editor?.isActive('heading', { level: 3 })} on:click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
        H3
      </button>
      <div class="tb-sep"></div>
      <button type="button" class="tb-btn" class:active={editor?.isActive('bulletList')} on:click={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
        <iconify-icon icon="lucide:list" width="14"></iconify-icon>
      </button>
      <button type="button" class="tb-btn" class:active={editor?.isActive('orderedList')} on:click={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
        <iconify-icon icon="lucide:list-ordered" width="14"></iconify-icon>
      </button>
      <div class="tb-sep"></div>
      <button type="button" class="tb-btn" class:active={editor?.isActive('blockquote')} on:click={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
        <iconify-icon icon="lucide:quote" width="14"></iconify-icon>
      </button>
      <button type="button" class="tb-btn" on:click={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
        <iconify-icon icon="lucide:minus" width="14"></iconify-icon>
      </button>
    </div>
    <div class="editor-wrap" bind:this={editorEl}></div>
  </div>

  {#if error}
    <div class="error-msg">
      <iconify-icon icon="lucide:alert-circle" width="14"></iconify-icon>
      {error}
    </div>
  {/if}

  <div class="editor-actions">
    <button type="button" class="btn-cancel" on:click={() => dispatch("cancelled")}>Cancel</button>
    <button type="button" class="btn-save" disabled={saving} on:click={save}>
      {#if saving}
        <iconify-icon icon="lucide:loader-2" width="14" class="spin"></iconify-icon>
        Saving…
      {:else}
        <iconify-icon icon="lucide:send" width="14"></iconify-icon>
        {editPost ? "Save changes" : "Publish post"}
      {/if}
    </button>
  </div>
</div>

<style>
  .editor-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .editor-header h3 {
    font-size: 18px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
  }

  .cancel-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.15s;
  }
  .cancel-btn:hover { background: #f1f5f9; }

  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field label {
    font-size: 13px;
    font-weight: 800;
    color: #334155;
  }

  .req { color: #ef4444; }

  /* Image upload */
  .img-dropzone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 110px;
    border: 2px dashed #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.15s;
    background: #f8fafc;
  }
  .img-dropzone:hover, .img-dropzone.dragging {
    border-color: #4f46e5;
    background: #eef2ff;
    color: #4f46e5;
  }

  .img-preview {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    height: 160px;
    background: #f1f5f9;
  }
  .img-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .img-remove {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 26px;
    height: 26px;
    border-radius: 999px;
    background: rgba(0,0,0,0.55);
    border: none;
    color: #fff;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: background 0.15s;
  }
  .img-remove:hover { background: rgba(0,0,0,0.75); }

  .field input[type="text"] {
    height: 44px;
    padding: 0 14px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    font-family: inherit;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;
    background: #fff;
    transition: border-color 0.15s;
  }
  .field input[type="text"]:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  /* Toolbar */
  .toolbar {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 6px 8px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    flex-wrap: wrap;
  }

  .tb-btn {
    width: 30px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #475569;
    cursor: pointer;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 700;
    font-family: inherit;
    transition: all 0.12s;
  }
  .tb-btn:hover { background: #e2e8f0; }
  .tb-btn.active { background: #4f46e5; color: #fff; }

  .tb-sep {
    width: 1px;
    height: 18px;
    background: #e2e8f0;
    margin: 0 4px;
  }

  /* Editor area */
  .editor-wrap {
    min-height: 200px;
    border: 1px solid #e2e8f0;
    border-radius: 0 0 12px 12px;
    padding: 14px 16px;
    background: #fff;
    cursor: text;
  }

  .editor-wrap :global(.tiptap-content) {
    outline: none;
    min-height: 160px;
    font-size: 15px;
    line-height: 1.65;
    color: #0f172a;
  }

  .editor-wrap :global(.tiptap-content p) { margin: 0 0 10px; }
  .editor-wrap :global(.tiptap-content p:last-child) { margin-bottom: 0; }
  .editor-wrap :global(.tiptap-content h2) { font-size: 20px; font-weight: 900; margin: 16px 0 8px; color: #0f172a; }
  .editor-wrap :global(.tiptap-content h3) { font-size: 17px; font-weight: 800; margin: 14px 0 6px; color: #0f172a; }
  .editor-wrap :global(.tiptap-content ul), .editor-wrap :global(.tiptap-content ol) { padding-left: 20px; margin: 8px 0; }
  .editor-wrap :global(.tiptap-content li) { margin: 4px 0; }
  .editor-wrap :global(.tiptap-content blockquote) {
    border-left: 3px solid #4f46e5;
    padding-left: 14px;
    margin: 10px 0;
    color: #64748b;
    font-style: italic;
  }
  .editor-wrap :global(.tiptap-content hr) { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  .editor-wrap :global(.tiptap-content strong) { font-weight: 800; }

  .editor-wrap :global(.tiptap-content p.is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: #94a3b8;
    pointer-events: none;
    height: 0;
  }

  .error-msg {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #ef4444;
  }

  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn-cancel {
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: #64748b;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 18px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .btn-cancel:hover { background: #f1f5f9; }

  .btn-save {
    font-family: inherit;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: #4f46e5;
    border: none;
    border-radius: 12px;
    padding: 10px 20px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
  }
  .btn-save:hover { background: #4338ca; }
  .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  :global(.spin) { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
