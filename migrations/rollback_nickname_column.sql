-- Rollback nickname column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "nickname";