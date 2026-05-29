<script lang="ts">
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { Translator } from '$lib/i18n/index.js';
	import LangToggle from '$lib/components/LangToggle.svelte';

	interface NavUser { username: string; email: string; isAdmin: boolean; }
	let { user }: { user: NavUser | null } = $props();

	const t = getContext<Readable<Translator>>('t');

	const consoleHref = $derived(user?.isAdmin ? '/admin' : '/dashboard');
</script>

<header class="nav">
	<a class="brand" href="/" aria-label="Frost Tech">
		<span class="brand-snow" aria-hidden="true">❄</span>
		<span class="brand-word"><span class="frost">Frost</span>&thinsp;<strong>Tech</strong></span>
	</a>

	<div class="nav-right">
		<LangToggle />
		{#if user}
			<details class="acct">
				<summary aria-label={$t('home.nav.menu')}>
					<span class="acct-avatar" aria-hidden="true">{user.username[0]?.toUpperCase() ?? '?'}</span>
					<span class="acct-name">{user.username}</span>
					<span class="acct-caret" aria-hidden="true">▾</span>
				</summary>
				<div class="acct-menu" role="menu">
					<a role="menuitem" href={consoleHref}>{$t('home.nav.console')}</a>
					<a role="menuitem" href="/dashboard#apps">{$t('home.nav.authz')}</a>
					<div class="acct-sep" aria-hidden="true"></div>
					<a role="menuitem" class="acct-out" href="/logout">{$t('home.nav.signout')}</a>
				</div>
			</details>
		{:else}
			<a class="login-btn" href="/login">{$t('home.nav.login')}</a>
		{/if}
	</div>
</header>

<style>
	.nav {
		position: fixed; top: 0; left: 0; right: 0; z-index: 50;
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.85rem clamp(1rem, 4vw, 2.5rem);
		background: rgba(11, 12, 16, 0.62);
		backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
		border-bottom: 1px solid var(--border);
	}
	.brand { display: inline-flex; align-items: center; gap: 0.5rem; text-decoration: none; }
		.brand-snow { font-size: 2rem; color: var(--accent-hi); text-shadow: 0 0 20px rgba(137,142,196,0.8); line-height: 1; animation: snowPulse 3s ease-in-out infinite; }
	.brand-word { font-family: var(--font-display); font-size: 1.05rem; font-weight: 200; letter-spacing: 0.1em; color: var(--text); }
	.brand-word strong { font-weight: 600; }
	.brand-word .frost { color: var(--accent); }

		@keyframes snowPulse { 0%,100% { text-shadow: 0 0 20px rgba(137,142,196,0.8); } 50% { text-shadow: 0 0 36px rgba(137,142,196,1), 0 0 60px rgba(113,118,170,0.45); } }
		@media (prefers-reduced-motion: reduce) { .brand-snow { animation: none; } }


	.nav-right { display: flex; align-items: center; gap: 0.75rem; }

	.login-btn {
		display: inline-flex; align-items: center; height: 36px; padding: 0 1.1rem;
		font-family: var(--font-display); font-size: 0.8125rem; font-weight: 400;
		letter-spacing: 0.08em; text-transform: uppercase; text-decoration: none;
		color: #fff; background: var(--accent); border-radius: var(--radius-sm);
		transition: filter 0.18s, transform 0.15s;
	}
	.login-btn:hover { filter: brightness(1.15); transform: translateY(-1px); }
	.login-btn:focus-visible { outline: 2px solid var(--accent-hi); outline-offset: 2px; }

	/* Account dropdown (details/summary — keyboard accessible, no JS needed) */
	.acct { position: relative; }
	.acct summary {
		display: inline-flex; align-items: center; gap: 0.5rem; height: 36px; padding: 0 0.6rem 0 0.4rem;
		list-style: none; cursor: pointer; border: 1px solid var(--border); border-radius: var(--radius-sm);
		background: rgba(255,255,255,0.02); transition: border-color 0.15s, background 0.15s;
	}
	.acct summary::-webkit-details-marker { display: none; }
	.acct summary:hover { border-color: var(--border-hi); }
	.acct summary:focus-visible { outline: 2px solid var(--accent-hi); outline-offset: 2px; }
	.acct-avatar {
		width: 26px; height: 26px; border-radius: 50%;
		display: flex; align-items: center; justify-content: center;
		background: linear-gradient(135deg, var(--accent), var(--accent-hi)); color: #fff;
		font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
	}
	.acct-name { font-size: 0.8125rem; color: var(--text); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.acct-caret { font-size: 0.6rem; color: var(--text-dim); }
	.acct-menu {
		position: absolute; top: calc(100% + 8px); right: 0; min-width: 180px;
		display: flex; flex-direction: column; padding: 0.35rem;
		background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md);
		box-shadow: 0 12px 40px rgba(0,0,0,0.45);
	}
	.acct-menu a {
		padding: 0.55rem 0.7rem; font-size: 0.8125rem; color: var(--text-dim); text-decoration: none;
		border-radius: var(--radius-sm); transition: color 0.15s, background 0.15s;
	}
	.acct-menu a:hover { color: var(--text); background: rgba(255,255,255,0.03); }
	.acct-menu a:focus-visible { outline: 2px solid var(--accent-hi); outline-offset: -2px; }
	.acct-out:hover { color: var(--error) !important; }
	.acct-sep { height: 1px; margin: 0.3rem 0; background: var(--border); }

	@media (max-width: 520px) {
		.acct-name { display: none; }
	}
</style>
