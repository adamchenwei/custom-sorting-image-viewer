- **Tech Stack**: 
    Node.js 20.10.0 (Daemon Service)
    TypeScript
    Jest (For Unit Testing)
    - Read additional tools context in _agent-guide/app-definations/tools-context folder.

- **Service Architecture**:
    - Long-running process designed to run indefinitely
    - Graceful shutdown handling (SIGTERM, SIGINT signals)
    - Health check endpoint or heartbeat mechanism
    - Automatic restart on failure (via process manager)

- **Process Management**:
    - Development: `npm run dev` (with nodemon or ts-node-dev for auto-reload)
    - Production: Use process manager (PM2, systemd, or Docker)
    - PM2 commands:
        - Start: `pm2 start dist/index.js --name "service-name"`
        - Stop: `pm2 stop service-name`
        - Restart: `pm2 restart service-name`
        - Logs: `pm2 logs service-name`
        - Status: `pm2 status`

- **Environment Validation**:
    - Verify Node.js version matches requirement: `node --version` should show v20.10.0
    - Use nvm if needed: `source ~/.nvm/nvm.sh && nvm use`

- **Version Management**:
    - Version file: `package.json`
    - Read current version: `node -p "require('./package.json').version"`
    - Update version field in package.json using `edit` tool
    - Commit command: `git add package.json && git commit -m "chore(version): bump version to X.Y.Z" && git push`

- **Build Command**:
    - Production build: `npm run build`
    - Development: `npm run dev`
    - Verify build succeeds before committing changes

- **Code Quality Standards**:
    - Use TypeScript strict mode (`noImplicitAny`, `strictNullChecks`)
    - Use camelCase for variables/functions and PascalCase for classes/interfaces
    - Structured logging (use winston, pino, or similar)
    - All TypeScript errors must be resolved before commit
    - No unused imports or variables

- **Daemon-Specific Patterns**:
    - Implement graceful shutdown:
        ```typescript
        process.on('SIGTERM', () => gracefulShutdown());
        process.on('SIGINT', () => gracefulShutdown());
        ```
    - Use async/await with proper error handling
    - Implement retry logic for external service connections
    - Add circuit breaker pattern for fault tolerance
    - Memory leak prevention (avoid unbounded arrays, clear intervals/timeouts)

- **Logging & Monitoring**:
    - Use structured JSON logging for production
    - Log levels: error, warn, info, debug
    - Include correlation IDs for request tracing
    - Log service start, stop, and health status
    - Monitor memory usage and event loop lag

- **Health Checks**:
    - Implement `/health` or `/healthz` endpoint if HTTP-based
    - For non-HTTP services, implement heartbeat file or socket
    - Return service status, uptime, and dependency health

- **Configuration**:
    - Use environment variables for configuration
    - Support `.env` files for local development (dotenv)
    - Validate required environment variables on startup
    - Fail fast if critical configuration is missing

- **Testing**:
    - Unit tests: `npm run test`
    - Test command for CI: `npm run test:ci`
    - Include nvm setup if needed: `source ~/.nvm/nvm.sh && nvm use && npm run test`
    - Test graceful shutdown behavior
    - Mock external dependencies for isolation

- **Docker Support** (if applicable):
    - Use multi-stage builds for smaller images
    - Run as non-root user
    - Handle signals properly (use `exec` form for CMD)
    - Example Dockerfile CMD: `CMD ["node", "dist/index.js"]`
