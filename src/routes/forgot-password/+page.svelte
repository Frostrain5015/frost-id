<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let mounted = $state(false);
	let requesting = $state(false);
	let resetting = $state(false);
	let errorShake = $state(false);
	let errorMsg = $state('');
	let email = $state('');
	let code = $state('');
	let password = $state('');
	let confirmPassword = $state('');

	const codeSent = $derived(Boolean(form?.codeSent) || Boolean(email));
	const mismatch = $derived(confirmPassword.length > 0 && password !== confirmPassword);
	const loginHref = $derived(data.oauthParams ? `/login?oauth=${encodeURIComponent(data.oauthParams)}` : '/login');

	onMount(() => {
		mounted = true;
	});

	$effect(() => {
		if (form?.email) email = form.email;
		if (form?.errorKey) {
			errorMsg = form.errorKey;
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
		} else if (form?.codeSent) {
			errorMsg = '';
		}
	});

	function requestEnhance() {
		const emailEl = document.getElementById('reset-email') as HTMLInputElement;
		if (!emailEl.value.trim()) {
			errorMsg = 'forgot.err_email_invalid';
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
			return;
		}
		requesting = true;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			requesting = false;
		};
	}

	function resetEnhance() {
		if (!email || !code.trim() || !password || !confirmPassword) {
			errorMsg = 'forgot.err_required';
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
			return;
		}
		if (password !== confirmPassword) {
			errorMsg = 'forgot.err_password_mismatch';
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
			return;
		}
		resetting = true;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			resetting = false;
		};
	}
</script>

<svelte:head>
	<title>{$t('forgot.page_title')}</title>
</svelte:head>

