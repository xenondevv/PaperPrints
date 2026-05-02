-- =============================================================================
-- Migration 005: Add Cashfree-specific columns to payments table
-- =============================================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS cf_order_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_session_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cf_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_gateway TEXT DEFAULT 'CASHFREE';

-- Update payment_method check to include CASHFREE-managed methods
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('UPI', 'CASH', 'CARD', 'WALLET', 'NETBANKING', 'EMI', 'CASHFREE'));
