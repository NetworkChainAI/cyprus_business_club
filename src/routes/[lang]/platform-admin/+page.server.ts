import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const lang = params.lang ?? "en";
  throw redirect(302, `/${lang}/platform-admin/users`);
};
