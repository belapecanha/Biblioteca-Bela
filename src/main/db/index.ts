import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import * as schema from './schema'

const userDataDir = app.getPath('userData')

export const capasDir = join(userDataDir, 'capas')
export const backupsDir = join(userDataDir, 'backups')
const dbPath = join(userDataDir, 'biblioteca.db')

for (const dir of [userDataDir, capasDir, backupsDir]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// electron-vite empacota o main num unico arquivo out/main/index.js;
// o plugin copyMigrationsPlugin (electron.vite.config.ts) copia as
// migrations para out/main/db/migrations no build, mantendo __dirname valido.
export function runMigrations(): void {
  migrate(db, { migrationsFolder: join(__dirname, 'db/migrations') })
}
