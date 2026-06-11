<script lang="ts">
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { Translator } from '$lib/i18n/index.js';
	import { products } from '$lib/products.js';
	import LangToggle from '$lib/components/LangToggle.svelte';

	let { user }: { user: { isAdmin: boolean } | null } = $props();
	const t = getContext<Readable<Translator>>('t');
	const consoleHref = $derived(user?.isAdmin ? '/admin' : '/dashboard');
</script>

<footer class="foot">
	<div class="foot-grid">
		<div class="foot-brand">
			<span class="foot-snow" aria-hidden="true">❄</span>
			<span class="foot-word"><span class="frost">Frost</span>&thinsp;<strong>Tech</strong></span>
		</div>

		<nav class="foot-col" aria-label={$t('home.footer.products')}>
			<p class="foot-h">{$t('home.footer.products')}</p>
			{#each products as p}
				<a href={p.url} target="_blank" rel="noopener noreferrer">{p.name}</a>
			{/each}
		</nav>

		<nav class="foot-col" aria-label={$t('home.footer.identity')}>
			<p class="foot-h">{$t('home.footer.identity')}</p>
			{#if user}
				<a href={consoleHref}>{$t('home.nav.console')}</a>
				<a href="/dashboard#apps">{$t('home.nav.authz')}</a>
			{:else}
				<a href="/login">{$t('home.nav.login')}</a>
			{/if}
		</nav>

		<div class="foot-end">
			<LangToggle />
		</div>
	</div>

	<div class="foot-base">
		<span class="frost-tech"><span class="frost-spin" aria-hidden="true">❄</span> {$t('home.footer.made')}</span>
		<span>© {new Date().getFullYear()} {$t('home.footer.rights')}</span>
		<a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer" class="foot-icp">浙ICP备2026040257号-1</a>
	</div>
</footer>

<style>
	.foot { border-top: 1px solid var(--border); padding: 3rem clamp(1rem,4vw,2.5rem) 1.75rem; background: var(--surface); }
	.foot-grid { max-width: 1100px; margin: 0 auto; display: flex; flex-wrap: wrap; gap: 2rem 3rem; align-items: flex-start; }
	.foot-brand { display: inline-flex; align-items: center; gap: 0.5rem; margin-right: auto; }
	.foot-snow { font-size: 1.4rem; color: var(--accent-hi); }
	.foot-word { font-family: var(--font-display); font-size: 1.1rem; font-weight: 200; letter-spacing: 0.1em; color: var(--text); }
	.foot-word strong { font-weight: 600; }
	.foot-word .frost { color: var(--accent); }

	.foot-col { display: flex; flex-direction: column; gap: 0.6rem; }
	.foot-h { font-family: var(--font-body); font-size: 0.6rem; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--text-dim); opacity: 0.7; margin-bottom: 0.2rem; }
	.foot-col a { font-size: 0.8125rem; color: var(--text-dim); text-decoration: none; transition: color 0.15s; }
	.foot-col a:hover { color: var(--text); }
	.foot-col a:focus-visible { outline: 2px solid var(--accent-hi); outline-offset: 2px; }

	.foot-base { max-width: 1100px; margin: 2.5rem auto 0; padding-top: 1.5rem; border-top: 1px solid var(--border); display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; justify-content: space-between; font-size: 0.7rem; letter-spacing: 0.06em; color: var(--text-dim); opacity: 0.7; text-transform: uppercase; }
	.frost-tech { display: inline-flex; align-items: center; gap: 0.4rem; }
	.frost-spin { display: inline-block; animation: frostRotate 6s ease-in-out infinite; }
	@keyframes frostRotate { 0%,75% { transform: rotate(0deg); } 88% { transform: rotate(360deg); } 100% { transform: rotate(360deg); } }
	.foot-icp { color: var(--text-dim); text-decoration: none; opacity: 0.7; transition: opacity 0.15s; }
	.foot-icp:hover { opacity: 1; }
	@media (prefers-reduced-motion: reduce) { .frost-spin { animation: none; } }
</style>
