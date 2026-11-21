export function createMemoryStore(initial = {}) {
  const rows = new Map(Object.entries(initial))

  return {
    kind: 'memory',
    async insert(id, data) {
      if (rows.has(id)) return false
      rows.set(id, structuredClone(data))
      return true
    },
    async get(id) {
      return rows.has(id) ? structuredClone(rows.get(id)) : null
    },
    async ping() {},
    async close() {},
  }
}
