# Jules CLI: Token Hemostasis & Safety Guidelines

Using Jules' ReAct (Reason + Act) loop can lead to "token explosion" due to
context accumulation. Follow these guidelines to minimize costs and maximize
efficiency.

## 1. The ReAct "Snowball Effect"

Each iteration sends the entire history back to the LLM.

- **Iteration 1:** Request + Thought 1 + Action 1.
- **Iteration 5:** Request + (Thoughts 1-4) + (Actions 1-4) + (Failures 1-4).
- **Result:** Context usage grows exponentially, especially with large logs.

## 2. Operational Safety Rules

### Max Iterations (Limit: 5)

- Never allow Jules to run more than **5 iterations** on a single task.
- If the bug isn't fixed in 5 tries, stop and re-evaluate manually.
- **Rule:** If it's a "silly" fix (missing semicolon), fix it yourself.

### Atomic Tasks

- **Bad:** "Fix all test errors in the project."
- **Good:** "Fix the 401 error in `@tests/performance/terrain-loading.spec.ts`."
- Smaller tasks = Shorter history = Lower cost.

### Context Compression

- Use `/compress` or `caveman:compress` if the session becomes long.
- Summary of progress is better than a 10-turn raw history.

### Log Management

- Do not feed raw trace logs (e.g., Playwright full logs) to Jules.
- Use `.geminiignore` or manually extract only relevant **Error Snippets**.

## 3. When to Stop Jules

1.  **Hallucination Loop:** If Jules repeats the same "fix" that already failed.
2.  **Environment Error:** If the failure is due to missing `.env` or network
    issues that AI cannot fix.
3.  **Logic Complexity:** If the fix requires architectural decisions that
    diverge from the `GEMINI.md` mandates.

---

_Follow these rules to keep the project's token quota healthy._
