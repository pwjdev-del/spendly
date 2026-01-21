---
name: planning
description: Generates comprehensive implementation plans for multi-step tasks. Use this when you have requirements/specs but haven't started coding yet. Ensures detailed, bite-sized tasks for execution.
---

# Planning Implementation

## When to use this skill
- After a design has been agreed upon (e.g., via `brainstorming` skill)
- When you have a clear spec or requirements
- Before writing any code for a complex task

## Workflow
[ ] Create Implementation Plan file (e.g., `docs/plans/YYYY-MM-DD-feature.md`)
[ ] Add standard header with verify instructions
[ ] Break down work into bite-sized tasks (2-5 mins each)
[ ] Review plan with user

## Instructions

### 1. Core Philosophy
- **Assume Zero Context**: Write for a skilled dev who doesn't know the codebase.
- **Bite-Sized Tasks**: Each step should be one atomic action (e.g., "Write failing test", "Make it pass").
- **TDD & YAGNI**: Enforce Test-Driven Development and "You Ain't Gonna Need It".

### 2. Plan Document Structure

**Header:**
```markdown
# [Feature Name] Implementation Plan

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about approach]
**Tech Stack:** [Key technologies/libraries]
```

**Task Format:**
Each task should follow this strict structure:
```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`

**Step 1: Write the failing test**
[Code snippet]

**Step 2: Verify failure**
[Command to run]

**Step 3: Minimal Implementation**
[Code snippet]

**Step 4: Verify pass**
[Command to run]

**Step 5: Commit**
[Git command]
```

### 3. Execution Options
After generating the plan, ask the user how they want to proceed:
1.  **Execute Immediately**: You proceed to implement the plan step-by-step.
2.  **Parallel Execution**: Open a new session to execute the plan while this session remains for oversight.

## Resources
- [See `brainstorming` skill for prior steps](../brainstorming/SKILL.md)
