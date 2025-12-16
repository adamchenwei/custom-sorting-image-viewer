# SQLite Database Setup

## Tech Stack (Database-specific)
- **SQLite** (For local/embedded database)
- **better-sqlite3** (Recommended Node.js driver - synchronous, fast)

## When to Use SQLite
- Single-user or low-concurrency applications
- Local-first applications
- Prototyping and development
- Applications requiring embedded database
- When external database service is not needed

## Database File Location
- Default location: `/data/app.db` or `./db/app.db`
- Ensure the directory exists before database initialization
- For production: Use persistent storage volume

## Persistence Requirements
- Ensure corresponding host has available persisted storage
- If not available, use the deployment instance itself as storage
- **Important**: Always keep persistent storage setup in mind for production deployments
- Railway/Render/Fly.io: Configure volume mounts for data persistence

## Database Schema Management
- Main schema file: `/db/schema.sql`
- All schema changes must be reflected in:
    - The main schema file
    - A versioned migration file in `/db/migrations/` (e.g., `YYYYMMDD_HHMMSS_description.sql`)
    - TypeScript type definitions in `/src/types/database.ts`

### Migration Workflow
1. Create migration file: `/db/migrations/YYYYMMDD_HHMMSS_description.sql`
2. Test migration on local database first
3. Update schema.sql with cumulative changes
4. Update TypeScript types manually (no auto-generation for SQLite)
5. Update affected queries and tests
6. Document breaking changes in migration comments
7. Verify all existing tests still pass after migration

## Database Initialization
```typescript
// src/lib/db.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/app.db';

// Ensure directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); // Better performance

export default db;
```

## Environment Variables
```
DATABASE_PATH=./data/app.db
```

## Authentication (If Needed)
- SQLite itself has no built-in authentication
- For app-level auth, consider:
    - Simple password hashing with bcrypt
    - Session-based auth with cookies
    - JWT tokens for stateless auth
- Store user credentials in a `users` table with hashed passwords

## Example Users Table
```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Best Practices
- Use WAL mode for better concurrent read performance
- Implement connection pooling for high-traffic apps
- Regular backups of the database file
- Use transactions for multi-statement operations
- Index frequently queried columns
