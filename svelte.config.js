import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		csrf: {
			// OAuth endpoints are server-to-server API calls protected by PKCE and
			// client credentials — they don't need browser CSRF origin checking.
			checkOrigin: false
		}
	}
};

export default config;
