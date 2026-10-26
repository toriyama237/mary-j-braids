CREATE TABLE `login_attempts` (
	`username` varchar(50) NOT NULL,
	`failures` int NOT NULL DEFAULT 0,
	`locked_until` timestamp,
	CONSTRAINT `login_attempts_username` PRIMARY KEY(`username`)
);
