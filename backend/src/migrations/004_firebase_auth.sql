-- Migration: Add Firebase auth columns to users table
-- Run this against your PostgreSQL database

-- Add firebase_uid for linking Google accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS firebase_uid TEXT UNIQUE;

-- Add photo_url from Google profile
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Make phone and password_hash optional (Google users won't have them)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Index for fast lookup by firebase_uid
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users (firebase_uid);
