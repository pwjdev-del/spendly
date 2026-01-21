# Debugging Tools & Techniques

## 1. Browser DevTools (Chrome/Edge)
- **Elements Panel**: Debug CSS, layout queries, event listeners (`$0`).
- **Network Panel**: Filter XHR/Fetch. Check "Preserve Log" to catch redirect errors. Right-click copy as curl.
- **Sources Panel**: Set breakpoints. "Pause on Exception".
- **React Developer Tools**: Inspect component hierarchy, props, and state. "Highlight updates" to spot re-renders.

## 2. Node.js Debugging
- **Inspector**: Run `node --inspect index.js`. Open `chrome://inspect`. Full DevTools for backend.
- **VS Code**: Use "Auto Attach" or `.vscode/launch.json`. Breakpoints work directly in the editor.
- **Logging**:
    - **Development**: `morgan('dev')` for HTTP request logging.
    - **Production**: structured logging with `winston` or `pino` (JSON format).

## 3. Database & Performance
- **Prisma Studio**: `npx prisma studio` to visualize data.
- **Query Logging**: Enable query logging in dev (`log: ['query']` in PrismaClient).
- **EXPLAIN ANALYZE**: Run raw SQL `EXPLAIN` to see query execution plans and index usage.

## 4. Monitoring (The "Black Box" Recorder)
- **Sentry**: Capture stack traces and user context in production.
- **Tracing**: OpenTelemetry to trace requests across microservices.
