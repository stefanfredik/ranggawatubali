-- Rollback for donations tables

-- Drop donation_contributors table first (because it references donations)
DROP TABLE IF EXISTS "donation_contributors";

-- Drop donations table
DROP TABLE IF EXISTS "donations";