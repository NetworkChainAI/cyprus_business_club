<script lang="ts">
  import { t } from "$lib/i18n";

  export let error: any;
  export let status: number;
</script>

<section class="wrap">
  <div class="card">
    <div class="code">{status}</div>
    <h1>{$t('common.error.title')}</h1>
    <p>{error?.message ?? $t('common.error.fallback')}</p>

    <a class="btn" href="/">{$t('common.error.goHome')}</a>
  </div>
</section>

<style>
  .wrap {
    min-height: calc(100vh - 80px);
    display: grid;
    place-items: center;
    padding: 28px 18px 64px;
    background: rgb(248 250 252);
  }

  .card {
    width: 100%;
    max-width: 520px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 22px;
    box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
    text-align: center;
  }

  .code {
    display: inline-block;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(79, 70, 229, 0.08);
    border: 1px solid rgba(79, 70, 229, 0.18);
    color: rgb(79 70 229);
    font-weight: 900;
  }

  h1 {
    margin: 12px 0 6px;
    font-size: 28px;
    font-weight: 900;
    color: #0f172a;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    color: #64748b;
    font-weight: 700;
  }

  .btn {
    margin-top: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 16px;
    border-radius: 999px;
    background: rgb(79 70 229);
    color: #fff;
    font-weight: 900;
    text-decoration: none;
  }
</style>
