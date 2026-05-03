/**
 * Migration: Add fcm_token column to users table.
 * Run this once: node add-fcm-token-column.js
 */
'use strict';

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    // Add fcm_token column if it doesn't already exist
    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS fcm_token TEXT DEFAULT NULL;
    `);
    console.log('✅ Added fcm_token column to users table');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
