<script lang="ts">
  import { t } from "$lib/i18n";
  import Decimal from 'decimal.js';

  export let amount: string;
  export let inputTitle: string;
  export let checkMinAmount: boolean = true;
  export let readonly: boolean = false;
  export let currency: any | null = null;

  $: checkMinAmountCondition = () => {
    return checkMinAmount && +amount < +getMinAmount();
  };

  const getMinAmount = () => {
    return new Decimal(currency?.minDep || 0).mul(2).toString();
  };
</script>

<div class="input-wrapper">
  <label>{inputTitle}</label>

  <input
    bind:value={amount}
    {readonly}
    class:danger={checkMinAmountCondition()}
    type="text"
  />
</div>

<style>
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
  }

  label {
    font-size: 13px;
    color: #999;
  }

  input {
    width: 100%;
    padding: 18px 20px;
    font-size: 20px;
    border-radius: 14px;
    border: 2px solid transparent;
    background: #27292e;
    color: white;
    transition: 0.2s;
  }

  input:hover {
    background: #2d2f34;
  }

  input:focus {
    background: #32343a;
    border-color: #007bff;
    outline: none;
  }

  input.danger {
    border-color: #e63946 !important;
    color: #e63946;
  }
</style>
