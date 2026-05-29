<script lang="ts">
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { Translator } from '$lib/i18n/index.js';
	import type { Product } from '$lib/products.js';
	import AppIcon from '$lib/components/AppIcon.svelte';

	let { product, index = 0 }: { product: Product; index?: number } = $props();

	const t = getContext<Readable<Translator>>('t');

	const features = $derived(
		Array.from({ length: product.featureCount }, (_, i) => `home.products.${product.key}.f${i + 1}`)
	);
	const kindLabel = $derived(
		product.kind === 'partner' ? 'home.ecosystem.partner' : 'home.ecosystem.owned'
	);
</script>

<article
	class="card"
	class:partner={product.kind === 'partner'}
	style="--brand:{product.brand}; --brand-alt:{product.brandAlt ?? product.brand}; --i:{index};"
>
	<div class="card-top">
		<AppIcon name={product.name} size={52} />
		<span class="kind" class:kind--partner={product.kind === 'partner'}>{$t(kindLabel)}</span>
	</div>

	<h3 class="card-name">{product.name}</h3>
	<p class="card-tagline">{$t(`home.products.${product.key}.tagline`)}</p>
	<p class="card-desc">{$t(`home.products.${product.key}.desc`)}</p>

	<ul class="card-feats">
		{#each features as f}
			<li><span class="dot" aria-hidden="true"></span>{$t(f)}</li>
		{/each}
	</ul>

	<a class="card-cta" href={product.url} target="_blank" rel="noopener noreferrer">
		{$t('home.ecosystem.visit')}<span class="arrow" aria-hidden="true">→</span>
	</a>
</article>

<style>
	.card {
		position: relative;
		display: flex; flex-direction: column;
		padding: 1.75rem 1.5rem 1.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		overflow: hidden;
		transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), border-color 0.25s, box-shadow 0.25s;
	}
	/* brand accent line along the top — the only saturated use of --brand */
	.card::before {
		content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
		background: linear-gradient(90deg, var(--brand), var(--brand-alt));
		opacity: 0.85;
	}
	/* soft brand glow that intensifies on hover */
	.card::after {
		content: ''; position: absolute; inset: 0; pointer-events: none;
		background: radial-gradient(120% 80% at 50% -10%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 60%);
		opacity: 0; transition: opacity 0.3s;
	}
	.card:hover { transform: translateY(-4px); border-color: color-mix(in srgb, var(--brand) 40%, var(--border)); box-shadow: 0 18px 50px rgba(0,0,0,0.4); }
	.card:hover::after { opacity: 1; }

	.card-top { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; margin-bottom: 1.1rem; }
	.kind {
		font-family: var(--font-body); font-size: 0.6rem; font-weight: 500; letter-spacing: 0.14em;
		text-transform: uppercase; color: var(--text-dim);
		padding: 0.25rem 0.6rem; border: 1px solid var(--border); border-radius: 100px;
	}
	.kind--partner { color: color-mix(in srgb, var(--brand) 70%, var(--text-dim)); border-color: color-mix(in srgb, var(--brand) 35%, var(--border)); }

	.card-name { font-family: var(--font-display); font-size: 1.3rem; font-weight: 400; color: var(--text); letter-spacing: 0.01em; }
	.card-tagline { margin-top: 0.2rem; font-size: 0.8125rem; color: color-mix(in srgb, var(--brand) 60%, var(--text)); }
	.card-desc { margin-top: 0.75rem; font-size: 0.875rem; line-height: 1.6; color: var(--text-dim); }

	.card-feats { list-style: none; margin: 1.1rem 0 1.4rem; display: flex; flex-direction: column; gap: 0.5rem; }
	.card-feats li { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8125rem; color: var(--text); }
	.dot { width: 5px; height: 5px; border-radius: 50%; background: var(--brand); box-shadow: 0 0 8px color-mix(in srgb, var(--brand) 60%, transparent); flex-shrink: 0; }

	.card-cta {
		margin-top: auto; align-self: flex-start;
		display: inline-flex; align-items: center; gap: 0.4rem;
		font-family: var(--font-display); font-size: 0.8125rem; font-weight: 400; letter-spacing: 0.08em;
		text-transform: uppercase; text-decoration: none; color: var(--text-dim);
		transition: color 0.18s, gap 0.18s;
	}
	.card-cta:hover { color: color-mix(in srgb, var(--brand) 75%, #fff); gap: 0.65rem; }
	.card-cta:focus-visible { outline: 2px solid var(--brand); outline-offset: 3px; border-radius: 2px; }
	.arrow { transition: transform 0.18s; }
	.card-cta:hover .arrow { transform: translateX(2px); }

	@media (prefers-reduced-motion: reduce) {
		.card, .card-cta, .arrow { transition: none; }
		.card:hover { transform: none; }
	}
</style>
