---
name: allin1
description: Orchestrates the comprehensive full-stack development lifecycle. Connects Frontend, API, Backend, Database, and External Services into a cohesive workflow. Use for end-to-end feature implementation.
---

# All-in-One Full Stack Development

## When to use this skill
- When implementing a complete feature that touches every layer of the stack.
- When you need to understand the data flow from User to Database.
- To ensure tight integration between Frontend components and Backend logic.
- For architectural guidance on connecting External Services (Payments, Email).

## Workflow

### 1. The Full Stack Loop
Follow the data flow:
1.  **User (Frontend)**: Capture intent using `frontend` skill components.
2.  **API (Communication)**: Validate payload using shared types.
3.  **Backend (Logic)**: Process rules using `backend` skill architecture.
4.  **Database (Storage)**: Persist safely.
5.  **External Services**: Handle side-effects (Async/Queues).

### 2. Integration Checkpoints
[ ] **Contract First**: Define the API types/Interface before coding.
[ ] **Database Schema**: Ensure efficient models (check Indexes).
[ ] **Error Handling**: Ensure Backend errors map to Frontend toast notifications.
[ ] **Loading States**: Handle network latency gracefully in the UI.

## Resources
- 👉 **[End-to-End Workflow](resources/end-to-end-workflow.md)** (The detailed flow map)
- 👉 **[Integration Patterns](resources/integration-patterns.md)** (Type sharing, Facades, Queues)
- 👉 **[Frontend Skill](../frontend/SKILL.md)** (For UI/UX)
- 👉 **[Backend Skill](../backend/SKILL.md)** (For Architecture/Security)
- 👉 **[Debug Skill](../debug/SKILL.md)** (When integrations break)
