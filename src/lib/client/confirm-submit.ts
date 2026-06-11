import {
	requestConfirmation,
	type ConfirmationOptions
} from '$lib/stores/confirmation.js';

export async function confirmSubmit(event: MouseEvent, options: ConfirmationOptions): Promise<void> {
	event.preventDefault();

	const button = event.currentTarget as HTMLButtonElement;
	const form = button.form;
	if (!form) return;

	const accepted = await requestConfirmation(options);
	if (accepted) {
		form.requestSubmit(button);
	}
}
