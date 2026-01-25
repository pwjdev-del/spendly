---
name: api-troubleshooting
description: |
  Expert diagnostics and resolution for API, AI integration, and server-side dependency errors. 
  Follows a rigorous "isolate-inspect-resolve" methodology to fix 400/500 errors.
---

# API Troubleshooting Skill

Use this skill when the user encounters:
- **Status 400 (Bad Request)**: "Invalid format", "Cannot identify image", "Missing parameter".
- **Status 500 (Internal Server Error)**: Crashes, timeouts, "Something went wrong".
- **AI API Issues**: OpenAI/Anthropic/Nvidia errors, rate limits, hallucinated formats.
- **Dependency Failures**: "Sharp missing", "Module not found", "Glbc version mismatch" (Common in AWS/Vercel).

## Workflow

### Phase 1: Isolation & Classification
1.  **Identify the Source**:
    - **Client-Side (400)**: The request is malformed (bad JSON, wrong Headers, invalid file type).
    - **Server-Side (500)**: The code crashed (Null pointer, Dependency missing, Database timeout).
    - **Upstream (502/504)**: The 3rd party API (AI provider) is down or rejecting the request.

2.  **Verify Environment**:
    - **Run the Diagnostic Script**: `npx tsx .agent/skills/api-troubleshooting/scripts/diagnose-env.ts`
        - Checks for critical binaries (`sharp`, `python`, `ffmpeg`).
        - Validates environment variables (API Keys present?).
        - Checks node version matches deployment target.

### Phase 2: "Deep Logging" Instrumentation
If the error is vague (e.g., "Image processing failed"), you MUST instrument the code to see the raw data.

1.  **Log Incoming Payloads**:
    ```typescript
    console.log('[Debug] Payload Size:', req.body.length);
    console.log('[Debug] Headers:', JSON.stringify(req.headers));
    ```
2.  **Log Binary/Buffer Details**:
    - **NEVER** log the full buffer.
    - **ALWAYS** log the magic bytes (first 10 hex characters).
    ```typescript
    if (buffer) {
       console.log('[Debug] Buffer Magic Bytes:', buffer.subarray(0, 10).toString('hex'));
    }
    ```
3.  **Log Upstream Requests**:
    - Log exactly what you are sending to the AI API (truncated to safe length).

### Phase 3: Common Fix Patterns

#### Pattern A: "Sharp/Image Processing Failed" (The AWS/Linux Issue)
**Symptoms**: Works locally (Mac/Windows), fails on AWS/Vercel (Linux). Error: "Cannot find module...", "Something went wrong".
**Root Cause**: `sharp` needs platform-specific binaries (`linux-x64`) which aren't installed on your Mac.
**Fix**:
1.  **Relax Validation**: Don't just trust `sharp`. If it fails, fallback to checking `file.type` (MIME type) or simple magic bytes.
    ```typescript
    // RELAXED FALLBACK
    try {
       await sharp(buffer).metadata();
    } catch (e) {
       if (file.type.startsWith('image/')) {
          console.warn("Sharp failed, but trusting MIME type");
       } else {
          throw e;
       }
    }
    ```
2.  **Install Platform Binaries**:
    - Run: `npm install --platform=linux --arch=x64 sharp`
    - Or use `npm ci` in Docker.

#### Pattern B: "AI Returns Invalid JSON"
**Symptoms**: `JSON.parse` fails.
**Fix**:
1.  **Sanitize Output**:
    ```typescript
    const cleanJson = response.replace(/```json|```/g, '').trim();
    ```
2.  **Use "Strict Mode" / Structured Outputs** (if available in API).

#### Pattern C: "Timeouts" (504)
**Symptoms**: Request takes > 30s.
**Fix**:
1.  Increase Vercel/AWS Function timeout.
2.  Verify `await` logic (don't `await` inside a `map` unless intentional, use `Promise.all`).

## User Notification
If you identify an Environment Issue (missing binary, wrong env var), you MUST notify the user clearly:
> "I have detected a missing dependency in your production environment. AWS requires Linux binaries for [Library Name], but you only have macOS binaries. I will run a fix command."
