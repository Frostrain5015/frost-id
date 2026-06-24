<script lang="ts">
	import { TrendingUp, GraduationCap } from 'lucide-svelte';

	// Shared application logo, used on both the consent screen and the admin
	// console client list so each app's mark is identical in both places.
	let { name, size = 48 }: { name: string; size?: number } = $props();

	const lower       = $derived(name.toLowerCase());
	const isInvestory = $derived(lower.includes('investory'));
	const isPPTypeset = $derived(lower.includes('pp') || lower.includes('typeset'));
	const isBlades    = $derived(lower.includes('blades') || lower.includes('hex'));
	const isBoen      = $derived(lower.includes('boen'));
	const initial     = $derived(name[0]?.toUpperCase() ?? '?');

	function hashColor(n: string): string {
		const palette = ['#ec8f6a', '#6aad8f', '#7a9ec7', '#c77a9e', '#a88dc7', '#d4a86a', '#6aafb4', '#b48a7a'];
		let h = 0;
		for (let i = 0; i < n.length; i++) h = ((h << 5) - h) + n.charCodeAt(i);
		return palette[Math.abs(h) % palette.length];
	}
	const color = $derived(hashColor(name));
</script>

{#if isInvestory}
	<div class="app-icon investory" style="--s:{size}px" aria-hidden="true">
		<TrendingUp size={size * 0.5} color="#fff" strokeWidth={2} />
	</div>
{:else if isPPTypeset}
	<div class="app-icon pp" style="--s:{size}px" aria-hidden="true"><em>PP</em></div>
{:else if isBlades}
	<!-- Mirrors the Blades of Hex project favicon: the crossed-swords emoji. -->
	<div class="app-icon blades" style="--s:{size}px" aria-hidden="true">⚔️</div>
{:else if isBoen}
	<div class="app-icon boen" style="--s:{size}px" aria-hidden="true">
		<GraduationCap size={size * 0.5} color="#fff" strokeWidth={2} />
	</div>
{:else}
	<div
		class="app-icon initial"
		style="--s:{size}px; background: linear-gradient(135deg, {color}22, {color}44); border-color: {color}55; color: {color};"
		aria-hidden="true"
	>{initial}</div>
{/if}

<style>
	.app-icon {
		width: var(--s); height: var(--s);
		flex-shrink: 0;
		display: flex; align-items: center; justify-content: center;
		border-radius: calc(var(--s) * 0.29);
		line-height: 1;
	}
	.investory { background: linear-gradient(135deg, #863bff, #47bfff); border-radius: calc(var(--s) * 0.25); }
	.pp { background: #0A0A0D; border: 1px solid rgba(255, 255, 255, 0.08); }
	.pp em { font-family: 'Georgia', 'Times New Roman', serif; font-style: italic; font-weight: 700; font-size: calc(var(--s) * 0.46); color: #ea580c; }
	.blades { font-size: calc(var(--s) * 0.66); }
	.boen { background: linear-gradient(135deg, #d99a4e, #f0c275); border-radius: calc(var(--s) * 0.25); }
	.initial { border: 1.5px solid; font-family: var(--font-display); font-weight: 500; font-size: calc(var(--s) * 0.5); backdrop-filter: blur(4px); }
</style>
