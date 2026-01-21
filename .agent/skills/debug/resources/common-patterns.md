# Common Bug Patterns & Identification

## React
### 1. Infinite Re-Render Loops
- **Symptom**: App freezes, browser crashes, maximum update depth exceeded error.
- **Cause**: Updating state inside `useEffect` without proper dependencies, or setting state directly in the render body.
- **Fix**: Check `useEffect` dependency array. Remove direct state setters from render.

### 2. Stale Closures
- **Symptom**: `useEffect` or event handler sees old state values.
- **Cause**: Closure capturing variables from a previous render.
- **Fix**: Add missing dependencies to the hook or use a functional state update `setCount(c => c + 1)`.

### 3. "Component is changing a controlled input to be uncontrolled"
- **Symptom**: Console warning on form interaction.
- **Cause**: Input value initializing as `undefined` then switching to a defined value.
- **Fix**: Initialize state with empty string `useState('')` instead of `useState()`.

## Node.js
### 1. Unhandled Promise Rejections
- **Symptom**: Process crashes or silent failures in async code.
- **Cause**: Missing `.catch()` or `try/catch` block.
- **Fix**: Always handle errors (use a global handler or `express-async-errors`).

### 2. Event Loop Blocking
- **Symptom**: Server stops responding to *all* requests during specific operations.
- **Cause**: Heavy synchronous computation (JSON.parse huge files, heavy regex) on the main thread.
- **Fix**: Offload to worker threads or break into chunks with `setImmediate`.

### 3. Memory Leaks
- **Symptom**: RSS memory grows indefinitely until OOM crash.
- **Cause**: Global variables, uncleared intervals, closures holding large objects.
- **Fix**: Use `--inspect` and Chrome DevTools Memory tab to take heap snapshots.

## Databases (SQL/Prisma)
### 1. The N+1 Query Problem
- **Symptom**: Page loads slow; DB CPU spikes; logs show hundreds of simple SELECTs.
- **Cause**: Fetching a list, then looping to fetch related data for *each* item.
- **Fix**: Use `.include()` in Prisma or SQL `JOIN`.

### 2. Connection Pool Exhaustion
- **Symptom**: `TimeoutError: Timed out fetching a new connection`.
- **Cause**: Not releasing connections, or opening a new client for every request.
- **Fix**: Use a singleton DB client instance. Ensure connections are closed/released.
