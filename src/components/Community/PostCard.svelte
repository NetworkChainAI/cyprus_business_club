<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { photoSrc } from "$lib/utils/photo";
  import { getDateLocale } from "$lib/utils/dateLocale";

  export let post: {
    id: string;
    title: string;
    excerpt: string | null;
    content: any;
    image: string | null;
    createdAt: string | Date;
    author: { id: string; name: string; photo: string | null };
  };
  export let isOwner = false;
  export let expanded = false;

  const dispatch = createEventDispatcher<{ edit: any; delete: string }>();

  let deleting = false;

  function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString(getDateLocale(), {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  // Render TipTap JSON to HTML
  function renderContent(doc: any): string {
    if (!doc?.content) return "";
    return doc.content.map(renderNode).join("");
  }

  function renderNode(node: any): string {
    const marks = node.marks ?? [];
    const applyMarks = (text: string) =>
      marks.reduce((t: string, m: any) => {
        if (m.type === "bold") return `<strong>${t}</strong>`;
        if (m.type === "italic") return `<em>${t}</em>`;
        if (m.type === "strike") return `<s>${t}</s>`;
        if (m.type === "code") return `<code>${t}</code>`;
        return t;
      }, text);

    switch (node.type) {
      case "paragraph":
        return `<p>${(node.content ?? []).map(renderNode).join("")}</p>`;
      case "heading":
        return `<h${node.attrs?.level}>${(node.content ?? []).map(renderNode).join("")}</h${node.attrs?.level}>`;
      case "text":
        return applyMarks(node.text ?? "");
      case "bulletList":
        return `<ul>${(node.content ?? []).map(renderNode).join("")}</ul>`;
      case "orderedList":
        return `<ol>${(node.content ?? []).map(renderNode).join("")}</ol>`;
      case "listItem":
        return `<li>${(node.content ?? []).map(renderNode).join("")}</li>`;
      case "blockquote":
        return `<blockquote>${(node.content ?? []).map(renderNode).join("")}</blockquote>`;
      case "horizontalRule":
        return `<hr>`;
      case "hardBreak":
        return `<br>`;
      case "codeBlock":
        return `<pre><code>${(node.content ?? []).map(renderNode).join("")}</code></pre>`;
      default:
        return (node.content ?? []).map(renderNode).join("");
    }
  }

  async function deletePost() {
    if (!confirm("Delete this post?")) return;
    deleting = true;
    dispatch("delete", post.id);
  }
</script>

<article class="post-card" class:expanded class:has-image={!!post.image}>
  <!-- Cover image — full-width when collapsed, top when expanded -->
  {#if post.image && expanded}
    <div class="post-cover">
      <img src={photoSrc(post.image)} alt={post.title} loading="lazy" />
    </div>
  {/if}

  <div class="post-inner">
    <!-- Thumbnail — shown when collapsed and has image -->
    {#if post.image && !expanded}
      <div class="post-thumb">
        <img src={photoSrc(post.image, 300)} alt={post.title} loading="lazy" />
      </div>
    {/if}

    <div class="post-body">
      <!-- Meta: author + date -->
      <div class="post-meta">
        <a class="post-author" href="/members/{post.author.id}">
          {#if post.author.photo}
            <img class="author-avatar" src={photoSrc(post.author.photo, 64)} alt={post.author.name} />
          {:else}
            <div class="author-avatar fallback">{post.author.name[0].toUpperCase()}</div>
          {/if}
          <span class="author-name">{post.author.name}</span>
        </a>
        <span class="post-date">{formatDate(post.createdAt)}</span>
      </div>

      <h2 class="post-title">{post.title}</h2>

      {#if !expanded}
        {#if post.excerpt}
          <p class="post-excerpt">{post.excerpt}</p>
        {/if}
        <button type="button" class="read-more" on:click={() => (expanded = true)}>
          Read more
          <iconify-icon icon="lucide:chevron-down" width="14"></iconify-icon>
        </button>
      {:else}
        <div class="post-content">
          {@html renderContent(post.content)}
        </div>
        <button type="button" class="read-more collapse" on:click={() => (expanded = false)}>
          Collapse
          <iconify-icon icon="lucide:chevron-up" width="14"></iconify-icon>
        </button>
      {/if}

      {#if isOwner}
        <div class="post-actions">
          <button type="button" class="action-edit" on:click={() => dispatch("edit", post)}>
            <iconify-icon icon="lucide:pencil" width="13"></iconify-icon>
            Edit
          </button>
          <button type="button" class="action-delete" disabled={deleting} on:click={deletePost}>
            <iconify-icon icon="lucide:trash-2" width="13"></iconify-icon>
            Delete
          </button>
        </div>
      {/if}
    </div>
  </div>
</article>

<style>
  .post-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .post-card:hover {
    box-shadow: 0 4px 20px rgba(15, 23, 42, 0.07);
  }

  /* Cover: full-width top image when expanded */
  .post-cover {
    height: 240px;
    overflow: hidden;
    position: relative;
  }
  .post-cover img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Inner: horizontal when collapsed with thumb, vertical otherwise */
  .post-inner {
    display: flex;
    gap: 0;
  }

  /* Thumbnail — right side strip when collapsed */
  .post-thumb {
    flex: 0 0 160px;
    order: 2;
    overflow: hidden;
    position: relative;
    border-left: 1px solid #f1f5f9;
    border-radius: 0 16px 16px 0;
  }
  .post-thumb img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .post-body {
    flex: 1;
    min-width: 0;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    order: 1;
  }

  .post-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .post-author {
    display: flex;
    align-items: center;
    gap: 7px;
    text-decoration: none;
    color: inherit;
    min-width: 0;
  }

  .author-avatar {
    width: 26px;
    height: 26px;
    border-radius: 999px;
    object-fit: cover;
    display: block;
    flex: 0 0 auto;
  }
  .author-avatar.fallback {
    background: #e0e7ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 900;
    color: #4f46e5;
  }

  .author-name {
    font-size: 13px;
    font-weight: 700;
    color: #334155;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .post-author:hover .author-name { color: #4f46e5; }

  .post-date {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .post-title {
    font-size: 17px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }

  .post-excerpt {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
    line-height: 1.55;
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .post-content {
    font-size: 15px;
    line-height: 1.65;
    color: #334155;
  }
  .post-content :global(p) { margin: 0 0 10px; }
  .post-content :global(p:last-child) { margin-bottom: 0; }
  .post-content :global(h2) { font-size: 19px; font-weight: 900; margin: 16px 0 8px; color: #0f172a; }
  .post-content :global(h3) { font-size: 16px; font-weight: 800; margin: 14px 0 6px; color: #0f172a; }
  .post-content :global(ul), .post-content :global(ol) { padding-left: 20px; margin: 8px 0; }
  .post-content :global(li) { margin: 4px 0; }
  .post-content :global(blockquote) {
    border-left: 3px solid #4f46e5;
    padding-left: 14px;
    margin: 10px 0;
    color: #64748b;
    font-style: italic;
  }
  .post-content :global(hr) { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  .post-content :global(strong) { font-weight: 800; }
  .post-content :global(code) { background: #f1f5f9; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
  .post-content :global(pre) { background: #1e293b; color: #e2e8f0; padding: 14px 16px; border-radius: 10px; overflow-x: auto; }

  .read-more {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    color: #4f46e5;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    align-self: flex-start;
    transition: opacity 0.15s;
  }
  .read-more:hover { opacity: 0.75; }
  .read-more.collapse { color: #94a3b8; }

  .post-actions {
    display: flex;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid #f1f5f9;
    margin-top: 2px;
  }

  .action-edit, .action-delete {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
    font-size: 12px;
    font-weight: 700;
    border-radius: 8px;
    padding: 5px 10px;
    cursor: pointer;
    transition: all 0.15s;
    border: none;
  }
  .action-edit { color: #4f46e5; background: #eef2ff; }
  .action-edit:hover { background: #e0e7ff; }
  .action-delete { color: #ef4444; background: #fef2f2; }
  .action-delete:hover { background: #fee2e2; }
  .action-delete:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Mobile: stack vertically, thumb goes to top */
  @media (max-width: 560px) {
    .post-inner {
      flex-direction: column;
    }
    .post-thumb {
      flex: none;
      order: 0;
      border-left: none;
      border-bottom: 1px solid #f1f5f9;
      border-radius: 0;
      height: 160px;
    }
    .post-cover {
      height: 180px;
    }
  }
</style>
