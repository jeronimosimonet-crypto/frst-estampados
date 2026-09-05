CREATE TABLE `design_approvals` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`design_name` text DEFAULT 'Diseño del pedido' NOT NULL,
	`status` text DEFAULT 'Pendiente' NOT NULL,
	`customer_comment` text DEFAULT '' NOT NULL,
	`token` text NOT NULL,
	`approved_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `design_approvals_token_unique` ON `design_approvals` (`token`);--> statement-breakpoint
CREATE INDEX `idx_design_approvals_order_updated` ON `design_approvals` (`order_id`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_design_approvals_order_version` ON `design_approvals` (`order_id`,`version`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`order_id` integer NOT NULL,
	`product_id` integer,
	`product_name` text NOT NULL,
	`size` text DEFAULT 'Único' NOT NULL,
	`color` text DEFAULT 'Sin color' NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`unit_price` real DEFAULT 0 NOT NULL,
	`print_position` text DEFAULT 'Frente' NOT NULL,
	`print_width` real DEFAULT 0 NOT NULL,
	`print_height` real DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `idx_order_items_product` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE TABLE `product_variants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`size` text DEFAULT 'Único' NOT NULL,
	`color` text DEFAULT 'Sin color' NOT NULL,
	`sku_suffix` text DEFAULT '' NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`min_stock` integer DEFAULT 0 NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_product_variants_product_active` ON `product_variants` (`product_id`,`active`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_product_variants_product_size_color` ON `product_variants` (`product_id`,`size`,`color`);