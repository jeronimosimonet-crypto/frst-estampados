CREATE INDEX `idx_customers_archived_updated` ON `customers` (`archived`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_archived_updated` ON `orders` (`archived`,`updated_at`);--> statement-breakpoint
CREATE INDEX `idx_orders_customer_id` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `idx_payments_order_created` ON `payments` (`order_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_products_active_name` ON `products` (`active`,`name`);--> statement-breakpoint
PRAGMA optimize;
