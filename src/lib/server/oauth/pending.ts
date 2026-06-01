import type { AuthorizationRequest } from '@jmondi/oauth2-server';
import { nanoid } from 'nanoid';

interface PendingEntry {
	authRequest: AuthorizationRequest;
	oauthParams: string | null;
	expiresAt: number;
}

const store = new Map<string, PendingEntry>();

export function storePending(authRequest: AuthorizationRequest, oauthParams: string | null = null): string {
	const id = nanoid(24);
	store.set(id, { authRequest, oauthParams, expiresAt: Date.now() + 10 * 60 * 1000 });
	return id;
}

export function getPending(id: string): AuthorizationRequest | null {
	const entry = store.get(id);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		store.delete(id);
		return null;
	}
	return entry.authRequest;
}

export function getPendingOAuthParams(id: string): string | null {
	const entry = store.get(id);
	if (!entry) return null;
	if (Date.now() > entry.expiresAt) {
		store.delete(id);
		return null;
	}
	return entry.oauthParams;
}

export function deletePending(id: string): void {
	store.delete(id);
}
