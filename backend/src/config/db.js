const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({ connectionString: env.db.url });

pool.on('error', (err) => {
  console.error('Unexpected DB client error', err);
  process.exit(-1);
});

/**
 * Execute a parameterised query.
 * @param {string} text  - SQL string
 * @param {Array}  params - query parameters
 */
const query = (text, params) => pool.query(text, params);

module.exports = { query, pool };
