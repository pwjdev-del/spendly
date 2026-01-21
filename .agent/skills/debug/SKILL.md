---
name: debug
description: Debugging & Problem-Solving Master. Provides a systematic framework for debugging React, Node.js, and Database issues. Includes methodology, patterns, tools, and real-world examples.
---

# Debugging & Problem-Solving Master

## When to use this skill
- When you are stuck on a difficult bug in a web stack (React/Node/DB).
- When you need a structured approach ("I don't know where to start").
- When identifying common patterns like memory leaks, re-renders, or slow queries.

## Workflow
[ ] **Step 1: Consult Framework** - Use the [Methodology](resources/methodology.md) to structure your approach.
[ ] **Step 2: Check Patterns** - Look for [Common Patterns](resources/common-patterns.md) matching your symptoms.
[ ] **Step 3: Tooling** - Select the right [Tool](resources/tools-techniques.md) (Inspector, DevTools, Logging).
[ ] **Step 4: Check Examples** - See [Real Fixes](examples/fix-examples.md) for inspiration.

## Resources
- 👉 **[Systematic Methodology](resources/methodology.md)** (Reproduce -> Diagnose -> Fix)
- 👉 **[Common Bug Patterns](resources/common-patterns.md)** (React loops, Node leaks, DB bottlenecks)
- 👉 **[Tools & Techniques](resources/tools-techniques.md)** (DevTools, breakpoints, logging)
- 👉 **[Real Code Examples](examples/fix-examples.md)** (Before/After scenarios)

## Quick Tips
- **React**: Is it a stale closure? Check your dependency arrays.
- **Node**: Is the process crashing? Check unhandled promise rejections.
- **Database**: Is it slow? Check for N+1 queries.
