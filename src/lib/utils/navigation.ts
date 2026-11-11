import { goto } from '$app/navigation';
import { get } from 'svelte/store';
import { page } from '$app/stores';
import { withLang } from '$lib/utils/withLang';

export function gotoWithRedirectPreserved(href: string) {
	const current = get(page);
	const currentPath = current.url.pathname.replace(/^\/[a-z]{2}(\/|$)/, '/') || '/';

	if (href.includes('/login')) {
		document.cookie = `redirectAfterLogin=${currentPath}; path=/; max-age=600; SameSite=Lax`;
	}

	return goto(withLang(href));
}
