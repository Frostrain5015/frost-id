<script lang="ts">
	import { TrendingUp } from 'lucide-svelte';

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
	<!-- Mirrors the Boen mascot: cream canvas + green graduate character. -->
	<div class="app-icon boen" style="--s:{size}px" aria-hidden="true">
		<svg viewBox="0 0 100 104" width={size} height={size} style="overflow: visible; color: #14b48a;">
			<defs>
				<radialGradient id="boenShine" cx="36%" cy="28%" r="78%">
					<stop offset="0%" stop-color="#ffffff" stop-opacity="0.6" />
					<stop offset="55%" stop-color="#ffffff" stop-opacity="0" />
				</radialGradient>
			</defs>
			<!-- body -->
			<circle cx="50" cy="55" r="33" fill="currentColor" />
			<path d="M20 64 A33 33 0 0 0 80 64 A40 40 0 0 1 20 64 Z" fill="#000" opacity="0.08" />
			<circle cx="50" cy="55" r="33" fill="url(#boenShine)" />
			<!-- blush -->
			<ellipse cx="31" cy="62" rx="6" ry="4" fill="#ff8a6a" opacity="0.35" />
			<ellipse cx="69" cy="62" rx="6" ry="4" fill="#ff8a6a" opacity="0.35" />
			<!-- brows -->
			<path d="M34 41 Q40 38 46 41" stroke="#2c2722" stroke-width="2" stroke-linecap="round" fill="none" />
			<path d="M54 41 Q60 38 66 41" stroke="#2c2722" stroke-width="2" stroke-linecap="round" fill="none" />
			<!-- eyes -->
			<ellipse cx="40" cy="51" rx="6.8" ry="7.8" fill="#fffdf9" />
			<ellipse cx="60" cy="51" rx="6.8" ry="7.8" fill="#fffdf9" />
			<circle cx="41.5" cy="52" r="3.5" fill="#2c2722" />
			<circle cx="61.5" cy="52" r="3.5" fill="#2c2722" />
			<circle cx="43" cy="50.2" r="1.2" fill="#fffdf9" />
			<circle cx="63" cy="50.2" r="1.2" fill="#fffdf9" />
			<!-- smile -->
			<path d="M42 65 Q50 71 58 65" stroke="#2c2722" stroke-width="2.4" stroke-linecap="round" fill="none" />
			<!-- graduation cap -->
			<rect x="40" y="19" width="20" height="9" rx="2" fill="#2c2722" />
			<polygon points="50,11 76,21 50,31 24,21" fill="#37322c" />
			<polygon points="50,13 70,21 50,29 30,21" fill="#2c2722" />
			<circle cx="50" cy="21" r="2.4" fill="currentColor" />
		</svg>
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
	.boen { background: linear-gradient(135deg, #fbf6ee, #f1ead9); border: 1px solid rgba(20, 180, 138, 0.18); border-radius: calc(var(--s) * 0.25); overflow: hidden; }
	.initial { border: 1.5px solid; font-family: var(--font-display); font-weight: 500; font-size: calc(var(--s) * 0.5); backdrop-filter: blur(4px); }
</style>
