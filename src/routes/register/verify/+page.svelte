<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, onDestroy, getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import SystemNotice from '$lib/components/SystemNotice.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let mounted     = $state(false);
	let verifying   = $state(false);
	let resending   = $state(false);
	let errorShake  = $state(false);
	let errorMsg    = $state('');
	let resent      = $state(false);
	let success     = $state(false);

	// Countdown: 10 minutes
	let secondsLeft = $state(10 * 60);
	let timer: ReturnType<typeof setInterval> | undefined;

	// OTP digits state — 6 individual inputs for UX, joined on submit
	let digits = $state(['', '', '', '', '', '']);
	let inputRefs: HTMLInputElement[] = [];

	const codeValue = $derived(digits.join(''));

	onMount(() => {
		mounted = true;
		timer = setInterval(() => {
			secondsLeft = Math.max(0, secondsLeft - 1);
		}, 1000);
		// Auto-focus first digit
		setTimeout(() => inputRefs[0]?.focus(), 300);
	});

	onDestroy(() => { if (timer) clearInterval(timer); });

	const timerDisplay = $derived(() => {
		const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
		const s = (secondsLeft % 60).toString().padStart(2, '0');
		return `${m}:${s}`;
	});

	$effect(() => {
		if (form?.errorKey) {
			errorMsg   = form.errorKey;
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
		}
		if (form?.resent) {
			resent = true;
			secondsLeft = 10 * 60;
			setTimeout(() => (resent = false), 3000);
		}
	});

	function onDigitInput(index: number, e: Event) {
		const input = e.target as HTMLInputElement;
		const val = input.value.replace(/\D/g, '').slice(-1);
		digits[index] = val;
		if (val && index < 5) {
			inputRefs[index + 1]?.focus();
		}
	}

	function onDigitKeyDown(index: number, e: KeyboardEvent) {
		if (e.key === 'Backspace' && !digits[index] && index > 0) {
			digits[index - 1] = '';
			inputRefs[index - 1]?.focus();
		}
		if (e.key === 'ArrowLeft' && index > 0) inputRefs[index - 1]?.focus();
		if (e.key === 'ArrowRight' && index < 5) inputRefs[index + 1]?.focus();
	}

	// Handle paste: distribute digits across boxes
	function onPaste(e: ClipboardEvent) {
		e.preventDefault();
		const pasted = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
		pasted.split('').forEach((ch, i) => { digits[i] = ch; });
		const next = Math.min(pasted.length, 5);
		inputRefs[next]?.focus();
	}

	function handleVerifyEnhance() {
		if (codeValue.length < 6) {
			errorMsg   = 'register.err_code_invalid';
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
			return;
		}
		errorMsg  = '';
		verifying = true;
		return async ({ result, update }: { result: { type: string }, update: (o?: { reset?: boolean }) => Promise<void> }) => {
			if (result.type === 'redirect') {
				success = true;
				// brief success flash before SvelteKit navigates
				await new Promise(r => setTimeout(r, 600));
			}
			await update({ reset: false });
			verifying = false;
		};
	}

	function handleResendEnhance() {
		resending = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			resending = false;
		};
	}
</script>

<svelte:head>
	<title>{$t('register.verify_page_title')}</title>
</svelte:head>

