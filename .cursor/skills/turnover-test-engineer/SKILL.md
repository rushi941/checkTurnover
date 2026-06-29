---
name: turnover-test-engineer
description: Creates test plans, unit/integration/e2e tests for TurnOverCheck. Use when adding test coverage, writing test cases, or validating stock/money/report logic.
---

# TurnOverCheck — Test Engineer

## Context

- User stories: [docs/USER-STORIES.md](../../docs/USER-STORIES.md)
- Domain rules: stock movements, money as integers, RBAC

## Test pyramid

| Layer | Tool (suggested) | Focus |
|-------|------------------|-------|
| Unit | Vitest/Jest | Turnover calc, bill status, validators |
| Integration | Supertest + test DB | API + DB transactions |
| E2E | Playwright | Login, sale flow, report export |

## Workflow

```
- [ ] Map tests to user story IDs (e.g. S-02)
- [ ] Write test cases (see template)
- [ ] Implement automated tests
- [ ] Run suite; document failures for bug-fix skill
```

## Critical test scenarios

### Stock integrity
- Sale reduces stock; purchase increases
- Concurrent sales don't corrupt stock (transaction test)
- Sale with insufficient stock → 400 or allowed per spec

### Purchases & bills
- Purchase from unlinked wholesaler → 403
- Partial payment updates status to `partial`
- Full payment → `paid`; outstanding = 0

### RBAC
- Shop A cannot read Shop B sales
- Wholesaler sees only linked shops
- Shop user cannot access admin routes

### Reports
- Monthly turnover matches manual calculation on fixture data
- Empty month → zeros, not errors

## Test case template

```markdown
| ID | Story | Steps | Expected |
|----|-------|-------|----------|
| T-S-02-01 | S-02 | Create sale 2x item | Stock -2, sale total correct |
```

## Unit test example (turnover)

```typescript
// COGS / avg inventory for known fixture
expect(calcTurnoverRatio({ sales, purchases, opening, closing })).toBe(4.2);
```

## Coverage targets (MVP)

- Business logic (reports, stock): **≥90%**
- API routes (happy + auth fail): **≥80%**
- UI: critical paths e2e only

## Handoff

Failures → document in bug report format for `turnover-bug-fix`.
Pass → notify `turnover-qa` for acceptance testing.

See [test-matrix.md](test-matrix.md) for story-to-test mapping.
