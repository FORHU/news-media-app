import { Client } from "pg";
import fs from "fs";
import path from "path";

const BATCH_SIZE = 500;

function formatSqlValue(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (value instanceof Date) return `'${value.toISOString().replace(/'/g, "''")}'`;
  if (Buffer.isBuffer(value)) return `'\\x${value.toString("hex")}'`;
  if (Array.isArray(value)) {
    const items = value.map((item) => formatSqlValue(item));
    return `ARRAY[${items.join(", ")}]`;
  }
  if (typeof value === "object") {
    const json = JSON.stringify(value).replace(/'/g, "''");
    return `'${json}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function exportTable(
  client: Client,
  stream: fs.WriteStream,
  schema: string,
  table: string
): Promise<number> {
  const qualified = `"${schema}"."${table}"`;
  let offset = 0;
  let totalRows = 0;
  let columns: string[] | null = null;

  while (true) {
    const { rows } = await client.query(
      `SELECT * FROM ${qualified} LIMIT $1 OFFSET $2`,
      [BATCH_SIZE, offset]
    );

    if (!rows.length) break;

    if (!columns) {
      columns = Object.keys(rows[0] as Record<string, unknown>);
      stream.write(`\n-- Table ${qualified} (${columns.length} columns)\n`);
    }

    const columnList = columns.map((c) => `"${c}"`).join(", ");

    for (const row of rows) {
      const record = row as Record<string, unknown>;
      const values = columns.map((col) => formatSqlValue(record[col]));
      stream.write(
        `INSERT INTO ${qualified} (${columnList}) VALUES (${values.join(", ")});\n`
      );
    }

    totalRows += rows.length;
    offset += BATCH_SIZE;
    if (rows.length < BATCH_SIZE) break;
  }

  stream.write(`-- ${qualified}: ${totalRows} row(s)\n`);
  return totalRows;
}

export async function exportDatabaseViaPg(
  databaseUrl: string,
  outfile: string,
  schemas: string[]
): Promise<void> {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 30_000,
  });

  await client.connect();

  const stream = fs.createWriteStream(outfile, { encoding: "utf-8" });
  stream.write("-- Supabase data export (Node.js / pg fallback)\n");
  stream.write(`-- Created: ${new Date().toISOString()}\n\n`);
  stream.write("BEGIN;\n");
  stream.write("SET client_encoding = 'UTF8';\n");

  let tableCount = 0;
  let rowCount = 0;

  try {
    for (const schema of schemas) {
      stream.write(`\n-- Schema: ${schema}\n`);
      const { rows: tables } = await client.query<{ tablename: string }>(
        `SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`,
        [schema]
      );

      for (const { tablename } of tables) {
        tableCount += 1;
        const rows = await exportTable(client, stream, schema, tablename);
        rowCount += rows;
        console.log(
          `[database]   ${schema}.${tablename}: ${rows} row(s)`
        );
      }
    }

    stream.write("\nCOMMIT;\n");
  } finally {
    await new Promise<void>((resolve, reject) => {
      stream.end((err) => (err ? reject(err) : resolve()));
    });
    await client.end();
  }

  console.log(
    `[database] Exported ${tableCount} table(s), ${rowCount} row(s) → ${path.basename(outfile)}`
  );
}
