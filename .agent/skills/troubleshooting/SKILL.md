---
name: troubleshooting
description: Systematically debugs and resolves application issues using a rigorous 6-step process (Error Assessment, Prediction, Investigation, Root Cause, Fix). Use when the user reports a bug, error, or unexpected behavior.
---

# Troubleshooting & Debugging

## When to use this skill
- When the user reports a bug, crash, or error message
- When an application is behaving unexpectedly
- When resolving build or compilation errors
- To harden code using robust error handling patterns

## Workflow
[ ] **Step 1: Error Assessment** (Restate error, summarize task, check for red flags)
[ ] **Step 2: Prediction Generation** (Generate 3-7 plausible root causes)
[ ] **Step 3: Code Investigation** (Scan code for evidence confirming/denying predictions)
[ ] **Step 4: Prediction Narrowing** (Converge on 1-2 most likely causes)
[ ] **Step 5: Root Cause Identification** (Pinpoint problematic code and explain why)
[ ] **Step 6: Debugging & Fixing** (Apply fix, verify, and improve error handling)

## Instructions

### 1. Error Assessment
- **Restate the ERROR** in your own words.
- **Summarize** what the user was trying to do.
- **Identify Red Flags** in the provided code immediately.

### 2. Prediction Generation
- Brainstorm **3-7 potential causes**.
- Base these on the stack trace, error message, and common failure modes (e.g., null pointers, network issues, race conditions).

### 3. Investigation & Narrowing
- **Systematically test** each prediction against the code.
- **Rule out** causes with evidence (e.g., "Can't be network because the error is a ReferenceError").
- **Converge** on the single most likely root cause.

### 4. Fixing the Issue
- **Apply the Fix**: Provide exact code changes.
- **Verify**: precise steps to confirm the fix works.
- **Harden**: Consult the **Error Handling Patterns** resource to prevent recurrence.

## Resources
- [Error Handling Patterns](resources/error-handling-patterns.md) - Best practices for writing resilient code and better error messages.
