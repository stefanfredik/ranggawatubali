-- Rollback campus column from users table
ALTER TABLE "users" DROP COLUMN IF EXISTS "campus";