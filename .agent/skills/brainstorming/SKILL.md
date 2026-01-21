---
name: brainstorming
description: Use before any creative work to explore user intent, requirements, and design before implementation. Helps turn ideas into fully formed designs through collaborative dialogue.
---

# Brainstorming Ideas Into Designs

## When to use this skill
- When starting a new feature or component
- When the user has a vague idea that needs refinement
- Before writing any code or implementation plans

## Workflow
[ ] Understand the idea (Check context, ask clarifying questions)
[ ] Explore approaches (Propose 2-3 options with trade-offs)
[ ] Present the design (Break into small sections, validate each)
[ ] Documentation (Write validated design to docs)

## Instructions

### 1. Understanding the Idea
- **Check Context First**: Look at current files, docs, and recent work.
- **Ask ONE Question at a time**: Don't overwhelm.
- **Prefer Multiple Choice**: "Should we use A or B?" is better than "How should we do this?"
- **Focus**: Understand purpose, constraints, and success criteria.

### 2. Exploring Approaches
- Always propose **2-3 different approaches**.
- Explain trade-offs for each.
- State your recommendation clearly but be open to feedback.

### 3. Presenting the Design
- **Incremental Validation**: Present the design in chunks of 200-300 words.
- **Check-in**: "Does this look right so far?" after each chunk.
- **Cover**: Architecture, components, data flow, error handling, testing.
- **Be Flexible**: If the user disagrees, pause and clarify.

### 4. Post-Design Actions
- **Document**: Save the valid design to a markdown file (e.g., `docs/designs/YYYY-MM-DD-topic.md`).
- **Transition**: Ask "Ready to set up for implementation?" and suggested moving to the `planning` skill.

## Resources
- [See `planning` skill for next steps](../planning/SKILL.md)
