<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let loading = $state(false);
	let mounted = $state(false);
	let errorShake = $state(false);
	let errorMsg = $state('');

	// Code sending state
	let sendingCode = $state(false);
	let codeSent = $state(false);
	let codeCountdown = $state(0);
	let emailVal = $state('');
	let codeTimer: ReturnType<typeof setInterval> | undefined = $state(undefined);

	let passwordVal    = $state('');
	let confirmVal     = $state('');
	let mismatch = $derived(confirmVal.length > 0 && passwordVal !== confirmVal);

	onMount(() => { mounted = true; });

	$effect(() => {
		if (form?.errorKey) {
			errorMsg = form.errorKey;
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
		} else if (!form?.errorKey && form !== null) {
			errorMsg = '';
		}
	});

	async function sendCode() {
		const e = emailVal.trim().toLowerCase();
		if (!e || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;

		sendingCode = true;
		errorMsg = '';

		try {
			const res = await fetch('/api/verification-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: e })
			});
			if (!res.ok) {
				const body = await res.json();
				errorMsg = body.error === 'An account with this email already exists.'
					? 'register.err_email_taken'
					: 'register.err_code_send';
				return;
			}
			codeSent = true;
			codeCountdown = 60;
			codeTimer = setInterval(() => {
				codeCountdown -= 1;
				if (codeCountdown <= 0) {
					clearInterval(codeTimer);
					codeTimer = undefined;
				}
			}, 1000);
		} catch {
			errorMsg = 'register.err_code_send';
		} finally {
			sendingCode = false;
		}
	}

	function onEmailChange(e: Event) {
		emailVal = (e.target as HTMLInputElement).value;
		// Reset code state if email changes
		if (codeSent) {
			codeSent = false;
			if (codeTimer) { clearInterval(codeTimer); codeTimer = undefined; }
			codeCountdown = 0;
		}
	}

	$effect(() => {
		return () => { if (codeTimer) clearInterval(codeTimer); };
	});
</script>

<svelte:head>
	<title>{$t('register.page_title')}</title>
</svelte:head>

