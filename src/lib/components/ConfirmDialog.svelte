<script lang="ts">
	import { confirmation, resolveConfirmation } from '$lib/stores/confirmation.js';

	let panel = $state<HTMLDivElement | undefined>();
	let previousFocus: HTMLElement | null = null;

	$effect(() => {
		if (!$confirmation) return;

		previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		setTimeout(() => panel?.focus(), 0);

		return () => {
			document.body.style.overflow = previousOverflow;
			previousFocus?.focus();
			previousFocus = null;
		};
	});

	function close(accepted: boolean): void {
		resolveConfirmation(accepted);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (!$confirmation) return;

		if (event.key === 'Escape') {
			event.preventDefault();
			close(false);
			return;
		}

		if (event.key !== 'Tab' || !panel) return;

		const focusable = Array.from(
			panel.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		);
		if (focusable.length === 0) return;

		const first = focusable[0];
		const last = focusable[focusable.length - 1];

		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if $confirmation}
	<div
		class="confirm-layer"
		role="presentation"
		onclick={(event) => {
			if (event.target === event.currentTarget) close(false);
		}}
	>
		<div
			class="confirm-card"
			class:confirm-card--danger={$confirmation.variant === 'danger'}
			role="dialog"
			aria-modal="true"
			aria-labelledby={`confirm-title-${$confirmation.id}`}
			tabindex="-1"
			bind:this={panel}
		>
			<div class="confirm-mark" aria-hidden="true"></div>
			<div class="confirm-copy">
				<h2 id={`confirm-title-${$confirmation.id}`}>{$confirmation.title}</h2>
				<p>{$confirmation.message}</p>
			</div>
			<div class="confirm-actions">
				<button type="button" class="confirm-btn confirm-btn--ghost" onclick={() => close(false)}>
					{$confirmation.cancelLabel}
				</button>
				<button
					type="button"
					class="confirm-btn confirm-btn--primary"
					class:confirm-btn--danger={$confirmation.variant === 'danger'}
					onclick={() => close(true)}
				>
					{$confirmation.confirmLabel}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.confirm-layer {
		position: fixed;
		inset: 0;
		z-index: 200;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.25rem;
		background: rgba(4,5,8,0.72);
		backdrop-filter: blur(14px);
		animation: confirmLayerIn 0.18s ease both;
	}

	.confirm-card {
		position: relative;
		width: min(100%, 430px);
		padding: 1.25rem;
		border: 1px solid rgba(113,118,170,0.28);
		border-radius: var(--radius-lg);
		background:
			linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)),
			var(--surface);
		box-shadow: 0 24px 80px rgba(0,0,0,0.42);
		outline: none;
		animation: confirmCardIn 0.22s cubic-bezier(0.22,1,0.36,1) both;
	}

	.confirm-card--danger {
		border-color: rgba(217,92,92,0.32);
	}

	.confirm-mark {
		width: 2rem;
		height: 2rem;
		margin-bottom: 1rem;
		border: 1px solid rgba(113,118,170,0.32);
		border-radius: 999px;
		background: radial-gradient(circle at center, var(--accent-hi) 0 23%, rgba(113,118,170,0.16) 24% 100%);
		box-shadow: 0 0 0 6px rgba(113,118,170,0.08);
	}

	.confirm-card--danger .confirm-mark {
		border-color: rgba(217,92,92,0.36);
		background: radial-gradient(circle at center, var(--error) 0 23%, rgba(217,92,92,0.14) 24% 100%);
		box-shadow: 0 0 0 6px rgba(217,92,92,0.08);
	}

	.confirm-copy h2 {
		margin: 0 0 0.45rem;
		font-family: var(--font-display);
		font-size: 1.1rem;
		font-weight: 400;
		letter-spacing: 0.03em;
		color: var(--text);
		line-height: 1.25;
	}

	.confirm-copy p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.65;
		color: var(--text-dim);
	}

	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.625rem;
		margin-top: 1.25rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border);
	}

	.confirm-btn {
		min-height: 44px;
		padding: 0 1rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-display);
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		cursor: pointer;
		outline: none;
		transition: color 0.15s, border-color 0.15s, background 0.15s, filter 0.15s;
	}

	.confirm-btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.confirm-btn--ghost {
		color: var(--text-dim);
		background: transparent;
		border: 1px solid var(--border);
	}

	.confirm-btn--ghost:hover {
		color: var(--text);
		border-color: var(--border-hi);
		background: rgba(255,255,255,0.03);
	}

	.confirm-btn--primary {
		color: #fff;
		background: var(--accent);
		border: 1px solid var(--accent);
	}

	.confirm-btn--primary:hover {
		filter: brightness(1.12);
	}

	.confirm-btn--danger {
		background: rgba(217,92,92,0.16);
		border-color: rgba(217,92,92,0.38);
		color: #f0a0a0;
	}

	.confirm-btn--danger:hover {
		background: rgba(217,92,92,0.24);
	}

	@keyframes confirmLayerIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@keyframes confirmCardIn {
		from { opacity: 0; transform: translateY(10px) scale(0.985); }
		to { opacity: 1; transform: translateY(0) scale(1); }
	}

	@media (max-width: 520px) {
		.confirm-layer { align-items: flex-end; padding: 0.75rem; }
		.confirm-card { width: 100%; }
		.confirm-actions { flex-direction: column-reverse; }
		.confirm-btn { width: 100%; }
	}

	@media (prefers-reduced-motion: reduce) {
		.confirm-layer,
		.confirm-card {
			animation: none;
		}
	}
</style>
