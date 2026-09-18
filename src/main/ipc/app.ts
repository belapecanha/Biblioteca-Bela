import { ipcMain } from 'electron'
import { sql } from 'drizzle-orm'
import { db } from '../db'

// Canal de verificacao simples: confirma que main -> preload -> renderer
// e o acesso ao SQLite (via Drizzle) estao funcionando de ponta a ponta.
export function registerAppHandlers(): void {
  ipcMain.handle('app:ping', () => {
    const row = db.get<{ ok: number }>(sql`SELECT 1 as ok`)
    return { ok: row?.ok === 1, timestamp: new Date().toISOString() }
  })
}
