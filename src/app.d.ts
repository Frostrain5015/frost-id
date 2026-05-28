declare global {
	namespace App {
		interface Locals {
			user?: {
				id: string;
				email: string;
				name: string;
				isAdmin: boolean;
			};
		}
		interface PageData {}
		interface PageState {}
		interface Error {
			message: string;
		}
		interface Platform {}
	}
}
export {};