<div class="scene">
	<main class="wrap" class:mounted>
		<div class="card" class:shake={errorShake} class:error-flash={errorShake}>

			<header class="brand">
				<span class="mark-icon brand-mark" aria-hidden="true">❄</span>
				<h1 class="wordmark"><span class="frost">Frost</span> <strong>ID</strong></h1>
			</header>

			{#if errorMsg}
				<div class="err" role="alert" aria-live="assertive">
					{$t(errorMsg)}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update({ reset: false });
						loading = false;
					};
				}}
			>
				<input type="hidden" name="oauth_params" value={data.oauthParams ?? ''} />

				<!-- Email + Send Code -->
				<div class="field">
					<label for="email">{$t('register.email')}</label>
					<div class="email-row">
						<input
							type="email" id="email" name="email"
							placeholder={$t('register.email')}
							autocomplete="email" required disabled={loading}
							value={emailVal} oninput={onEmailChange}
						/>
						<button
							type="button" class="code-btn"
							disabled={sendingCode || codeCountdown > 0 || !emailVal}
							onclick={sendCode}
						>
							{#if sendingCode}
								{$t('register.sending')}
							{:else if codeCountdown > 0}
								{$t('register.code_resend')} ({codeCountdown})
							{:else if codeSent}
								{$t('register.code_sent')}
							{:else}
								{$t('register.send_code')}
							{/if}
						</button>
					</div>
				</div>

				<!-- Code field (appears after send) -->
				<div class="field code-field" class:code-field--visible={codeSent}>
					<label for="code">{$t('register.code_label')}</label>
					<input
						type="text" id="code" name="code"
						placeholder={$t('register.code_placeholder')}
						inputmode="numeric" pattern="[0-9]*" maxlength="6"
						autocomplete="one-time-code" required disabled={loading || !codeSent}
					/>
				</div>

				<!-- Name -->
				<div class="field">
					<label for="name">{$t('register.name')}</label>
					<input type="text" id="name" name="name" placeholder={$t('register.name')}
						autocomplete="name" required disabled={loading} />
				</div>

				<!-- Password -->
				<div class="field">
					<label for="password">{$t('register.password')}</label>
					<input type="password" id="password" name="password" placeholder="········"
						autocomplete="new-password" minlength="8" required disabled={loading}
						oninput={(e) => (passwordVal = (e.target as HTMLInputElement).value)} />
				</div>

				<!-- Confirm -->
				<div class="field" style="margin-bottom: 0">
					<label for="confirm" class:label--error={mismatch}>
						{$t('register.confirm_password')}
					</label>
					<input type="password" id="confirm" name="confirm_password" placeholder="········"
						autocomplete="new-password" minlength="8" required disabled={loading}
						class:input--error={mismatch}
						oninput={(e) => (confirmVal = (e.target as HTMLInputElement).value)} />
					{#if mismatch}
						<span class="mismatch" aria-live="polite">{$t('register.err_password_mismatch')}</span>
					{/if}
				</div>

				<button type="submit" class="submit" disabled={loading || mismatch || !codeSent} aria-busy={loading}>
					{#if loading}
						<svg class="spinner" viewBox="0 0 24 24" aria-label={$t('register.submitting')}>
							<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
								stroke-width="2" stroke-dasharray="56.5" stroke-dashoffset="42"
								stroke-linecap="round"/>
						</svg>
					{:else}
						{$t('register.submit')}
					{/if}
				</button>
			</form>

			<p class="switch-link">
				{$t('register.sign_in_prompt')}
				<a href={data.oauthParams ? `/login?oauth=${encodeURIComponent(data.oauthParams)}` : '/login'}>
					{$t('register.sign_in_link')}
				</a>
			</p>

			<footer class="foot">
				<LangToggle />
				<span class="foot-sep" aria-hidden="true"></span>
				<span>OAuth 2.1</span>
				<span class="foot-sep" aria-hidden="true"></span>
				<span>{$t('common.pkce_enforced')}</span>
			</footer>
		</div>
	</main>
</div>

<style>
	.scene { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
	.wrap { width: 100%; max-width: 420px; padding: 1.5rem; opacity: 0; transform: translateY(16px); transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1); }
	.wrap.mounted { opacity: 1; transform: translateY(0); }
	.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 3rem 2.75rem 2.25rem; }
	.card.shake       { animation: shake 0.45s ease; }
	.card.error-flash { animation: shake 0.45s ease, errorFlash 0.6s ease; }

	.brand { display: flex; flex-direction: column; align-items: center; gap: 0.25rem; margin-bottom: 1.75rem; }
	.mark-icon { font-size: 2.5rem; line-height: 1; }
	.wordmark { font-family: var(--font-display); font-size: 3rem; font-weight: 200; letter-spacing: 0.08em; line-height: 1; color: var(--text); }
	.wordmark strong { font-weight: 500; color: var(--text); }
	.frost { color: var(--accent); }

	.err { padding: 0.75rem 1rem; margin-bottom: 1.25rem; background: rgba(217,92,92,0.06); border: 1px solid rgba(217,92,92,0.2); border-radius: var(--radius-md); font-size: 0.8125rem; color: #e88383; animation: fadeUp 0.25s ease; }

	/* Fields */
	.field { margin-bottom: 1rem; }
	.field label { display: block; margin-bottom: 0.4rem; font-family: var(--font-body); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); }
	.field label.label--error { color: var(--error); }
	.field input { display: block; width: 100%; padding: 0.7rem 0.875rem; font-family: var(--font-body); font-size: 0.9375rem; color: var(--text); background: var(--input-bg); border: 1px solid var(--border-hi); border-radius: var(--radius-md); outline: none; -webkit-appearance: none; transition: border-color 0.15s, box-shadow 0.15s; }
	.field input::placeholder { color: var(--text-dim); opacity: 0.35; }
	.field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
	.field input.input--error { border-color: var(--error); box-shadow: 0 0 0 3px var(--error-ring); }
	.field input:disabled { opacity: 0.5; cursor: not-allowed; }

	/* Email row with inline button */
	.email-row { display: flex; gap: 0.5rem; align-items: flex-start; }
	.email-row input { flex: 1; min-width: 0; }

	.code-btn {
		flex-shrink: 0; height: 42px; padding: 0 0.75rem;
		font-family: var(--font-body); font-size: 0.7rem; font-weight: 500;
		letter-spacing: 0.06em; text-transform: uppercase;
		color: var(--accent-hi); background: rgba(113,118,170,0.08);
		border: 1px solid rgba(113,118,170,0.25);
		border-radius: var(--radius-sm); cursor: pointer;
		white-space: nowrap; outline: none;
		transition: background 0.15s, border-color 0.15s, opacity 0.15s;
	}
	.code-btn:hover:not(:disabled) { background: rgba(113,118,170,0.15); border-color: rgba(113,118,170,0.4); }
	.code-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Code field (animated reveal) */
	.code-field {
		max-height: 0; overflow: hidden; margin-bottom: 0;
		transition: max-height 0.35s cubic-bezier(0.22,1,0.36,1), margin-bottom 0.35s;
	}
	.code-field--visible { max-height: 100px; margin-bottom: 1rem; }

	.mismatch { display: block; font-size: 0.7rem; color: #e88383; margin-top: 0.35rem; animation: fadeUp 0.15s ease; }

	.submit { display: flex; align-items: center; justify-content: center; width: 100%; height: 48px; margin-top: 1.75rem; font-family: var(--font-display); font-size: 0.9375rem; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: #fff; background: var(--accent); border: none; border-radius: var(--radius-sm); cursor: pointer; outline: none; transition: filter 0.18s, transform 0.15s; }
	.submit:hover:not(:disabled)          { filter: brightness(1.15); transform: translateY(-1px); }
	.submit:active:not(:disabled)         { transform: scale(0.98); }
	.submit:focus-visible                 { outline: 2px solid var(--accent); outline-offset: 2px; }
	.submit:disabled                      { opacity: 0.4; cursor: not-allowed; filter: none; transform: none; }
	.spinner { width: 20px; height: 20px; animation: spin 0.75s linear infinite; }

	.switch-link { text-align: center; margin-top: 1.25rem; font-size: 0.8125rem; color: var(--text-dim); }
	.switch-link a { color: var(--accent); margin-left: 0.25rem; border-bottom: 1px solid transparent; transition: color 0.15s, border-color 0.15s; padding-bottom: 1px; }
	.switch-link a:hover { color: var(--accent-hi); border-color: var(--accent-hi); }

	.foot { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.6rem; font-family: var(--font-body); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); opacity: 0.55; }
	.foot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); opacity: 0.35; }
</style>
