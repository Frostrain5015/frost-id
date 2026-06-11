import { ProxyAgent, setGlobalDispatcher } from 'undici';

const proxyUrl = process.env.OUTBOUND_PROXY_URL || process.env.PROXY_URL;

function installFetchHeaderWorkaround() {
	const originalFetch = globalThis.fetch.bind(globalThis);

	globalThis.fetch = (input, init) => {
		if (typeof Request !== 'undefined' && input instanceof Request) {
			const headers = new Headers(input.headers);
			if (init?.headers) {
				new Headers(init.headers).forEach((value, key) => headers.set(key, value));
			}
			headers.delete('content-length');
			return originalFetch(new Request(input, Object.assign({}, init, { headers })));
		}

		const headers = new Headers(init?.headers);
		headers.delete('content-length');
		return originalFetch(input, Object.assign({}, init, { headers }));
	};
}

if (proxyUrl) {
	installFetchHeaderWorkaround();
	setGlobalDispatcher(new ProxyAgent(proxyUrl));
	console.log('[Frost ID] Global proxy configured:', proxyUrl);
} else {
	console.log('[Frost ID] No PROXY_URL set, skipping proxy');
}
