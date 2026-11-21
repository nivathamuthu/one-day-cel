import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export function createFileStore(dir) {
  mkdirSync(dir, { recursive: true })
  const fileFor = (id) => join(dir, `${id}.json`)

  return {
    kind: 'file',
    async insert(id, data) {
      try {
        writeFileSync(fileFor(id), JSON.stringify(data), { flag: 'wx' })
        return true
      } catch (error) {
        if (error.code === 'EEXIST') return false
        throw error
      }
    },
    async get(id) {
      try {
        return JSON.parse(readFileSync(fileFor(id), 'utf8'))
      } catch (error) {
        if (error.code === 'ENOENT') return null
        throw error
      }
    },
    async ping() {},
    async close() {},
  }
}
