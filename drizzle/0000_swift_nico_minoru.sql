CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`sha256` text NOT NULL,
	`medical_date` text NOT NULL,
	`category` text NOT NULL,
	`state` text NOT NULL,
	`version` integer NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_sha256_unique` ON `documents` (`sha256`);--> statement-breakpoint
CREATE INDEX `document_date_idx` ON `documents` (`medical_date`,`id`);--> statement-breakpoint
CREATE INDEX `document_category_idx` ON `documents` (`category`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`number` integer NOT NULL,
	`date` text NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_number_unique` ON `sessions` (`number`);--> statement-breakpoint
CREATE INDEX `session_date_idx` ON `sessions` (`date`);