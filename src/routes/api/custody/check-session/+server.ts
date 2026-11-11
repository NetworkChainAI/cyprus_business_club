import { json, type RequestEvent } from "@sveltejs/kit";

export function GET({ cookies }: RequestEvent) {
  return json({ active: Boolean(cookies.get("jwt")) });
}
