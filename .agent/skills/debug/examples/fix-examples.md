# Real-World Debugging Examples

## Example 1: React Stale Closure
**The Bug:** A "Save" button in a `useEffect` interval keeps saving the initial state, ignoring user updates.

**Correct Fix:**
```javascript
// BEFORE (Buggy)
useEffect(() => {
  const timer = setInterval(() => {
    saveData(data); // 'data' is stuck at initial value due to closure
  }, 1000);
  return () => clearInterval(timer);
}, []); // Empty dependency array tells React "never update this effect"

// AFTER (Fixed)
useEffect(() => {
  const timer = setInterval(() => {
    saveData(data); 
  }, 1000);
  return () => clearInterval(timer);
}, [data]); // Effect re-runs when 'data' changes, capturing fresh value
```

## Example 2: Node.js Unhandled Async Error
**The Bug:** Server crashes silently when DB fails, or hangs indefinitely.

**Correct Fix:**
```javascript
// BEFORE (Buggy)
app.get('/user/:id', async (req, res) => {
  const user = await db.findUser(req.params.id); // If this throws, Express 4.x won't catch it!
  res.json(user);
});

// AFTER (Fixed)
app.get('/user/:id', async (req, res, next) => {
  try {
    const user = await db.findUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err); // Pass error to global error handler
  }
});
```

## Example 3: Prisma N+1 Query
**The Bug:** Fetching 100 posts causes 101 DB queries.

**Correct Fix:**
```typescript
// BEFORE (Buggy - N+1)
const posts = await prisma.post.findMany();
for (const post of posts) {
  post.author = await prisma.user.findUnique({ where: { id: post.authorId } });
}

// AFTER (Fixed - 1 Query)
const posts = await prisma.post.findMany({
  include: {
    author: true // Joins data in a single efficient query
  }
});
```
