# Integration Patterns

How to connect the layers without creating a spaghetti mess.

## 1. Type Sharing (The "Golden Thread")
Don't write types twice.
- **Monorepo**: Export Typescript interfaces from a shared `packages/types` workspace.
- **tRPC**: Infer types directly from the backend router on the frontend client.

## 2. API Facade Pattern
Don't call the DB directly from a clean API route.
- **Bad**: Controller -> `db.find()`
- **Good**: Controller -> `UserService.findById()` -> `UserRepository.find()` -> DB
- **Why**: Allows you to swap the DB or add caching logic in the Service layer without breaking the API contract.

## 3. Async Integration (Queues)
For External Services (Email, Notifications), do NOT wait for them to finish in the main request loop.
- **Pattern**:
    1.  User clicks "Register".
    2.  Backend saves User to DB.
    3.  Backend adds "Send Welcome Email" job to Queue (BullMQ/Redis).
    4.  Backend returns `200 OK`.
    5.  Worker processes Queue and calls SendGrid.
- **Benefit**: Fast UI response, fault tolerance if email provider is down.

## 4. Centralized Error Handling
One catch block to rule them all.
- Middleware in Express/Next.js that catches `AppError` and formats it consistently:
  ```json
  {
    "success": false,
    "error": {
      "code": "PAYMENT_FAILED",
      "message": "Card declined",
      "requestId": "req_123"
    }
  }
  ```
