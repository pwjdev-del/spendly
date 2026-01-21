# Systematic Debugging Methodology

A disciplined, step-by-step approach to solving any software defect.

## The 5-Step Framework

### 1. Reproduce (The "Golden Rule")
**Goal:** Consistently trigger the bug.
- **Isolate the environment**: Does it happen on local? Staging? Prod?
- **Minimal Reproduction**: Remove unnecessary variables until you have the smallest set of steps.
- **Automate**: If possible, write a failing test case (TDD fix).

### 2. Diagnose (The "Scientist Phase")
**Goal:** Form a hypothesis and prove it.
- **Read the Logs**: Don't guess. Read the actual stack trace.
- **Binary Search**: Comment out half the code. Does it still break?
- **Check Assumptions**: Verify inputs/outputs at system boundaries (API calls, DB queries).
- **Tooling**: Use breakpoints, not just `console.log`.

### 3. Fix (The "Surgeon Phase")
**Goal:** Implement the solution without side effects.
- **One Change at a Time**: Change one variable, test.
- ** Understand the "Why"**: Don't just paste a StackOverflow fix. Understand *why* it fixes it.
- **Refactor**: Clean up the code structure while you're there (Boy Scout Rule).

### 4. Verify & Regression Test
**Goal:** Ensure the bug is dead and nothing else is broken.
- **Run the Repro**: verification step 1.
- **Run the Suite**: verification step 2 (integration/unit tests).
- **Manual Check**: human verification of the UI/UX.

### 5. Prevent (The "Architect Phase")
**Goal:** Ensure this class of bug never happens again.
- **Add Monitoring**: Log this specific failure mode?
- **Improve Types**: Could TypeScript have caught this?
- **Update Docs**: Warn others of this pitfall.
