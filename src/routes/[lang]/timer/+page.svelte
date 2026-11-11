<script lang="ts">
  let duration = 60;
  let remaining = 60;
  let running = false;
  let interval: ReturnType<typeof setInterval> | null = null;

  let audioCtx: AudioContext | null = null;

  function tick() {
    if (!audioCtx) audioCtx = new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = 600;
    g.gain.value = 0.15;
    o.start();
    o.stop(audioCtx.currentTime + 0.08);
  }

  function beep() {
    if (!audioCtx) audioCtx = new AudioContext();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.3;
    o.start();
    o.stop(audioCtx.currentTime + 0.15);
    setTimeout(() => {
      const o2 = audioCtx!.createOscillator();
      const g2 = audioCtx!.createGain();
      o2.connect(g2);
      g2.connect(audioCtx!.destination);
      o2.frequency.value = 880;
      g2.gain.value = 0.3;
      o2.start();
      o2.stop(audioCtx!.currentTime + 0.15);
    }, 200);
    setTimeout(() => {
      const o3 = audioCtx!.createOscillator();
      const g3 = audioCtx!.createGain();
      o3.connect(g3);
      g3.connect(audioCtx!.destination);
      o3.frequency.value = 1100;
      g3.gain.value = 0.3;
      o3.start();
      o3.stop(audioCtx!.currentTime + 0.3);
    }, 400);
  }

  function select(seconds: number) {
    stop();
    duration = seconds;
    remaining = seconds;
  }

  function start() {
    if (remaining <= 0) remaining = duration;
    running = true;
    beep();
    interval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        remaining = 0;
        stop();
        beep();
      }
    }, 1000);
  }

  function stop() {
    running = false;
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  function reset() {
    stop();
    remaining = duration;
  }

  $: minutes = Math.floor(remaining / 60);
  $: seconds = remaining % 60;
  $: display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  $: progress = duration > 0 ? remaining / duration : 1;
</script>

<svelte:head>
  <title>Timer</title>
</svelte:head>

<div class="timer-page">
  <div class="clock-wrapper">
    <svg viewBox="0 0 200 200" class="progress-ring">
      <circle cx="100" cy="100" r="94" class="ring-bg" />
      <circle
        cx="100"
        cy="100"
        r="94"
        class="ring-progress"
        style="stroke-dashoffset: {590.62 * (1 - progress)}"
      />
    </svg>
    <div class="time-display" class:finished={remaining === 0 && !running}>
      {display}
    </div>
  </div>

  <div class="bottom">
    <div class="duration-buttons">
      <button class="dur-btn" class:active={duration === 60} on:click={() => select(60)}>1m</button>
      <button class="dur-btn" class:active={duration === 120} on:click={() => select(120)}>2m</button>
      <button class="dur-btn" class:active={duration === 180} on:click={() => select(180)}>3m</button>
    </div>

    <div class="controls">
      {#if !running}
        <button class="ctrl-btn start" on:click={start} disabled={remaining === 0}>Start</button>
      {:else}
        <button class="ctrl-btn stop" on:click={stop}>Stop</button>
      {/if}
      <button class="ctrl-btn reset" on:click={reset}>Reset</button>
    </div>
  </div>
</div>

<style>
  .timer-page {
    position: fixed;
    inset: 0;
    background: #0f172a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: system-ui, -apple-system, sans-serif;
    z-index: 9999;
  }

  .clock-wrapper {
    position: relative;
    width: min(85vw, 85vh);
    height: min(85vw, 85vh);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .progress-ring {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .ring-bg {
    fill: none;
    stroke: #1e293b;
    stroke-width: 4;
  }

  .ring-progress {
    fill: none;
    stroke: #4f46e5;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-dasharray: 590.62;
    transition: stroke-dashoffset 0.5s ease;
  }

  .time-display {
    font-size: min(22vw, 22vh);
    font-weight: 900;
    color: #e2e8f0;
    letter-spacing: 0.02em;
    font-variant-numeric: tabular-nums;
    line-height: 1;
  }

  .time-display.finished {
    color: #ef4444;
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .bottom {
    position: fixed;
    bottom: 16px;
    right: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .bottom:hover {
    opacity: 1;
  }

  .duration-buttons {
    display: flex;
    gap: 6px;
  }

  .dur-btn {
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid #334155;
    background: transparent;
    color: #94a3b8;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
  }

  .dur-btn:hover {
    border-color: #4f46e5;
    color: #e2e8f0;
  }

  .dur-btn.active {
    background: #4f46e5;
    border-color: #4f46e5;
    color: #fff;
  }

  .controls {
    display: flex;
    gap: 6px;
  }

  .ctrl-btn {
    padding: 4px 16px;
    border-radius: 6px;
    border: none;
    font-size: 11px;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ctrl-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .ctrl-btn.start {
    background: #4f46e5;
    color: #fff;
  }

  .ctrl-btn.start:hover:not(:disabled) {
    background: #4338ca;
  }

  .ctrl-btn.stop {
    background: #ef4444;
    color: #fff;
  }

  .ctrl-btn.stop:hover {
    background: #dc2626;
  }

  .ctrl-btn.reset {
    background: #334155;
    color: #e2e8f0;
  }

  .ctrl-btn.reset:hover {
    background: #475569;
  }
</style>
