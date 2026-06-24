import fs from 'node:fs';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';

// 博文 Boen 是机密客户端（服务端换 token，携带 client_secret + PKCE），与 PP Typeset / Investory 一致。
// 用法：
//   BOEN_APP_URL=https://boen.frostrain.tech node scripts/ensure-boen-client.mjs
//   - 未提供 BOEN_CLIENT_SECRET 时：新建会自动生成并打印 secret（请抄进 Boen 服务端 .env 的 FROST_ID_CLIENT_SECRET）
//   - 提供 BOEN_CLIENT_SECRET 时：用该值（已存在则重置为该值）
//   多个回调地址用逗号分隔。

const CLIENT_ID = process.env.BOEN_CLIENT_ID || 'boen-client';
const CLIENT_NAME = process.env.BOEN_CLIENT_NAME || '博文 Boen';
const ALLOWED_GRANTS = ['authorization_code', 'refresh_token'];
const SCOPES = ['openid', 'profile', 'email'];

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

function normalizeArray(value) {
	if (Array.isArray(value)) return value;
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

const env = { ...loadEnv(), ...process.env };

if (!env.DATABASE_URL) {
	console.error('DATABASE_URL is required in .env or the process environment.');
	process.exit(1);
}
if (!env.BOEN_APP_URL) {
	console.error('BOEN_APP_URL is required, e.g. BOEN_APP_URL=https://boen.frostrain.tech');
	process.exit(1);
}

const redirectUris = env.BOEN_APP_URL.split(',')
	.map((s) => s.trim())
	.filter(Boolean)
	.map((origin) => {
		try {
			return new URL(`${origin.replace(/\/$/, '')}/auth/callback`).toString();
		} catch {
			console.error(`Invalid origin in BOEN_APP_URL: ${origin}`);
			process.exit(1);
		}
	});

const connection = await mysql.createConnection(env.DATABASE_URL);

try {
	const [rows] = await connection.execute(
		'select id, name, secret, redirect_uris, allowed_grants, scopes from clients where id = ?',
		[CLIENT_ID]
	);

	if (!rows.length) {
		const secret = env.BOEN_CLIENT_SECRET || crypto.randomBytes(32).toString('hex');
		await connection.execute(
			'insert into clients (id, name, secret, redirect_uris, allowed_grants, scopes) values (?, ?, ?, ?, ?, ?)',
			[
				CLIENT_ID,
				CLIENT_NAME,
				secret,
				JSON.stringify(redirectUris),
				JSON.stringify(ALLOWED_GRANTS),
				JSON.stringify(SCOPES)
			]
		);
		console.log(`Created confidential client ${CLIENT_NAME} (${CLIENT_ID}):`);
		for (const uri of redirectUris) console.log(`- ${uri}`);
		console.log(`CLIENT_SECRET=${secret}`);
		console.log('↑ 抄进 Boen 服务端 .env 的 FROST_ID_CLIENT_SECRET');
		process.exit(0);
	}

	const existing = rows[0];
	const nextRedirects = [...new Set([...normalizeArray(existing.redirect_uris), ...redirectUris])];
	const nextGrants = [...new Set([...normalizeArray(existing.allowed_grants), ...ALLOWED_GRANTS])];
	const nextScopes = [...new Set([...normalizeArray(existing.scopes), ...SCOPES])];

	if (env.BOEN_CLIENT_SECRET) {
		await connection.execute(
			'update clients set secret = ?, redirect_uris = ?, allowed_grants = ?, scopes = ? where id = ?',
			[env.BOEN_CLIENT_SECRET, JSON.stringify(nextRedirects), JSON.stringify(nextGrants), JSON.stringify(nextScopes), CLIENT_ID]
		);
		console.log(`Updated ${existing.name} (${CLIENT_ID}) incl. secret reset.`);
	} else {
		await connection.execute(
			'update clients set redirect_uris = ?, allowed_grants = ?, scopes = ? where id = ?',
			[JSON.stringify(nextRedirects), JSON.stringify(nextGrants), JSON.stringify(nextScopes), CLIENT_ID]
		);
		console.log(`Updated ${existing.name} (${CLIENT_ID}) (secret unchanged).`);
	}
	console.log(`  redirect_uris:`);
	for (const uri of nextRedirects) console.log(`  - ${uri}`);
	console.log(`  allowed_grants: ${nextGrants.join(', ')}`);
	console.log(`  scopes: ${nextScopes.join(', ')}`);
} finally {
	await connection.end();
}
