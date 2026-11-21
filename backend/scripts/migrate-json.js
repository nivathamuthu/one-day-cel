// Imports the JSON surprises saved on this computer into Supabase, keeping their IDs.
// Usage: npm run migrate -- [folder] [--dry-run]
// Existing database rows are never overwritten and the JSON files are never deleted.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { migrateDirectory } from '../src/migrate.js'
import { createPostgresStore } from '../src/stores/postgres.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const folderArg = args.find((arg) => !arg.startsWith('--'))
const dir = folderArg ? resolve(folderArg) : fileURLToPath(new URL('../../data/surprises/', import.meta.url))

if (!existsSync(dir)) {
  console.error(`Folder not found: ${dir}`)
  process.exit(1)
}
if (!dryRun && !process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL (in backend/.env or the environment) before importing, or use --dry-run.')
  process.exit(1)
}

const store = dryRun
  ? null
  : createPostgresStore({
      connectionString: process.env.DATABASE_URL,
      caCert: process.env.DATABASE_CA_CERT,
      ssl: process.env.DATABASE_SSL === 'disable' ? 'disable' : 'require',
    })

console.log(`${dryRun ? 'Checking' : 'Importing'} surprises from ${dir}`)
const report = await migrateDirectory({ dir, store, dryRun })
await store?.close()

for (const { id } of report.imported) console.log(`  ${dryRun ? 'would import' : 'imported'}  ${id}`)
for (const { id, reason } of report.skipped) console.log(`  skipped   ${id} (${reason})`)
for (const { id, reason } of report.failed) console.log(`  failed    ${id} (${reason})`)
console.log(
  `\n${dryRun ? 'Would import' : 'Imported'}: ${report.imported.length}  Skipped: ${report.skipped.length}  Failed: ${report.failed.length}`,
)
process.exit(report.failed.length ? 1 : 0)
