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

	let passwordVal = $state('');
	let confirmVal = $state('');
	let mismatch = $derived(confirmVal.length > 0 && passwordVal !== confirmVal);

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
		const usernameEl = document.getElementById('username') as HTMLInputElement;
		const pwEl = document.getElementById('password') as HTMLInputElement;
		const cfEl = document.getElementById('confirm') as HTMLInputElement;

		if (!usernameEl.value.trim() || !pwEl.value || !cfEl.value) {
			errorMsg = 'register.err_required';
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
			return;
		}
		if (pwEl.value !== cfEl.value) {
			errorMsg = 'register.err_password_mismatch';
			errorShake = true;
			setTimeout(() => (errorShake = false), 550);
			return;
		}
		loading = true;
		return async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			loading = false;
		};
	}

	const providerIcons: Record<string, string> = {
		github: '◆',
		google: '◇'
	};
</script>

<svelte:head>
	<title>{$t('social_complete.page_title')}</title>
</svelte:head>

<div class="scene">
	<main class="wrap" class:mounted>
		<div class="card" class:shake={errorShake} class:error-flash={errorShake}>

			<header class="brand">
				<span class="mark-icon brand-mark" aria-hidden="true">❄</span>
				<h1 class="wordmark"><span class="frost">Frost</span> <strong>ID</strong></h1>
				<p class="tagline">{$t('common.auth_server')}</p>
			</header>

			{#if data.expired}
				<SystemNotice variant="error">
					{$t('social_complete.expired')}
				</SystemNotice>
				<p class="switch-link">
					<a href="/login">{$t('social_complete.back_to_login')}</a>
				</p>
			{:else if data.profile}
				<!-- Social profile summary -->
				<div class="social-profile">
					<div class="social-avatar-wrap">
						{#if data.profile.avatarUrl}
							<img class="social-avatar" src={data.profile.avatarUrl} alt="" />
						{:else}
							<div class="social-avatar social-avatar--placeholder">
								{(data.profile.displayName ?? data.profile.email)[0].toUpperCase()}
							</div>
						{/if}
					</div>
					<div class="social-info">
						<span class="social-provider">
							<span class="social-provider-icon" aria-hidden="true">
								{providerIcons[data.profile.provider] ?? '·'}
							</span>
							{data.profile.provider === 'github' ? 'GitHub' : 'Google'}
						</span>
						{#if data.profile.displayName}
							<span class="social-name">{data.profile.displayName}</span>
						{/if}
						<span class="social-email">{data.profile.email}</span>
					</div>
				</div>

				<p class="setup-hint">{$t('social_complete.setup_hint')}</p>

				{#if errorMsg}
					<SystemNotice variant="error">{$t(errorMsg)}</SystemNotice>
				{/if}

				<form method="POST" novalidate use:enhance={handleEnhance}>
					<input type="hidden" name="token" value={data.token ?? ''} />

					<div class="field">
						<label for="username">{$t('register.username')}</label>
						<input
							type="text" id="username" name="username"
							placeholder={$t('register.username')}
							autocomplete="username"
							value={data.profile.username}
							disabled={loading}
							onfocus={() => (errorMsg = '')}
						/>
						<p class="field-hint">{$t('register.username_hint')}</p>
					</div>

					<div class="field">
						<label for="email-display">{$t('register.email')}</label>
						<input
							type="email" id="email-display"
							value={data.profile.email}
							disabled
							class="input-locked"
						/>
					</div>

					<div class="field">
						<label for="password">{$t('register.password')}</label>
						<input
							type="password" id="password" name="password"
							placeholder="········"
							autocomplete="new-password"
							minlength="8"
							disabled={loading}
							oninput={(e) => (passwordVal = (e.target as HTMLInputElement).value)}
							onfocus={() => (errorMsg = '')}
						/>
					</div>

					<div class="field" style="margin-bottom: 0">
						<label for="confirm" class:label--error={mismatch}>{$t('register.confirm_password')}</label>
						<input
							type="password" id="confirm" name="confirm_password"
							placeholder="········"
							autocomplete="new-password"
							disabled={loading}
							class:input--error={mismatch}
							oninput={(e) => (confirmVal = (e.target as HTMLInputElement).value)}
							onfocus={() => (errorMsg = '')}
						/>
						{#if mismatch}
							<span class="mismatch" aria-live="polite">{$t('register.err_password_mismatch')}</span>
						{/if}
					</div>

					<button
						type="submit"
						class="submit"
						disabled={loading || mismatch}
						aria-busy={loading}
					>
						{#if loading}
							<svg class="spinner" viewBox="0 0 24 24" aria-label={$t('social_complete.creating')}>
								<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
									stroke-width="2" stroke-dasharray="56.5" stroke-dashoffset="42"
									stroke-linecap="round"/>
							</svg>
						{:else}
							{$t('social_complete.submit')}
						{/if}
					</button>
				</form>
			{/if}

			<footer class="foot">
				<LangToggle />
				<span class="foot-sep" aria-hidden="true"></span>
				<span class="frost-tech"><span class="frost-spin" aria-hidden="true">❄</span> Frost Tech</span>
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

	/* ── Social profile ──────────────────────────────────── */
	.social-profile {
		display: flex;
		align-items: center;
		gap: 0.875rem;
		padding: 0.875rem 1rem;
		margin-bottom: 1rem;
		background: var(--input-bg);
		border: 1px solid var(--border-hi);
		border-radius: var(--radius-md);
	}
	.social-avatar-wrap { flex-shrink: 0; }
	.social-avatar {
		width: 40px; height: 40px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid var(--border);
	}
	.social-avatar--placeholder {
		display: flex; align-items: center; justify-content: center;
		background: rgba(113,118,170,0.12);
		border: 1px solid rgba(113,118,170,0.2);
		font-family: var(--font-display);
		font-size: 1rem; font-weight: 400;
		color: var(--accent);
	}
	.social-info {
		display: flex; flex-direction: column; gap: 2px;
		min-width: 0;
	}
	.social-provider {
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
		display: flex; align-items: center; gap: 0.35rem;
	}
	.social-provider-icon { font-size: 0.7rem; opacity: 0.7; }
	.social-name {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: var(--text);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.social-email {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--text-dim);
		opacity: 0.7;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.setup-hint {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--text-dim);
		opacity: 0.6;
		line-height: 1.5;
		margin-bottom: 1.25rem;
		text-align: center;
	}

	/* ── Error ───────────────────────────────────────────── */
	/* ── Fields ──────────────────────────────────────────── */
	.field { margin-bottom: 1.125rem; }
	.field label { display: block; margin-bottom: 0.4rem; font-family: var(--font-body); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); }
	.field label.label--error { color: var(--error); }
	.field input { display: block; width: 100%; padding: 0.7rem 0.875rem; font-family: var(--font-body); font-size: 0.9375rem; color: var(--text); background: var(--input-bg); border: 1px solid var(--border-hi); border-radius: var(--radius-md); outline: none; -webkit-appearance: none; transition: border-color 0.15s, box-shadow 0.15s; }
	.field input::placeholder { color: var(--text-dim); opacity: 0.35; }
	.field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
	.field input.input--error { border-color: var(--error); box-shadow: 0 0 0 3px var(--error-ring); }
	.field input:disabled { opacity: 0.5; cursor: not-allowed; }
	.field-hint { font-family: var(--font-body); font-size: 0.6875rem; color: var(--text-dim); opacity: 0.55; margin-top: 0.3rem; }
	.mismatch { display: block; font-size: 0.7rem; color: #e88383; margin-top: 0.35rem; animation: fadeUp 0.15s ease; }

	.input-locked {
		opacity: 0.55 !important;
		cursor: default !important;
	}

	/* ── Submit ──────────────────────────────────────────── */
	.submit { display: flex; align-items: center; justify-content: center; width: 100%; height: 48px; margin-top: 1.75rem; font-family: var(--font-display); font-size: 0.9375rem; font-weight: 400; letter-spacing: 0.14em; text-transform: uppercase; color: #fff; background: var(--accent); border: none; border-radius: var(--radius-sm); cursor: pointer; outline: none; transition: filter 0.18s, transform 0.15s; }
	.submit:hover:not(:disabled)  { filter: brightness(1.15); transform: translateY(-1px); }
	.submit:active:not(:disabled) { transform: scale(0.98); }
	.submit:focus-visible         { outline: 2px solid var(--accent); outline-offset: 2px; }
	.submit:disabled              { opacity: 0.4; cursor: not-allowed; filter: none; transform: none; }
	.spinner { width: 20px; height: 20px; animation: spin 0.75s linear infinite; }

	/* ── Switch link ─────────────────────────────────────── */
	.switch-link { text-align: center; margin-top: 1.25rem; font-size: 0.8125rem; color: var(--text-dim); }
	.switch-link a { color: var(--accent); margin-left: 0.25rem; border-bottom: 1px solid transparent; transition: color 0.15s, border-color 0.15s; padding-bottom: 1px; }
	.switch-link a:hover { color: var(--accent-hi); border-color: var(--accent-hi); }

	/* ── Footer ──────────────────────────────────────────── */
	.foot { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.6rem; font-family: var(--font-body); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); opacity: 0.55; }
	.foot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); opacity: 0.35; }

	@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
	@keyframes shake  { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
	@keyframes errorFlash { 0% { box-shadow: 0 0 0 0 rgba(217,92,92,0); } 50% { box-shadow: 0 0 0 4px rgba(217,92,92,0.12); } 100% { box-shadow: 0 0 0 0 rgba(217,92,92,0); } }
	@keyframes spin { to { transform: rotate(360deg); } }
</style>
