-- Initial Schema Migration: Tenants, Profiles, and Services
-- Description: Sets up the core multi-tenant architecture with Row Level Security.
-- Robustness: Uses IF NOT EXISTS and CREATE OR REPLACE for idempotency.

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tenant Table
CREATE TABLE IF NOT EXISTS public.tenant (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('owner', 'admin', 'staff')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Create Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    deposit_percentage INT CHECK (deposit_percentage IN (10, 25, 50, 100)),
    is_paused BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. Enable Row Level Security
DO $$ 
BEGIN
    ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already enabled or tables don't exist
END $$;

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_tenant_slug ON public.tenant(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON public.services(tenant_id);

-- 7. SECURITY DEFINER Functions for RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_tenant()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 8. RLS Policies for Tenant
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create a tenant') THEN
        CREATE POLICY "Users can create a tenant" ON public.tenant FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their tenant') THEN
        CREATE POLICY "Users can view their tenant" ON public.tenant FOR SELECT USING (auth.uid() = owner_id OR id = public.get_auth_user_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners can update their tenant') THEN
        CREATE POLICY "Owners can update their tenant" ON public.tenant FOR UPDATE USING (auth.uid() = owner_id OR (id = public.get_auth_user_tenant() AND public.get_auth_user_role() = 'owner'));
    END IF;
END $$;

-- 9. RLS Policies for Profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile') THEN
        CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view profiles') THEN
        CREATE POLICY "Users can view profiles" ON public.profiles FOR SELECT USING (auth.uid() = id OR (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin')));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update profiles') THEN
        CREATE POLICY "Users can update profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id OR (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin')));
    END IF;
END $$;

-- 10. RLS Policies for Services
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their tenant services') THEN
        CREATE POLICY "Users can view their tenant services" ON public.services FOR SELECT USING (tenant_id = public.get_auth_user_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can manage services') THEN
        CREATE POLICY "Staff can manage services" ON public.services FOR ALL USING (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'));
    END IF;
END $$;

-- 11. Functions and Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    END IF;
END $$;

-- 12. Restore and Ensure Permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

GRANT ALL ON TABLE public.tenant TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.services TO anon, authenticated, service_role;

-- 13. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    joined_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 14. Enable RLS for Teams
DO $$ 
BEGIN
    ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if already enabled
END $$;

-- 15. Index for Teams
CREATE INDEX IF NOT EXISTS idx_teams_tenant_id ON public.teams(tenant_id);

-- 16. RLS Policies for Teams
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their tenant teams') THEN
        CREATE POLICY "Users can view their tenant teams" ON public.teams FOR SELECT USING (tenant_id = public.get_auth_user_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners and admins can manage teams') THEN
        CREATE POLICY "Owners and admins can manage teams" ON public.teams FOR ALL USING (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'));
    END IF;
END $$;

-- 17. Grant Permissions for Teams
GRANT ALL ON TABLE public.teams TO anon, authenticated, service_role;

-- 18. Supabase Storage: Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 19. Storage RLS Policies for avatars bucket
DO $$
BEGIN
    -- Allow any authenticated user to upload
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload avatars' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'avatars');
    END IF;

    -- Allow public read (required for public CDN URLs to resolve)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view avatars' AND tablename = 'objects') THEN
        CREATE POLICY "Public can view avatars"
        ON storage.objects FOR SELECT TO public
        USING (bucket_id = 'avatars');
    END IF;

    -- Allow authenticated users to update/delete their own files
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can manage avatars' AND tablename = 'objects') THEN
        CREATE POLICY "Authenticated users can manage avatars"
        ON storage.objects FOR ALL TO authenticated
        USING (bucket_id = 'avatars');
    END IF;
END $$;

-- ============================================================
-- 20. Team Schedules Table
-- Stores weekly availability for each team member.
-- Used by the booking engine to determine assignable slots.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.team_schedules (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id     UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
    team_member_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 1=Mon ... 6=Sat
    is_available  BOOLEAN DEFAULT TRUE NOT NULL,
    start_time    TIME NOT NULL DEFAULT '09:00',
    end_time      TIME NOT NULL DEFAULT '17:00',
    created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (team_member_id, day_of_week)
);

-- 21. Index for fast schedule lookups by booking engine
CREATE INDEX IF NOT EXISTS idx_team_schedules_member ON public.team_schedules(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_schedules_tenant ON public.team_schedules(tenant_id);

-- 22. Enable RLS for team_schedules
DO $$
BEGIN
    ALTER TABLE public.team_schedules ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 23. RLS Policies for team_schedules
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their tenant schedules') THEN
        CREATE POLICY "Users can view their tenant schedules"
        ON public.team_schedules FOR SELECT
        USING (tenant_id = public.get_auth_user_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners and admins can manage team schedules') THEN
        CREATE POLICY "Owners and admins can manage team schedules"
        ON public.team_schedules FOR ALL
        USING (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'));
    END IF;
END $$;

-- 24. Grant permissions
GRANT ALL ON TABLE public.team_schedules TO anon, authenticated, service_role;
