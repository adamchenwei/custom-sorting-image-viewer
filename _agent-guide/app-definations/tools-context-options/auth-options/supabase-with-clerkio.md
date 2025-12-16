# Supabase + Clerk.io Authentication Setup

## Tech Stack (Auth-specific)
- **Supabase** (For Database)
- **Clerk.io** (For Authentication)

## Auth Flow
When making UI app, follow the user creation logic in `_agent-guide/app-definations/tools-context-options/web-nextjs-details.md/user-creation-without-webhooks.md`. Do not use Clerk webhooks.

## Database Schema Management (Supabase)
- Main schema file: `/db/app-database-schemas.sql`
- All schema changes must be reflected in:
    - The main schema file
    - A versioned migration file in `/db/migrations/` (e.g., `YYYYMMDD_HHMMSS_description.sql`)
    - TypeScript type definitions in `/src/types/database.ts`

### Migration Workflow
1. Create migration file: `/db/migrations/YYYYMMDD_HHMMSS_description.sql`
2. Test migration on local database first
3. Update app-database-schemas.sql with cumulative changes
4. Generate TypeScript types: `npm run generate:types` (if applicable)
5. Update affected queries and tests
6. Document breaking changes in migration comments
7. Verify all existing tests still pass after migration

## Environment Variables
Make sure to add these environment variables to your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
CLERK_SECRET_KEY=your-clerk-secret-key
```

The `SUPABASE_SERVICE_ROLE_KEY` is needed because the user creation process needs to bypass Row Level Security (RLS) to create new users. Find this key in Supabase dashboard under Project Settings > API.

## Pre-requisites
1. Make sure Supabase service key is added correctly from /settings/api-keys (knowing that this is legacy approach, but we will use it until its fully deprecated; new approach is in /settings/api-keys/new in Supabase site)
