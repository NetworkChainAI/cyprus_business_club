<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from "svelte";
  import { browser } from "$app/environment";
  import { t } from "$lib/i18n";

  export let eventId: string;

  const PUBLIC_PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  const dispatch = createEventDispatcher();
  let container: HTMLDivElement | null = null;
  let destroyed = false;

  const FREE_EVENT_ERR = "EVENT_FREE";

  function isInstrumentDeclined(payload: any): boolean {
    const details = payload?.paypal?.details;
    return Array.isArray(details) && details.some((d: any) => d?.issue === "INSTRUMENT_DECLINED");
  }

  function paypalIssue(payload: any): string {
    const details = payload?.paypal?.details;
    if (!Array.isArray(details)) return "";
    return details.find((d: any) => typeof d?.issue === "string")?.issue || "";
  }

  function toUserMessage(payload: any): string {
    const issue = paypalIssue(payload);

    switch (issue) {
      case "INSTRUMENT_DECLINED":
        return t.get('common.paypal.declined');
      case "INSUFFICIENT_FUNDS":
        return t.get('common.paypal.insufficientFunds');
      case "TRANSACTION_REFUSED":
        return t.get('common.paypal.refused');
      case "PAYER_ACTION_REQUIRED":
        return t.get('common.paypal.actionRequired');
      default:
        return t.get('common.paypal.failed');
    }
  }

  function loadPaypalSdk(): Promise<void> {
    if (!browser) return Promise.resolve();

    // Already loaded
    // @ts-ignore
    if (window.paypal) return Promise.resolve();

    // Already added and loading
    const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="1"]');
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("PayPal SDK load error")), {
          once: true,
        });
      });
    }

    if (!PUBLIC_PAYPAL_CLIENT_ID) {
      return Promise.reject(new Error("Missing VITE_PAYPAL_CLIENT_ID"));
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.dataset.paypalSdk = "1";

      const params = new URLSearchParams({
        "client-id": PUBLIC_PAYPAL_CLIENT_ID,
        currency: "EUR",
        intent: "capture",
        components: "buttons",
      });

      script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
      script.async = true;

      script.onload = () => resolve();
      script.onerror = () => reject(new Error("PayPal SDK load error"));

      document.head.appendChild(script);
    });
  }

  async function renderButtons() {
    if (!container) return;

    // avoid duplicates
    container.innerHTML = "";

    // @ts-ignore
    if (!window.paypal) {
      console.error("PayPal SDK not available");
      dispatch("error", { message: t.get('common.paypal.unavailable') });
      return;
    }

    // @ts-ignore
    window.paypal
      .Buttons({
        async createOrder() {
          const res = await fetch("/api/paypal/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId }),
          });

          if (!res.ok) {
            const t = await res.text();
            throw new Error(t || "PayPal create order failed");
          }

          const data = await res.json();

          if (data.free) {
            dispatch("free", data);
            throw new Error(FREE_EVENT_ERR);
          }

          if (!data.paypalOrderId) {
            throw new Error("Missing paypalOrderId from /api/paypal/create");
          }

          return data.paypalOrderId;
        },

        // IMPORTANT: accept `actions` for restart()
        async onApprove(data: any, actions: any) {
          const res = await fetch("/api/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paypalOrderId: data.orderID, eventId }),
          });

          // server error (non-JSON)
          if (!res.ok) {
            const t = await res.text();
            dispatch("error", { message: t || "PayPal capture failed" });
            return;
          }

          const out = await res.json();

          // ✅ PayPal recommended flow: restart on INSTRUMENT_DECLINED
          if (isInstrumentDeclined(out)) {
            dispatch("error", { message: t.get('common.paypal.declined') });
            if (actions?.restart) return actions.restart();
            return;
          }

          if (out?.success) {
            dispatch("success", out);
          } else {
            dispatch("error", { message: toUserMessage(out), raw: out });
          }
        },

        onError(err: any) {
          // For free-event flow — ignore
          const msg = typeof err?.message === "string" ? err.message : "";
          if (msg.includes(FREE_EVENT_ERR)) return;

          console.error("PayPal error:", err);
          dispatch("error", {
            message: t.get('common.paypal.error'),
            raw: err,
          });
        },

        onCancel(data: any) {
          dispatch("error", {
            message: t.get('common.paypal.cancelled'),
            data,
          });
        },
      })
      .render(container);
  }

  onMount(async () => {
    if (!browser) return;

    try {
      await loadPaypalSdk();
      if (!destroyed) await renderButtons();
    } catch (e) {
      console.error(e);
      dispatch("error", {
        message: t.get('common.paypal.initFailed'),
        raw: e,
      });
    }
  });

  onDestroy(() => {
    destroyed = true;
    if (container) container.innerHTML = "";
  });
</script>

<div bind:this={container}></div>
