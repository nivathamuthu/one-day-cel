import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { ID_PATTERN, validateDraft } from './validate.js'

export async function migrateDirectory({ dir, store, dryRun = false }) {
  const report = { imported: [], skipped: [], failed: [] }
  const files = readdirSync(dir).filter((name) => name.endsWith('.json')).sort()

  for (const file of files) {
    const id = basename(file, '.json')
    if (!ID_PATTERN.test(id)) {
      report.failed.push({ id, reason: 'file name is not a 10-character surprise ID' })
      continue
    }
    let data
    try {
      data = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    } catch {
      report.failed.push({ id, reason: 'file is not valid JSON' })
      continue
    }
    const { value, error } = validateDraft(data)
    if (error) {
      report.failed.push({ id, reason: error })
      continue
    }
    if (dryRun) {
      report.imported.push({ id })
      continue
    }
    try {
      if (await store.insert(id, value)) report.imported.push({ id })
      else report.skipped.push({ id, reason: 'already in the database' })
    } catch (insertError) {
      report.failed.push({ id, reason: `database error: ${insertError.message}` })
    }
  }
  return report
}
