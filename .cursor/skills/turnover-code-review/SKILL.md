---
name: turnover-code-review
description: Reviews TurnOverCheck code for correctness, security, RBAC, stock integrity, and maintainability. Use when reviewing PRs, commits, or when the user asks for a code review.
---

# TurnOverCheck — Code Review

## Review workflow

1. Read the linked user story or change description
2. Inspect diff for scope creep
3. Run checklist below
4. Output findings by severity

## Severity levels

- 🔴 **Critical** — Must fix (security, data loss, wrong stock/money)
- 🟡 **Suggestion** — Should consider
- 🟢 **Nice to have** — Optional polish

## Critical checks

- [ ] **RBAC:** Shop routes verify shop_id matches JWT
- [ ] **Stock integrity:** Sale/purchase creates StockMovement in same transaction
- [ ] **Money:** Integers for amounts; no `float` math
- [ ] **SQL injection:** Parameterized queries / ORM only
- [ ] **Auth:** No secrets in code; JWT validated on protected routes
- [ ] **Input validation:** All write endpoints validate body
- [ ] **Idempotency:** Payment recording doesn't double-apply

## Domain-specific

| Area | Check |
|------|-------|
| Sales | Stock cannot go negative unless business allows |
| Purchases | Wholesaler must be linked to shop |
| Reports | Turnover formulas match REQUIREMENTS.md |
| Admin | Audit log on create/deactivate |

## Output format

```markdown
## Code Review: [feature/PR title]

### Summary
[1-2 sentences]

### Critical
- [file:line] Issue — suggested fix

### Suggestions
- ...

### What's good
- ...
```

## After review

If critical issues exist → block merge, invoke `turnover-bug-fix` or developer skill.
If clean → suggest `turnover-test-engineer` add tests for gaps.

## Standards reference

[turnover-developer/STANDARDS.md](../turnover-developer/STANDARDS.md)
