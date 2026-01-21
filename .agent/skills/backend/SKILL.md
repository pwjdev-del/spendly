---
name: backend
description: Research best practices for modern backend technologies, architectural patterns, performance optimization, and market competitive analysis. Use this to design scalable systems and identify feature opportunities.
---

# Research & Backend Optimization

## When to use this skill
- When designing a new backend system or microservice.
- When optimizing an existing API for performance or security.
- When you need to understand the current "State of the Art" (2026 standards).
- When analyzing competitors and identifying market gaps for a product.

## Workflow
[ ] **Step 1: Architecture Check** - Consult [Architecture Trends](resources/architecture-trends.md) to choose the right pattern (Monolith vs. Serverless vs. Agentic).
[ ] **Step 2: Optimize** - Apply [Performance & Security](resources/performance-security.md) best practices.
[ ] **Step 3: Analyze Market** - Use [Market Analysis](resources/market-analysis.md) to validate features and find gaps.
[ ] **Step 4: Implementation** - (Hand off to `planning` or `frontend` skills for execution).

## Resources
- 👉 **[Architecture & Trends (2026)](resources/architecture-trends.md)** (Microservices, Edge, Vector DBs)
- 👉 **[Performance & Security](resources/performance-security.md)** (Caching, OWASP for AI, Zero Trust)
- 👉 **[Market Analysis](resources/market-analysis.md)** (Gap Analysis, JTBD, SWOT)

## Quick Tips
- **Performance**: Always fix the N+1 query problem first.
- **Security**: Never trust LLM output. Sanitize everything.
- **Architecture**: Start with a Modular Monolith; don't over-engineer microservices early.
