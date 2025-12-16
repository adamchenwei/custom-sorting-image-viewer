# AI AGENT SHOULD NEVER MODIFY THIS FILE WITHOUT USER CONSENT AUTOMATICALLY!


# App Building Iteration Guide

## ⚠️ BEFORE YOU START: Archive Check

**Check if previous work needs archiving:**
1. Look at `_agent-guide/app-user-input/current-user-input.md`
2. If it has content AND you just pushed code → Archive it now (see `_agent-guide/MANDATORY-AFTER-PUSH.md`)
3. If it's empty → Proceed with new task

**This ensures you never lose track of completed work.**

---

## Agent Rules
- Be an honest assistant acknowledging what they can't determine, do not pretend to be confident in the answer. ask additional questions to narrow down toward the correct solution instead of assuming. if any assumptions have been made, make sure mention it in your response.

- Before start doing anything make sure check the content in /app-specific-context and /app-user-input to make sure its relevant to the current repository. if it seems irrelevant, user maybe making a mistake on the work, make sure stop and ask user to confirm before proceed to do anything else.
    - if the project is clearly started from stratch meaning, only _agent-guide/ folder is in the root of the project, then all files in //app-specific-context should still exist but they should be empty, unless,  /app-user-input/current-user-input.md has text in it to describe the project.

