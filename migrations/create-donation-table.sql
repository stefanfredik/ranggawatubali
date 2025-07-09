-- Create donations table
CREATE TABLE IF NOT EXISTS "donations" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" TEXT NOT NULL CHECK ("type" IN ('happy', 'sad', 'fundraising')),
  "amount" DECIMAL(15, 2) NOT NULL DEFAULT 0,
  "target_amount" DECIMAL(15, 2),
  "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'completed', 'cancelled')),
  "created_by" INTEGER REFERENCES "users"("id") NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create donation_contributors table
CREATE TABLE IF NOT EXISTS "donation_contributors" (
  "id" SERIAL PRIMARY KEY,
  "donation_id" INTEGER REFERENCES "donations"("id") ON DELETE CASCADE NOT NULL,
  "user_id" INTEGER REFERENCES "users"("id") NOT NULL,
  "name" TEXT NOT NULL,
  "amount" DECIMAL(15, 2) NOT NULL,
  "message" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_donations_type" ON "donations"("type");
CREATE INDEX IF NOT EXISTS "idx_donations_status" ON "donations"("status");
CREATE INDEX IF NOT EXISTS "idx_donation_contributors_donation_id" ON "donation_contributors"("donation_id");
CREATE INDEX IF NOT EXISTS "idx_donation_contributors_user_id" ON "donation_contributors"("user_id");