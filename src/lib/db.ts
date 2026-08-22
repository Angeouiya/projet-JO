import path from 'node:path'
import { PrismaClient } from '@prisma/client'

function resolveDatabaseUrl() {
  const current = process.env.DATABASE_URL
  if (current?.startsWith('postgres://') || current?.startsWith('postgresql://')) {
    process.env.EXTERNAL_DATABASE_URL ??= current
  }
  if (current?.startsWith('file:') && !current.includes('/home/z/my-project/')) return current

  const dbPath = path.join(process.cwd(), 'db', 'custom.db').replace(/\\/g, '/')
  return `file:${dbPath}`
}

process.env.DATABASE_URL = resolveDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
