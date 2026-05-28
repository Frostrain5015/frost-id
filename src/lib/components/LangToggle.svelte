<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable, Readable } from 'svelte/store';
	import type { Locale, Translator } from '$lib/i18n/index.js';

	const locale = getContext<Writable<Locale>>('locale');
	const t = getContext<Readable<Translator>>('t');

	function toggle() {
		locale.update((l) => (l === 'zh' ? 'en' : 'zh'));
	}
</script>

<button
	class="lang-btn"
	onclick={toggle}
	title={$t('lang.switch_to')}
	aria-label={$t('lang.switch_to')}
>
	{#if $locale === 'zh'}
		<span class="active">中</span><span class="sep" aria-hidden="true">/</span><span>EN</span>
	{:else}
		<span>中</span><span class="sep" aria-hidden="true">/</span><span class="active">EN</span>
	{/if}
</button>

<style>
	.lang-btn {
		display: inline-flex;
		align-items: center;
		gap: 0;
		padding: 0.3rem 0.6rem;
		font-family: var(--font-body);
		font-size: 0.65rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		color: var(--text-dim);
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 100px;
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
		outline: none;
	}
	.lang-btn:hover {
		border-color: var(--border-hi);
		color: var(--text);
		background: rgba(255,255,255,0.03);
	}
	.lang-btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.sep {
		margin: 0 0.2rem;
		opacity: 0.3;
		font-size: 0.55rem;
	}
	.active {
		color: var(--accent-hi);
		font-weight: 600;
	}
</style>
