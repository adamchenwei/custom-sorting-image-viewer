- **Tech Stack**: 
    Next.js 14 (For UI App)
    Nodejs 20.10.0 (For Backend and CLI)
    TypeScript
    Playwright (For Regression Testing)
    Jest (For Unit Testing) 
    Supabase (For Database)
    Clerk.io (For Authentication)
    - Read additional tools context in _agent-guide/app-definations/tools-context folder.

- **Auth Flow**: When Making UI app, Make Sure Follow the user creation logic in `/app-definations/tools-context-options/web-nextjs-details.md/user-creation-without-webhooks.md`. Do not use Clerk webhooks.

- **Environment Validation**:
    - Verify Node.js version matches requirement: `node --version` should show v20.10.0
    - Use nvm if needed: `source ~/.nvm/nvm.sh && nvm use`

- **Version Management**:
    - Version file: `package.json`
    - Read current version: `node -p "require('./package.json').version"`
    - Update version field in package.json using `edit` tool
    - Commit command: `git add package.json && git commit -m "chore(version): bump version to X.Y.Z" && git push`
    - Note: Some projects may have auto-bump mechanisms via git hooks (e.g., `lib/version.ts`)

- **Build Command**:
    - Production build: `npm run build`
    - Development: `npm run dev`
    - Verify build succeeds before committing changes

- **Code Quality Standards**:
    - Use TypeScript strict mode (`noImplicitAny`, `strictNullChecks`)
    - Use camelCase for variables/functions and PascalCase for classes/interfaces/components
    - No console.log statements in production code
    - All TypeScript errors must be resolved before commit
    - No unused imports or variables

- **Database Schema Management** (Supabase):
    - Main schema file: `/db/app-database-schemas.sql`
    - All schema changes must be reflected in:
        - The main schema file
        - A versioned migration file in `/db/migrations/` (e.g., `YYYYMMDD_HHMMSS_description.sql`)
        - TypeScript type definitions in `/src/types/database.ts`
    
    **Migration Workflow**:
    1. Create migration file: `/db/migrations/YYYYMMDD_HHMMSS_description.sql`
    2. Test migration on local database first
    3. Update app-database-schemas.sql with cumulative changes
    4. Generate TypeScript types: `npm run generate:types` (if applicable)
    5. Update affected queries and tests
    6. Document breaking changes in migration comments
    7. Verify all existing tests still pass after migration

- **Regression Testing** (Playwright):
    - Create regression tests for happy path user flows
    - For AI agent iteration, create custom npm command: `npm run test:regression:ci`
    - Command should run: `playwright test --reporter=list` (uses list reporter for CI)
    - Include nvm setup if needed: `source ~/.nvm/nvm.sh && nvm use && playwright test --reporter=list`
    - Add command to package.json scripts
    - Un-testable features (camera/audio/screen recording, screenshots) only need unit tests