- **Commit Message Format**: All commits MUST follow the Conventional Commits specification:
  
  **Format**: `type(scope): description`
  
  **Types** (required):
  - `feat`: A new feature for the user
  - `fix`: A bug fix
  - `docs`: Documentation only changes
  - `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
  - `refactor`: A code change that neither fixes a bug nor adds a feature
  - `perf`: A code change that improves performance
  - `test`: Adding missing tests or correcting existing tests
  - `chore`: Changes to the build process or auxiliary tools and libraries
  - `ci`: Changes to CI configuration files and scripts
  - `build`: Changes that affect the build system or external dependencies
  
  **Scope** (optional but recommended):
  - The scope should be the name of the affected module, component, or feature area
  - Examples: `auth`, `api`, `database`, `ui`, `config`, `migration`, `component-name`
  - Use kebab-case for multi-word scopes
  
  **Description** (required):
  - Use imperative, present tense: "change" not "changed" nor "changes"
  - Don't capitalize the first letter
  - No period (.) at the end
  - Be concise but descriptive (50 characters or less recommended)
  
  **Examples**:
  - `feat(auth): add user session persistence with localStorage`
  - `fix(api): resolve race condition in payment processing`
  - `docs(readme): update environment setup instructions`
  - `refactor(database): extract query logic into repository pattern`
  - `test(user-service): add unit tests for user creation flow`
  - `chore(deps): upgrade next.js to version 14.2.0`
  
  **Breaking Changes**:
  - Add `!` after the type/scope to indicate breaking changes: `feat(api)!: redesign authentication endpoint`
  - Include `BREAKING CHANGE:` in the commit body to explain the breaking change
  
  **Multi-line Commits** (when needed):
  - First line: type(scope): short description
  - Blank line
  - Body: Detailed explanation of what and why (not how)
  - Blank line
  - Footer: References to issues, breaking changes, etc.

## Tooling Context:
  - Looking for app-specific context preferences in `_agent-guide/app-user-input/context/app-definations-tool-context-selected.md` which should choose a specific context in `/app-specific-context/` and make sure to obtain tooling context from them in detail.
  - This includes checking for any existing configuration, dependencies, and setup instructions.
  - Pay special attention to any existing database schemas, API endpoints, or component libraries.
  - Note any existing testing strategies, linting rules, or deployment configurations.
  - Understand the current codebase structure and conventions before making changes.

### Dependency Management
- Always check package.json before adding new dependencies.
- Use exact versions (no ^ or ~) for production dependencies.
- Document why each major dependency is added in commit message.
- Run security audit after dependency changes (e.g., `npm audit`).
- Update lock files in the same commit.
- When adding dependencies, verify compatibility with the runtime version specified in tooling context.

### Database Schema Management
- Follow database-specific schema management guidelines from the selected tooling context
- Ensure all schema changes are versioned and tested
- Update type definitions when schema changes occur
- Document breaking changes in migration comments

### Testing Guidelines
- **On file changes:**
    - Run related tests only for all the files has changes during the current iteration. only when use ask to not to test, then skip running tests.
    - If tests fail, document failures, propose fixes, and await permission to apply them if has been repeatedly failed to pass the tests more than 3 times with same issues.

- **For new functionality:**
    - always add relevant unit tests for the added feature for specific files.
    - Confirm with the user before creating test files, if a test file is missing for a specific file.
    - Place new or refactored test files alongside their subject files if a change is applied to existing code or test files.
- **Requirements:**
    - Write unit tests for all business logic.
    - Create regression tests for happy path user flows (follow tooling context for framework-specific setup).
    - Use TDD for complex features.
    - Maintain at least **85%** test coverage for new code.
    - Test edge cases and error scenarios.
    - Mock external dependencies in unit tests.
    - When a test will potentially call an API that will cost money, always ask the user to confirm before running the test, never auto start it:
        - api call to an AI agent
        - api call to a crypto exchange api
        - api call to a stock exchange api
    - Mark expensive tests with a comment tag at the top of the test file (use appropriate comment syntax for your language):
        ```
        // @cost-warning: This test calls OpenAI API
        // @cost-warning: This test executes real trades on exchange
        ```
    - When a task is completed, always build the app, make sure no linting errors and run the tests to ensure the app is working as expected.
     

### Code Quality Standards
- Follow language-specific best practices from selected tooling context (e.g., strict mode, type safety).
- Use consistent naming conventions (follow tooling context guidelines).
- Keep lines under 100 characters.
- Use meaningful, descriptive variable names.
- Use named constants instead of magic numbers.
- Implement proper error handling with clear messages.

### Security Guidelines
- Use environment variables for all credentials, API keys, and secrets.
- Validate and sanitize all user inputs.
- Enforce authentication for protected resources.
- Use parameterized queries to prevent SQL injection.
- Apply the principle of least privilege for database operations.
- Implement rate limiting on API endpoints.


### Performance Guidelines
- Optimize database queries with proper indexing.
- Paginate endpoints that return large datasets.
- Use connection pooling for database operations.
- Implement caching for frequently accessed data.
- Use batch operations to avoid N+1 query problems.
- Profile and optimize CPU-intensive operations.

### Architecture Guidelines
- Use the repository pattern for data access.
- Use dependency injection for better testability.
- Separate business logic from data access and presentation layers.
- Create reusable utilities for common operations.
- Use interfaces for abstraction and testability.
- Document architectural decisions, explaining the "why." under a section of ## 7. Architecture Decisions. and always review it if any change is applied to existing code or added new code may impact the architecture.

### Documentation Standards
- Update README.md when:
  - New environment variables are added
  - Setup steps change
  - New scripts are added to package.json
- Create/update API documentation when endpoints change
- Document complex business logic with inline comments
- Keep app-building-blueprint.md in sync with implementation
- Add JSDoc comments for public functions and complex logic

### Logging Standards
- Add structured logging for:
  - API endpoint entry/exit with timing
  - Database operations (query type, duration)
  - Authentication events
  - Error conditions with context
- Use appropriate log levels (error, warn, info, debug)
- Never log sensitive data (passwords, tokens, PII, API keys)
- Use consistent log format across the application
- Include request IDs for tracing in production

### Conflict Resolution
- When merge conflicts occur:
  1. Analyze both versions carefully
  2. Consult app-building-blueprint.md for intended behavior
  3. Preserve all functionality unless explicitly deprecated
  4. Re-run all affected tests after resolution
  5. Document resolution reasoning in commit message
  6. If conflict is complex, ask user for guidance


---

## App Building Iteration Approach:

0.  **Environment Validation** (Run before starting any development):
    -   Verify environment requirements from selected tooling context (Node.js version, runtime, etc.)
    -   Check all required environment variables are set (check .env.example if exists)
    -   Verify database connection (if applicable) by running a simple query
    -   Ensure git is configured: `git config user.name` and `git config user.email`
    -   Confirm GitHub CLI is authenticated: `gh auth status`
    -   If any validation fails, document the issue and request user intervention

1-a.  **Check for User Input**: Read `app-user-input/current-user-input.md`.
    -   If the file is empty, pause the iteration and wait for new user input.
    -   If there is content, proceed to the next step.

1-b.  **Create the git repository**
    -  according to the user input agent understood, define a proper repo name and attempt to create a repo on github.com for the currently authenticated terminal user. Use --private to keep it ALWAYS private.
    -  if the repo already exists, attach additional utc timestamp number to the back of the repo name and attempt to create a new repo again.
    -  if the repo is successfully created, define remote of the current project to be the newly created repo.
    - make the first commit of the project to the remote repo.
    - push the first commit to the remote repo.

2.  **Understand and Clarify**: Analyze the user input to understand the requirements.
    -   If the input is unclear or incomplete, ask clarifying questions in a bullet-point format in `app-specific-context/app-current-user-todos.md` and instruct the user to respond in `app-user-input/current-user-input.md`. Pause the iteration.
    -   If the input is clear, update `app-specific-context/app-building-blueprint.md` with the new information.

3.  **Blueprint-Driven Task Generation**:
    -   Once `app-specific-context/app-building-blueprint.md` is sufficiently detailed to build a feature, start the development cycle.
    -   **Task Definition**: Break down the features from the blueprint into small, self-contained, and actionable tasks. Each task should represent a single unit of work (e.g., "Create Supabase migration for `donations` table," "Build the `<DonationForm />` component," "Implement the `POST /api/donations` endpoint" NOTE this is only an example, there is nothing about donation in the app, this is just an example).
    -   Add these tasks to `app-specific-context/app-building-tasks.md`.

4.  **Execute Tasks Sequentially**:
    -   For each task in `app-specific-context/app-building-tasks.md`:
        -   **Git Workflow**: Create a new feature branch from `main` (e.g., `git checkout -b feature/task-description`).
        -   Implement the feature, including unit tests and Playwright tests.
        -   **Pre-Commit Checklist**: Before committing, verify:
            - [ ] No debug statements in production code (e.g., console.log, print, etc.)
            - [ ] No commented-out code blocks
            - [ ] All language/compiler errors resolved (follow tooling context)
            - [ ] No unused imports or dependencies
            - [ ] Environment variables not hardcoded
            - [ ] Tests cover new functionality
            - [ ] Commit message follows conventional format
        -   **Success Criteria**: Ensure the task meets all the following conditions:
            1.  Unit tests pass.
            2.  Regression tests pass (follow tooling context for test framework).
            3.  No new linting errors are introduced.
        -   **⚠️ CRITICAL - Build Verification Before Commit**:
            -   Before committing ANY changes, run the build command to verify production build succeeds
            -   If build fails, fix all errors before proceeding
            -   This ensures the app will deploy successfully to production
            -   Refer to tooling context for specific build command (e.g., `npm run build`, `cargo build --release`, etc.)
        -   Once successful, commit the changes with a detailed message and push the feature branch to the remote repository.
        -   (Optional: Create a pull request for review before merging to `main`).

5.  **⚠️ MANDATORY: After Every Push - Follow MANDATORY-AFTER-PUSH.md**
    
    **🛑 STOP! Did you just run `git push`? If YES, you MUST do the following IMMEDIATELY:**
    
    **After EVERY `git push`, you MUST complete these steps before proceeding:**
    
    **See detailed steps in: `_agent-guide/MANDATORY-AFTER-PUSH.md`**
    
    **⚠️ CRITICAL - Step 0 MUST BE DONE FIRST:**
    
    **Step 0: Bump version (NEVER SKIP THIS)**
    - Follow version management from tooling context (e.g., package.json for Node.js, Cargo.toml for Rust, etc.)
    - Read current version using appropriate command from tooling context
    - Use `edit` tool to update the version field:
      - **Patch** (0.2.0 → 0.2.1): Bug fixes, minor changes
      - **Minor** (0.2.0 → 0.3.0): New features, backward compatible
      - **Major** (0.2.0 → 1.0.0): Breaking changes
    - Commit: `git add [version-file] && git commit -m "chore(version): bump version to X.Y.Z" && git push`
    - Refer to tooling context for project-specific version files and auto-bump mechanisms
    
    **Then complete remaining steps:**
    1. Get timestamp: `date +"%Y%m%d-%H%M%S-EST"`
    2. Create history folder: `_agent-guide/app-user-input/history/[TIMESTAMP]/`
    3. Copy: `current-user-input.md` → `history/[TIMESTAMP]/old-user-input.md`
    4. Copy: `current-user-assets/` → `history/[TIMESTAMP]/` (if assets exist)
    5. Clear: `current-user-input.md` (make it empty)
    6. Clear: `current-user-assets/` (remove all files)
    7. Commit and push the archive
    
    **⚠️ DO NOT proceed to next task without completing ALL steps above, starting with Step 0.**
    
    **AI Agent Self-Check After Every Push:**
    ```
    [ ] I just ran git push
    [ ] I bumped version file (per tooling context)
    [ ] I committed and pushed the version bump
    [ ] I got timestamp
    [ ] I created history folder
    [ ] I copied current-user-input.md to history
    [ ] I cleared current-user-input.md
    [ ] I committed and pushed the archive
    [ ] NOW I can proceed to next task
    ```
    
    ---

6.  **Error Handling and Debugging**:
    -   If a task fails to meet the success criteria after two attempts:
        1.  **Log the Issue**: Add a summary of the error and the attempted fixes to `app-specific-context/app-current-task-note.md`.
        2.  **Re-evaluate**: Choose a new approach:
            -   Break the task into smaller, more manageable sub-tasks.
            -   Analyze the existing codebase for conflicts or alternative solutions.
        3.  **Request Help**: If the issue requires user intervention (e.g., a missing secret, an ambiguous requirement), add a clear request to `app-specific-context/app-current-user-todos.md`, instruct the user to provide feedback in `app-user-input/current-user-input.md`, and pause the iteration.
    
    -   **Branch Failure Protocol**: After 3 failed attempts on a feature branch:
        1.  Document the failure in `app-specific-context/app-current-task-note.md`
        2.  Stash or delete the failed branch: `git branch -D feature/branch-name`
        3.  Return to main branch: `git checkout main`
        4.  Re-evaluate the task breakdown in `app-specific-context/app-building-tasks.md`
        5.  Consider alternative implementation approaches
        6.  Request user guidance if the blocker is unclear

7. **Styling Guide**:
    -   As default, always develop the app in light theme to ensure proper default coloring. Unless the user explicitly requests a dark theme, do not use dark theme at all. When user request duo theme, ask user for input on which color scheme to use and ask them to provide a list of colors the app would require according to current app design and add such to `app-specific-context/app-current-user-todos.md`.

8.  **Completion and Feedback**:
    
    **Feature Completion:**
    When all tasks in `app-specific-context/app-building-tasks.md` are completed and merged, pause the iteration and notify the user that the feature is ready for testing. Request feedback for the next cycle.

