import Database from 'better-sqlite3'
import { existsSync } from 'fs'
import { join } from 'path'

// Check if database exists and has data
const dbPath = join(__dirname, 'data', 'dj-rotation.db')

export function isDatabaseInitialized(): boolean {
  if (!existsSync(dbPath)) {
    console.log('📁 Database file does not exist')
    return false
  }

  try {
    const sqlite = new Database(dbPath)
    
    // Check if tables exist and have data
    const tables = sqlite.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='djs'").get()
    if (!tables) {
      sqlite.close()
      console.log('📋 Tables do not exist yet')
      return false
    }

    const djCount = sqlite.prepare('SELECT COUNT(*) as count FROM djs').get() as { count: number }
    sqlite.close()

    if (djCount.count === 0) {
      console.log('📋 Database is empty')
      return false
    }

    console.log(`✅ Database already initialized with ${djCount.count} DJs`)
    return true
  } catch (error) {
    console.log('⚠️  Error checking database:', error)
    return false
  }
}

// Run check if called directly
if (require.main === module) {
  const initialized = isDatabaseInitialized()
  process.exit(initialized ? 0 : 1)
}
