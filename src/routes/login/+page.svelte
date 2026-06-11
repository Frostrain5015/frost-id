<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import SystemNotice from '$lib/components/SystemNotice.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let loading = $state(false);
	let mounted = $state(false);
	let errorShake = $state(false);
	let errorMsg = $state('');

	onMount(() => { mounted = true; });

	$effect(() => {
		if (form?.errorKey) {
			errorMsg = form.errorKey;
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
		} else if (!form) {
			errorMsg = '';
		}
	});

	function handleEnhance() {
		const identifierEl = document.getElementById('identifier') as HTMLInputElement;
		const passwordEl = document.getElementById('password') as HTMLInputElement;
		if (!identifierEl.value.trim() || !passwordEl.value) {
			errorMsg = 'login.err_required';
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
			return;
		}
		loading = true;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			loading = false;
		};
	}
</script>

<svelte:head>
	<title>{$t('login.page_title')}</title>
</svelte:head>

<div class="scene">
	<main class="wrap" class:mounted>
		<div class="card" class:shake={errorShake} class:error-flash={errorShake}>

			<header class="brand">
				<span class="mark-icon brand-mark" aria-hidden="true">❄</span>
				<h1 class="wordmark"><span class="frost">Frost</span> <strong>ID</strong></h1>
				<p class="tagline">{$t('common.auth_server')}</p>
			</header>

			{#if data.socialError}
				<SystemNotice variant="error">
					{$t('login.err_' + data.socialError)}
				</SystemNotice>
			{:else if errorMsg}
				<SystemNotice variant="error">
					{$t(errorMsg)}
				</SystemNotice>
			{:else if data.resetSuccess}
				<SystemNotice variant="success">
					{$t('login.reset_success')}
				</SystemNotice>
			{/if}

			<form method="POST" novalidate use:enhance={handleEnhance}>
				<input type="hidden" name="oauth_params" value={data.oauthParams ?? ''} />

				<div class="field">
					<label for="identifier">{$t('login.identifier')}</label>
					<input
						type="text"
						id="identifier"
						name="identifier"
						placeholder={$t('login.identifier')}
						autocomplete="username"
						disabled={loading}
						onfocus={() => (errorMsg = '')}
					/>
				</div>

				<div class="field" style="margin-bottom: 0">
					<label for="password">{$t('login.password')}</label>
					<input
						type="password"
						id="password"
						name="password"
						placeholder={$t('login.password')}
						autocomplete="current-password"
						disabled={loading}
						onfocus={() => (errorMsg = '')}
					/>
				</div>

				<div class="form-meta">
					<a href={data.oauthParams ? `/forgot-password?oauth=${encodeURIComponent(data.oauthParams)}` : '/forgot-password'}>
						{$t('login.forgot_password')}
					</a>
				</div>

				<button
					type="submit"
					class="submit"
					disabled={loading}
					aria-busy={loading}
				>
					{#if loading}
						<svg class="spinner" viewBox="0 0 24 24" aria-label={$t('login.submitting')}>
							<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
								stroke-width="2" stroke-dasharray="56.5" stroke-dashoffset="42"
								stroke-linecap="round"/>
						</svg>
					{:else}
						{$t('login.submit')}
					{/if}
				</button>
			</form>

			<div class="divider">
				<span class="divider-text">{$t('login.or_continue_with')}</span>
			</div>

			<div class="social-buttons">
				<a
					data-sveltekit-reload href={`/auth/github${data.oauthParams ? '?oauth=' + encodeURIComponent(data.oauthParams) : ''}`}
					class="social-btn"
				>
					<svg class="social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.245.675 1.14 1.785 1.38 2.64 1.065.075-.54.27-.93.495-1.14-1.725-.195-3.51-.87-3.51-3.87 0-.87.3-1.59.795-2.145-.075-.195-.345-1.02.075-2.13 0 0 .645-.21 2.13.795.63-.18 1.29-.27 1.95-.27s1.32.09 1.95.27c1.485-1.02 2.13-.795 2.13-.795.42 1.11.15 1.935.075 2.13.495.555.795 1.275.795 2.145 0 3.015-1.8 3.675-3.525 3.87.285.24.54.705.54 1.41 0 1.02-.015 1.845-.015 2.1 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
					</svg>
					<span>{$t('login.continue_github')}</span>
				</a>
				<a
					data-sveltekit-reload href={`/auth/google${data.oauthParams ? '?oauth=' + encodeURIComponent(data.oauthParams) : ''}`}
					class="social-btn"
				>
					<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					<span>{$t('login.continue_google')}</span>
				</a>
			</div>

			<p class="switch-link">
				{$t('login.register_prompt')}
				<a href={data.oauthParams ? `/register?oauth=${encodeURIComponent(data.oauthParams)}` : '/register'}>
					{$t('login.register_link')}
				</a>
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
	.card.shake       { animation: shake 0.45s ease; }
	.card.error-flash { animation: shake 0.45s ease, errorFlash 0.6s ease; }

	.brand { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; margin-bottom: 2rem; }
	.mark-icon { font-size: 2.5rem; line-height: 1; margin-bottom: 0.25rem; }
	.wordmark { font-family: var(--font-display); font-size: 3rem; font-weight: 200; letter-spacing: 0.08em; line-height: 1; color: var(--text); }
	.wordmark strong { font-weight: 500; color: var(--text); }
	.frost { color: var(--accent); }
	.tagline { font-family: var(--font-body); font-size: 0.55rem; font-weight: 400; letter-spacing: 0.35em; text-transform: uppercase; color: var(--text-dim); opacity: 0.6; margin-top: 0.125rem; }

	.field { margin-bottom: 1.25rem; }
	.field label { display: block; margin-bottom: 0.45rem; font-family: var(--font-body); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); }
	.field input { display: block; width: 100%; padding: 0.75rem 0.875rem; font-family: var(--font-body); font-size: 0.9375rem; color: var(--text); background: var(--input-bg); border: 1px solid var(--border-hi); border-radius: var(--radius-md); outline: none; appearance: none; -webkit-appearance: none; transition: border-color 0.15s, box-shadow 0.15s; }
	.field input::placeholder { color: var(--text-dim); opacity: 0.5; }
	.field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
	.field input:disabled { opacity: 0.5; cursor: not-allowed; }

	.form-meta { display: flex; justify-content: flex-end; margin-top: 0.75rem; font-size: 0.8125rem; }
	.form-meta a { color: var(--text-dim); opacity: 0.72; border-bottom: 1px solid transparent; padding-bottom: 1px; transition: color 0.15s, opacity 0.15s, border-color 0.15s; }
	.form-meta a:hover { color: var(--accent-hi); opacity: 1; border-color: var(--accent-hi); }
	.form-meta a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 2px; }

	.submit { display: flex; align-items: center; justify-content: center; width: 100%; height: 48px; margin-top: 1.75rem; font-family: var(--font-display); font-size: 0.9375rem; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: #fff; background: var(--accent); border: none; border-radius: var(--radius-sm); cursor: pointer; outline: none; transition: filter 0.18s, transform 0.15s; }
	.submit:hover:not(:disabled)          { filter: brightness(1.15); transform: translateY(-1px); }
	.submit:active:not(:disabled)         { transform: scale(0.98); }
	.submit:focus-visible                 { outline: 2px solid var(--accent); outline-offset: 2px; }
	.submit:disabled                      { opacity: 0.4; cursor: not-allowed; filter: none; transform: none; }
	.spinner { width: 20px; height: 20px; animation: spin 0.75s linear infinite; }

	/* ── Social login divider ─────────────────────────────── */
	.divider { display: flex; align-items: center; gap: 0.75rem; margin: 1.5rem 0 1.25rem; }
	.divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
	.divider-text { font-family: var(--font-body); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); opacity: 0.6; }

	.social-buttons { display: flex; flex-direction: column; gap: 0.625rem; }
	.social-btn { display: flex; align-items: center; justify-content: center; gap: 0.625rem; width: 100%; height: 44px; font-family: var(--font-display); font-size: 0.8125rem; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text); background: var(--input-bg); border: 1px solid var(--border-hi); border-radius: var(--radius-md); cursor: pointer; text-decoration: none; transition: border-color 0.15s, background 0.15s, color 0.15s; }
	.social-btn:hover { border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.04); }
	.social-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.social-icon { width: 18px; height: 18px; flex-shrink: 0; }

	.switch-link { text-align: center; margin-top: 1.25rem; font-size: 0.8125rem; color: var(--text-dim); }
	.switch-link a { color: var(--accent); margin-left: 0.25rem; border-bottom: 1px solid transparent; transition: color 0.15s, border-color 0.15s; padding-bottom: 1px; }
	.switch-link a:hover { color: var(--accent-hi); border-color: var(--accent-hi); }

	.foot { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.65rem; font-family: var(--font-body); letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); opacity: 0.55; }
	.foot .frost-spin { font-size: 0.886rem; line-height: 1; vertical-align: middle; }
	.foot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); opacity: 0.35; }
</style>
