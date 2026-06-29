# Test Matrix (MVP)

| Story | Test IDs | Type |
|-------|----------|------|
| A-01 | T-A-01-01..03 | integration |
| S-01 | T-S-01-01 | integration |
| S-02 | T-S-02-01..04 | unit + integration + e2e |
| S-03 | T-S-03-01..03 | integration |
| S-04 | T-S-04-01..02 | integration + e2e |
| S-05 | T-S-05-01..02 | unit (formulas) + e2e |
| S-06 | T-S-06-01..02 | integration |
| S-07 | T-S-07-01..02 | integration |
| S-08 | T-S-08-01 | integration |
| W-01 | T-W-01-01 | integration |
| X-01 | T-X-01-01..02 | integration |
| X-02 | T-X-02-01 | integration (isolation) |

## E2E smoke suite (minimum)

1. Admin creates shop → shop logs in
2. Shop adds product → records purchase → records sale
3. Dashboard shows today's totals
4. Record payment on bill → outstanding updates
5. Generate monthly report PDF

## Fixture data

Maintain `apps/api/test/fixtures/`:
- `shop-a.json` — products, linked wholesaler
- `month-june.json` — sales/purchases for report tests