<div class="scene">
	<main class="wrap" class:mounted>
		<div class="card" class:shake={errorShake} class:error-flash={errorShake}>
			<header class="brand">
				<span class="mark-icon brand-mark" aria-hidden="true">❄</span>
				<h1 class="wordmark"><span class="frost">Frost</span> <strong>ID</strong></h1>
				<p class="tagline">{$t('common.auth_server')}</p>
			</header>

			<div class="step-indicator" aria-label={$t('forgot.step_label')}>
				<span class="step-dot step-dot--active"></span>
				<span class="step-line" class:step-line--active={codeSent}></span>
				<span class="step-dot" class:step-dot--active={codeSent}></span>
			</div>

			<h2 class="heading">{$t(codeSent ? 'forgot.reset_heading' : 'forgot.heading')}</h2>
			<p class="subtext">{$t(codeSent ? 'forgot.reset_subtitle' : 'forgot.subtitle')}</p>

			{#if errorMsg}
				<div class="err" role="alert" aria-live="assertive">{$t(errorMsg)}</div>
			{:else if form?.codeSent}
				<div class="notice" role="status" aria-live="polite">{$t('forgot.code_sent')}</div>
			{/if}

			<form method="POST" action="?/requestCode" novalidate use:enhance={requestEnhance}>
				<div class="field">
					<label for="reset-email">{$t('forgot.email')}</label>
					<input
						type="email"
						id="reset-email"
						name="email"
						placeholder={$t('forgot.email')}
						autocomplete="email"
						bind:value={email}
						disabled={requesting || resetting}
						onfocus={() => (errorMsg = '')}
					/>
				</div>
				<button type="submit" class="submit submit--secondary" disabled={requesting || resetting} aria-busy={requesting}>
					{#if requesting}
						<svg class="spinner" viewBox="0 0 24 24" aria-hidden="true">
							<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
								stroke-width="2" stroke-dasharray="56.5" stroke-dashoffset="42"
								stroke-linecap="round"/>
						</svg>
					{:else}
						{$t(codeSent ? 'forgot.resend_code' : 'forgot.send_code')}
					{/if}
				</button>
			</form>

			{#if codeSent}
				<form method="POST" action="?/reset" novalidate use:enhance={resetEnhance} class="reset-form">
					<input type="hidden" name="email" value={email} />
					<input type="hidden" name="oauth_params" value={data.oauthParams ?? ''} />

					<div class="field">
						<label for="reset-code">{$t('forgot.code')}</label>
						<input
							type="text"
							id="reset-code"
							name="code"
							placeholder="000000"
							autocomplete="one-time-code"
							inputmode="numeric"
							maxlength="6"
							bind:value={code}
							disabled={resetting}
							oninput={(e) => (code = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6))}
							onfocus={() => (errorMsg = '')}
						/>
					</div>

					<div class="field">
						<label for="new-password">{$t('forgot.password')}</label>
						<input
							type="password"
							id="new-password"
							name="password"
							placeholder="路路路路路路路路"
							autocomplete="new-password"
							minlength="8"
							bind:value={password}
							disabled={resetting}
							onfocus={() => (errorMsg = '')}
						/>
					</div>

					<div class="field" style="margin-bottom: 0">
						<label for="confirm-password" class:label--error={mismatch}>{$t('forgot.confirm_password')}</label>
						<input
							type="password"
							id="confirm-password"
							name="confirm_password"
							placeholder="路路路路路路路路"
							autocomplete="new-password"
							minlength="8"
							bind:value={confirmPassword}
							class:input--error={mismatch}
							disabled={resetting}
							onfocus={() => (errorMsg = '')}
						/>
						{#if mismatch}
							<span class="mismatch" aria-live="polite">{$t('forgot.err_password_mismatch')}</span>
						{/if}
					</div>

					<p class="hint">{$t('forgot.code_hint')}</p>

					<button
						type="submit"
						class="submit"
						disabled={resetting || mismatch}
						aria-busy={resetting}
					>
						{#if resetting}
							<svg class="spinner" viewBox="0 0 24 24" aria-hidden="true">
								<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
									stroke-width="2" stroke-dasharray="56.5" stroke-dashoffset="42"
									stroke-linecap="round"/>
							</svg>
						{:else}
							{$t('forgot.reset_submit')}
						{/if}
					</button>
				</form>
			{/if}

			<p class="switch-link">
				<a href={loginHref}>{$t('forgot.back_to_login')}</a>
			</p>

			<footer class="foot">
				<LangToggle />
				<span class="foot-sep" aria-hidden="true"></span>
				<span class="frost-tech"><span class="frost-spin" aria-hidden="true">❄</span> Powered by Frost Tech</span>
			</footer>
		</div>
	</main>
</div>

<style>
	.scene { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
	.wrap { width: 100%; max-width: 420px; padding: 1.5rem; opacity: 0; transform: translateY(16px); transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1); }
	.wrap.mounted { opacity: 1; transform: translateY(0); }
	.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 3rem 2.75rem 2.25rem; }
	.card.shake { animation: shake 0.45s ease; }
	.card.error-flash { animation: shake 0.45s ease, errorFlash 0.6s ease; }

	.brand { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; margin-bottom: 1.65rem; }
	.mark-icon { font-size: 2.5rem; line-height: 1; margin-bottom: 0.25rem; }
	.wordmark { font-family: var(--font-display); font-size: 3rem; font-weight: 200; letter-spacing: 0.08em; line-height: 1; color: var(--text); }
	.wordmark strong { font-weight: 500; color: var(--text); }
	.frost { color: var(--accent); }
	.tagline { font-family: var(--font-body); font-size: 0.55rem; font-weight: 400; letter-spacing: 0.35em; text-transform: uppercase; color: var(--text-dim); opacity: 0.6; margin-top: 0.125rem; }

	.step-indicator { display: flex; align-items: center; justify-content: center; gap: 0.35rem; margin-bottom: 1.25rem; }
	.step-dot { width: 7px; height: 7px; border-radius: 50%; border: 1px solid var(--border-hi); background: transparent; transition: background 0.18s, border-color 0.18s; }
	.step-dot--active { border-color: var(--accent-hi); background: var(--accent); }
	.step-line { width: 28px; height: 1px; background: var(--border-hi); transition: background 0.18s; }
	.step-line--active { background: var(--accent); }

	.heading { font-family: var(--font-display); font-size: 1.5rem; font-weight: 400; letter-spacing: 0; line-height: 1.2; color: var(--text); text-align: center; margin-bottom: 0.5rem; }
	.subtext { max-width: 320px; margin: 0 auto 1.4rem; font-size: 0.8125rem; line-height: 1.6; color: var(--text-dim); text-align: center; }

	.err, .notice { padding: 0.75rem 1rem; margin-bottom: 1.25rem; border-radius: var(--radius-md); font-size: 0.8125rem; animation: fadeUp 0.25s ease; }
	.err { background: rgba(217,92,92,0.06); border: 1px solid rgba(217,92,92,0.2); color: #e88383; }
	.notice { background: rgba(113,118,170,0.08); border: 1px solid rgba(113,118,170,0.22); color: var(--accent-hi); }

	.field { margin-bottom: 1.125rem; }
	.field label { display: block; margin-bottom: 0.4rem; font-family: var(--font-body); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); }
	.field label.label--error { color: var(--error); }
	.field input { display: block; width: 100%; padding: 0.7rem 0.875rem; font-family: var(--font-body); font-size: 0.9375rem; color: var(--text); background: var(--input-bg); border: 1px solid var(--border-hi); border-radius: var(--radius-md); outline: none; appearance: none; -webkit-appearance: none; transition: border-color 0.15s, box-shadow 0.15s; }
	.field input::placeholder { color: var(--text-dim); opacity: 0.45; }
	.field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
	.field input.input--error { border-color: var(--error); box-shadow: 0 0 0 3px var(--error-ring); }
	.field input:disabled { opacity: 0.5; cursor: not-allowed; }

	.reset-form { margin-top: 1.35rem; padding-top: 1.35rem; border-top: 1px solid var(--border); animation: fadeUp 0.25s ease; }
	.hint { margin-top: 0.7rem; font-size: 0.75rem; color: var(--text-dim); opacity: 0.7; text-align: center; }
	.mismatch { display: block; font-size: 0.7rem; color: #e88383; margin-top: 0.35rem; animation: fadeUp 0.15s ease; }

	.submit { display: flex; align-items: center; justify-content: center; width: 100%; height: 48px; margin-top: 1.35rem; font-family: var(--font-display); font-size: 0.9375rem; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: #fff; background: var(--accent); border: none; border-radius: var(--radius-sm); cursor: pointer; outline: none; transition: filter 0.18s, transform 0.15s; }
	.submit--secondary { margin-top: 0; color: var(--text); background: transparent; border: 1px solid var(--border-hi); }
	.submit:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-1px); }
	.submit--secondary:hover:not(:disabled) { color: var(--accent-hi); border-color: rgba(113,118,170,0.35); background: rgba(113,118,170,0.05); filter: none; }
	.submit:active:not(:disabled) { transform: scale(0.98); }
	.submit:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.submit:disabled { opacity: 0.4; cursor: not-allowed; filter: none; transform: none; }
	.spinner { width: 20px; height: 20px; animation: spin 0.75s linear infinite; }

	.switch-link { text-align: center; margin-top: 1.25rem; font-size: 0.8125rem; color: var(--text-dim); }
	.switch-link a { color: var(--accent); border-bottom: 1px solid transparent; transition: color 0.15s, border-color 0.15s; padding-bottom: 1px; }
	.switch-link a:hover { color: var(--accent-hi); border-color: var(--accent-hi); }

	.foot { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.65rem; font-family: var(--font-body); letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); opacity: 0.55; }
	.foot .frost-spin { font-size: 0.886rem; line-height: 1; vertical-align: middle; }
	.foot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); opacity: 0.35; }
</style>
