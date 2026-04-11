-- =============================================
-- YapiMap – Datenbank Schema
-- Supabase SQL Editor → New Query → Paste → Run
-- =============================================

-- PROFILES (wird automatisch bei Registrierung erstellt)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  company_name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('broker', 'developer', 'admin')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active')),
  logo_url text,
  stripe_customer_id text,
  subscription_status text DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'canceled', 'past_due')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PROJECTS (von Developer hochgeladen)
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  city text NOT NULL,
  district text,
  address text,
  lat float8 NOT NULL,
  lng float8 NOT NULL,
  project_type text NOT NULL CHECK (project_type IN ('daire', 'villa', 'rezidans', 'ofis', 'townhouse', 'loft', 'karma')),
  delivery_date date,
  is_complete boolean DEFAULT false,
  min_price bigint,
  max_price bigint,
  min_sqm int,
  max_sqm int,
  rooms text[],
  amenities text[],
  cover_image_url text,
  brochure_pdf_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ikamet_eligible boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- INDEXES für Filter-Performance
CREATE INDEX idx_projects_city ON projects(city);
CREATE INDEX idx_projects_type ON projects(project_type);
CREATE INDEX idx_projects_delivery ON projects(delivery_date);
CREATE INDEX idx_projects_price ON projects(min_price, max_price);
CREATE INDEX idx_projects_developer ON projects(developer_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_geo ON projects(lat, lng);

-- PROJECT IMAGES
CREATE TABLE project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- DEVELOPER CONTACTS (Sales Team)
CREATE TABLE developer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  title text,
  phone text,
  whatsapp text,
  email text,
  photo_url text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- BOOKMARKS (Makler speichert Projekte)
CREATE TABLE bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(broker_id, project_id)
);

-- CATALOGS (Makler erstellt PDF-Katalog)
CREATE TABLE catalogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT 'Katalog',
  project_ids uuid[],
  pdf_url text,
  share_token text UNIQUE DEFAULT gen_random_uuid()::text,
  created_at timestamptz DEFAULT now()
);

-- ADMIN NOTES (Audit Trail)
CREATE TABLE admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id),
  target_user_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
CREATE POLICY "Eigenes Profil lesen" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Eigenes Profil updaten" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Developer-Profile für aktive User sichtbar" ON profiles FOR SELECT USING (
  role = 'developer' AND status = 'active'
);

-- PROJECTS Policies
CREATE POLICY "Alle aktiven User sehen published Projects" ON projects FOR SELECT USING (
  status = 'published' AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND status = 'active'
  )
);
CREATE POLICY "Developer sieht eigene Projects" ON projects FOR SELECT USING (
  developer_id = auth.uid()
);
CREATE POLICY "Developer kann eigene Projects einfügen" ON projects FOR INSERT WITH CHECK (
  developer_id = auth.uid()
);
CREATE POLICY "Developer kann eigene Projects updaten" ON projects FOR UPDATE USING (
  developer_id = auth.uid()
);
CREATE POLICY "Developer kann eigene Projects löschen" ON projects FOR DELETE USING (
  developer_id = auth.uid()
);

-- PROJECT IMAGES Policies
CREATE POLICY "Bilder sehen wenn Project sichtbar" ON project_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND (
    status = 'published' OR developer_id = auth.uid()
  ))
);
CREATE POLICY "Developer kann Bilder hochladen" ON project_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND developer_id = auth.uid())
);
CREATE POLICY "Developer kann Bilder löschen" ON project_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM projects WHERE id = project_id AND developer_id = auth.uid())
);

-- DEVELOPER CONTACTS Policies
CREATE POLICY "Aktive Broker sehen Kontakte" ON developer_contacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'broker' AND status = 'active')
);
CREATE POLICY "Developer verwaltet eigene Kontakte" ON developer_contacts FOR ALL USING (
  developer_id = auth.uid()
);

-- BOOKMARKS Policies
CREATE POLICY "Eigene Bookmarks" ON bookmarks FOR ALL USING (broker_id = auth.uid());

-- CATALOGS Policies
CREATE POLICY "Eigene Kataloge" ON catalogs FOR ALL USING (broker_id = auth.uid());

-- =============================================
-- TRIGGER: Profile bei Registrierung erstellen
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, company_name, phone, role, status)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'company_name', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'broker'),
    'pending'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- STORAGE BUCKETS (manuell in Supabase erstellen)
-- =============================================
-- Storage → New Bucket:
-- 1. "logos"           → Public: YES
-- 2. "project-images"  → Public: YES
-- 3. "project-pdfs"    → Public: NO
-- 4. "catalogs"        → Public: NO
