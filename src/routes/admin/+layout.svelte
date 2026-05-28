<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { LayoutData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const t = getContext<Readable<Translator>>('t');

	let sidebarOpen = $state(false);

	const NAV = [
		{ href: '/admin/clients', labelKey: 'admin.nav.clients', glyph: '◈' },
		{ href: '/admin/users',   labelKey: 'admin.nav.users',   glyph: '◉' }
	];

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="shell">
	{#if sidebarOpen}
		<button
			class="overlay"
			onclick={() => (sidebarOpen = false)}
			aria-label={$t('admin.mobile.close')}
		></button>
	{/if}

	<aside class="sidebar" class:sidebar--open={sidebarOpen} aria-label={$t('admin.nav.aria')}>
		<div class="sidebar-top">
			<div class="sb-brand">
				<span class="sb-icon brand-mark" aria-hidden="true">❄</span>
				<div>
					<p class="sb-wordmark"><span class="frost">Frost</span>&thinsp;<strong>ID</strong></p>
					<p class="sb-sub">{$t('common.admin_console')}</p>
				</div>
			</div>
			<div class="sb-rule" aria-hidden="true"></div>
		</div>

		<nav class="sb-nav" aria-label={$t('admin.nav.sections')}>
			{#each NAV as item}
				<a
					href={item.href}
					class="nav-item"
					class:nav-item--active={isActive(item.href)}
					aria-current={isActive(item.href) ? 'page' : undefined}
					onclick={() => (sidebarOpen = false)}
				>
					<span class="nav-glyph" aria-hidden="true">{item.glyph}</span>
					<span class="nav-label">{$t(item.labelKey)}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-foot">
			<div class="user-block">
				<div class="user-avatar" aria-hidden="true">
					{data.user.email[0].toUpperCase()}
				</div>
				<div class="user-info">
					<p class="user-email" title={data.user.email}>{data.user.email}</p>
					{#if data.user.isAdmin}
						<span class="badge badge--accent">{$t('admin.user.admin_badge')}</span>
					{/if}
				</div>
			</div>

			<div class="sidebar-foot-actions">
				<LangToggle />
				<a href="/logout" class="btn-ghost signout-btn">
					<span aria-hidden="true">↪</span>
					{$t('common.sign_out')}
				</a>
			</div>
		</div>
	</aside>

	<div class="main-wrap">
		<header class="mobile-header">
			<button
				class="hamburger"
				onclick={() => (sidebarOpen = !sidebarOpen)}
				aria-label={sidebarOpen ? $t('admin.mobile.close_menu') : $t('admin.mobile.open')}
				aria-expanded={sidebarOpen}
			>
				<span></span><span></span><span></span>
			</button>
			<span class="mobile-title">
			<span class="brand-mark" aria-hidden="true" style="font-size:1.4rem">❄</span> Frost ID
			</span>
		</header>

		<main class="content" id="main-content">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.shell { display: flex; min-height: 100vh; background: var(--bg); }
	.overlay { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.6); cursor: default; border: none; }
	.sidebar { position: fixed; top: 0; left: 0; bottom: 0; width: 240px; z-index: 50; display: flex; flex-direction: column; background: var(--surface); border-right: 1px solid var(--border); transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); }
	@media (max-width: 768px) {
		.sidebar { transform: translateX(-100%); }
		.sidebar--open { transform: translateX(0); }
	}

	.sidebar-top { padding: 1.5rem 1.25rem 0; }
	.sb-brand { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1.25rem; }
	.sb-icon { font-size: 1.8rem; }
	.sb-wordmark { font-family: var(--font-display); font-size: 1.25rem; font-weight: 200; color: var(--text); letter-spacing: 0.08em; line-height: 1; }
	.sb-wordmark strong { font-weight: 600; }
	.sb-wordmark .frost { color: var(--accent); }
	.sb-sub { font-family: var(--font-body); font-size: 0.5rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--text-dim); opacity: 0.6; margin-top: 2px; }
	.sb-rule { height: 1px; background: var(--border); }
	.sb-nav { flex: 1; padding: 0.5rem 0; overflow-y: auto; }
	.nav-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1.25rem; font-family: var(--font-body); font-size: 0.7rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); text-decoration: none; border-left: 2px solid transparent; transition: color 0.15s, background 0.15s, border-color 0.15s; cursor: pointer; }
	.nav-item:hover { color: var(--text); background: rgba(255,255,255,0.03); }
	.nav-item--active { color: var(--accent); background: rgba(113,118,170,0.06); border-left-color: var(--accent); }
	.nav-glyph { font-size: 0.75rem; opacity: 0.6; flex-shrink: 0; }
	.sidebar-foot { padding: 1.25rem; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 0.75rem; }
	.user-block { display: flex; align-items: center; gap: 0.75rem; }
	.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(113,118,170,0.12); border: 1px solid rgba(113,118,170,0.2); display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 500; color: var(--accent); flex-shrink: 0; }
	.user-info { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
	.user-email { font-family: var(--font-body); font-size: 0.7rem; color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
	.sidebar-foot-actions { display: flex; align-items: center; gap: 0.5rem; }
	.signout-btn { flex: 1; font-family: var(--font-display); font-size: 0.8125rem; font-weight: 400; gap: 0.4rem; cursor: pointer; display: flex; align-items: center; justify-content: center; letter-spacing: 0.08em; text-transform: uppercase; }
	.main-wrap { flex: 1; margin-left: 240px; display: flex; flex-direction: column; min-height: 100vh; }
	@media (max-width: 768px) { .main-wrap { margin-left: 0; } }
	.mobile-header { display: none; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); background: var(--surface); }
	@media (max-width: 768px) { .mobile-header { display: flex; } }
	.hamburger { display: flex; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 4px; }
	.hamburger span { display: block; width: 20px; height: 1.5px; background: var(--text-dim); transition: background 0.15s; }
	.hamburger:hover span { background: var(--text); }
	.mobile-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 200; color: var(--accent); letter-spacing: 0.08em; display: flex; align-items: center; gap: 0.5rem; }
	.content { flex: 1; padding: 2.5rem; max-width: 1200px; width: 100%; }
	@media (max-width: 768px) { .content { padding: 1.25rem; } }
</style>
