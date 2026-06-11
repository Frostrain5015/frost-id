<script lang="ts">
	import { enhance } from '$app/forms';
	import { getContext } from 'svelte';
	import { confirmSubmit } from '$lib/client/confirm-submit.js';
	import SystemNotice from '$lib/components/SystemNotice.svelte';
	import type { Readable } from 'svelte/store';
	import type { ActionData, PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const t = getContext<Readable<Translator>>('t');

	let showCreate = $state(false);
	let creating = $state(false);

	function formatDate(d: Date | string): string {
		return new Date(d).toLocaleDateString(undefined, {
			year: 'numeric', month: 'short', day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{$t('users.page_title')}</title>
</svelte:head>

<div class="page-header anim-item">
	<div>
		<h2 class="page-title">{$t('users.heading')}</h2>
		<p class="page-sub">{$t('users.subtitle')}</p>
	</div>
	<button
		class="btn-primary new-btn"
		onclick={() => (showCreate = !showCreate)}
		aria-expanded={showCreate}
	>
		{showCreate ? $t('users.btn_cancel_new') : $t('users.btn_new')}
	</button>
</div>

{#if form?.created}
	<SystemNotice variant="success">{$t('users.notice_created')}</SystemNotice>
{/if}

{#if form?.errorKey}
	<SystemNotice variant="error">{$t(form.errorKey)}</SystemNotice>
{/if}

{#if showCreate}
	<div class="create-panel surface anim-item">
		<div class="create-inner">
			<p class="create-title">{$t('users.form_title')}</p>
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
					<div class="field">
						<input type="text" id="username" name="username"
							placeholder="username" required autocomplete="off" />
						<label for="username">{$t('users.form_username')}</label>
					</div>
					<div class="field">
						<input type="email" id="email" name="email"
							placeholder="email" required autocomplete="off" />
						<label for="email">{$t('users.form_email')}</label>
					</div>
					<div class="field" style="grid-column: span 2">
						<input type="password" id="password" name="password"
							placeholder="password" required autocomplete="new-password" minlength="8" />
						<label for="password">{$t('users.form_password')}</label>
					</div>
					<label class="check-item admin-check">
						<input type="checkbox" name="admin" />
						<span>{$t('users.form_admin')}</span>
					</label>
				</div>
				<div class="create-actions">
					<button type="button" class="btn-ghost" onclick={() => (showCreate = false)}>
						{$t('users.form_cancel')}
					</button>
					<button type="submit" class="btn-primary" disabled={creating} aria-busy={creating}>
						{#if creating}
							<span class="dots"><span></span><span></span><span></span></span>
						{:else}
							{$t('users.form_submit')}
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if data.users.length > 0}
	<div class="table-wrap surface anim-item" style:animation-delay="0.08s">
		<table class="admin-table">
			<thead>
				<tr>
					<th scope="col">{$t('users.col_user')}</th>
					<th scope="col">{$t('users.col_role')}</th>
					<th scope="col">{$t('users.col_created')}</th>
					<th scope="col"><span class="sr-only">{$t('common.cancel')}</span></th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user}
					<tr>
						<td>
							<div class="user-cell">
								<div class="user-avatar" aria-hidden="true">{user.username[0].toUpperCase()}</div>
								<div>
									<p class="user-name">{user.username}</p>
									<p class="user-email">{user.email}</p>
								</div>
							</div>
						</td>
						<td>
							{#if user.isAdmin}
								<span class="badge badge--accent">{$t('users.badge_admin')}</span>
							{:else}
								<span class="badge badge--muted">{$t('users.badge_user')}</span>
							{/if}
						</td>
						<td class="date-cell">{formatDate(user.createdAt)}</td>
						<td class="action-cell">
							<form method="POST" action="?/delete" use:enhance={() => ({ update }) => update()}>
								<input type="hidden" name="id" value={user.id} />
								<button
									type="submit"
									class="btn-ghost del-btn"
									aria-label={$t('users.delete_aria', { name: user.username })}
									onclick={(e) => confirmSubmit(e, {
										title: $t('users.delete_aria', { name: user.username }),
										message: $t('users.delete_confirm', { email: user.email }),
										confirmLabel: $t('users.delete_aria', { name: user.username }),
										cancelLabel: $t('common.cancel'),
										variant: 'danger'
									})}
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
		<p class="empty-title"><em>{$t('users.empty_title')}</em></p>
		<p class="empty-sub">{$t('users.empty_desc')}</p>
	</div>
{/if}

<style>
	@media (prefers-reduced-motion: reduce) { .anim-item { animation: none !important; } }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); border: 0; }
	.anim-item { animation: fadeUp 0.85s cubic-bezier(0.16,1,0.3,1) both; }
	.page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
	.page-title { font-family: var(--font-display); font-size: 2rem; font-weight: 300; color: var(--text); letter-spacing: 0.02em; }
	.page-sub { font-size: 0.8125rem; color: var(--text-dim); margin-top: 0.25rem; }
	.new-btn { width: auto; cursor: pointer; padding: 0.75rem 1.25rem; }
	.create-panel { margin-bottom: 1.5rem; }
	.create-inner { padding: 1.75rem 2rem; }
	.create-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 300; color: var(--text); margin-bottom: 1.5rem; letter-spacing: 0.04em; }
	.create-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 1.5rem; }
	@media (max-width: 600px) { .create-grid { grid-template-columns: 1fr; } }
	.create-grid .field { margin-bottom: 0; }
	.check-item { display: flex; align-items: center; gap: 0.6rem; cursor: pointer; font-size: 0.8125rem; color: var(--text); grid-column: span 2; }
	@media (max-width: 600px) { .check-item { grid-column: span 1; } }
	.check-item input[type=checkbox] { width: 15px; height: 15px; accent-color: var(--accent); }
	.create-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid var(--border); }
	.create-actions button { width: auto; cursor: pointer; }
	.dots { display: inline-flex; gap: 4px; align-items: center; }
	.dots span { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: shimmer 1.1s ease-in-out infinite; }
	.dots span:nth-child(2) { animation-delay: 0.18s; }
	.dots span:nth-child(3) { animation-delay: 0.36s; }
	.table-wrap { overflow-x: auto; }
	.user-cell { display: flex; align-items: center; gap: 0.75rem; }
	.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(113,118,170,0.2); border: 1px solid rgba(113,118,170,0.35); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 500; color: var(--accent-hi); flex-shrink: 0; }
	.user-name { font-size: 0.875rem; color: var(--text); }
	.user-email { font-size: 0.75rem; color: var(--text-dim); }
	.date-cell { color: var(--text-dim); font-size: 0.8125rem; white-space: nowrap; }
	.action-cell { text-align: right; }
	.del-btn { padding: 0.35rem 0.6rem; font-size: 0.75rem; color: rgba(217,92,92,0.7); border-color: rgba(217,92,92,0.2); cursor: pointer; }
	.del-btn:hover { color: #e84f6e; border-color: rgba(217,92,92,0.5); background: rgba(217,92,92,0.06); }
	.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.875rem; padding: 4rem 2rem; border: 1px dashed rgba(113,118,170,0.2); border-radius: var(--radius-xl); text-align: center; }
	.empty-icon { font-size: 2.5rem; color: var(--accent-hi); display: block; }
	.empty-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 300; color: var(--text-dim); }
	.empty-title em { font-style: italic; }
	.empty-sub { font-size: 0.8125rem; color: var(--text-dim); opacity: 0.7; }
</style>
