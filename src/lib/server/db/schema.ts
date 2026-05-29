import {
	mysqlTable,
	varchar,
	boolean,
	timestamp,
	json,
	text,
	index
} from 'drizzle-orm/mysql-core';

export const clients = mysqlTable('clients', {
	id: varchar('id', { length: 36 }).primaryKey(),
	name: varchar('name', { length: 255 }).notNull(),
	secret: varchar('secret', { length: 255 }),
	redirectUris: json('redirect_uris').$type<string[]>().notNull(),
	allowedGrants: json('allowed_grants').$type<string[]>().notNull(),
	scopes: json('scopes').$type<string[]>().notNull(),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

export const users = mysqlTable(
	'users',
	{
		id: varchar('id', { length: 36 }).primaryKey(),
		email: varchar('email', { length: 255 }).notNull().unique(),
		username: varchar('username', { length: 255 }).notNull().unique(),
		passwordHash: varchar('password_hash', { length: 255 }).notNull(),
		isAdmin: boolean('is_admin').notNull().default(false),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => ({
		emailIdx: index('users_email_idx').on(t.email),
		usernameIdx: index('users_username_idx').on(t.username)
	})
);

export const authCodes = mysqlTable(
	'auth_codes',
	{
		code: varchar('code', { length: 128 }).primaryKey(),
		clientId: varchar('client_id', { length: 36 }).notNull(),
		userId: varchar('user_id', { length: 36 }),
		redirectUri: varchar('redirect_uri', { length: 2048 }),
		codeChallenge: varchar('code_challenge', { length: 255 }),
		codeChallengeMethod: varchar('code_challenge_method', { length: 10 }),
		scopes: json('scopes').$type<string[]>().notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		revoked: boolean('revoked').notNull().default(false),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => ({ clientIdx: index('auth_codes_client_idx').on(t.clientId) })
);

export const accessTokens = mysqlTable(
	'access_tokens',
	{
		accessToken: varchar('access_token', { length: 512 }).primaryKey(),
		accessTokenExpiresAt: timestamp('access_token_expires_at').notNull(),
		refreshToken: varchar('refresh_token', { length: 512 }),
		refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
		clientId: varchar('client_id', { length: 36 }).notNull(),
		userId: varchar('user_id', { length: 36 }),
		scopes: json('scopes').$type<string[]>().notNull(),
		revoked: boolean('revoked').notNull().default(false),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => ({
		refreshIdx: index('tokens_refresh_idx').on(t.refreshToken),
		clientIdx: index('tokens_client_idx').on(t.clientId)
	})
);

export const scopes = mysqlTable('scopes', {
	name: varchar('name', { length: 64 }).primaryKey(),
	description: text('description').notNull().default('')
});

export const sessions = mysqlTable(
	'sessions',
	{
		id: varchar('id', { length: 36 }).primaryKey(),
		userId: varchar('user_id', { length: 36 }).notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => ({ userIdx: index('sessions_user_idx').on(t.userId) })
);

export type Client = typeof clients.$inferSelect;
export type User = typeof users.$inferSelect;

export const verificationCodes = mysqlTable(
	'verification_codes',
	{
		id: varchar('id', { length: 36 }).primaryKey(),
		email: varchar('email', { length: 255 }).notNull(),
		code: varchar('code', { length: 8 }).notNull(),
		expiresAt: timestamp('expires_at').notNull(),
		used: boolean('used').notNull().default(false),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => ({ emailIdx: index('vc_email_idx').on(t.email) })
);

export const pendingRegistrations = mysqlTable(
	'pending_registrations',
	{
		id: varchar('id', { length: 36 }).primaryKey(),
		username: varchar('username', { length: 255 }).notNull(),
		email: varchar('email', { length: 255 }).notNull(),
		passwordHash: varchar('password_hash', { length: 255 }).notNull(),
		oauthParams: varchar('oauth_params', { length: 2048 }),
		expiresAt: timestamp('expires_at').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow()
	},
	(t) => ({ emailIdx: index('pr_email_idx').on(t.email) })
);

export type AuthCode = typeof authCodes.$inferSelect;
export type AccessToken = typeof accessTokens.$inferSelect;
export type Scope = typeof scopes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type PendingRegistration = typeof pendingRegistrations.$inferSelect;
