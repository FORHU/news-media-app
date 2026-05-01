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
  const now = new Date().toISOString();
  await pool.query(`
    INSERT INTO tenants (id, slug, domain, site_name, default_language, is_active, created_at, updated_at) 
    VALUES ('jejutime', 'jejutime', 'jejutime.com', 'JEJUTIME', 'en', true, $1, $1) 
    ON CONFLICT (domain) DO UPDATE SET site_name = 'JEJUTIME', updated_at = $1
  `, [now]);
  await pool.query(`
    INSERT INTO tenants (id, slug, domain, site_name, default_language, is_active, created_at, updated_at) 
    VALUES ('newsicons', 'newsicons', 'newsicons.com', 'NEWSICONS', 'en', true, $1, $1) 
    ON CONFLICT (domain) DO UPDATE SET site_name = 'NEWSICONS', updated_at = $1
  `, [now]);
  console.log('Successfully updated cloud DB with jejutime.com and newsicons.com');
} catch (e) {
  console.error('Failed to update tenants:', e.message);
} finally {
  await pool.end();
}
