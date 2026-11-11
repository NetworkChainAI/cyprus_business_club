<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { t } from "$lib/i18n";
  const dispatch = createEventDispatcher();

  export let length = 6;
  export let value = "";
  export let disabled = false;

  let inputs: HTMLInputElement[] = [];
  let otp = Array(length).fill("");

  $: if (value && value.length === length) {
    otp = value.split("");
  }

  function handleInput(e: Event, index: number) {
    const target = e.target as HTMLInputElement;
    let val = target.value.replace(/\D/g, "");

    if (!val) {
      otp[index] = "";
      dispatch("change", otp.join(""));
      return;
    }

    otp[index] = val[0];

    if (index < length - 1) {
      inputs[index + 1].focus();
    }

    dispatch("change", otp.join(""));
  }

  function handleKeydown(e: KeyboardEvent, index: number) {
    if (e.key === "Backspace") {
      if (otp[index] === "") {
        if (index > 0) {
          otp[index - 1] = "";
          inputs[index - 1].focus();
        }
      } else {
        otp[index] = "";
      }
      dispatch("change", otp.join(""));
    }
  }

  function handlePaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData("text") ?? "";
    const digits = text.replace(/\D/g, "").slice(0, length);

    if (!digits) return;

    digits.split("").forEach((d, i) => (otp[i] = d));
    dispatch("change", otp.join(""));

    const last = digits.length - 1;
    if (inputs[last]) inputs[last].focus();
  }
</script>

<div class="otp" on:paste={handlePaste}>
  {#each otp as d, i}
    <input
      class="box"
      bind:this={inputs[i]}
      bind:value={otp[i]}
      maxlength="1"
      inputmode="numeric"
      pattern="\d*"
      {disabled}
      on:input={(e) => handleInput(e, i)}
      on:keydown={(e) => handleKeydown(e, i)}
      aria-label={`${$t('wallet.otp.digit')} ${i + 1}`}
    />
  {/each}
</div>

<style>
  .otp {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 10px;
    margin: 10px 0 4px;
    flex-wrap: nowrap;
    overflow-x: hidden;
  }

  .box {
    width: 48px;
    height: 52px;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #0f172a;
    font-size: 18px;
    font-weight: 900;
    text-align: center;
    outline: none;
    transition: border-color 0.15s;
    caret-color: transparent;
  }

  .box:focus {
    border-color: #4f46e5;
  }

  .box:disabled {
    opacity: 0.55;
    background: #f8fafc;
    cursor: not-allowed;
  }

  @media (max-width: 520px) {
    .otp {
      gap: 8px;
    }

    .box {
      width: 42px;
      height: 48px;
      border-radius: 12px;
      font-size: 17px;
    }
  }

  @media (max-width: 380px) {
    .otp {
      gap: 6px;
    }

    .box {
      width: 36px;
      height: 44px;
      border-radius: 10px;
      font-size: 16px;
    }
  }
</style>
