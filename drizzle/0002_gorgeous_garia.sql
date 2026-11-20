CREATE TABLE `calendar_slots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`timezone` varchar(64) NOT NULL,
	`therapist` varchar(40) NOT NULL,
	`durationMinutes` int NOT NULL,
	`status` enum('available','reserved','confirmed','cancelled') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendar_slots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `appointment_requests` ADD `status` enum('pending','confirmed','cancelled') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `appointment_requests` ADD `slotId` int;