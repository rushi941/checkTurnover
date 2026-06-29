# QA Checklists

## Pre-release gate

- [ ] All P0 user stories (A-01..03, S-01..07, W-01..02, X-01..02) tested
- [ ] No open P0 bugs
- [ ] P1 bugs documented with workaround or fix
- [ ] RBAC spot-check passed
- [ ] Mobile smoke on 375px width
- [ ] Report PDF/Excel opens and totals verified

## Data integrity spot checks

- [ ] Sum of stock movements = displayed stock per product
- [ ] Sum of payments ≤ purchase total per bill
- [ ] Dashboard today = sum of today's transactions

## Security spot checks

- [ ] Cannot access `/api/v1/admin` as shop user
- [ ] Cannot pass another shop_id in URL
- [ ] JWT expired → 401

## Performance (manual)

- [ ] Dashboard with 1000+ transactions loads < 3s
- [ ] Monthly report generates < 10s
