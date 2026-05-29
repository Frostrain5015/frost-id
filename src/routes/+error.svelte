<script lang="ts">
	import { page } from '$app/stores';

	const STATUS = $derived($page.status);
	const ERROR  = $derived(($page.error as any)?.message ?? '');

	const CODES: Record<number, { icon: string; title: string; subtitle: string }> = {
		400: { icon: '◇', title: 'Bad Request',
			subtitle: 'The request could not be understood. Please check your input and try again.' },
		401: { icon: '⊡', title: 'Unauthorized',
			subtitle: 'You need to sign in to access this page.' },
		403: { icon: '⊡', title: 'Forbidden',
			subtitle: 'You do not have permission to access this resource.' },
		404: { icon: '◎', title: 'Page Not Found',
			subtitle: 'The page you are looking for does not exist or has been moved.' },
		410: { icon: '◈', title: 'Gone',
			subtitle: 'This resource is no longer available.' },
		429: { icon: '↻', title: 'Too Many Requests',
			subtitle: 'Please wait a moment before trying again.' },
	};

	const fallback = (code: number) => ({
		icon: '◆',
		title: code >= 500 ? 'Internal Server Error' : 'Something Went Wrong',
		subtitle: code >= 500
			? 'An internal error occurred. Our team has been notified.'
			: 'An unexpected error occurred. Please try again.'
	});

	const meta = $derived(CODES[STATUS] ?? fallback(STATUS));
</script>

<svelte:head>
	<title>{STATUS} — Frost ID</title>
</svelte:head>

<div class="scene">
	<div class="wrap">
		<div class="card">
			<div class="status-badge" class:status-5xx={STATUS >= 500}>
				<span class="status-num">{STATUS}</span>
			</div>

			<div class="icon-wrap">
				<span class="error-icon" aria-hidden="true">{meta.icon}</span>
			</div>

			<h1 class="title">{meta.title}</h1>
			<p class="subtitle">{meta.subtitle}</p>

			{#if ERROR && !ERROR.includes('Not Found') && ERROR !== meta.title}
				<details class="detail">
					<summary class="detail-summary">Technical detail</summary>
					<p class="detail-msg">{ERROR}</p>
				</details>
			{/if}

			<div class="actions">
				<a href="/" class="btn-primary">
					<span aria-hidden="true">❄</span>
					Back to Home
				</a>
				<button onclick={() => history.back()} class="btn-ghost">
					<span aria-hidden="true">←</span>
					Go Back
				</button>
			</div>
		</div>

		<div class="foot">
			<span>Frost ID</span>
			<span class="foot-sep" aria-hidden="true"></span>
			<span>OAuth 2.1</span>
		</div>
	</div>
</div>

<style>
	.scene {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		padding: 1.5rem;
	}
	.wrap { width: 100%; max-width: 440px; }

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		padding: 3rem 2.5rem 2.25rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		animation: fadeUp 0.6s cubic-bezier(0.22,1,0.36,1);
	}

	.status-badge {
		display: inline-flex;
		padding: 0.25rem 0.75rem;
		border-radius: 99px;
		font-family: var(--font-mono);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		margin-bottom: 1.5rem;
		background: rgba(217,92,92,0.06);
		border: 1px solid rgba(217,92,92,0.15);
		color: #e88383;
	}
	.status-5xx { background: rgba(217,92,92,0.1); border-color: rgba(217,92,92,0.25); color: #ec9e9e; }

	.icon-wrap { margin-bottom: 1.25rem; }
	.error-icon {
		display: block;
		font-size: 2.5rem;
		line-height: 1;
		color: var(--accent);
		opacity: 0.7;
		animation: iconPulse 2s ease-in-out infinite;
	}

	.title {
		font-family: var(--font-display);
		font-size: 1.75rem;
		font-weight: 300;
		color: var(--text);
		letter-spacing: 0.03em;
		line-height: 1.15;
		margin-bottom: 0.625rem;
	}
	.subtitle {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--text-dim);
		line-height: 1.6;
		max-width: 320px;
	}

	.detail { width: 100%; margin-top: 1.25rem; text-align: left; }
	.detail-summary {
		font-size: 0.6875rem;
		color: var(--text-dim);
		opacity: 0.4;
		cursor: pointer;
		letter-spacing: 0.04em;
		margin-bottom: 0.5rem;
	}
	.detail-summary:hover { opacity: 0.7; }
	.detail-msg {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--text-dim);
		opacity: 0.5;
		line-height: 1.6;
		padding: 0.75rem;
		background: rgba(255,255,255,0.02);
		border-radius: var(--radius-md);
		border: 1px solid rgba(255,255,255,0.04);
		word-break: break-word;
	}

	.actions { display: flex; flex-direction: column; gap: 0.625rem; width: 100%; margin-top: 1.75rem; }

	.btn-primary {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		height: 48px;
		width: 100%;
		font-family: var(--font-display);
		font-size: 0.875rem;
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		text-decoration: none;
		color: #fff;
		background: var(--accent);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		outline: none;
		transition: filter 0.18s, transform 0.15s;
	}
	.btn-primary:hover { filter: brightness(1.15); transform: translateY(-1px); }
	.btn-primary:active { transform: scale(0.98); }

	.btn-ghost {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		height: 40px;
		width: 100%;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--text-dim);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		outline: none;
		opacity: 0.6;
		text-decoration: none;
		transition: color 0.15s, opacity 0.15s;
	}
	.btn-ghost:hover { color: var(--text); opacity: 0.9; }

	.foot {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
		font-size: 0.6rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-dim);
		opacity: 0.35;
	}
	.foot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); opacity: 0.35; }

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(12px); }
		to   { opacity: 1; transform: translateY(0); }
	}
	@keyframes iconPulse {
		0%, 100% { opacity: 0.7; transform: scale(1); }
		50%       { opacity: 0.4; transform: scale(1.1); }
	}
</style>
