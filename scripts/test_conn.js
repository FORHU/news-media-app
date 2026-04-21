const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.asyjcjciioibpkmzzhfh:Z2RNmUrsNK6UJHwS@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true';

async function run() {
  console.log('Connecting to database...');
  const pool = new Client({ connectionString });
  try {
    await pool.connect();
    console.log('Connected to pool!');
    const res = await pool.query('SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = \'public\'');
    console.log('Tables:', res.rows.map(r => r.tablename));
    await pool.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

run();
