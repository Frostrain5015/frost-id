<script lang="ts">
	// Decorative drifting snowflakes for the hero. Purely atmospheric, so it is
	// aria-hidden and fully disabled under prefers-reduced-motion.
	let { count = 26 }: { count?: number } = $props();

	const flakes = Array.from({ length: count }, (_, i) => {
		const r = (n: number) => Math.sin(i * 9301 + n * 49297) * 0.5 + 0.5; // deterministic
		return {
			left: Math.round(r(1) * 100),
			size: +(0.4 + r(2) * 0.9).toFixed(2), // rem
			delay: +(r(3) * -18).toFixed(2), // negative → already mid-fall
			duration: +(11 + r(4) * 12).toFixed(2),
			drift: Math.round(r(5) * 40 - 20), // px horizontal sway
			opacity: +(0.18 + r(6) * 0.45).toFixed(2)
		};
	});
</script>

<div class="snowfield" aria-hidden="true">
	{#each flakes as f}
		<span
			class="flake"
			style="left:{f.left}%; font-size:{f.size}rem; animation-delay:{f.delay}s; animation-duration:{f.duration}s; --drift:{f.drift}px; --o:{f.opacity};"
			>❄</span
		>
	{/each}
</div>

<style>
	.snowfield {
		position: absolute;
		inset: 0;
		overflow: hidden;
		pointer-events: none;
		z-index: 0;
	}
	.flake {
		position: absolute;
		top: -8%;
		color: var(--accent-hi);
		line-height: 1;
		opacity: 0;
		will-change: transform, opacity;
		animation-name: snow-fall;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}
	@keyframes snow-fall {
		0% { transform: translate3d(0, -10vh, 0) rotate(0deg); opacity: 0; }
		10% { opacity: var(--o); }
		90% { opacity: var(--o); }
		100% { transform: translate3d(var(--drift), 110vh, 0) rotate(220deg); opacity: 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.snowfield { display: none; }
	}
</style>
