<script lang="ts">
  import { onMount, tick } from "svelte";

  export let symbol: string;
  export let quote: string;
  export let interval = "5m";
  export let limit = 160;

  // ✅ анимация только при первом появлении
  export let animateOnFirstLoad = true;
  export let animationMs = 650;

  let wrap: HTMLDivElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;

  let prices: number[] = [];
  let loading = true;

  let intervalId: number | null = null;
  let ro: ResizeObserver | null = null;

  // реальные размеры (в CSS px)
  let w = 0;
  let h = 0;

  // hiDPI
  let dpr = 1;

  // hover tooltip
  let hover = false;
  let hoverIndex = -1;
  let hoverX = 0;
  let hoverY = 0;
  let hoverPrice = 0;

  // cached stats
  let min = 0;
  let max = 0;
  let range = 1;
  let trendUp = true;

  // чтобы не перерисовывать без нужды
  let lastHash = "";
  let firstPaintDone = false;

  async function initContext() {
    await tick();
    for (let i = 0; i < 5; i++) {
      if (canvas) {
        ctx = canvas.getContext("2d");
        if (ctx) return true;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  }

  function measure() {
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const nextW = Math.max(1, Math.floor(rect.width));
    const nextH = Math.max(1, Math.floor(rect.height));

    // если размеры не поменялись — ничего не делаем
    if (nextW === w && nextH === h) return;

    w = nextW;
    h = nextH;

    setupHiDPI();
    // перерисуем текущие данные (без анимации, чтобы не мигало)
    if (prices.length) draw(1);
  }

  function setupHiDPI() {
    if (!canvas || !ctx) return;

    dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);

    // рисуем в CSS-пикселях
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  async function loadCandles() {
    const pair = `${symbol}${quote}`.toUpperCase();
    const url = `https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${limit}`;

    const res = await fetch(url);
    const data = await res.json();
    if (!Array.isArray(data)) return { changed: false };

    const nextPrices = data
      .map((c: any[]) => parseFloat(c[4]))
      .filter((v) => Number.isFinite(v));

    // лёгкий хеш: first|last|len (достаточно чтобы поймать изменения)
    const nextHash = `${nextPrices.length}|${nextPrices[0] ?? 0}|${nextPrices[nextPrices.length - 1] ?? 0}`;

    if (nextHash === lastHash) return { changed: false };

    prices = nextPrices;
    lastHash = nextHash;

    if (prices.length) {
      min = Math.min(...prices);
      max = Math.max(...prices);
      range = max - min || 1;
      trendUp = prices[prices.length - 1] > prices[0];
    }

    return { changed: true };
  }

  function priceToXY(price: number, i: number) {
    const x = (i / Math.max(1, prices.length - 1)) * w;
    const y = h - ((price - min) / range) * h;
    return { x, y };
  }

  function draw(progress = 1) {
    if (!ctx || !canvas || prices.length === 0 || w <= 0 || h <= 0) return;

    const c = ctx;
    c.clearRect(0, 0, w, h);

    const lineColor = trendUp ? "#00ff00" : "#ff4d4d";
    const fillColor = trendUp ? "rgba(0,255,0,0.18)" : "rgba(255,77,77,0.18)";

    const n = prices.length;
    const lastIndex = Math.max(1, Math.floor((n - 1) * progress));

    // линия (тоньше)
    c.beginPath();
    c.lineWidth = 1; // ✅ тонкая
    c.strokeStyle = lineColor;
    c.lineJoin = "round";
    c.lineCap = "round";

    for (let i = 0; i <= lastIndex; i++) {
      const { x, y } = priceToXY(prices[i], i);
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();

    // заливка
    c.lineTo((lastIndex / Math.max(1, n - 1)) * w, h);
    c.lineTo(0, h);
    c.closePath();
    c.fillStyle = fillColor;
    c.fill();

    // hover маркер
    if (hover && hoverIndex >= 0 && hoverIndex < prices.length) {
      const { x, y } = priceToXY(prices[hoverIndex], hoverIndex);

      c.beginPath();
      c.lineWidth = 1;
      c.strokeStyle = trendUp ? "rgba(0,255,0,0.28)" : "rgba(255,77,77,0.28)";
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();

      c.beginPath();
      c.fillStyle = "#ffffff";
      c.strokeStyle = lineColor;
      c.lineWidth = 1;
      c.arc(x, y, 3, 0, Math.PI * 2);
      c.fill();
      c.stroke();

      hoverX = x;
      hoverY = y;
      hoverPrice = prices[hoverIndex];
    }
  }

  function animateDrawOnce() {
    if (!animateOnFirstLoad || firstPaintDone) {
      draw(1);
      return;
    }

    const start = performance.now();

    const step = (t: number) => {
      const p = Math.min(1, (t - start) / animationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      draw(eased);
      if (p < 1) requestAnimationFrame(step);
      else firstPaintDone = true;
    };

    requestAnimationFrame(step);
  }

  function onMove(e: MouseEvent) {
    if (!prices.length || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const idx = Math.round((x / Math.max(1, rect.width)) * (prices.length - 1));
    hoverIndex = Math.max(0, Math.min(prices.length - 1, idx));
    hover = true;

    draw(1);
  }

  function onLeave() {
    hover = false;
    hoverIndex = -1;
    draw(1);
  }

  function formatPrice(v: number) {
    if (!Number.isFinite(v)) return "";
    if (v >= 1000) return v.toFixed(2);
    if (v >= 1) return v.toFixed(4);
    return v.toFixed(6);
  }

  async function refresh({ animateFirst = false } = {}) {
    if (loading) loading = false;

    const { changed } = await loadCandles();

    // ✅ если данные не изменились — не трогаем канвас
    if (!changed) return;

    // ✅ если размер ещё не замерили — замерим
    if (!w || !h) measure();

    // ✅ анимация только первый раз (по желанию)
    if (animateFirst) animateDrawOnce();
    else draw(1);
  }

  onMount(() => {
    (async () => {
      const ok = await initContext();
      if (!ok) return;

      // ResizeObserver для “гибких” размеров
      ro = new ResizeObserver(() => measure());
      if (wrap) ro.observe(wrap);

      // первичный замер и первичная загрузка
      measure();
      loading = true;
      await loadCandles();
      loading = false;

      // первый рендер — можно анимировать
      animateDrawOnce();

      // обновления — БЕЗ анимации, и без перерисовки если ничего не поменялось
      intervalId = window.setInterval(async () => {
        await refresh({ animateFirst: false });
      }, 5000);
    })();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (ro && wrap) ro.unobserve(wrap);
    };
  });
</script>

<div class="wrap" bind:this={wrap}>
  <canvas
    bind:this={canvas}
    on:mousemove={onMove}
    on:mouseleave={onLeave}
    aria-label="sparkline"
  />

  {#if hover && hoverIndex !== -1}
    <div
      class="tip"
      style="left:{Math.min(w - 6, Math.max(6, hoverX))}px; top:{Math.max(6, hoverY)}px;"
    >
      {formatPrice(hoverPrice)}
    </div>
  {/if}

  {#if loading}
    <div class="skeleton" aria-hidden="true"></div>
  {/if}
</div>

<style>
  /* ✅ размеры НЕ фиксированные: контейнер сам задаёт размер */
  .wrap {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 42px; /* чтобы не схлопывалось */
  }

  canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .tip {
    position: absolute;
    transform: translate(-50%, -120%);
    padding: 4px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 800;
    background: rgba(15, 23, 42, 0.92);
    color: #fff;
    pointer-events: none;
    white-space: nowrap;
  }

  .skeleton {
    position: absolute;
    inset: 0;
    border-radius: 10px;
    background: linear-gradient(
      90deg,
      rgba(148, 163, 184, 0.08) 0%,
      rgba(148, 163, 184, 0.18) 45%,
      rgba(148, 163, 184, 0.08) 100%
    );
    background-size: 220% 100%;
    animation: shimmer 1.2s linear infinite;
    pointer-events: none;
  }

  @keyframes shimmer {
    0% { background-position: 0% 0%; }
    100% { background-position: 220% 0%; }
  }
</style>
