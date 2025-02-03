-- PostgreSQL migration (Supabase)

-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add subscription_status to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'free';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_subscription_status_check;

ALTER TABLE users
  ADD CONSTRAINT users_subscription_status_check
  CHECK (subscription_status IN ('free', 'premium'));

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_ref TEXT NOT NULL UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'success', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Verification (PostgreSQL-safe)
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NULL THEN
    RAISE EXCEPTION 'Verification failed: table "transactions" was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'subscription_status'
  ) THEN
    RAISE EXCEPTION 'Verification failed: column users.subscription_status was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'subscription_start_date'
  ) THEN
    RAISE EXCEPTION 'Verification failed: column users.subscription_start_date was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'subscription_end_date'
  ) THEN
    RAISE EXCEPTION 'Verification failed: column users.subscription_end_date was not created';
  END IF;

  RAISE NOTICE 'Verification OK: transactions table exists and users.subscription_status column exists';
END $$;
