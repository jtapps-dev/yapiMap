-- ============================================
-- YapıMap Migration: Referral System
-- ============================================

-- profiles: IBAN + Referral Code
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS iban TEXT,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- commissions Tabelle
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Nur Admin kann lesen/schreiben (via service role in API)
CREATE POLICY "Admin only" ON commissions
  USING (false);
