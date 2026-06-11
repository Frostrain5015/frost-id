<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';
	import AppIcon from '$lib/components/AppIcon.svelte';
	import SystemNotice from '$lib/components/SystemNotice.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let approving = $state(false);
	let denying   = $state(false);
	let switching = $state(false);
	let mounted   = $state(false);
	let hoveredScope = $state<string | null>(null);

	onMount(() => { mounted = true; });

	interface ScopeMeta { label: string; desc: string; icon: string; }

	function scopeInfo(name: string): ScopeMeta {
		const l = $t(`consent.scope.${name}_label`);
		const d = $t(`consent.scope.${name}_desc`);
		const icons: Record<string, string> = {
			openid: '⊡', profile: '◎', email: '◇', offline_access: '↻'
		};
		return {
			label: l !== `consent.scope.${name}_label` ? l : name,
			desc:  d !== `consent.scope.${name}_desc`  ? d  : '',
			icon:  icons[name] ?? '·'
		};
	}
</script>

<svelte:head>
	<title>{$t('consent.page_title')}</title>
</svelte:head>

<div class="scene">
	<main class="wrap" class:mounted>
		<div class="card">

			<!-- Dual-brand header -->
			<div class="dual-brand">
				<div class="brand-block">
					<div class="brand-icon-wrap">
						<span class="brand-icon" aria-hidden="true">❄</span>
						<div class="brand-glow" aria-hidden="true"></div>
					</div>
					<h2 class="brand-label"><span class="frost">Frost</span>&thinsp;<strong>ID</strong></h2>
				</div>

				<div class="connector" aria-hidden="true">
					<div class="connector-line"></div>
					<div class="connector-dot"></div>
					<div class="connector-line"></div>
				</div>

				<div class="brand-block brand-block--app">
					<div class="app-icon-wrap">
						<AppIcon name={data.clientName} size={48} />
					</div>
					<h2 class="brand-label brand-label--app">{data.clientName}</h2>
				</div>
			</div>

			<div class="divider" aria-hidden="true"></div>

			<!-- Signed-in user -->
			<p class="signed-as">
				<svg class="user-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
				</svg>
				<span>{$t('consent.signed_as')}&nbsp;<strong>{data.user.email}</strong></span>
			</p>

			<form method="POST" action="?/switchAccount"
				use:enhance={() => {
					switching = true;
					return async ({ update }) => { await update(); switching = false; };
				}}
				class="switch-account-form"
			>
				<input type="hidden" name="pid" value={data.pid} />
				<button type="submit" class="switch-account" disabled={approving || denying || switching}>
					{switching ? $t('consent.switching_account') : $t('consent.switch_account')}
				</button>
			</form>

			{#if form?.errorKey}
				<SystemNotice variant="error" center>{$t(form.errorKey)}</SystemNotice>
			{/if}

			<!-- Scopes -->
			<p class="scopes-label">{$t('consent.cert_want')}</p>
			<ul class="scopes" aria-label={$t('consent.cert_want')}>
				{#each data.scopes as scope, i}
					{@const meta = scopeInfo(scope)}
					<li
						class="scope"
						class:scope--hover={hoveredScope === scope}
						style="--index: {i}"
						onmouseenter={() => (hoveredScope = scope)}
						onmouseleave={() => (hoveredScope = null)}
					>
						<span class="scope-icon" aria-hidden="true">{meta.icon}</span>
						<div class="scope-body">
							<span class="scope-name">{meta.label}</span>
							{#if meta.desc}<span class="scope-desc">{meta.desc}</span>{/if}
						</div>
						{#if hoveredScope === scope}
							<span class="scope-check" aria-hidden="true">✓</span>
						{/if}
					</li>
				{/each}
			</ul>

			<!-- Action buttons -->
			<div class="actions">
				<form method="POST" action="?/deny"
					use:enhance={() => {
						denying = true;
						return async ({ update }) => { await update(); denying = false; };
					}}
				>
					<input type="hidden" name="pid" value={data.pid} />
					<button type="submit" class="btn-deny" disabled={approving || denying}>{$t('consent.deny')}</button>
				</form>

				<form method="POST" action="?/approve"
					use:enhance={() => {
						approving = true;
						return async ({ update }) => { await update(); approving = false; };
					}}
				>
					<input type="hidden" name="pid" value={data.pid} />
					<button type="submit" class="btn-approve" disabled={approving || denying}>
						{#if approving}
							<svg class="spinner" viewBox="0 0 24 24" aria-label={$t('consent.approve')}>
								<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor"
									stroke-width="2" stroke-dasharray="56.5" stroke-dashoffset="42"
									stroke-linecap="round"/>
							</svg>
						{:else}
							<span aria-hidden="true">✓</span>
							{$t('consent.approve')}
						{/if}
					</button>
				</form>
			</div>

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
	.wrap { width: 100%; max-width: 480px; padding: 1.5rem; opacity: 0; transform: translateY(16px); transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1); }
	.wrap.mounted { opacity: 1; transform: translateY(0); }
	.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2.75rem 2.5rem 2rem; }

	/* ── Dual-brand ─────────────────────────────────────── */
	.dual-brand { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1.5rem; }
	.brand-block { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; flex: 1; }
	.brand-block--app { opacity: 0.75; }

	.brand-icon-wrap { position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
	.brand-icon { font-size: 2.5rem; line-height: 1; position: relative; z-index: 1; }
	.brand-glow { position: absolute; inset: -4px; background: radial-gradient(circle, rgba(113,118,170,0.15) 0%, transparent 70%); }

	.app-icon-wrap { position: relative; }

	.brand-label { font-family: var(--font-display); font-size: 1rem; font-weight: 200; letter-spacing: 0.06em; color: var(--text); line-height: 1.15; white-space: nowrap; text-align: center; }
	.brand-label strong { font-weight: 500; }
	.brand-label .frost { color: var(--accent); }
	.brand-label--app { font-weight: 300; color: var(--text-dim); letter-spacing: 0.04em; }


	.connector { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; }
	.connector-line { width: 28px; height: 1px; background: var(--border); }
	.connector-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--text-dim); opacity: 0.3; }

	.divider { height: 1px; margin-bottom: 1.25rem; background: var(--border); }

	/* ── Signed-as ─────────────────────────────────────── */
	.signed-as { display: flex; align-items: center; justify-content: center; gap: 0.4rem; font-size: 0.8125rem; color: var(--text-dim); margin-bottom: 1.25rem; }
	.signed-as strong { color: var(--text); font-weight: 400; }
	.user-icon { opacity: 0.5; flex-shrink: 0; }

	.switch-account-form { display: flex; justify-content: center; margin: -0.6rem 0 1.25rem; }
	.switch-account {
		min-height: 44px;
		padding: 0 0.25rem;
		background: transparent;
		border: 0;
		color: var(--text-dim);
		font-family: var(--font-body);
		font-size: 0.8125rem;
		cursor: pointer;
		opacity: 0.72;
		text-decoration: underline;
		text-decoration-color: transparent;
		text-underline-offset: 4px;
		transition: color 0.15s, opacity 0.15s, text-decoration-color 0.15s;
	}
	.switch-account:hover:not(:disabled) { color: var(--accent-hi); opacity: 1; text-decoration-color: currentColor; }
	.switch-account:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 2px; }
	.switch-account:disabled { cursor: not-allowed; opacity: 0.4; }

	.scopes-label { font-family: var(--font-body); font-size: 0.6rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.625rem; }

	.scopes { list-style: none; display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.75rem; }
	.scope { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); cursor: default; transition: border-color 0.15s, background 0.15s; }
	.scope--hover { border-color: var(--border-hi); background: rgba(255,255,255,0.02); }
	.scope-icon { font-size: 0.8rem; color: var(--accent); opacity: 0.7; flex-shrink: 0; }
	.scope-body { flex: 1; display: flex; flex-direction: column; gap: 1px; }
	.scope-name { font-size: 0.875rem; color: var(--text); }
	.scope-desc { font-size: 0.75rem; color: var(--text-dim); }
	.scope-check { font-size: 0.65rem; color: var(--accent-hi); animation: fadeUp 0.15s ease; }

	.actions { display: flex; gap: 0.75rem; margin-top: 0; }
	.actions form { display: contents; }

	.btn-deny {
		flex: 0 0 auto; min-width: 100px; height: 48px;
		display: flex; align-items: center; justify-content: center;
		padding: 0 1.25rem;
		font-family: var(--font-display); font-size: 0.8125rem; font-weight: 400;
		letter-spacing: 0.1em; text-transform: uppercase;
		color: var(--text-dim);
		background: transparent; border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer; outline: none;
		transition: color 0.15s, border-color 0.15s, background 0.15s, transform 0.15s;
	}
	.btn-deny:hover:not(:disabled) { color: var(--error); border-color: rgba(217,92,92,0.35); background: rgba(217,92,92,0.05); }
	.btn-deny:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.btn-deny:disabled { opacity: 0.4; cursor: not-allowed; }

	.btn-approve {
		flex: 1; height: 48px;
		display: flex; align-items: center; justify-content: center;
		gap: 0.5rem;
		font-family: var(--font-display); font-size: 0.9375rem; font-weight: 400;
		letter-spacing: 0.14em; text-transform: uppercase;
		color: #fff; background: var(--accent); border: none;
		border-radius: var(--radius-sm);
		cursor: pointer; outline: none;
		transition: filter 0.18s, transform 0.15s;
	}
	.btn-approve:hover:not(:disabled) { filter: brightness(1.15); transform: translateY(-1px); }
	.btn-approve:active:not(:disabled) { transform: scale(0.98); }
	.btn-approve:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.btn-approve:disabled { opacity: 0.4; cursor: not-allowed; filter: none; transform: none; }

	.spinner { width: 20px; height: 20px; animation: spin 0.75s linear infinite; }

	.foot { display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--border); font-size: 0.6rem; font-family: var(--font-body); letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); opacity: 0.55; }
	.foot-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--text-dim); opacity: 0.35; }

	@keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
</style>
