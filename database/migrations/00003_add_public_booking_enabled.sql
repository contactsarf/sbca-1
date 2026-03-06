-- Migration 00003: Add public booking availability flag
-- Description: Adds a toggle field to control whether public booking page is available
-- This migration is idempotent and safe to run multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'tenant'
          AND column_name = 'public_booking_enabled'
    ) THEN
        ALTER TABLE public.tenant
        ADD COLUMN public_booking_enabled BOOLEAN DEFAULT TRUE NOT NULL;
    END IF;
END $$;

-- Backfill for older rows in case defaults were not applied
UPDATE public.tenant
SET public_booking_enabled = TRUE
WHERE public_booking_enabled IS NULL;
