ALTER TABLE `users` ADD COLUMN `username` varchar(255) NULL;
UPDATE `users` SET `username` = `name` WHERE `username` IS NULL;
ALTER TABLE `users` MODIFY COLUMN `username` varchar(255) NOT NULL;
CREATE UNIQUE INDEX `users_username_idx` ON `users` (`username`);

CREATE TABLE `pending_registrations` (
	`id` varchar(36) NOT NULL,
	`username` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`oauth_params` varchar(2048),
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pending_registrations_id` PRIMARY KEY(`id`)
);
CREATE INDEX `pr_email_idx` ON `pending_registrations` (`email`);
