<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { t } from "$lib/i18n";

  const pdfUrl = "/assets/docs/file.pdf";

  let bookEl: HTMLDivElement | null = null;
  let flip: any = null;
  let pdfDoc: any = null;

  let thumbs: string[] = [];
  let pagesHtml: string[] = [];
  let pageCount = 0;
  let currentPage = 0;
  let thumbsOpen = true;

  const BOOK_W = 520;
  const BOOK_H = 740;
  const THUMB_SCALE = 0.22; // можно меньше для скорости

  // кэш статусов, чтобы не гонять рендер заново
  const renderedFull = new Set<number>(); // pageNum 1..N
  const renderedThumb = new Set<number>();

  // хранение активных renderTask, чтобы уметь cancel
  const renderTasks = new Map<number, any>();

  // для очистки памяти под thumb blob urls
  const thumbBlobUrls: string[] = [];

  function getCanvas(pageNum: number) {
    return bookEl?.querySelector<HTMLCanvasElement>(
      `canvas[data-page="${pageNum}"]`
    ) || null;
  }

  async function renderPageIntoCanvas(pageNum: number) {
    if (!pdfDoc || !bookEl) return;
    if (renderedFull.has(pageNum)) return; // уже отрендерили

    // отменяем старый таск на эту же страницу, если был
    renderTasks.get(pageNum)?.cancel?.();

    const page = await pdfDoc.getPage(pageNum);

    // scale под размер книги: чтобы не рендерить лишние пиксели
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = BOOK_W / baseViewport.width;

    const viewport = page.getViewport({ scale });
    const canvas = getCanvas(pageNum);
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const task = page.render({ canvasContext: ctx, viewport });
    renderTasks.set(pageNum, task);

    try {
      await task.promise;
      renderedFull.add(pageNum);
    } catch (_) {
      // render может быть отменён — это нормально
    }
  }

  async function renderThumb(pageNum: number) {
    if (!pdfDoc) return;
    if (renderedThumb.has(pageNum)) return;

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: THUMB_SCALE });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b!), "image/jpeg", 0.7)
    );
    const url = URL.createObjectURL(blob);
    thumbBlobUrls.push(url);

    thumbs[pageNum - 1] = url;
    thumbs = thumbs; // реактивность
    renderedThumb.add(pageNum);
  }

  async function ensurePagesAround(centerIndex: number) {
    const targets = [
      centerIndex - 1,
      centerIndex,
      centerIndex + 1
    ].filter((i) => i >= 0 && i < pageCount);

    for (const i of targets) {
      const pageNum = i + 1;
      renderPageIntoCanvas(pageNum);
    }
  }

  function selectThumb(i: number) {
    currentPage = i;
    flip?.flip?.(i);
  }

  onMount(async () => {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

      // важные флаги для тяжёлых PDF
      pdfDoc = await pdfjsLib.getDocument({
        url: pdfUrl,
        disableAutoFetch: true, // не тащить всё сразу
        disableRange: false,    // range requests (если сервер поддерживает)
        disableStream: false,
        useSystemFonts: true
      }).promise;

      pageCount = pdfDoc.numPages;

      // 1) Мгновенно создаём страницы-заглушки (canvas пустые)
      pagesHtml = Array.from({ length: pageCount }, (_, i) => {
        const pageNum = i + 1;
        return `
          <div class="page">
            <canvas data-page="${pageNum}"></canvas>
          </div>
        `;
      });

      // thumbs массив-заглушка
      thumbs = Array(pageCount).fill("");

      await tick();
      if (!bookEl) return;

      // 2) Инициализируем PageFlip
      const pkg: any = await import("page-flip");
      const PageFlip = pkg.PageFlip ?? pkg.default?.PageFlip ?? pkg.default;

      flip = new PageFlip(bookEl, {
        width: BOOK_W,
        height: BOOK_H,
        size: "fixed",
        maxShadowOpacity: 0.35,
        showCover: false,
        mobileScrollSupport: true
      });

      flip.loadFromHTML(Array.from(bookEl.querySelectorAll(".page")));

      // 3) Рендер стартовых страниц
      await ensurePagesAround(0);

      // 4) Первые thumbs (чуть-чуть)
      for (let i = 1; i <= Math.min(8, pageCount); i++) {
        renderThumb(i);
      }

      flip.on("flip", (e: any) => {
        currentPage = e.data;

        ensurePagesAround(currentPage);
        renderThumb(currentPage + 1);
      });
    } catch (e) {
      console.error("PDF/flip error:", e);
    }
  });

  onDestroy(() => {
    flip?.destroy?.();
    flip = null;

    // отменяем активные рендеры
    renderTasks.forEach((t) => t?.cancel?.());
    renderTasks.clear();

    // чистим thumb blob urls
    thumbBlobUrls.forEach((u) => URL.revokeObjectURL(u));
  });
