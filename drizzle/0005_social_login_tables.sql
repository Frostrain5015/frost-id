CREATE TABLE `linked_accounts` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`display_name` varchar(255),
	`email` varchar(255),
	`avatar_url` varchar(512),
	`access_token` varchar(1024),
	`refresh_token` varchar(1024),
	`expires_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT now(),
	PRIMARY KEY (`id`)
);
CREATE INDEX `la_user_idx` ON `linked_accounts` (`user_id`);
CREATE INDEX `la_provider_idx` ON `linked_accounts` (`provider`, `provider_account_id`);

CREATE TABLE `social_oauth_states` (
	`id` varchar(36) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`code_verifier` varchar(255) NOT NULL,
	`state` varchar(128) NOT NULL,
	`oauth_params` varchar(2048),
	`action` varchar(32) NOT NULL,
	`user_id` varchar(36),
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT now(),
	PRIMARY KEY (`id`)
);
CREATE INDEX `sos_expires_idx` ON `social_oauth_states` (`expires_at`);

CREATE TABLE `pending_social_registrations` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`username` varchar(255) NOT NULL,
	`avatar_url` varchar(512),
	`provider` varchar(32) NOT NULL,
	`provider_account_id` varchar(255) NOT NULL,
	`display_name` varchar(255),
	`oauth_params` varchar(2048),
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT now(),
	PRIMARY KEY (`id`)
);
CREATE INDEX `psr_email_idx` ON `pending_social_registrations` (`email`);
