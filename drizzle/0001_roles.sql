ALTER TABLE `visits` DROP FOREIGN KEY `visits_created_by_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `users` ADD `role` enum('admin','staff') DEFAULT 'staff' NOT NULL;--> statement-breakpoint
ALTER TABLE `visits` ADD CONSTRAINT `visits_created_by_users_id_fk` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Avant les rôles, le seul compte existant était celui du gérant.
UPDATE `users` SET `role` = 'admin';
