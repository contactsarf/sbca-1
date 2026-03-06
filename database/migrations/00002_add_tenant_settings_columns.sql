-- Migration 00002: Add Settings Columns to Tenant Table
-- Description: Adds business and public booking settings columns to existing tenant table
-- Run this ONCE if your tenant table was created before these columns were added
-- This migration is idempotent and safe to run multiple times

-- Add new columns to tenant table (only if they don't exist)
DO $$ 
BEGIN
    -- Add logo_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'logo_size') THEN
        ALTER TABLE public.tenant ADD COLUMN logo_size INTEGER DEFAULT 72;
    END IF;

    -- Add timezone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'timezone') THEN
        ALTER TABLE public.tenant ADD COLUMN timezone TEXT DEFAULT 'America/Toronto';
    END IF;

    -- Add tax_province column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'tax_province') THEN
        ALTER TABLE public.tenant ADD COLUMN tax_province TEXT DEFAULT 'ON';
    END IF;

    -- Add primary_contact_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'primary_contact_name') THEN
        ALTER TABLE public.tenant ADD COLUMN primary_contact_name TEXT;
    END IF;

    -- Add primary_contact_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'primary_contact_email') THEN
        ALTER TABLE public.tenant ADD COLUMN primary_contact_email TEXT;
    END IF;

    -- Add primary_contact_phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'primary_contact_phone') THEN
        ALTER TABLE public.tenant ADD COLUMN primary_contact_phone TEXT;
    END IF;

    -- Add public_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'public_email') THEN
        ALTER TABLE public.tenant ADD COLUMN public_email TEXT;
    END IF;

    -- Add public_phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'public_phone') THEN
        ALTER TABLE public.tenant ADD COLUMN public_phone TEXT;
    END IF;

    -- Add public_website column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'public_website') THEN
        ALTER TABLE public.tenant ADD COLUMN public_website TEXT;
    END IF;

    -- Add public_instagram column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'public_instagram') THEN
        ALTER TABLE public.tenant ADD COLUMN public_instagram TEXT;
    END IF;

    -- Add public_address column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'public_address') THEN
        ALTER TABLE public.tenant ADD COLUMN public_address TEXT;
    END IF;

    -- Add public_message column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'public_message') THEN
        ALTER TABLE public.tenant ADD COLUMN public_message TEXT;
    END IF;

    -- Add stripe_connect_account_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'stripe_connect_account_id') THEN
        ALTER TABLE public.tenant ADD COLUMN stripe_connect_account_id TEXT;
    END IF;

    -- Add stripe_connect_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'stripe_connect_status') THEN
        ALTER TABLE public.tenant ADD COLUMN stripe_connect_status TEXT DEFAULT 'not_connected';
    END IF;

    -- Add interac_email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'interac_email') THEN
        ALTER TABLE public.tenant ADD COLUMN interac_email TEXT;
    END IF;

    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'tenant' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.tenant ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    END IF;

    RAISE NOTICE 'Tenant table columns added successfully';
END $$;

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to automatically update updated_at on tenant updates
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenant_updated_at') THEN
        CREATE TRIGGER update_tenant_updated_at
        BEFORE UPDATE ON public.tenant
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Trigger update_tenant_updated_at created successfully';
    ELSE
        RAISE NOTICE 'Trigger update_tenant_updated_at already exists';
    END IF;
END $$;

-- Update RLS policy to allow admins to update tenant (if using RLS)
DO $$ 
BEGIN
    -- Drop the old policy if it exists
    DROP POLICY IF EXISTS "Owners can update their tenant" ON public.tenant;
    
    -- Create updated policy that includes admins
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Owners and admins can update tenant') THEN
        CREATE POLICY "Owners and admins can update tenant" 
        ON public.tenant FOR UPDATE 
        USING (auth.uid() = owner_id OR (id = public.get_auth_user_tenant() AND public.get_auth_user_role() IN ('owner', 'admin')));
        RAISE NOTICE 'RLS policy updated to allow admins';
    END IF;
END $$;

-- Verification: Show tenant table structure
DO $$
DECLARE
    col_record RECORD;
BEGIN
    RAISE NOTICE 'Current tenant table columns:';
    FOR col_record IN 
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tenant'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  - %: % (default: %)', col_record.column_name, col_record.data_type, col_record.column_default;
    END LOOP;
END $$;
