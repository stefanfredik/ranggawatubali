-- Add profile_picture column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_picture" text;