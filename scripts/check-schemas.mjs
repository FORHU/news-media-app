import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');
const envLines = readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^"|"$/g, '');
  if (key && !process.env[key]) process.env[key] = val;
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const r = await pool.query("SELECT nspname FROM pg_catalog.pg_namespace");
  console.log('Schemas:', r.rows.map(n => n.nspname));
  
  const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'tenants'");
  console.log('Tenants table locations:', tables.rows);
} catch (e) {
  console.error('Failed:', e.message);
} finally {
  await pool.end();
}
