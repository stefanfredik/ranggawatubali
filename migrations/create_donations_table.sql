CREATE TABLE IF NOT EXISTS "donations" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "amount" decimal(15, 2) NOT NULL,
  "event_name" text NOT NULL,
  "event_date" date NOT NULL,
  "target_amount" decimal(15, 2),
  "status" text NOT NULL DEFAULT 'pending',
  "collection_date" date,
  "collection_method" text,
  "wallet_id" integer REFERENCES "wallets"("id"),
  "notes" text,
  "type" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);