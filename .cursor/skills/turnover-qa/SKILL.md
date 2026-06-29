---
name: turnover-qa
description: Performs acceptance QA on TurnOverCheck against requirements and user stories. Use for manual validation, release sign-off, regression checks, and UAT scenarios for admin, shop, and wholesaler roles.
---

# TurnOverCheck — QA

## Sources of truth

- [docs/REQUIREMENTS.md](../../docs/REQUIREMENTS.md)
- [docs/USER-STORIES.md](../../docs/USER-STORIES.md)

## QA workflow

```
- [ ] Identify user story IDs in scope
- [ ] Execute manual test script per role
- [ ] Compare actual vs acceptance criteria
- [ ] Log defects (bug template)
- [ ] Sign-off or block release
```

## Acceptance criteria format

Each story passes only if **all** criteria met:

```markdown
### S-04 Daily dashboard
- [ ] Shows today's sales total matching entered sales
- [ ] Shows today's purchases total
- [ ] Shows profit estimate (sales - purchase cost or defined formula)
- [ ] Updates within 5s of new entry without full page reload
- [ ] Low-stock section lists products at/below reorder level
```

## Role-based test scripts

### Admin (15 min)
1. Login as admin
2. Create shop + wholesaler
3. Link wholesaler to shop
4. Verify shop can login; deactivated shop cannot

### Shop owner (30 min)
1. Add 3 products with reorder levels
2. Record purchase from linked wholesaler (2 lines)
3. Record 2 sales
4. Verify dashboard numbers
5. Open wholesaler bills → outstanding correct
6. Record partial payment → status updates
7. Generate monthly report → PDF opens, totals match

### Wholesaler (10 min)
1. Login → see linked shop only
2. View purchase bills from that shop
3. Cannot see unlinked shop data

## Defect report template

```markdown
**ID:** BUG-XXX
**Story:** S-06
**Severity:** P0|P1|P2|P3
**Steps:**
1. ...
**Expected:** ...
**Actual:** ...
**Environment:** browser, date, test account
**Screenshots/logs:** ...
```

## Severity guide

| Level | Definition |
|-------|------------|
| P0 | Data loss, security breach, cannot login, wrong stock/money |
| P1 | Core feature broken (sale, purchase, report) |
| P2 | Workaround exists |
| P3 | Cosmetic / minor |

## Sign-off template

```markdown
## QA Sign-off: [Release/Milestone]

**Stories tested:** S-01..S-07
**Result:** PASS | FAIL
**Open P0/P1:** [count]
**Tester:** Agent QA
**Date:** YYYY-MM-DD
```

## Regression (before release)

Run full scripts above + verify fixed bugs don't recur.

Defects → `turnover-bug-fix` skill.

See [checklists.md](checklists.md) for printable checklists.
