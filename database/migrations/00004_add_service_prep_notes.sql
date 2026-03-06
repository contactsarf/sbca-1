-- Migration 00004: Add prep notes to services
-- Description: Adds prep notes to services for booking guidance
-- This migration is idempotent and safe to run multiple times

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'services'
          AND column_name = 'prep_notes'
    ) THEN
        ALTER TABLE public.services
        ADD COLUMN prep_notes TEXT;
    END IF;
END $$;
