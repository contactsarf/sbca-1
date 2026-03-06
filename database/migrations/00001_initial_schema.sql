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
    logo_size INTEGER DEFAULT 72,
    timezone TEXT DEFAULT 'America/Toronto',
    tax_province TEXT DEFAULT 'ON',
    primary_contact_name TEXT,
    primary_contact_email TEXT,
    primary_contact_phone TEXT,
    public_email TEXT,
    public_phone TEXT,
    public_website TEXT,
    public_instagram TEXT,
    public_address TEXT,
    public_message TEXT,
    stripe_connect_account_id TEXT,
    stripe_connect_status TEXT DEFAULT 'not_connected',
    interac_email TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
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
    prep_notes TEXT,
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
        CREATE POLICY "Owners can update their tenant" ON public.tenant FOR UPDATE USING (auth.uid() = owner_id OR (id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin')));
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

-- 11a. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11b. Trigger to update tenant updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenant_updated_at') THEN
        CREATE TRIGGER update_tenant_updated_at
        BEFORE UPDATE ON public.tenant
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
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

-- ============================================================
-- 25. Service-Team Member Mapping Table
-- Links services to team members for assignment.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.service_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
    team_member_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE (service_id, team_member_id)
);

-- 26. Indexes for service-team member mapping
CREATE INDEX IF NOT EXISTS idx_service_team_members_tenant_id ON public.service_team_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_team_members_service_id ON public.service_team_members(service_id);
CREATE INDEX IF NOT EXISTS idx_service_team_members_team_member_id ON public.service_team_members(team_member_id);

-- 27. Enable RLS for service_team_members
DO $$
BEGIN
    ALTER TABLE public.service_team_members ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 28. RLS Policies for service_team_members
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their service-team mappings') THEN
        CREATE POLICY "Users can view their service-team mappings"
        ON public.service_team_members FOR SELECT
        USING (tenant_id = public.get_auth_user_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners and admins can manage service-team mappings') THEN
        CREATE POLICY "Owners and admins can manage service-team mappings"
        ON public.service_team_members FOR ALL
        USING (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'))
        WITH CHECK (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'));
    END IF;
END $$;

-- 29. Grant permissions for service_team_members
GRANT ALL ON TABLE public.service_team_members TO anon, authenticated, service_role;

-- ============================================================
-- 30. Clients Table
-- Manages customer/client information separate from system users.
-- Used for tracking visits, spending, marketing campaigns, etc.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
    email TEXT,
    phone TEXT,
    name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    -- At least one contact method required
    CONSTRAINT clients_contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL),
    -- Email unique per tenant when provided
    CONSTRAINT clients_email_tenant_unique UNIQUE (tenant_id, email),
    -- Phone unique per tenant when provided
    CONSTRAINT clients_phone_tenant_unique UNIQUE (tenant_id, phone)
);

-- 31. Indexes for clients
CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_tenant_email ON public.clients(tenant_id, email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_tenant_phone ON public.clients(tenant_id, phone) WHERE phone IS NOT NULL;

-- 32. Enable RLS for clients
DO $$
BEGIN
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 33. RLS Policies for clients
DO $$
BEGIN
    -- Staff can view clients for their tenant
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view tenant clients') THEN
        CREATE POLICY "Staff can view tenant clients"
        ON public.clients FOR SELECT
        USING (tenant_id = public.get_auth_user_tenant());
    END IF;

    -- Owners and admins can manage clients
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners and admins can manage clients') THEN
        CREATE POLICY "Owners and admins can manage clients"
        ON public.clients FOR ALL
        USING (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'))
        WITH CHECK (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'));
    END IF;

    -- Application can upsert clients during booking (service_role)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can upsert clients') THEN
        CREATE POLICY "Service role can upsert clients"
        ON public.clients FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 34. Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 35. Trigger to update clients updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at
        BEFORE UPDATE ON public.clients
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 36. Grant permissions for clients
GRANT ALL ON TABLE public.clients TO anon, authenticated, service_role;

-- ============================================================
-- 37. Bookings Table
-- Core table for appointment bookings. Critical for booking engine.
-- Optimized for high performance with millions of rows.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenant(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL NOT NULL,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL NOT NULL,
    team_member_id UUID REFERENCES public.teams(id) ON DELETE SET NULL NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'America/Toronto',  -- IANA timezone for accurate handling
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no-show')) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 38. Critical indexes for booking engine performance
-- Multi-column indexes optimized for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date ON public.bookings(tenant_id, booking_date) WHERE status NOT IN ('cancelled');
CREATE INDEX IF NOT EXISTS idx_bookings_staff_date ON public.bookings(team_member_id, booking_date) WHERE status NOT IN ('cancelled');
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Composite index for fast availability checks (booking engine's most frequent query)
CREATE INDEX IF NOT EXISTS idx_bookings_availability_lookup 
ON public.bookings(tenant_id, team_member_id, booking_date, start_time, end_time) 
WHERE status IN ('confirmed', 'pending');

-- 39. Enable RLS for bookings
DO $$
BEGIN
    ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 40. RLS Policies for bookings
DO $$
BEGIN
    -- Staff can view all bookings for their tenant
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can view all tenant bookings') THEN
        CREATE POLICY "Staff can view all tenant bookings"
        ON public.bookings FOR SELECT
        USING (tenant_id = public.get_auth_user_tenant());
    END IF;

    -- Anonymous and authenticated users can create bookings (public booking flow)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can create bookings') THEN
        CREATE POLICY "Public can create bookings"
        ON public.bookings FOR INSERT
        TO anon, authenticated
        WITH CHECK (true);  -- Validation happens in application logic
    END IF;

    -- Only owners/admins can update bookings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners and admins can manage bookings') THEN
        CREATE POLICY "Owners and admins can manage bookings"
        ON public.bookings FOR UPDATE
        USING (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'))
        WITH CHECK (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'));
    END IF;

    -- Only owners/admins can delete bookings
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners and admins can delete bookings') THEN
        CREATE POLICY "Owners and admins can delete bookings"
        ON public.bookings FOR DELETE
        USING (tenant_id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin'));
    END IF;
END $$;

-- 41. Trigger to update bookings updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_bookings_updated_at') THEN
        CREATE TRIGGER update_bookings_updated_at
        BEFORE UPDATE ON public.bookings
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- 42. Grant permissions for bookings
GRANT ALL ON TABLE public.bookings TO anon, authenticated, service_role;
