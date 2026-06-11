// Migrate tables from public schema to domain schemas
// Run: node src/scripts/migrate-schemas.mjs

const { Pool } = require('pg');

const SCHEMAS = {
  auth: ['users', 'refresh_tokens', 'permissions', 'role_permissions', 'user_permissions', 'scopes', 'user_scopes'],
  inventory: ['customers', 'products', 'cylinders', 'ink_formulas', 'ink_batches'],
  production: ['production_jobs', 'job_verifications', 'production_logs', 'qc_inspections'],
  sales: ['sales_orders'],
  workflow: ['workflow_definitions', 'workflow_instances', 'workflow_steps'],
  audit: ['audit_logs'],
};

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://gravure_user:gravure_password@postgres:5432/gravure_db?schema=public' });
  const client = await pool.connect();

  try {
    console.log('\n=== Schema Migration ===\n');

    // 1. Create schemas
    for (const schema of Object.keys(SCHEMAS)) {
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      console.log(`  Created schema: ${schema}`);
    }

    // 2. Move tables
    for (const [schema, tables] of Object.entries(SCHEMAS)) {
      for (const table of tables) {
        const check = await client.query(`SELECT to_regclass('public.${table}') AS tbl`);
        if (check.rows[0]?.tbl) {
          // Drop target if exists (shouldn't, but safety)
          await client.query(`DROP TABLE IF EXISTS "${schema}"."${table}" CASCADE`);
          await client.query(`ALTER TABLE public."${table}" SET SCHEMA "${schema}"`);
          console.log(`  Moved: public.${table} → ${schema}.${table}`);
        } else {
          console.log(`  Skipped: public.${table} (does not exist)`);
        }
      }
    }

    console.log('\n=== Migration Complete ===\n');
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(() => process.exit(1));
