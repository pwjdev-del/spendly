---
name: aws-troubleshooting
description: Performs expert pre-deployment checks and troubleshooting for AWS deployments, specifically focusing on database connectivity and health. Use this when the user intends to "deploy", "upload", or fix AWS issues.
---

# AWS Deployment Troubleshooter

## When to use this skill
- User says "deploy", "upload to AWS", or "going live".
- User encounters "deployment failed" or "database connection error" on AWS.
- User asks to "check the database" before deploying.

## Workflow
1.  **Detect Intent**: User wants to deploy or is having deployment issues.
2.  **Pre-Flight Check**: Run the `pre-deploy-check.ts` script to verify local/environment readiness.
    - Check for `DATABASE_URL`.
    - Validate Prisma schema.
    - Verify actual database connectivity.
3.  **Analyze Results**:
    - **Pass**: Proceed with the user's requested deployment command (e.g., `git push`, `eb deploy`, `zip upload`).
    - **Fail**: Stop! Do not deploy. Analyze the error output and propose fixes (e.g., correct env vars, run migrations).

## Instructions

### 1. Run Pre-Deployment Check
Before ANY deployment command, run this script to ensure the database is accessible and the schema is valid.

```bash
npx tsx .agent/skills/aws-troubleshooting/scripts/pre-deploy-check.ts
```

### 2. Common Fixes

**Issue: `PrismaClientInitializationError` / Connection refused**
- Check if the allowed IP address for the database includes the deployment environment (or current machine).
- Verify `DATABASE_URL` format.

**Issue: Schema Validation Error**
- Run `npx prisma generate` to refresh the client.
- Fix syntax errors in `schema.prisma`.

**Issue: Pending Migrations**
- If the check warns about migrations, ASK the user before running `npx prisma migrate deploy`.

## Resources
- [pre-deploy-check.ts](scripts/pre-deploy-check.ts)
