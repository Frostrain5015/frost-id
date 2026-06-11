<script lang="ts">
	import type { Snippet } from 'svelte';

	type NoticeVariant = 'success' | 'error' | 'warning' | 'info';

	let {
		variant = 'info',
		center = false,
		children
	}: {
		variant?: NoticeVariant;
		center?: boolean;
		children?: Snippet;
	} = $props();

	const role = $derived(variant === 'error' ? 'alert' : 'status');
	const live = $derived(variant === 'error' ? 'assertive' : 'polite');
</script>

<div
	class={`system-notice system-notice--${variant}`}
	class:system-notice--center={center}
	role={role}
	aria-live={live}
>
	<span class="system-notice__mark" aria-hidden="true"></span>
	<div class="system-notice__body">
		{#if children}
			{@render children()}
		{/if}
	</div>
</div>

<style>
	.system-notice {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		width: 100%;
		margin-bottom: 1.25rem;
		padding: 0.75rem 0.875rem;
		border: 1px solid var(--notice-border);
		border-radius: var(--radius-md);
		background:
			linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0)),
			var(--notice-bg);
		color: var(--notice-text);
		font-family: var(--font-body);
		font-size: 0.8125rem;
		line-height: 1.55;
		box-shadow: 0 14px 36px rgba(0,0,0,0.16);
		animation: noticeIn 0.22s cubic-bezier(0.22,1,0.36,1) both;
	}

	.system-notice--center {
		align-items: center;
		text-align: center;
	}

	.system-notice__mark {
		position: relative;
		width: 0.625rem;
		height: 0.625rem;
		margin-top: 0.4rem;
		border-radius: 999px;
		background: currentColor;
		box-shadow: 0 0 0 4px color-mix(in srgb, currentColor 16%, transparent);
		flex: 0 0 auto;
	}

	.system-notice--center .system-notice__mark {
		margin-top: 0;
	}

	.system-notice__body {
		flex: 1;
		min-width: 0;
	}

	.system-notice--success {
		--notice-bg: rgba(94,186,125,0.08);
		--notice-border: rgba(94,186,125,0.24);
		--notice-text: #8fd9a0;
	}

	.system-notice--error {
		--notice-bg: rgba(217,92,92,0.08);
		--notice-border: rgba(217,92,92,0.26);
		--notice-text: #e88383;
	}

	.system-notice--warning {
		--notice-bg: rgba(232,168,102,0.08);
		--notice-border: rgba(232,168,102,0.26);
		--notice-text: #e8b574;
	}

	.system-notice--info {
		--notice-bg: rgba(113,118,170,0.08);
		--notice-border: rgba(113,118,170,0.26);
		--notice-text: var(--accent-hi);
	}

	@keyframes noticeIn {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	@media (prefers-reduced-motion: reduce) {
		.system-notice { animation: none; }
	}
</style>
