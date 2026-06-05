import fs from 'node:fs';
import mysql from 'mysql2/promise';

const CLIENT_ID = process.env.PP_TYPESET_CLIENT_ID || 'smjqe2s56xrNMmyQxySlzj70kd_iSITnX3tz';
const REDIRECT_URI = 'https://pptypeset.frostrain.tech/api/auth/frost-id/callback';

function loadEnv(path = '.env') {
	const values = {};
	const text = fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : '';

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const index = line.indexOf('=');
		if (index === -1) continue;
		values[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
	}

	return values;
}

function normalizeRedirectUris(value) {
	if (Array.isArray(value)) return value;
	if (!value) return [];

	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function isPpTypesetRedirect(uri) {
	try {
		return new URL(uri).toString() === REDIRECT_URI;
	} catch {
		return false;
	}
}

const env = { ...loadEnv(), ...process.env };

if (!env.DATABASE_URL) {
	console.error('DATABASE_URL is required in .env or the process environment.');
	process.exit(1);
}

const connection = await mysql.createConnection(env.DATABASE_URL);

try {
	const [rows] = await connection.execute(
		'select id, name, redirect_uris from clients where id = ?',
		[CLIENT_ID]
	);

	if (!rows.length) {
		console.error(`OAuth client not found: ${CLIENT_ID}`);
		process.exit(1);
	}

	const current = normalizeRedirectUris(rows[0].redirect_uris);
	const next = [...new Set([
		...current.filter(isPpTypesetRedirect),
		REDIRECT_URI
	])];

	await connection.execute(
		'update clients set redirect_uris = ? where id = ?',
		[JSON.stringify(next), CLIENT_ID]
	);

	console.log(`Updated ${rows[0].name} (${CLIENT_ID}) redirect URIs:`);
	for (const uri of next) console.log(`- ${uri}`);
} finally {
	await connection.end();
}