<div class="scene">
	<main class="wrap" class:mounted>
		<div class="card" class:shake={errorShake} class:success>

			<!-- Brand -->
			<header class="brand">
				<span class="mark-icon brand-mark" aria-hidden="true">❄</span>
				<h1 class="wordmark"><span class="frost">Frost</span> <strong>ID</strong></h1>
				<p class="tagline">{$t('common.auth_server')}</p>
			</header>

			{#if success}
				<!-- Success flash -->
				<div class="success-state" aria-live="polite">
					<span class="success-icon" aria-hidden="true">✓</span>
					<p class="success-text">Account created</p>
				</div>
			{:else}
				<!-- Envelope icon -->
				<div class="mail-icon-wrap" aria-hidden="true">
					<div class="mail-icon">
						<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="4" y="10" width="40" height="28" rx="3" stroke="currentColor" stroke-width="2"/>
							<path d="M4 14l20 14 20-14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
						</svg>
						<div class="mail-pulse" aria-hidden="true"></div>
					</div>
				</div>

				<h2 class="heading">{$t('register.verify_heading')}</h2>

				<p class="subtext">
					{$t('register.verify_sent_to')}<br />
					<span class="email-accent">{data.maskedEmail}</span>
				</p>

				{#if errorMsg}
					<SystemNotice variant="error" center>{$t(errorMsg)}</SystemNotice>
				{/if}

				{#if resent}
					<SystemNotice variant="success" center>{$t('register.verify_resent')}</SystemNotice>
				{/if}

				<!-- Verify form -->
				<form method="POST" action="?/verify" novalidate use:enhance={handleVerifyEnhance}>
					<input type="hidden" name="token"  value={data.token} />
					<input type="hidden" name="code"   value={codeValue} />

					<!-- OTP 6-box input -->
					<div class="otp-row" role="group" aria-label={$t('register.verify_code_label')}>
						{#each digits as digit, i}
							<input
								bind:this={inputRefs[i]}
								type="text"
								inputmode="numeric"
								pattern="[0-9]*"
								maxlength="1"
								class="otp-box"
								class:otp-box--filled={digit !== ''}
								value={digit}
								oninput={(e) => onDigitInput(i, e)}
								onkeydown={(e) => onDigitKeyDown(i, e)}
								onpaste={onPaste}
								autocomplete={i === 0 ? 'one-time-code' : 'off'}
								aria-label={`Digit ${i + 1}`}
								disabled={verifying}
							/>
						{/each}
					</div>

					<!-- Timer -->
					<p class="timer" class:timer--urgent={secondsLeft <= 60} class:timer--expired={secondsLeft === 0}>
						{#if secondsLeft > 0}
							<span class="timer-dot" aria-hidden="true"></span>
							{$t('register.verify_page_title').split('—')[0].trim()} — {timerDisplay()}
						{:else}
							Code expired
						{/if}
					</p>

					<button
						type="submit"
						class="submit"
						disabled={verifying || codeValue.length < 6 || secondsLeft === 0}
						aria-busy={verifying}
					>
						{#if verifying}
							<svg class="spinner" viewBox="0 0 24 24" aria-hidden="true">
								<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
									stroke-width="2" stroke-dasharray="56.5" stroke-dashoffset="42"
									stroke-linecap="round"/>
							</svg>
						{:else}
							{$t('register.verify_submit')}
						{/if}
					</button>
				</form>

				<!-- Resend form -->
				<form method="POST" action="?/resend" use:enhance={handleResendEnhance} class="resend-form">
					<input type="hidden" name="token" value={data.token} />
					<button type="submit" class="resend-btn" disabled={resending || secondsLeft > 540}>
						{resending ? $t('register.verify_resending') : $t('register.verify_resend')}
					</button>
				</form>

				<!-- Back link -->
				<a href="/register" class="back-link">
					<span aria-hidden="true">←</span>
					{$t('register.verify_back')}
				</a>
			{/if}

		</div>
	</main>

	<div class="foot-outer">
		<LangToggle />
	</div>
</div>

<style>
	/* ── Scene ────────────────────────────────────────────────────────────── */
	.scene {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--bg);
		padding: 1.5rem;
	}

	.wrap {
		width: 100%;
		max-width: 420px;
		opacity: 0;
		transform: translateY(18px);
		transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1);
	}
	.wrap.mounted { opacity: 1; transform: translateY(0); }

	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-xl);
		padding: 2.75rem 2.5rem 2.25rem;
		transition: box-shadow 0.3s ease;
	}
	.card.shake { animation: shake 0.45s ease; }
	.card.success {
		border-color: rgba(113, 118, 170, 0.4);
		box-shadow: 0 0 40px rgba(113, 118, 170, 0.12);
	}

	/* ── Brand ────────────────────────────────────────────────────────────── */
	.brand {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.375rem;
		margin-bottom: 2rem;
	}
	.mark-icon { font-size: 2.5rem; line-height: 1; margin-bottom: 0.25rem; }
	.wordmark {
		font-family: var(--font-display);
		font-size: 3rem;
		font-weight: 200;
		letter-spacing: 0.08em;
		line-height: 1;
		color: var(--text);
	}
	.wordmark strong { font-weight: 500; }
	.frost { color: var(--accent); }
	.tagline {
		font-family: var(--font-body);
		font-size: 0.55rem;
		font-weight: 400;
		letter-spacing: 0.35em;
		text-transform: uppercase;
		color: var(--text-dim);
		opacity: 0.6;
		margin-top: 0.125rem;
	}

	/* ── Mail Icon ────────────────────────────────────────────────────────── */
	.mail-icon-wrap {
		display: flex;
		justify-content: center;
		margin-bottom: 1.5rem;
	}
	.mail-icon {
		position: relative;
		width: 64px;
		height: 64px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
	}
	.mail-icon svg {
		width: 48px;
		height: 48px;
		position: relative;
		z-index: 1;
		filter: drop-shadow(0 0 8px rgba(113,118,170,0.4));
		animation: mailFloat 3s ease-in-out infinite;
	}
	.mail-pulse {
		position: absolute;
		inset: -4px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(113,118,170,0.12) 0%, transparent 70%);
		animation: pulse 2.5s ease-in-out infinite;
	}

	/* ── Heading ──────────────────────────────────────────────────────────── */
	.heading {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 300;
		color: var(--text);
		text-align: center;
		letter-spacing: 0.02em;
		line-height: 1.15;
		margin-bottom: 0.625rem;
	}
	.subtext {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--text-dim);
		text-align: center;
		line-height: 1.6;
		margin-bottom: 1.75rem;
	}
	.email-accent {
		color: var(--accent-hi);
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	/* ── OTP Input ────────────────────────────────────────────────────────── */
	.otp-row {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.otp-box {
		width: 48px;
		height: 60px;
		text-align: center;
		font-family: 'Courier New', 'Courier', monospace;
		font-size: 1.75rem;
		font-weight: 600;
		color: var(--text);
		background: rgba(255,255,255,0.03);
		border: 1.5px solid rgba(113,118,170,0.2);
		border-radius: var(--radius-md);
		outline: none;
		-webkit-appearance: none;
		caret-color: var(--accent);
		transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
		padding: 0;
	}
	.otp-box:focus {
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-ring);
		background: rgba(113,118,170,0.06);
	}
	.otp-box.otp-box--filled {
		border-color: rgba(113,118,170,0.45);
		background: rgba(113,118,170,0.06);
		color: var(--accent-hi);
	}
	.otp-box:disabled { opacity: 0.5; cursor: not-allowed; }

	/* ── Timer ────────────────────────────────────────────────────────────── */
	.timer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--text-dim);
		opacity: 0.6;
		margin-bottom: 1.5rem;
		letter-spacing: 0.04em;
		transition: color 0.3s, opacity 0.3s;
	}
	.timer--urgent { color: #e8a866; opacity: 0.85; }
	.timer--expired { color: #e88383; opacity: 0.85; }
	.timer-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: currentColor;
		animation: timerBlink 1s steps(1) infinite;
	}

	/* ── Submit ───────────────────────────────────────────────────────────── */
	.submit {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 48px;
		font-family: var(--font-display);
		font-size: 0.9375rem;
		font-weight: 400;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #fff;
		background: var(--accent);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		outline: none;
		transition: filter 0.18s, transform 0.15s, opacity 0.15s;
	}
	.submit:hover:not(:disabled)  { filter: brightness(1.18); transform: translateY(-1px); }
	.submit:active:not(:disabled) { transform: scale(0.98); }
	.submit:focus-visible         { outline: 2px solid var(--accent); outline-offset: 2px; }
	.submit:disabled              { opacity: 0.35; cursor: not-allowed; filter: none; transform: none; }
	.spinner { width: 20px; height: 20px; animation: spin 0.75s linear infinite; }

	/* ── Resend ───────────────────────────────────────────────────────────── */
	.resend-form { margin-top: 1rem; text-align: center; }
	.resend-btn {
		background: none;
		border: none;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--text-dim);
		opacity: 0.6;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s, opacity 0.15s;
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: transparent;
		transition: color 0.15s, opacity 0.15s, text-decoration-color 0.15s;
	}
	.resend-btn:hover:not(:disabled) {
		color: var(--accent-hi);
		opacity: 1;
		text-decoration-color: currentColor;
	}
	.resend-btn:disabled { cursor: not-allowed; }

	/* ── Back Link ────────────────────────────────────────────────────────── */
	.back-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		margin-top: 1.5rem;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--text-dim);
		text-decoration: none;
		opacity: 0.5;
		transition: color 0.15s, opacity 0.15s;
	}
	.back-link:hover { color: var(--text); opacity: 0.8; }

	/* ── Success State ────────────────────────────────────────────────────── */
	.success-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		padding: 2rem 0;
		animation: fadeUp 0.4s ease;
	}
	.success-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: rgba(113,118,170,0.15);
		border: 1.5px solid rgba(113,118,170,0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: var(--accent-hi);
		animation: successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	.success-text {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 300;
		color: var(--text);
		letter-spacing: 0.04em;
	}

	/* ── Footer Lang ──────────────────────────────────────────────────────── */
	.foot-outer {
		margin-top: 1.5rem;
		opacity: 0.5;
	}

	/* ── Animations ───────────────────────────────────────────────────────── */
	@keyframes mailFloat {
		0%, 100% { transform: translateY(0); }
		50%       { transform: translateY(-5px); }
	}
	@keyframes pulse {
		0%, 100% { opacity: 0.6; transform: scale(1); }
		50%       { opacity: 1;   transform: scale(1.15); }
	}
	@keyframes timerBlink {
		0%   { opacity: 1; }
		50%  { opacity: 0; }
		100% { opacity: 1; }
	}
	@keyframes successPop {
		0%   { transform: scale(0); opacity: 0; }
		60%  { transform: scale(1.15); }
		100% { transform: scale(1); opacity: 1; }
	}
	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(6px); }
		to   { opacity: 1; transform: translateY(0); }
	}
</style>
