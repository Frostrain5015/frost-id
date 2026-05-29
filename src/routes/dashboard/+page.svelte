<script lang="ts">
	import { enhance } from '$app/forms';
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import AppIcon from '$lib/components/AppIcon.svelte';

	let { data }: { data: PageData } = $props();

	const t = getContext<Readable<Translator>>('t');

	function relativeTime(date: Date | string): string {
		const diff = Date.now() - new Date(date).getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return $t('dashboard.time.just_now');
		if (mins < 60) return $t('dashboard.time.minutes', { n: String(mins) });
		const hours = Math.floor(mins / 60);
		if (hours < 24) return $t('dashboard.time.hours', { n: String(hours) });
		const days = Math.floor(hours / 24);
		if (days < 30) return $t('dashboard.time.days', { n: String(days) });
		const months = Math.floor(days / 30);
		return $t('dashboard.time.months', { n: String(months) });
	}

	// Reuse the consent screen's scope labels; fall back to the raw scope name.
	function scopeLabel(s: string): string {
		const l = $t(`consent.scope.${s}_label`);
		return l === `consent.scope.${s}_label` ? s : l;
	}
</script>

<svelte:head>
	<title>{$t('dashboard.page_title')}</title>
</svelte:head>

<div class="page anim-item">
	<div class="page-head">
		<div>
			<h2 class="page-title">{$t('dashboard.heading')}</h2>
			<p class="page-sub">{$t('dashboard.subtitle')}</p>
		</div>
	</div>

	<!-- Profile card -->
	<div class="profile surface" style="--anim-delay: 0.04s">
		<div class="profile-avatar">{data.user.username[0].toUpperCase()}</div>
		<div class="profile-body">
			<p class="profile-name">{data.user.username}</p>
			<p class="profile-email">{data.user.email}</p>
			<span class="tag tag--muted">{$t('users.badge_user')}</span>
		</div>
	</div>

	<!-- Apps section -->
	<div id="apps" class="section-head" style="--anim-delay: 0.08s">
		<h3 class="section-title">{$t('dashboard.apps_section')}</h3>
	</div>

	{#if data.clients.length > 0}
		<div class="app-grid" style="--anim-delay: 0.1s">
			{#each data.clients as client}
				<div class="app-card">
					<div class="app-card-top">
						<AppIcon name={client.name} size={40} />
						<div class="app-meta">
							<h4 class="app-name">{client.name}</h4>
							<p class="app-date">{$t('dashboard.granted', { time: relativeTime(client.grantedAt) })}</p>
						</div>
						<form
							method="POST"
							action="?/revoke"
							use:enhance={() => ({ update }) => update()}
						>
							<input type="hidden" name="clientId" value={client.id} />
							<button
								type="submit"
								class="revoke-btn"
								onclick={(e) => {
									if (!confirm($t('dashboard.revoke_confirm', { name: client.name }))) {
										e.preventDefault();
									}
								}}
							>{$t('dashboard.revoke')}</button>
						</form>
					</div>

					{#if client.scopes.length > 0}
						<div class="app-scopes">
							{#each client.scopes as s}
								<span class="tag tag--accent">{scopeLabel(s)}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty" style="--anim-delay: 0.1s">
			<span class="empty-icon" aria-hidden="true">❄</span>
			<p class="empty-text"><em>{$t('dashboard.apps_empty')}</em></p>
		</div>
	{/if}
</div>

<style>
	.page { max-width: 720px; }
	.anim-item { animation: fadeUp 0.85s cubic-bezier(0.16,1,0.3,1) both; animation-delay: var(--anim-delay, 0s); }
	@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

	.page-head { margin-bottom: 1.75rem; }
	.page-title { font-family: var(--font-display); font-size: 2rem; font-weight: 300; color: var(--text); letter-spacing: 0.02em; line-height: 1.1; }
	.page-sub { font-size: 0.8125rem; color: var(--text-dim); margin-top: 0.25rem; }

	/* ── Profile ────────────────────────────────────────── */
	.profile { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; margin-bottom: 2rem; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
	.profile-avatar { width: 48px; height: 48px; border-radius: 50%; background: rgba(113,118,170,0.12); border: 1px solid rgba(113,118,170,0.2); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: 500; color: var(--accent); flex-shrink: 0; }
	.profile-body { display: flex; flex-direction: column; gap: 4px; }
	.profile-name { font-family: var(--font-display); font-size: 1.125rem; color: var(--text); }
	.profile-email { font-size: 0.8125rem; color: var(--text-dim); }

	/* ── Section heading ────────────────────────────────── */
	.section-head { margin-bottom: 0.875rem; }
	.section-title { font-family: var(--font-display); font-size: 1.25rem; font-weight: 300; color: var(--text); letter-spacing: 0.04em; }

	/* ── App card grid ──────────────────────────────────── */
	.app-grid { display: flex; flex-direction: column; gap: 0.5rem; }

	.app-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.125rem 1.25rem;
		transition: border-color 0.2s, background 0.2s;
		cursor: default;
	}
	.app-card:hover {
		border-color: rgba(113,118,170,0.2);
		background: rgba(113,118,170,0.02);
	}

	.app-card-top { display: flex; align-items: center; gap: 0.75rem; }
	.app-meta { flex: 1; min-width: 0; }
	.revoke-btn { flex-shrink: 0; padding: 0.4rem 0.85rem; font-family: var(--font-display); font-size: 0.7rem; font-weight: 400; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-dim); background: transparent; border: 1px solid var(--border); border-radius: var(--radius-sm); cursor: pointer; transition: color 0.15s, border-color 0.15s, background 0.15s; }
	.revoke-btn:hover { color: var(--error); border-color: rgba(217,92,92,0.35); background: rgba(217,92,92,0.05); }
	.revoke-btn:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
	.app-name { font-family: var(--font-display); font-size: 0.95rem; font-weight: 400; color: var(--text); letter-spacing: 0.02em; }
	.app-date { font-family: var(--font-body); font-size: 0.6875rem; color: var(--text-dim); opacity: 0.5; margin-top: 1px; }

	/* ── Scope tags ─────────────────────────────────────── */
	.app-scopes { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 0.625rem; padding-top: 0.625rem; border-top: 1px solid var(--border); }
	.tag { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 0.65rem; font-weight: 500; letter-spacing: 0.03em; }
	.tag--muted { background: rgba(113,118,170,0.08); color: var(--text-dim); border: 1px solid rgba(113,118,170,0.15); }
	.tag--accent { background: rgba(113,118,170,0.1); color: var(--accent-hi); border: 1px solid rgba(113,118,170,0.18); }

	/* ── Empty state ────────────────────────────────────── */
	.empty { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 5rem 2rem; border: 1px dashed rgba(113,118,170,0.15); border-radius: var(--radius-xl); text-align: center; }
	.empty-icon { font-size: 2.5rem; color: var(--accent-hi); opacity: 0.5; display: block; }
	.empty-text { font-family: var(--font-display); font-size: 1.25rem; font-weight: 300; color: var(--text-dim); }
	.empty-text em { font-style: italic; }
</style>
