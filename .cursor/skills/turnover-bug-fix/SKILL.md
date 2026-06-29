---
name: turnover-bug-fix
description: Triages, root-causes, and fixes TurnOverCheck bugs with minimal diffs. Use when QA or tests report defects, production issues, or regression failures in stock, billing, or reports.
---

# TurnOverCheck — Bug Fix

## Triage workflow

```
- [ ] Read bug report (steps, expected, actual, severity)
- [ ] Reproduce locally
- [ ] Identify root cause (not symptom)
- [ ] Implement minimal fix
- [ ] Add regression test
- [ ] Request code review + QA re-test
```

## Severity → SLA

| Severity | Action |
|----------|--------|
| P0 | Stop feature work; fix immediately |
| P1 | Fix before next merge to main |
| P2 | Schedule in current sprint |
| P3 | Backlog |

## Common root causes

| Symptom | Likely cause | Fix area |
|---------|--------------|----------|
| Wrong stock | Missing StockMovement or no transaction | purchases/sales service |
| Wrong outstanding | paid_amount not updated atomically | payments handler |
| Dashboard stale | Cache or missing refetch | frontend query invalidation |
| 403 for valid user | RBAC shop_id mismatch | auth middleware |
| Report totals off | Timezone boundary or float money | report service, use integers |
| Wholesaler sees wrong shop | Missing link filter | wholesaler queries |

## Fix principles

1. **Minimal diff** — fix root cause only
2. **Same transaction** — stock + header + lines together
3. **Regression test** — every P0/P1 bug gets a test
4. **No silent failures** — log and return clear errors

## Bug fix report template

```markdown
## Fix: BUG-XXX

**Root cause:** ...
**Fix:** ...
**Files changed:** ...
**Regression test:** T-XXX-XX
**QA re-test:** [steps]
```

## After fix

1. Run `turnover-test-engineer` suite
2. `turnover-code-review` on fix PR
3. `turnover-qa` re-test original steps

## Escalation

If architectural change needed → hand off to `turnover-architect` with bug context.