</script>

<div class="page-root">
  <div class="book-wrap">
    <div class="book" bind:this={bookEl}>
      {@html pagesHtml.join("")}
    </div>
  </div>

  <button
    class="thumbs-toggle"
    type="button"
    on:click={() => (thumbsOpen = !thumbsOpen)}
    aria-expanded={thumbsOpen}
  >
    {thumbsOpen ? $t('common.journal.hidePages') : $t('common.journal.showPages')}
  </button>

  {#if thumbs.length}
    <div class="thumbs {thumbsOpen ? 'open' : 'closed'}">
      {#each thumbs as thumb, i}
        <button
          class="thumb {i === currentPage ? 'active' : ''}"
          on:click={() => selectThumb(i)}
          title={`${$t('common.journal.page')} ${i + 1}`}
          type="button"
        >
          {#if thumb}
            <img src={thumb} alt={`page ${i + 1}`} />
          {:else}
            <div class="thumb-skel">...</div>
          {/if}
          <span class="num">{i + 1}</span>
        </button>
      {/each}
    </div>
  {:else}
    <div class="thumbs-loading">{$t('common.journal.loadingThumbs')}</div>
  {/if}
</div>

<style>
  .page-root {
    min-height: 100vh;
    display: grid;
    grid-template-rows: 1fr auto auto;
    padding: 12px;
    background: #0b0f17;
  }

  .book-wrap {
    display: grid;
    place-items: center;
    margin-bottom: 10px;
  }

  .book {
    background: #fff;
    border-radius: 10px;
    overflow: hidden;
  }

  /* страницы PageFlip */
  .book :global(.page) {
    width: 100%;
    height: 100%;
    background: #fff;
    display: grid;
    place-items: center;
  }

  /* canvas подгоняем под страницу */
  .book :global(.page canvas) {
    width: 100%;
    height: 100%;
    display: block;
    background: #fff;
  }

  .thumbs-toggle {
    margin: 0 auto 6px;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.06);
    color: #e6e8ee;
    font-size: 13px;
    cursor: pointer;
  }

  .thumbs {
    position: sticky;
    bottom: 0;
    padding: 10px 12px;
    display: flex;
    gap: 8px;
    overflow-x: auto;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(6px);

    transition: transform 220ms ease, opacity 220ms ease, max-height 220ms ease;
    transform-origin: bottom center;
    max-height: 180px;
  }
  .thumbs.closed {
    transform: translateY(110%);
    opacity: 0;
    max-height: 0;
    pointer-events: none;
  }

  .thumb {
    position: relative;
    flex: 0 0 auto;
    width: 120px;
    border-radius: 8px;
    padding: 0;
    border: 2px solid transparent;
    background: #fff;
    cursor: pointer;
    overflow: hidden;
  }
  .thumb img {
    display: block;
    width: 100%;
    height: auto;
  }

  .thumb-skel {
    width: 100%;
    height: 160px;
    display: grid;
    place-items: center;
    font-size: 20px;
    color: #999;
    background: #eee;
  }

  .num {
    position: absolute;
    right: 6px;
    bottom: 6px;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(0,0,0,0.65);
    color: #fff;
  }
  .thumb.active {
    border-color: #4aa3ff;
    box-shadow: 0 0 0 2px rgba(74,163,255,0.35);
  }

  .thumbs-loading {
    padding: 10px 12px;
    font-size: 13px;
    opacity: 0.7;
    text-align: center;
    color: #e6e8ee;
  }
</style>
