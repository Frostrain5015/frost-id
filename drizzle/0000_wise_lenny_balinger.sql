CREATE TABLE `access_tokens` (
	`access_token` varchar(512) NOT NULL,
	`access_token_expires_at` timestamp NOT NULL,
	`refresh_token` varchar(512),
	`refresh_token_expires_at` timestamp,
	`client_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`scopes` json NOT NULL,
	`revoked` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `access_tokens_access_token` PRIMARY KEY(`access_token`)
);
--> statement-breakpoint
CREATE TABLE `auth_codes` (
	`code` varchar(128) NOT NULL,
	`client_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`redirect_uri` varchar(2048),
	`code_challenge` varchar(255),
	`code_challenge_method` varchar(10),
	`scopes` json NOT NULL,
	`expires_at` timestamp NOT NULL,
	`revoked` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auth_codes_code` PRIMARY KEY(`code`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`secret` varchar(255),
	`redirect_uris` json NOT NULL,
	`allowed_grants` json NOT NULL,
	`scopes` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scopes` (
	`name` varchar(64) NOT NULL,
	`description` text NOT NULL DEFAULT (''),
	CONSTRAINT `scopes_name` PRIMARY KEY(`name`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`is_admin` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE INDEX `tokens_refresh_idx` ON `access_tokens` (`refresh_token`);--> statement-breakpoint
CREATE INDEX `tokens_client_idx` ON `access_tokens` (`client_id`);--> statement-breakpoint
CREATE INDEX `auth_codes_client_idx` ON `auth_codes` (`client_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `users_email_idx` ON `users` (`email`);