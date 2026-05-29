<script lang="ts">
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { Translator } from '$lib/i18n/index.js';
	import type { PageData } from './$types';
	import { products } from '$lib/products.js';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import Snowfield from '$lib/components/Snowfield.svelte';
	import ProductCard from '$lib/components/ProductCard.svelte';
	import SiteFooter from '$lib/components/SiteFooter.svelte';

	let { data }: { data: PageData } = $props();
	const t = getContext<Readable<Translator>>('t');
</script>

<svelte:head>
	<title>{$t('home.meta_title')}</title>
	<meta name="description" content={$t('home.meta_desc')} />
</svelte:head>

<div class="home">
	<SiteNav user={data.user} />

	<!-- ── Hero ──────────────────────────────────────────── -->
	<section class="hero">
		<Snowfield />
		<div class="hero-glow" aria-hidden="true"></div>
		<div class="hero-inner">
			<p class="eyebrow up u1"><span class="eyebrow-snow" aria-hidden="true">❄</span> {$t('home.hero.eyebrow')}</p>
			<h1 class="hero-title up u2">{$t('home.hero.title')}</h1>
			<p class="hero-lead up u3">{$t('home.hero.lead')}</p>
			<div class="hero-cta up u4">
				<a class="btn-primary" href="#ecosystem">{$t('home.hero.cta_explore')}</a>
				{#if !data.user}
					<a class="btn-ghost" href="/login">{$t('home.hero.cta_login')}</a>
				{/if}
			</div>

			<!-- Ecosystem constellation: Frost ID hub → the three products -->
			<div class="orbit up u5" aria-hidden="true">
				<div class="orbit-core">
					<span class="orbit-snow">❄</span>
				</div>
				<p class="orbit-core-label">{$t('home.hero.core_label')}</p>
				<div class="orbit-stem"></div>
				<div class="orbit-rail">
					{#each products as p}
						<div class="orbit-node">
							<span class="orbit-drop"></span>
							<AppIcon name={p.name} size={44} />
							<span class="orbit-name">{p.name}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- ── Ecosystem / products ──────────────────────────── -->
	<section id="ecosystem" class="ecosystem">
		<div class="section-head up u1">
			<p class="eyebrow">{$t('home.ecosystem.eyebrow')}</p>
			<h2 class="section-title">{$t('home.ecosystem.title')}</h2>
		</div>
		<div class="grid">
			{#each products as p, i}
				<div class="up" style="animation-delay:{0.1 + i * 0.1}s">
					<ProductCard product={p} index={i} />
				</div>
			{/each}
		</div>
	</section>

	<!-- ── Frost ID identity band ────────────────────────── -->
	<section class="frostid">
		<div class="frostid-card up u1">
			<div class="frostid-brand">
				<span class="frostid-mark" aria-hidden="true">❄</span>
				<h2 class="frostid-wordmark"><span class="frost">Frost</span> <strong>ID</strong></h2>
			</div>
			<p class="frostid-desc">{$t('home.frostid.desc')}</p>
			<div class="frostid-cta">
				{#if data.user}
					<a class="btn-primary" href="/dashboard#apps">{$t('home.frostid.cta_authz')}</a>
					<a class="btn-ghost" href={data.user.isAdmin ? '/admin' : '/dashboard'}>{$t('home.nav.console')}</a>
				{:else}
					<a class="btn-primary" href="/login">{$t('home.frostid.cta_login')}</a>
				{/if}
			</div>
		</div>
	</section>

	<SiteFooter user={data.user} />
</div>

<style>
	.home { min-height: 100vh; background: var(--bg); overflow-x: hidden; }

	.up { animation: fadeUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
	.u1 { animation-delay: 0.05s; }
	.u2 { animation-delay: 0.15s; }
	.u3 { animation-delay: 0.26s; }
	.u4 { animation-delay: 0.37s; }
	.u5 { animation-delay: 0.5s; }
	@media (prefers-reduced-motion: reduce) {
		.up { animation: none; }
	}

	.eyebrow { display: inline-flex; align-items: center; gap: 0.45rem; font-family: var(--font-body); font-size: 0.65rem; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-dim); }
	.eyebrow-snow { color: var(--accent-hi); }

	/* ── Hero ───────────────────────────────────────────── */
	.hero { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 7rem 1.25rem 4rem; overflow: hidden; }
	.hero-glow { position: absolute; inset: 0; z-index: 0; pointer-events: none;
		background:
			radial-gradient(60% 50% at 50% 18%, rgba(113,118,170,0.20), transparent 70%),
			radial-gradient(40% 40% at 80% 80%, rgba(137,142,196,0.10), transparent 70%),
			radial-gradient(40% 40% at 15% 70%, rgba(70,120,190,0.08), transparent 70%);
	}
	.hero-inner { position: relative; z-index: 1; max-width: 880px; text-align: center; display: flex; flex-direction: column; align-items: center; }
	.hero-title { margin-top: 1.1rem; font-family: var(--font-display); font-weight: 200; font-size: clamp(2.4rem, 6vw, 4.5rem); line-height: 1.08; letter-spacing: -0.01em; color: var(--text); }
	.hero-lead { margin-top: 1.25rem; max-width: 40rem; font-size: clamp(0.95rem, 2vw, 1.125rem); line-height: 1.7; color: var(--text-dim); }
	.hero-cta { margin-top: 2rem; display: flex; flex-wrap: wrap; gap: 0.85rem; justify-content: center; }
	.hero-cta :global(.btn-primary), .hero-cta :global(.btn-ghost) { height: 46px; padding: 0 1.5rem; text-decoration: none; }

	/* ── Constellation ──────────────────────────────────── */
	.orbit { margin-top: 3.5rem; display: flex; flex-direction: column; align-items: center; }
	.orbit-core { position: relative; width: 88px; height: 88px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--border-hi); background: radial-gradient(circle, rgba(113,118,170,0.22), transparent 70%); }
	.orbit-core::after { content: ''; position: absolute; inset: -12px; border-radius: 50%; border: 1px solid rgba(137,142,196,0.18); animation: pulse 4s ease-in-out infinite; }
	.orbit-snow { font-size: 2.8rem; color: var(--accent-hi); text-shadow: 0 0 22px rgba(137,142,196,0.6); }
	.orbit-core-label { margin-top: 0.5rem; font-family: var(--font-display); font-size: 0.75rem; letter-spacing: 0.22em; text-transform: uppercase; color: var(--text-dim); }
	.orbit-stem { width: 1px; height: 34px; background: linear-gradient(var(--border-hi), transparent); }
	.orbit-rail { position: relative; display: flex; flex-wrap: wrap; justify-content: center; gap: 2.5rem; padding-top: 0.5rem; }
	.orbit-rail::before { content: ''; position: absolute; top: 0; left: 12%; right: 12%; height: 1px; background: linear-gradient(90deg, transparent, var(--border-hi), transparent); }
	.orbit-node { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.55rem; }
	.orbit-drop { width: 1px; height: 14px; background: var(--border-hi); }
	.orbit-name { font-size: 0.7rem; letter-spacing: 0.08em; color: var(--text-dim); }
	@keyframes pulse { 0%,100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.12); opacity: 0.9; } }
	@media (max-width: 560px) { .orbit-rail::before { display: none; } .orbit-drop { display: none; } }

	/* ── Ecosystem ──────────────────────────────────────── */
	.ecosystem { max-width: 1100px; margin: 0 auto; padding: 5rem clamp(1rem,4vw,2.5rem); }
	.section-head { text-align: center; margin-bottom: 2.5rem; }
	.section-title { margin-top: 0.6rem; font-family: var(--font-display); font-weight: 200; font-size: clamp(1.8rem, 4vw, 2.75rem); color: var(--text); letter-spacing: -0.01em; }
	.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; align-items: stretch; }
	.grid > .up { display: flex; }
	.grid > .up > :global(.card) { width: 100%; }
	@media (max-width: 900px) { .grid { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; } }

	/* ── Frost ID band ──────────────────────────────────── */
	.frostid { padding: 4rem clamp(1rem,4vw,2.5rem) 6rem; }
	.frostid-card { position: relative; max-width: 720px; margin: 0 auto; text-align: center; padding: 3rem 2rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
	.frostid-card::before { content: ''; position: absolute; inset: 0; pointer-events: none; background: radial-gradient(80% 60% at 50% 0%, rgba(113,118,170,0.14), transparent 70%); }
	.frostid-brand { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; margin-bottom: 0.5rem; }
	.frostid-mark { font-size: 2.7rem; line-height: 1; color: var(--accent-hi); text-shadow: 0 0 20px rgba(137,142,196,0.5); }
	.frostid-wordmark { font-family: var(--font-display); font-size: 1.98rem; font-weight: 200; letter-spacing: 0.08em; line-height: 1; color: var(--text); }
	.frostid-wordmark strong { font-weight: 500; color: var(--text); }
	.frostid-wordmark .frost { color: var(--accent); }
	.frostid-desc { position: relative; margin: 1rem auto 0; max-width: 34rem; font-size: 0.95rem; line-height: 1.7; color: var(--text-dim); }
	.frostid-cta { position: relative; margin-top: 1.75rem; display: flex; gap: 0.85rem; justify-content: center; flex-wrap: wrap; }
	.frostid-cta :global(.btn-primary), .frostid-cta :global(.btn-ghost) { height: 46px; padding: 0 1.5rem; text-decoration: none; }

	@media (prefers-reduced-motion: reduce) {
		.orbit-core::after { animation: none; }
	}
</style>
