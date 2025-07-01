-- Update users table to add new fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "occupation" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "residence" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "arrival_date" text;

-- Update role enum to include new roles
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_role_check";
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('member', 'admin', 'ketua', 'bendahara', 'sekretaris'));