# Performance & Security Optimization

Building fast is good. Building fast and secure is non-negotiable.

## 1. Performance Optimization Techniques

### Application Level
- **Caching Stratagems**:
    - *L1*: In-memory (Redis/Memcached) for hot data.
    - *L2*: CDN caching (Stale-While-Revalidate pattern).
    - *L3*: Database read replicas.
- **Database Tuning**:
    - **Indexing**: The #1 fix. Use `EXPLAIN ANALYZE`.
    - **Connection Pooling**: Don't open/close connections per request (use PgBouncer or equivalent).
    - **N+1 Prevention**: Use batching (DataLoader) or eager loading.

### Infrastructure Level
- **Auto-Scaling Policies**: Scale based on *request depth* or *queue lag*, not just CPU.
- **Global Distribution**: Replicate data to regions closest to users.

### Measuring Success (Metrics)
- **P99 Latency**: The metric that actually matters for user experience.
- **Throughput**: Requests per second (RPS).
- **Error Rates**: Should be < 0.01%.

## 2. Security Best Practices (2026 Standards)

### OWASP Top 10 for Agentic AI
1.  **Prompt Injection**: Validate and sanitize all LLM inputs.
2.  **Insecure Output Handling**: Treat LLM output as untrusted user input (XSS risk).
3.  **Data Poisoning**: Verify source integrity of RAG data.

### API Security
- **Zero Trust**: "Verify explicitly, use least privilege, assume breach."
- **Rate Limiting**: Implementation at the edge (DDoS protection) and application level (API quotas).
- **Broken Object Level Authorization (BOLA)**: The most common API vuln. *Always* check ownership of the resource ID in the URL.

### Data Protection
- **Encryption at Rest & In-Transit**: Mandatory.
- **Secrets Management**: No `.env` files in production. Use Vault, AWS Secrets Manager, or Doppler.
