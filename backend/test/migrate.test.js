import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { migrateDirectory } from '../src/migrate.js'
import { createMemoryStore } from '../src/stores/memory.js'
import { sampleDraft } from './helpers.js'

function fixtureDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'migrate-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  writeFileSync(join(dir, 'aaaaaaaaaa.json'), JSON.stringify(sampleDraft({ name: 'New' })))
  writeFileSync(join(dir, 'bbbbbbbbbb.json'), JSON.stringify(sampleDraft({ name: 'From file' })))
  writeFileSync(join(dir, 'cccccccccc.json'), '{not json')
  writeFileSync(join(dir, 'dddddddddd.json'), JSON.stringify({ v: 9 }))
  writeFileSync(join(dir, 'Bad-Name.json'), JSON.stringify(sampleDraft()))
  writeFileSync(join(dir, 'notes.txt'), 'ignored')
  return dir
}

test('migration imports new ids, skips existing ones and reports failures', async (t) => {
  const dir = fixtureDir(t)
  const store = createMemoryStore({ bbbbbbbbbb: sampleDraft({ name: 'Already in database' }) })
  const report = await migrateDirectory({ dir, store })

  assert.deepEqual(report.imported.map((row) => row.id), ['aaaaaaaaaa'])
  assert.deepEqual(report.skipped.map((row) => row.id), ['bbbbbbbbbb'])
  assert.deepEqual(report.failed.map((row) => row.id).sort(), ['Bad-Name', 'cccccccccc', 'dddddddddd'])

  assert.equal((await store.get('aaaaaaaaaa')).name, 'New')
  assert.equal((await store.get('bbbbbbbbbb')).name, 'Already in database')
  assert.ok(existsSync(join(dir, 'aaaaaaaaaa.json')), 'JSON files are kept')
})

test('running the migration twice imports nothing the second time', async (t) => {
  const dir = fixtureDir(t)
  const store = createMemoryStore()
  await migrateDirectory({ dir, store })
  const second = await migrateDirectory({ dir, store })
  assert.equal(second.imported.length, 0)
  assert.equal(second.skipped.length, 2)
})

test('dry run writes nothing', async (t) => {
  const dir = fixtureDir(t)
  const store = createMemoryStore()
  const report = await migrateDirectory({ dir, store, dryRun: true })
  assert.equal(report.imported.length, 2)
  assert.equal(await store.get('aaaaaaaaaa'), null)
})

test('database errors are reported per record', async (t) => {
  const dir = fixtureDir(t)
  const store = { ...createMemoryStore(), insert: async () => Promise.reject(new Error('timeout')) }
  const report = await migrateDirectory({ dir, store })
  assert.equal(report.imported.length, 0)
  assert.ok(report.failed.some((row) => row.id === 'aaaaaaaaaa' && /timeout/.test(row.reason)))
})
