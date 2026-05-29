<script lang="ts">
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';

	let { data }: { data: PageData } = $props();

	const t = getContext<Readable<Translator>>('t');

	function formatDate(d: Date | string): string {
		return new Date(d).toLocaleDateString(undefined, {
			year: 'numeric', month: 'short', day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{$t('dashboard.page_title')}</title>
</svelte:head>

<div class="page-header anim-item">
	<div>
		<h2 class="page-title">{$t('dashboard.heading')}</h2>
		<p class="page-sub">{$t('dashboard.subtitle')}</p>
	</div>
</div>

<!-- Profile card -->
<div class="profile-card surface anim-item" style="animation-delay:0.04s">
	<div class="profile-avatar">{data.user.username[0].toUpperCase()}</div>
	<div class="profile-body">
		<p class="profile-name">{data.user.username}</p>
		<p class="profile-email">{data.user.email}</p>
		<span class="badge badge--muted">{$t('users.badge_user')}</span>
	</div>
</div>

<!-- Authorized apps list -->
<div class="section-head anim-item" style="animation-delay:0.08s">
	<h3 class="section-title">{$t('dashboard.apps_section')}</h3>
</div>

{#if data.clients.length > 0}
	<div class="table-wrap surface anim-item" style="animation-delay:0.1s">
		<table class="apps-table">
			<thead>
				<tr>
					<th scope="col">{$t('clients.col_application')}</th>
					<th scope="col">{$t('clients.col_scopes')}</th>
					<th scope="col">{$t('clients.col_created')}</th>
				</tr>
			</thead>
			<tbody>
				{#each data.clients as client}
					<tr>
						<td>
							<div class="app-name-cell">
								<span class="app-name">{client.name}</span>
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
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:else}
	<div class="empty-state surface anim-item" style="animation-delay:0.1s">
		<span class="empty-icon brand-mark" aria-hidden="true">❄</span>
		<p class="empty-title"><em>{$t('dashboard.apps_empty')}</em></p>
	</div>
{/if}

<style>
	@media (prefers-reduced-motion: reduce) { .anim-item { animation: none !important; } }
	.anim-item { animation: fadeUp 0.85s cubic-bezier(0.16,1,0.3,1) both; }
	.page-header { margin-bottom: 1.75rem; }
	.page-title { font-family: var(--font-display); font-size: 2rem; font-weight: 300; color: var(--text); letter-spacing: 0.02em; line-height: 1.1; }
	.page-sub { font-size: 0.8125rem; color: var(--text-dim); margin-top: 0.25rem; }

	.profile-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; margin-bottom: 2rem; }
	.profile-avatar { width: 48px; height: 48px; border-radius: 50%; background: rgba(113,118,170,0.12); border: 1px solid rgba(113,118,170,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 500; color: var(--accent); flex-shrink: 0; }
	.profile-body { display: flex; flex-direction: column; gap: 4px; }
	.profile-name { font-family: var(--font-display); font-size: 1.125rem; color: var(--text); }
	.profile-email { font-size: 0.8125rem; color: var(--text-dim); }
	.badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.04em; }
	.badge--muted { background: rgba(113,118,170,0.08); color: var(--text-dim); border: 1px solid rgba(113,118,170,0.15); }
	.badge--accent { background: rgba(113,118,170,0.12); color: var(--accent-hi); border: 1px solid rgba(113,118,170,0.2); }

	.section-head { margin-bottom: 0.75rem; }
	.section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 300; color: var(--text); letter-spacing: 0.04em; }
	.table-wrap { overflow-x: auto; }
	.app-name { font-weight: 400; color: var(--text); }
	.badge-list { display: flex; flex-wrap: wrap; gap: 4px; }
	.date-cell { color: var(--text-dim); font-size: 0.8125rem; white-space: nowrap; }
	.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.875rem; padding: 4rem 2rem; border: 1px dashed rgba(113,118,170,0.2); border-radius: var(--radius-xl); text-align: center; }
	.empty-icon { font-size: 2.5rem; color: var(--accent-hi); display: block; }
	.empty-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 300; color: var(--text-dim); }
	.empty-title em { font-style: italic; }
</style>
