-- =============================================================================
-- Migration 006: Add bank_details column to vendors table
-- =============================================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS upi_id TEXT;
