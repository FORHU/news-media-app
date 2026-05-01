import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Manually load .env since this runs outside Next.js
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
const url = process.env.DATABASE_URL;
console.log('DATABASE_URL prefix:', url?.substring(0, 60) + '...');

const pool = new Pool({ connectionString: url });
try {
  const r = await pool.query("SELECT * FROM tenants");
  console.log('Tenants:', JSON.stringify(r.rows, null, 2));
} catch (e) {
  console.error('Query failed:', e.message);
} finally {
  await pool.end();
}
