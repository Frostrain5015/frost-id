import { writable } from 'svelte/store';

export type ConfirmationVariant = 'danger' | 'neutral';

export interface ConfirmationOptions {
	title: string;
	message: string;
	confirmLabel: string;
	cancelLabel: string;
	variant?: ConfirmationVariant;
}

export interface ConfirmationRequest extends ConfirmationOptions {
	id: number;
	variant: ConfirmationVariant;
}

export const confirmation = writable<ConfirmationRequest | null>(null);

let resolver: ((accepted: boolean) => void) | null = null;
let nextId = 1;

export function requestConfirmation(options: ConfirmationOptions): Promise<boolean> {
	if (resolver) resolver(false);

	return new Promise((resolve) => {
		resolver = resolve;
		confirmation.set({
			...options,
			id: nextId++,
			variant: options.variant ?? 'neutral'
		});
	});
}

export function resolveConfirmation(accepted: boolean): void {
	if (!resolver) return;
	resolver(accepted);
	resolver = null;
	confirmation.set(null);
}
