---
trigger: always_on
---


## App specific

make sure use `test:ci` for full regression execution! it shouldn't server visual report when running in command line for cascade mode in windsurf.

## Nextjs Version
Nextjs version should be in default using version of 14.2.13

## Nextjs App Template
- The base setup of authentiation with clerk.io and supabase should be strictly taken from this template app
/Users/adamchenwei/www/nextjs-14-auth-template-supabase-clerkio
If any modifications are required, its permissible.
- Make sure do not change middleware.ts file so easily, any changes MUST first suggest then ask approal and only after user approved, such change may proceed.


## Database

The app's main database schema file used to restore all db tables is

/Users/adamchenwei/www/bookaride/db/schema.sql


## Testing Guidelines
When a file is created, modified, or deleted:
1. Run all tests related to the modified file using `npm test -- --grep="[relevant test pattern]"`
2. If tests fail, document the failures and propose fixes, but request permission before applying changes
3. If no tests exist for new/modified functionality:
   - Suggest unit tests for individual functions
   - Suggest integration tests for component interactions
   - Confirm with user before creating test files
   - when creating a new test file or its a refactoring of an existing test file or its a refactoring a function out of a file, it should always alone side of the subject file itself, if its not working that way, make sure refactor it so it work that way. i.e. if functionB is refactored out of functionA, then functionB's test file should be next to functionB's file, wherever functionB is.
4. Minimum test coverage requirement: 80% for new code

## Documentation Requirements
1. Add JSDoc comments to all new functions and classes
2. For database schema changes, update the schema documentation in /docs/database-schema.md
3. For API changes, update the API documentation in /docs/api.md

## Code Quality Standards
- Follow TypeScript strict mode with noImplicitAny and strictNullChecks enabled
- Maintain consistent naming conventions: camelCase for variables/functions, PascalCase for classes/interfaces
- Maximum line length: 100 characters
- Use meaningful variable names that clearly indicate purpose and content
- Avoid magic numbers - use named constants for all numeric values
- Implement proper error handling with typed errors and meaningful messages

## Security Guidelines
- Never hardcode credentials, API keys or secrets - always use environment variables
- Validate and sanitize all user inputs, especially for API endpoints
- Implement proper authentication checks before accessing protected resources
- Use parameterized queries for database operations to prevent SQL injection
- Apply the principle of least privilege for database operations
- Implement rate limiting for API endpoints to prevent abuse

## Performance Guidelines
- Optimize database queries with proper indexing and query planning
- Implement pagination for endpoints that return large datasets
- Use connection pooling for database operations
- Implement caching strategies for frequently accessed data
- Avoid N+1 query problems by using batch operations
- Profile and optimize CPU-intensive operations

## Architecture Guidelines
- Follow the repository pattern for data access
- Implement dependency injection for better testability
- Separate business logic from data access and presentation layers
- Create reusable utilities for common operations
- Use interfaces for better abstraction and testability
- Document architectural decisions with comments explaining "why" not just "what"

## Testing Requirements
- Write unit tests for all business logic functions
- Create integration tests for API endpoints
- Implement end-to-end tests for critical user flows
- Use test-driven development for complex features
- Maintain minimum test coverage of 85% for new code
- Include edge cases and error scenarios in test cases
- Mock external dependencies in unit tests

## Documentation Requirements
- Add JSDoc comments to all functions, classes, and interfaces
- Document function parameters, return types, and thrown exceptions
- Maintain up-to-date README files for each major component
- Document API endpoints with request/response examples
- Include setup instructions for local development
- Document environment variables and configuration options

## Pre-Commit Checklist
- Run linting: npm run lint
- Ensure all tests pass: npm test
- Check for security vulnerabilities: npm audit
- Verify type safety: npm run type-check
- Ensure no debugging code or console.log statements remain
- Verify that error handling is comprehensive

## Trading Bot Specific Guidelines
- Implement fail-safe mechanisms to prevent runaway trading
- Add transaction logging for all trading operations
- Include dry-run mode for testing strategies without real trades
- Implement circuit breakers for volatile market conditions
- Add proper error handling for exchange API failures
- Ensure idempotent operations to prevent duplicate trades
- Include monitoring and alerting for critical failures

## Change Management
- Inform the user when drastic changes are being made to any file that may alter existing behavior for debugging purposes
- Highlight potential side effects of changes and how they might impact other parts of the system
- Provide clear rollback instructions for significant changes

## Git Workflow
- At the end of each code change, make a commit with an appropriate commit message that reflects the purpose of the changes
- Push the changes to the origin repository
- Follow conventional commit format: type(scope): description
  - Types: feat, fix, docs, style, refactor, test, chore
  - Example: "feat(strategy): implement new mean reversion trading strategy"