import { generateKeyPair, exportJWK, importPKCS8, type KeyLike, type JWK } from 'jose';
import { createHash } from 'node:crypto';

let _privateKey: KeyLike | undefined;
let _publicJWK: JWK | undefined;
let _kid: string | undefined;

function decodePem(raw: string): string {
	if (raw.startsWith('-----BEGIN')) return raw;
	return Buffer.from(raw, 'base64').toString('utf-8');
}

async function init(): Promise<void> {
	if (_privateKey) return;

	const raw = process.env.OIDC_RSA_PRIVATE_KEY;
	if (raw?.trim()) {
		_privateKey = await importPKCS8(decodePem(raw.trim()), 'RS256');
	} else {
		const pair = await generateKeyPair('RS256', { modulusLength: 2048 });
		_privateKey = pair.privateKey;
		console.warn(
			'[OIDC] No OIDC_RSA_PRIVATE_KEY env var — using ephemeral RSA key. ' +
			'id_tokens will become invalid on server restart. ' +
			'Generate a persistent key for production.'
		);
	}

	const fullJWK = await exportJWK(_privateKey);
	_kid = createHash('sha256')
		.update(JSON.stringify({ n: fullJWK.n, e: fullJWK.e }))
		.digest('base64url')
		.slice(0, 16);

	_publicJWK = { kty: fullJWK.kty, n: fullJWK.n, e: fullJWK.e, alg: 'RS256', use: 'sig', kid: _kid };
}

export async function getSigningKey(): Promise<KeyLike> {
	await init();
	return _privateKey!;
}

export async function getKid(): Promise<string> {
	await init();
	return _kid!;
}

export async function getJWKS(): Promise<{ keys: JWK[] }> {
	await init();
	return { keys: [_publicJWK!] };
}
