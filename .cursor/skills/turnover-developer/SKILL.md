---
name: turnover-developer
description: Implements TurnOverCheck features — React frontend, Node API, PostgreSQL, auth, sales, purchases, reports. Use when building features, fixing implementation gaps, or scaffolding the monorepo.
---

# TurnOverCheck — Developer

## Context

- Requirements: [docs/REQUIREMENTS.md](../../docs/REQUIREMENTS.md)
- Architecture: [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- Project rules: [.cursor/rules/turnover-project.mdc](../../rules/turnover-project.mdc)

## Implementation workflow

```
- [ ] Read user story ID and acceptance criteria
- [ ] Check architect API/schema spec (or propose minimal spec)
- [ ] Implement backend: migration → model → route → validation
- [ ] Implement frontend: page → components → API client
- [ ] Manual smoke test happy path
- [ ] Hand off to code-review skill
```

## Backend checklist

- [ ] Zod/class-validator on request bodies
- [ ] RBAC middleware on all routes
- [ ] Shop_id from JWT, never from client body alone (multi-tenant isolation)
- [ ] Transactions for sale/purchase (header + lines + stock movements)
- [ ] Consistent error responses

## Frontend checklist

- [ ] Role-based navigation (admin / shop / wholesaler layouts)
- [ ] Loading and error states
- [ ] Mobile-responsive forms (shop owners use phones)
- [ ] Date pickers for daily/monthly filters
- [ ] Currency formatted as INR (₹)

## Key flows to implement correctly

### Daily purchase (multiple per day)
1. User enters `source_name` + `amount` (₹)
2. Optional: save to PurchaseSource for autocomplete
3. Dashboard sums all rows for date

### Daily galla (one per day, evening)
1. User enters single `amount` = whole day sales from galla
2. Upsert DailyGalla — UNIQUE(shop_id, date)
3. Profit = galla − sum(purchases) for date

### Purchases page (frontend)
- Route: `/purchases`
- Header: grand total from API `/purchases/summary`
- Tabs: `By store` | `All entries`
- Filters sync to URL query params
- Store drill-down: filter `source=` to one store name

### GST invoice (optional, separate from galla)
1. Direct line amounts; auto invoice_no from InvoiceSequence
2. Generate PDF; no mandatory buyer GSTIN

## Stack commands (after scaffold)

```bash
# API
cd apps/api && npm run dev

# Web
cd apps/web && npm run dev

# Migrations
cd apps/api && npm run migrate
```

## Do not

- Use floating point for money
- Skip stock movement on sale/purchase
- Expose other shops' data

## Standards

See [STANDARDS.md](STANDARDS.md) for naming and patterns.
