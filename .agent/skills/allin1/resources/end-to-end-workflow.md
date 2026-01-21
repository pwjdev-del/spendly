# End-to-End Workflow: The Full Stack Loop

This workflow covers the entire lifecycle of a request, ensuring consistency from pixel to database.

## The Flow: User → API → Backend → Database

### 1. User Layer (Frontend)
**Responsibility**: Capture Intent & Display State.
- **Reference**: Use `frontend` skill for components and aesthetics.
- **Key Task**: Validate inputs *before* sending.
- **Best Practice**: Optimistic UI (update state immediately, revert on failure).

### 2. Communication Layer (API)
**Responsibility**: Transport & Contract.
- **Format**: JSON (REST) or gRPC/tRPC.
- **Validation**: Zod/Yup schemas shared between Frontend and Backend.
- **Security Check**: Rate limiting and JWT verification happen here.

### 3. Logic Layer (Backend)
**Responsibility**: Business Rules & Orchestration.
- **Reference**: Use `backend` skill for architecture.
- **Services**:
    - *Core Logic*: Processes the data.
    - *Integrations*: Talks to External Services (Stripe, SendGrid).
- **Error Handling**: Never leak full stack traces to the API layer.

### 4. Storage Layer (Database)
**Responsibility**: Persistence & Integrity.
- **Pattern**: ACID transactions for critical writes.
- **Optimization**: Index foreign keys used in joins.

### 5. External Services (The "Side Effects")
**Responsibility**: Third-party capabilities.
- **Examples**: Payments (Stripe), Email (Resend), Push (OneSignal).
- **Critical Pattern**: **Idempotency**. Ensure that retrying a failed payment request doesn't charge the user twice. Use Webhooks to listen for async status updates.
