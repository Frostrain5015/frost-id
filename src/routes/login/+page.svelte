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
		// Client-side validation — prevents server round-trip for empty fields
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

			{#if errorMsg}
				<div class="err" role="alert" aria-live="assertive">
					{$t(errorMsg)}
				</div>
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

			<p class="switch-link">
				{$t('login.register_prompt')}
				<a href={data.oauthParams ? `/register?oauth=${encodeURIComponent(data.oauthParams)}` : '/register'}>
					{$t('login.register_link')}
				</a>
			</p>

			<footer class="foot">
				<LangToggle />
				<span class="foot-sep" aria-hidden="true"></span>
				<span>OAuth 2.1</span>
				<span class="foot-sep" aria-hidden="true"></span>
				<span>{$t('common.pkce_enforced')}</span>
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

	.err { padding: 0.75rem 1rem; margin-bottom: 1.25rem; background: rgba(217,92,92,0.06); border: 1px solid rgba(217,92,92,0.2); border-radius: var(--radius-md); font-size: 0.8125rem; color: #e88383; animation: fadeUp 0.25s ease; }

	.field { margin-bottom: 1.25rem; }
	.field label { display: block; margin-bottom: 0.45rem; font-family: var(--font-body); font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-dim); }
	.field input { display: block; width: 100%; padding: 0.75rem 0.875rem; font-family: var(--font-body); font-size: 0.9375rem; color: var(--text); background: var(--input-bg); border: 1px solid var(--border-hi); border-radius: var(--radius-md); outline: none; -webkit-appearance: none; transition: border-color 0.15s, box-shadow 0.15s; }
	.field input::placeholder { color: var(--text-dim); opacity: 0.5; }
	.field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-ring); }
	.field input:disabled { opacity: 0.5; cursor: not-allowed; }

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
