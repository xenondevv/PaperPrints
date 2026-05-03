-- =============================================================================
-- Migration 007: Order Files (multi-file support per order)
-- Allows an order to reference multiple merged PDFs (e.g. one color, one B&W).
-- The original `file_id` column on orders is kept for backward compatibility;
-- this junction table holds the full set.
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_files (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id  UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  file_id   UUID NOT NULL REFERENCES files  (id) ON DELETE CASCADE,
  label     TEXT,    -- optional: 'bw', 'color', 'merged', etc.
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE (order_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_order_files_order ON order_files (order_id);
