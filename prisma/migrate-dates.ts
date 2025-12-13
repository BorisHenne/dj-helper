import Database from 'better-sqlite3'
import { join } from 'path'

// Chemin vers la base de données SQLite
const dbPath = join(__dirname, 'data', 'dj-rotation.db')
const sqlite = new Database(dbPath)

// Only wipe data if explicitly requested via WIPE_DATA=true
const WIPE_DATA = process.env.WIPE_DATA === 'true'

async function migrateDates() {
  console.log('🔄 Checking database state...\n')

  if (WIPE_DATA) {
    console.log('⚠️  WIPE_DATA=true - Cleaning all tables for fresh start...')

    // Wipe DJHistory
    sqlite.prepare('DELETE FROM DJHistory').run()
    console.log('  ✓ DJHistory table cleared')

    // Wipe DailySession
    sqlite.prepare('DELETE FROM DailySession').run()
    console.log('  ✓ DailySession table cleared')

    // Wipe Play table
    sqlite.prepare('DELETE FROM Play').run()
    console.log('  ✓ Play table cleared')

    // Wipe DJ table to remove old/corrupted entries
    sqlite.prepare('DELETE FROM DJ').run()
    console.log('  ✓ DJ table cleared')

    console.log('\n🎉 All tables cleared! Will be reseeded with fresh data.')
  } else {
    // Check if tables have data
    const djCount = sqlite.prepare('SELECT COUNT(*) as count FROM DJ').get() as { count: number }
    const historyCount = sqlite.prepare('SELECT COUNT(*) as count FROM DJHistory').get() as { count: number }

    console.log(`  📊 Current data: ${djCount.count} DJs, ${historyCount.count} history entries`)

    if (djCount.count === 0) {
      console.log('  ℹ️  Database is empty, seed will populate it')
    } else {
      console.log('  ✅ Database has data, seed will only add missing entries')
    }

    console.log('\n  💡 To wipe and reseed: set WIPE_DATA=true')
  }
}

migrateDates()
  .catch((e) => {
    console.error('❌ Error during migration:', e)
    process.exit(1)
  })
  .finally(() => {
    sqlite.close()
  })
