<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount, getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let approving = $state(false);
	let denying   = $state(false);
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

			<!-- Dual-brand header: Frost ID ⟷ Application -->
			<div class="dual-brand">
				<div class="brand-block">
					<span class="brand-icon brand-mark" aria-hidden="true">❄</span>
					<h2 class="brand-name"><span class="frost">Frost</span>&thinsp;<strong>ID</strong></h2>
				</div>

				<div class="connector" aria-hidden="true">
					<div class="connector-line"></div>
					<div class="connector-icon">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M4 12h16" /><path d="M14 6l6 6-6 6" />
						</svg>
					</div>
					<div class="connector-line"></div>
				</div>

				<div class="brand-block brand-block--app">
					<div class="app-icon" aria-hidden="true">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 3l18 18" /><path d="M21 3L3 21" />
						</svg>
					</div>
					<h2 class="brand-name brand-name--app">{data.clientName}</h2>
				</div>
			</div>

			<div class="divider" aria-hidden="true"></div>

			<!-- Signed-in user -->
			<p class="signed-as">
				{$t('consent.signed_as')}&nbsp;<strong>{data.user.email}</strong>
			</p>

			{#if form?.errorKey}
				<div class="err" role="alert" aria-live="assertive">{$t(form.errorKey)}</div>
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
				<form
					method="POST" action="?/deny"
					use:enhance={() => {
						denying = true;
						return async ({ update }) => { await update(); denying = false; };
					}}
				>
					<input type="hidden" name="pid" value={data.pid} />
					<button type="submit" class="btn-deny" disabled={approving || denying}>
						{$t('consent.deny')}
					</button>
				</form>

				<form
					method="POST" action="?/approve"
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
							{$t('consent.approve')}
						{/if}
					</button>
				</form>
			</div>

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
	.wrap { width: 100%; max-width: 480px; padding: 1.5rem; opacity: 0; transform: translateY(16px); transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1); }
	.wrap.mounted { opacity: 1; transform: translateY(0); }
	.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 2.75rem 2.5rem 2rem; }

	/* Dual-brand */
	.dual-brand { display: flex; align-items: center; justify-content: center; gap: 0.75rem; margin-bottom: 1.25rem; }
	.brand-block { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; min-width: 0; }
	.brand-block--app { opacity: 0.7; }
	.brand-icon { font-size: 2.25rem; line-height: 1; }
	.brand-name { font-family: var(--font-display); font-size: 1rem; font-weight: 200; letter-spacing: 0.06em; color: var(--text); line-height: 1; white-space: nowrap; }
	.brand-name strong { font-weight: 500; }
	.brand-name .frost { color: var(--accent); }
	.brand-name--app { font-weight: 300; color: var(--text-dim); }
	.app-icon { width: 36px; height: 36px; border-radius: 10px; background: rgba(255,255,255,0.04); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; color: var(--text-dim); }

	.connector { display: flex; flex-direction: column; align-items: center; gap: 2px; flex-shrink: 0; }
	.connector-line { width: 32px; height: 1px; background: var(--border); }
	.connector-icon { color: var(--text-dim); opacity: 0.5; line-height: 1; }
	.connector-icon :global(svg) { display: block; }

	.divider { height: 1px; margin-bottom: 1.25rem; background: var(--border); }

	.signed-as { text-align: center; font-size: 0.8125rem; color: var(--text-dim); margin-bottom: 1.25rem; }
	.signed-as strong { color: var(--text); font-weight: 400; }

	.err { padding: 0.75rem 1rem; margin-bottom: 1.25rem; background: rgba(217,92,92,0.06); border: 1px solid rgba(217,92,92,0.2); border-radius: var(--radius-md); font-size: 0.8125rem; color: #e88383; animation: fadeUp 0.25s ease; }

	.scopes-label { font-family: var(--font-body); font-size: 0.6rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.625rem; }

	/* Scopes */
	.scopes { list-style: none; display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1.75rem; }
	.scope { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border: 1px solid var(--border); border-radius: var(--radius-md); cursor: default; transition: border-color 0.15s, background 0.15s; }
	.scope--hover { border-color: var(--border-hi); background: rgba(255,255,255,0.02); }
	.scope-icon { font-size: 0.8rem; color: var(--accent); opacity: 0.7; flex-shrink: 0; }
	.scope-body { flex: 1; display: flex; flex-direction: column; gap: 1px; }
	.scope-name { font-size: 0.875rem; color: var(--text); }
	.scope-desc { font-size: 0.75rem; color: var(--text-dim); }
	.scope-check { font-size: 0.65rem; color: var(--accent-hi); animation: fadeUp 0.15s ease; }

	/* Actions */
	.actions { display: flex; gap: 0.75rem; }
	.actions form { display: contents; }

	.btn-deny {
		flex: 0 0 auto; min-width: 100px; height: 48px;
		display: flex; align-items: center; justify-content: center;
		padding: 0 1rem;
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
</style>
