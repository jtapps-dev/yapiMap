ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS payment_plan_en TEXT,
  ADD COLUMN IF NOT EXISTS payment_plan_ru TEXT;
