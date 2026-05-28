<script lang="ts">
	import '../app.css';
	import { setContext } from 'svelte';
	import { writable, derived } from 'svelte/store';
	import { browser } from '$app/environment';
	import { createTranslator, type Locale, type Translator } from '$lib/i18n/index.js';
	import type { Readable, Writable } from 'svelte/store';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const locale: Writable<Locale> = writable(data.locale as Locale);

	// Persist locale choice to cookie so the server picks it up on next request
	locale.subscribe((val) => {
		if (browser) {
			document.cookie = `frost-locale=${val};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
		}
	});

	// Re-sync if server sends a different locale (e.g., after navigation)
	$effect(() => {
		locale.set(data.locale as Locale);
	});

	const t: Readable<Translator> = derived(locale, ($locale) => createTranslator($locale));

	setContext<Writable<Locale>>('locale', locale);
	setContext<Readable<Translator>>('t', t);
</script>

{@render children()}
