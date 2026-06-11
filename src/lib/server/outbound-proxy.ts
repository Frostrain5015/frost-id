import { env } from '$env/dynamic/private';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

let configuredProxyUrl: string | null = null;
let fetchPatched = false;

function installFetchHeaderWorkaround(): void {
	if (fetchPatched) return;

	const originalFetch = globalThis.fetch.bind(globalThis);
	globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
		if (typeof Request !== 'undefined' && input instanceof Request) {
			const headers = new Headers(input.headers);
			if (init?.headers) {
				new Headers(init.headers).forEach((value, key) => headers.set(key, value));
			}
			headers.delete('content-length');
			return originalFetch(new Request(input, { ...init, headers }));
		}

		const headers = new Headers(init?.headers);
		headers.delete('content-length');
		return originalFetch(input, { ...init, headers });
	}) as typeof globalThis.fetch;

	fetchPatched = true;
}

export function configureOutboundProxy(): void {
	const proxyUrl = env.OUTBOUND_PROXY_URL || env.PROXY_URL;
	if (!proxyUrl) return;

	installFetchHeaderWorkaround();
	if (configuredProxyUrl === proxyUrl) return;

	setGlobalDispatcher(new ProxyAgent(proxyUrl));
	configuredProxyUrl = proxyUrl;
	console.info('[Frost ID] Outbound fetch proxy enabled.');
}
