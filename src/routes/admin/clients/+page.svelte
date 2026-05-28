<script lang="ts">
	import { enhance } from '$app/forms';
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let showCreate = $state(false);
	let creating = $state(false);
	let secretCopied = $state(false);

	const GRANTS = [
		{ value: 'authorization_code', key: 'grant.authorization_code' },
		{ value: 'client_credentials', key: 'grant.client_credentials' },
		{ value: 'refresh_token',      key: 'grant.refresh_token'      }
	];

	async function copySecret(secret: string) {
		await navigator.clipboard.writeText(secret);
		secretCopied = true;
		setTimeout(() => (secretCopied = false), 2500);
	}

	function formatDate(d: Date | string): string {
		return new Date(d).toLocaleDateString(undefined, {
			year: 'numeric', month: 'short', day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{$t('clients.page_title')}</title>
</svelte:head>

<div class="page-header anim-item">
	<div class="page-header-left">
		<h2 class="page-title">{$t('clients.heading')}</h2>
		<p class="page-sub">{$t('clients.subtitle')}</p>
	</div>
	<button
		class="btn-primary new-btn"
		onclick={() => (showCreate = !showCreate)}
		aria-expanded={showCreate}
		aria-controls="create-form"
	>
		{showCreate ? $t('clients.btn_cancel_new') : $t('clients.btn_new')}
	</button>
</div>

{#if form?.created && form.clientSecret}
	<div class="secret-panel surface anim-item" role="status" aria-live="polite">
		<div class="secret-panel-inner">
			<div class="secret-header">
				<span class="secret-glyph" aria-hidden="true">◆</span>
				<div>
					<p class="secret-title">{$t('clients.secret_title')}</p>
					<p class="secret-warn">{$t('clients.secret_warn')}</p>
				</div>
			</div>
			<div class="secret-row">
				<code class="secret-value">{form.clientSecret}</code>
				<button
					class="btn-ghost copy-btn"
					onclick={() => copySecret(form!.clientSecret!)}
					aria-label={$t('clients.secret_copy')}
				>
					{secretCopied ? $t('clients.secret_copied') : $t('clients.secret_copy')}
				</button>
			</div>
		</div>
	</div>
{:else if form?.created}
	<div class="notice-panel anim-item" role="status">
		<span aria-hidden="true">✦</span> {$t('clients.notice_public')}
	</div>
{/if}

{#if form?.errorKey}
	<div class="err-panel anim-item" role="alert">
		<span aria-hidden="true">◆</span> {$t(form.errorKey)}
	</div>
{/if}

{#if showCreate}
	<div id="create-form" class="create-panel surface anim-item">
		<div class="create-panel-inner">
			<p class="create-panel-title">{$t('clients.form_title')}</p>
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						await update();
						creating = false;
						showCreate = false;
					};
				}}
			>
				<div class="create-grid">
					<div class="field create-field">
						<input
							type="text" id="name" name="name"
							placeholder="name" required autocomplete="off"
						/>
						<label for="name">{$t('clients.form_name')}</label>
					</div>

					<div class="field-area">
						<label class="area-label" for="redirect_uris">
							{$t('clients.form_redirect_uris')}
							<span class="label-hint">({$t('clients.form_redirect_hint')})</span>
						</label>
						<textarea
							id="redirect_uris" name="redirect_uris"
							rows="3" placeholder="https://your-app.com/callback" required
						></textarea>
					</div>

					<fieldset class="check-group">
						<legend class="check-legend">{$t('clients.form_grants')}</legend>
						<div class="checks">
							{#each GRANTS as g}
								<label class="check-item">
									<input
										type="checkbox" name="grants" value={g.value}
										checked={g.value === 'authorization_code'}
									/>
									<span class="check-label">{$t(g.key)}</span>
								</label>
							{/each}
						</div>
					</fieldset>

					<fieldset class="check-group">
						<legend class="check-legend">{$t('clients.form_scopes')}</legend>
						<div class="checks">
							{#each data.scopes as s}
								<label class="check-item">
									<input type="checkbox" name="scopes" value={s.name} />
									<span class="check-label">{s.name}</span>
								</label>
							{/each}
						</div>
					</fieldset>

					<label class="toggle-item">
						<input type="checkbox" name="confidential" />
						<span class="toggle-track" aria-hidden="true"></span>
						<span class="toggle-text">
							<span>{$t('clients.form_confidential')}</span>
							<span class="toggle-hint">{$t('clients.form_confidential_hint')}</span>
						</span>
					</label>
				</div>

				<div class="create-actions">
					<button type="button" class="btn-ghost" onclick={() => (showCreate = false)}>
						{$t('clients.form_cancel')}
					</button>
					<button type="submit" class="btn-primary" disabled={creating} aria-busy={creating}>
						{#if creating}
							<span class="dots"><span></span><span></span><span></span></span>
						{:else}
							{$t('clients.form_submit')}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if data.clients.length > 0}
	<div class="table-wrap surface anim-item" style:animation-delay="0.08s">
		<table class="admin-table">
			<thead>
				<tr>
					<th scope="col">{$t('clients.col_application')}</th>
					<th scope="col">{$t('clients.col_grants')}</th>
					<th scope="col">{$t('clients.col_scopes')}</th>
					<th scope="col">{$t('clients.col_created')}</th>
					<th scope="col"><span class="sr-only">{$t('clients.col_actions')}</span></th>
				</tr>
			</thead>
			<tbody>
				{#each data.clients as client}
					<tr>
						<td>
							<div class="client-name-cell">
								<span class="client-name">{client.name}</span>
								<span class="client-id">{client.id.slice(0, 12)}…</span>
								{#if !client.secret}
									<span class="badge badge--muted">{$t('clients.badge_public')}</span>
								{:else}
									<span class="badge badge--accent">{$t('clients.badge_confidential')}</span>
								{/if}
							</div>
						</td>
						<td>
							<div class="badge-list">
								{#each client.allowedGrants as g}
									<span class="badge badge--muted">{$t(`grant.${g}`)}</span>
								{/each}
							</div>
						</td>
						<td>
							<div class="badge-list">
								{#each client.scopes as s}
									<span class="badge badge--accent">{s}</span>
								{/each}
							</div>
						</td>
						<td class="date-cell">{formatDate(client.createdAt)}</td>
						<td class="action-cell">
							<form method="POST" action="?/delete" use:enhance={() => ({ update }) => update()}>
								<input type="hidden" name="id" value={client.id} />
								<button
									type="submit"
									class="btn-ghost del-btn"
									aria-label={$t('clients.delete_aria', { name: client.name })}
									onclick={(e) => {
										if (!confirm($t('clients.delete_confirm', { name: client.name }))) {
											e.preventDefault();
										}
									}}
								>✕</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="empty-state anim-item" style:animation-delay="0.08s">
		<span class="empty-icon brand-mark" aria-hidden="true">❄</span>
		<p class="empty-title"><em>{$t('clients.empty_title')}</em></p>
		<p class="empty-sub">{$t('clients.empty_desc')}</p>
		<button class="btn-ghost" onclick={() => (showCreate = true)}>
			{$t('clients.empty_cta')}
		</button>
	</div>
{/if}

<style>
	@media (prefers-reduced-motion: reduce) { .anim-item { animation: none !important; } }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
	.anim-item { animation: fadeUp 0.85s cubic-bezier(0.16,1,0.3,1) both; }
	.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
	.page-title { font-family: var(--font-display); font-size: 2rem; font-weight: 300; color: var(--text); letter-spacing: 0.02em; line-height: 1.1; }
	.page-sub { font-size: 0.8125rem; color: var(--text-dim); margin-top: 0.25rem; }
	.new-btn { width: auto; flex-shrink: 0; padding: 0.75rem 1.25rem; cursor: pointer; }
	.secret-panel { margin-bottom: 1.5rem; border-color: rgba(113,118,170,0.35) !important; background: rgba(113,118,170,0.08) !important; }
	.secret-panel-inner { padding: 1.25rem 1.5rem; }
	.secret-header { display: flex; align-items: flex-start; gap: 0.75rem; margin-bottom: 0.875rem; }
	.secret-glyph { font-size: 0.7rem; color: var(--accent-hi); flex-shrink: 0; line-height: 1.8; }
	.secret-title { font-size: 0.875rem; font-weight: 500; color: var(--text); }
	.secret-warn { font-size: 0.75rem; color: #f0b060; margin-top: 2px; }
	.secret-row { display: flex; align-items: center; gap: 0.75rem; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); padding: 0.75rem 1rem; }
	.secret-value { flex: 1; font-family: 'Courier New', monospace; font-size: 0.8125rem; color: var(--accent-hi); word-break: break-all; letter-spacing: 0.03em; }
	.copy-btn { flex-shrink: 0; cursor: pointer; }
	.notice-panel { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1.25rem; background: rgba(113,118,170,0.08); border: 1px solid rgba(113,118,170,0.28); border-radius: var(--radius-md); font-size: 0.8125rem; color: var(--accent-hi); animation: fadeUp 0.4s ease both; }
	.err-panel { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; margin-bottom: 1.25rem; background: rgba(217,92,92,0.08); border: 1px solid rgba(217,92,92,0.28); border-radius: var(--radius-md); font-size: 0.8125rem; color: #e88383; animation: fadeUp 0.4s ease both; }
	.create-panel { margin-bottom: 1.5rem; }
	.create-panel-inner { padding: 1.75rem 2rem; }
	.create-panel-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 300; color: var(--text); margin-bottom: 1.5rem; letter-spacing: 0.04em; }
	.create-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 1.5rem; }
	@media (max-width: 600px) { .create-grid { grid-template-columns: 1fr; } }
	.create-field { margin-bottom: 0; }
	.field-area { display: flex; flex-direction: column; gap: 0.5rem; }
	.area-label { font-size: 0.6875rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); }
	.label-hint { font-size: 0.6rem; opacity: 0.7; text-transform: none; letter-spacing: 0; }
	.field-area textarea { padding: 0.75rem; font-family: var(--font-body); font-size: 0.875rem; color: var(--text); background: rgba(255,255,255,0.04); border: 1px solid rgba(113,118,170,0.18); border-radius: var(--radius-md); resize: vertical; min-height: 80px; outline: none; transition: border-color 0.2s, box-shadow 0.2s; }
	.field-area textarea:focus { border-color: rgba(113,118,170,0.5); box-shadow: 0 0 0 3px rgba(113,118,170,0.1); }
	.check-group { border: none; }
	.check-legend { font-size: 0.6875rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.625rem; display: block; }
	.checks { display: flex; flex-direction: column; gap: 0.5rem; }
	.check-item { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; }
	.check-item input[type=checkbox] { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
	.check-label { font-size: 0.8125rem; color: var(--text); }
	.toggle-item { display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; grid-column: span 2; }
	@media (max-width: 600px) { .toggle-item { grid-column: span 1; } }
	.toggle-item input[type=checkbox] { display: none; }
	.toggle-track { position: relative; flex-shrink: 0; width: 36px; height: 20px; border-radius: 10px; background: rgba(113,118,170,0.2); border: 1px solid rgba(113,118,170,0.3); transition: background 0.2s; }
	.toggle-track::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: var(--text-dim); transition: transform 0.2s, background 0.2s; }
	.toggle-item input:checked + .toggle-track { background: rgba(113,118,170,0.4); border-color: var(--accent); }
	.toggle-item input:checked + .toggle-track::after { transform: translateX(16px); background: var(--accent); }
	.toggle-text { display: flex; flex-direction: column; gap: 2px; }
	.toggle-text span:first-child { font-size: 0.8125rem; color: var(--text); }
	.toggle-hint { font-size: 0.7rem; color: var(--text-dim); }
	.create-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border); }
	.create-actions .btn-ghost, .create-actions .btn-primary { width: auto; cursor: pointer; }
	.dots { display: inline-flex; gap: 4px; align-items: center; }
	.dots span { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: shimmer 1.1s ease-in-out infinite; }
	.dots span:nth-child(2) { animation-delay: 0.18s; }
	.dots span:nth-child(3) { animation-delay: 0.36s; }
	.table-wrap { overflow-x: auto; }
	.client-name-cell { display: flex; flex-direction: column; gap: 3px; }
	.client-name { font-weight: 400; color: var(--text); }
	.client-id { font-size: 0.7rem; color: var(--text-dim); font-family: monospace; }
	.badge-list { display: flex; flex-wrap: wrap; gap: 4px; }
	.date-cell { color: var(--text-dim); font-size: 0.8125rem; white-space: nowrap; }
	.action-cell { text-align: right; }
	.del-btn { padding: 0.35rem 0.6rem; font-size: 0.75rem; color: rgba(217,92,92,0.7); border-color: rgba(217,92,92,0.2); cursor: pointer; }
	.del-btn:hover { color: #e84f6e; border-color: rgba(217,92,92,0.5); background: rgba(217,92,92,0.06); }
	.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.875rem; padding: 4rem 2rem; border: 1px dashed rgba(113,118,170,0.2); border-radius: var(--radius-xl); text-align: center; }
	.empty-icon { font-size: 2.5rem; color: var(--accent-hi); display: block; }
	.empty-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 300; color: var(--text-dim); }
	.empty-title em { font-style: italic; }
	.empty-sub { font-size: 0.8125rem; color: var(--text-dim); opacity: 0.7; }
	.empty-state .btn-ghost { cursor: pointer; margin-top: 0.25rem; }
</style>
