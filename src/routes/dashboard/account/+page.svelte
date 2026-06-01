<script lang="ts">
	import { enhance } from '$app/forms';
	import { getContext } from 'svelte';
	import type { Readable } from 'svelte/store';
	import type { PageData } from './$types';
	import type { Translator } from '$lib/i18n/index.js';

	let { data, form }: { data: PageData; form: any } = $props();

	const t = getContext<Readable<Translator>>('t');
	const usernamePattern = '^[a-zA-Z0-9_]{2,32}$';

	let username = $state(data.user.username);
	let avatarUrl = $state(data.user.avatarUrl ?? '');
	let avatarUploading = $state(false);

	let emailChangeOpen = $state(false);
	let emailPending = $state('');
	let emailCode = $state('');

	let deletePassword = $state('');

	let toast = $state<{ key: string; kind: 'success' | 'error' } | null>(null);

	$effect(() => {
		if (form?.success) {
			toast = { key: form.success as string, kind: 'success' };
			if (form.emailChangePending) {
				emailPending = form.emailChangePending as string;
				toast = { key: 'dashboard.account.email_code_sent', kind: 'success' };
			}
			setTimeout(() => { toast = null; }, 4000);
		}
		if (form?.errorKey) {
			toast = { key: form.errorKey as string, kind: 'error' };
			setTimeout(() => { toast = null; }, 5000);
		}
	});

	async function handleAvatarUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		avatarUploading = true;
		try {
			const fd = new FormData();
			fd.append('file', file);
			const res = await fetch('/api/upload-avatar', { method: 'POST', body: fd });
			if (!res.ok) throw new Error();
			const result = await res.json();
			if (result.url) {
				avatarUrl = result.url;
				const fd2 = new FormData();
				fd2.append('avatarUrl', result.url);
				document.body.dispatchEvent(new CustomEvent('avatar-updated', { detail: result.url }));
				await fetch('?/updateAvatar', { method: 'POST', body: fd2 });
			}
		} catch {
			toast = { key: 'dashboard.account.avatar_failed', kind: 'error' };
			setTimeout(() => { toast = null; }, 4000);
		} finally {
			avatarUploading = false;
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>{$t('dashboard.account.heading')} — Frost ID</title>
</svelte:head>

<div class="page anim-item">
	<h2 class="page-title">{$t('dashboard.account.heading')}</h2>

	{#if toast}
		<div
			class="toast"
			class:toast--error={toast.kind === 'error'}
			class:toast--success={toast.kind === 'success'}
			role="alert"
		>
			<span>{$t(toast.key)}</span>
		</div>
	{/if}

	<!-- ═══════ Profile ═══════ -->
	<section class="card" style="--anim-delay: 0.02s">
		<h3 class="card-heading">{$t('dashboard.account.profile_section')}</h3>

		<div class="field-group">
			<label class="field">{$t('dashboard.account.avatar_label')}</label>
			<div class="avatar-row">
				{#if avatarUrl}
					<img class="avatar-preview" src={avatarUrl} alt="Avatar" />
				{:else}
					<div class="avatar-preview avatar-placeholder">{data.user.username[0].toUpperCase()}</div>
				{/if}
				<label class="btn btn--ghost avatar-upload-btn">
					{#if avatarUploading}{$t('dashboard.account.avatar_uploading')}{:else}{$t('dashboard.account.avatar_upload')}{/if}
					<input
						type="file"
						accept="image/png,image/jpeg,image/webp,image/gif"
						class="file-input"
						onchange={handleAvatarUpload}
						disabled={avatarUploading}
					/>
				</label>
				{#if avatarUrl}
					<button
						type="button"
						class="btn btn--ghost"
						onclick={async () => {
							avatarUrl = '';
							const fd = new FormData();
							fd.append('avatarUrl', '');
							await fetch('?/updateAvatar', { method: 'POST', body: fd });
						}}
					>{$t('dashboard.account.avatar_remove')}</button>
				{/if}
			</div>
		</div>

		<form method="POST" action="?/updateUsername" use:enhance class="mt">
			<label class="field" for="username">{$t('dashboard.account.username_label')}</label>
			<div class="field-row">
				<input
					id="username"
					name="username"
					type="text"
					class="input"
					required
					minlength="2"
					maxlength="32"
					pattern={usernamePattern}
					bind:value={username}
				/>
				<button type="submit" class="btn btn--ghost">{$t('dashboard.account.username_save')}</button>
			</div>
			<p class="hint">{$t('dashboard.account.username_invalid')}</p>
		</form>
	</section>

	<!-- ═══════ Security ═══════ -->
	<section class="card" style="--anim-delay: 0.06s">
		<h3 class="card-heading">{$t('dashboard.account.security_section')}</h3>

		<form method="POST" action="?/changePassword" use:enhance>
			<div class="field-group">
				<label class="field" for="currentPassword">{$t('dashboard.account.password_current')}</label>
				<input id="currentPassword" name="currentPassword" type="password" class="input" autocomplete="current-password" required />
			</div>
			<div class="field-row field-row--2">
				<div class="field-group">
					<label class="field" for="newPassword">{$t('dashboard.account.password_new')}</label>
					<input id="newPassword" name="newPassword" type="password" class="input" autocomplete="new-password" required minlength="8" />
				</div>
				<div class="field-group">
					<label class="field" for="confirmPassword">{$t('dashboard.account.password_confirm')}</label>
					<input id="confirmPassword" name="confirmPassword" type="password" class="input" autocomplete="new-password" required minlength="8" />
				</div>
			</div>
			<button type="submit" class="btn btn--primary mt">{$t('dashboard.account.password_save')}</button>
		</form>

		<hr class="sep" />

		<div class="field-group">
			<label class="field">{$t('dashboard.account.email_label')}</label>
			<div class="field-row">
				<input type="email" class="input" value={data.user.email} disabled />
				<button
					type="button"
					class="btn btn--ghost"
					onclick={() => { emailChangeOpen = !emailChangeOpen; emailPending = ''; emailCode = ''; }}
				>{#if emailChangeOpen}{$t('dashboard.account.email_cancel')}{:else}{$t('dashboard.account.email_change_btn')}{/if}</button>
			</div>
		</div>

		{#if emailChangeOpen}
			<form method="POST" action="?/requestEmailChange" use:enhance class="email-change">
				<div class="field-group">
					<label class="field" for="newEmail">{$t('dashboard.account.email_new_label')}</label>
					<input
						id="newEmail"
						name="email"
						type="email"
						class="input"
						required
						placeholder="new@email.com"
					/>
				</div>
				{#if !emailPending}
					<button type="submit" class="btn btn--primary mt">{$t('dashboard.account.email_send_code')}</button>
				{/if}
			</form>

			{#if emailPending}
				<form method="POST" action="?/verifyEmailChange" use:enhance class="email-verify">
					<input type="hidden" name="email" value={emailPending} />
					<div class="field-row">
						<input
							id="emailCode"
							name="code"
							type="text"
							class="input"
							required
							placeholder={$t('dashboard.account.email_code_placeholder')}
							bind:value={emailCode}
						/>
						<button type="submit" class="btn btn--primary">{$t('dashboard.account.email_verify')}</button>
					</div>
				</form>
			{/if}
		{/if}
	</section>

	<!-- ═══════ Sessions ═══════ -->
	<section class="card" style="--anim-delay: 0.1s">
		<h3 class="card-heading">{$t('dashboard.account.sessions_section')}</h3>

		{#if data.sessions.length > 0}
			<div class="session-list">
				{#each data.sessions as session, i}
					<div class="session-row">
						<div class="session-info">
							<span class="session-loc">{session.region ?? $t('dashboard.account.sessions_unknown')}</span>
							{#if i === 0}
								<span class="tag tag--current">{$t('dashboard.account.sessions_current')}</span>
							{/if}
						</div>
						{#if i !== 0}
							<form method="POST" action="?/revokeSession" use:enhance>
								<input type="hidden" name="sessionId" value={session.id} />
								<button type="submit" class="btn btn--danger-ghost">{$t('dashboard.account.sessions_revoke')}</button>
							</form>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty-text">{$t('dashboard.account.sessions_none')}</p>
		{/if}
	</section>

	<!-- ═══════ Danger Zone ═══════ -->
	<section class="card card--danger" style="--anim-delay: 0.14s">
		<h3 class="card-heading card-heading--danger">{$t('dashboard.account.danger_section')}</h3>

		<p class="danger-desc">{$t('dashboard.account.delete_desc')}</p>

		<form method="POST" action="?/deleteAccount" use:enhance>
			<div class="field-row">
				<input
					id="deletePassword"
					name="password"
					type="password"
					class="input input--danger"
					required
					placeholder={$t('dashboard.account.delete_confirm')}
					bind:value={deletePassword}
				/>
				<button
					type="submit"
					class="btn btn--danger"
					onclick={(e) => {
						if (!confirm($t('dashboard.account.delete_confirm'))) {
							e.preventDefault();
						}
					}}
				>{$t('dashboard.account.delete_btn')}</button>
			</div>
		</form>
	</section>
</div>

<style>
	.page { max-width: 640px; }
	.anim-item { animation: fadeUp 0.85s cubic-bezier(0.16,1,0.3,1) both; animation-delay: var(--anim-delay, 0s); }
	@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

	.page-title {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 300;
		color: var(--text);
		letter-spacing: 0.02em;
		margin-bottom: 1.75rem;
	}

	/* ── Toast ──────────────────────────────────────────── */
	.toast {
		padding: 0.625rem 1rem;
		border-radius: var(--radius-sm);
		font-family: var(--font-body);
		font-size: 0.75rem;
		letter-spacing: 0.03em;
		margin-bottom: 1.25rem;
		animation: fadeUp 0.3s ease;
	}
	.toast--success { background: rgba(94,186,125,0.1); border: 1px solid rgba(94,186,125,0.25); color: #7ecf92; }
	.toast--error   { background: rgba(217,92,92,0.1); border: 1px solid rgba(217,92,92,0.25); color: #e08080; }

	/* ── Cards ──────────────────────────────────────────── */
	.card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		padding: 1.5rem 1.75rem;
		margin-bottom: 1rem;
	}
	.card--danger {
		border-color: rgba(217,92,92,0.2);
		background: rgba(217,92,92,0.02);
	}

	.card-heading {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 400;
		color: var(--text);
		letter-spacing: 0.04em;
		margin-bottom: 1.125rem;
	}
	.card-heading--danger { color: #d95c5c; }

	/* ── Fields ─────────────────────────────────────────── */
	.field {
		display: block;
		font-family: var(--font-body);
		font-size: 0.7rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-dim);
		margin-bottom: 0.375rem;
	}

	.field-group { margin-bottom: 0.875rem; flex: 1; }

	.field-row {
		display: flex;
		gap: 0.5rem;
		align-items: flex-end;
	}
	.field-row--2 { gap: 0.75rem; }

	/* ── Avatar ─────────────────────────────────────────── */
	.avatar-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.avatar-preview {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		object-fit: cover;
		border: 1px solid var(--border);
		flex-shrink: 0;
	}
	.avatar-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(113,118,170,0.12);
		border: 1px solid rgba(113,118,170,0.2);
		font-family: var(--font-display);
		font-size: 1.5rem;
		font-weight: 400;
		color: var(--accent);
	}
	.avatar-upload-btn {
		position: relative;
		cursor: pointer;
	}
	.file-input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text);
		font-family: var(--font-body);
		font-size: 0.8125rem;
		letter-spacing: 0.02em;
		outline: none;
		transition: border-color 0.2s, box-shadow 0.2s;
	}
	.input:focus {
		border-color: rgba(113,118,170,0.4);
		box-shadow: 0 0 0 2px rgba(113,118,170,0.1);
	}
	.input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.input--danger:focus {
		border-color: rgba(217,92,92,0.5);
		box-shadow: 0 0 0 2px rgba(217,92,92,0.1);
	}

	.hint {
		font-family: var(--font-body);
		font-size: 0.65rem;
		color: var(--text-dim);
		opacity: 0.55;
		margin-top: 0.375rem;
	}

	.mt { margin-top: 0.875rem; }

	.sep {
		border: none;
		border-top: 1px solid var(--border);
		margin: 1.125rem 0;
	}

	/* ── Buttons ────────────────────────────────────────── */
	.btn {
		padding: 0.5rem 1rem;
		font-family: var(--font-display);
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color 0.15s, background 0.15s, border-color 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.btn:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}

	.btn--primary {
		background: rgba(113,118,170,0.15);
		border-color: rgba(113,118,170,0.3);
		color: var(--accent-hi);
	}
	.btn--primary:hover {
		background: rgba(113,118,170,0.25);
		border-color: rgba(113,118,170,0.45);
	}

	.btn--ghost {
		background: transparent;
		border-color: var(--border);
		color: var(--text-dim);
	}
	.btn--ghost:hover {
		color: var(--text);
		border-color: rgba(255,255,255,0.15);
	}

	.btn--danger-ghost {
		background: transparent;
		border-color: rgba(217,92,92,0.15);
		color: var(--text-dim);
		font-family: var(--font-display);
		font-size: 0.65rem;
		font-weight: 400;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.35rem 0.75rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color 0.15s, border-color 0.15s, background 0.15s;
		white-space: nowrap;
	}
	.btn--danger-ghost:hover {
		color: #d95c5c;
		border-color: rgba(217,92,92,0.35);
		background: rgba(217,92,92,0.05);
	}
	.btn--danger-ghost:focus-visible {
		outline: 2px solid #d95c5c;
		outline-offset: 2px;
	}

	.btn--danger {
		background: rgba(217,92,92,0.1);
		border-color: rgba(217,92,92,0.3);
		color: #d95c5c;
		font-family: var(--font-display);
		font-size: 0.75rem;
		font-weight: 400;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.5rem 1rem;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: color 0.15s, background 0.15s, border-color 0.15s;
		white-space: nowrap;
		flex-shrink: 0;
	}
	.btn--danger:hover {
		background: rgba(217,92,92,0.2);
		border-color: rgba(217,92,92,0.5);
	}
	.btn--danger:focus-visible {
		outline: 2px solid #d95c5c;
		outline-offset: 2px;
	}

	/* ── Email change ───────────────────────────────────── */
	.email-change, .email-verify {
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
	}

	/* ── Sessions ───────────────────────────────────────── */
	.session-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.session-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}
	.session-info {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.session-loc {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: var(--text);
	}

	.tag--current {
		display: inline-block;
		padding: 1px 7px;
		border-radius: 99px;
		font-size: 0.55rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: rgba(94,186,125,0.12);
		border: 1px solid rgba(94,186,125,0.2);
		color: #7ecf92;
	}

	.empty-text {
		font-family: var(--font-display);
		font-size: 0.85rem;
		font-weight: 300;
		color: var(--text-dim);
		opacity: 0.5;
		font-style: italic;
	}

	.danger-desc {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: var(--text-dim);
		line-height: 1.6;
		margin-bottom: 1rem;
	}
</style>
