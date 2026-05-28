CREATE TABLE `verification_codes` (
	`id` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`code` varchar(8) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verification_codes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `vc_email_idx` ON `verification_codes` (`email`);