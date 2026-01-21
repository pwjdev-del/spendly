# Error Handling Patterns

Build resilient applications with robust error handling strategies that gracefully handle failures and provide excellent debugging experiences.

## Core Concepts

### 1. Error Handling Philosophies
- **Exceptions**: Use for unexpected errors or exceptional conditions (traditional try-catch).
- **Result Types**: Use for expected errors and validation failures (functional approach, explicit success/failure).
- **Panics/Crashes**: Reserved for unrecoverable errors or programming bugs.

### 2. Error Categories
- **Recoverable Errors**: Network timeouts, missing files, invalid user input, API rate limits.
- **Unrecoverable Errors**: Out of memory, stack overflow, programming bugs.

## Language-Specific Patterns

### TypeScript/JavaScript

**Custom Error Classes:**
```typescript
class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
```

**Result Type Pattern:**
```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function Ok<T>(value: T): Result<T, never> { return { ok: true, value }; }
function Err<E>(error: E): Result<never, E> { return { ok: false, error }; }
```

### Python

**Custom Exception Hierarchy:**
```python
class ApplicationError(Exception):
    def __init__(self, message: str, code: str = None, details: dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}
```

**Retry with Exponential Backoff:**
```python
def retry(max_attempts=3, backoff_factor=2.0):
    # Implementation details in full guide...
```

## Universal Patterns

### 1. Circuit Breaker
Prevent cascading failures in distributed systems by stopping requests to failing services.

### 2. Error Aggregation
Collect multiple errors (e.g., form validation) instead of failing on the first one.

### 3. Graceful Degradation
Provide fallback functionality when errors occur (e.g., use cache if DB fails).

## Best Practices
- **Fail Fast**: Validate input early.
- **Preserve Context**: Include stack traces and metadata.
- **Meaningful Messages**: Explain what happened and how to fix it.
- **Clean Up**: Use try-finally or context managers.
- **Don't Swallow Errors**: Log or re-throw, don't ignore.
