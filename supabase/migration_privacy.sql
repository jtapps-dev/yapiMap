-- Migration: Privacy consent tracking
-- Add privacy_accepted_at to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS privacy_accepted_at timestamptz DEFAULT NULL;
