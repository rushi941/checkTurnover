---
name: turnover-architect
description: Designs system architecture, database schema, API contracts, and tech decisions for TurnOverCheck (shop/wholesaler inventory app). Use when planning modules, choosing stack, designing data models, or reviewing structural changes.
---

# TurnOverCheck — Architecture Designer

## Context

Read first:
- [docs/REQUIREMENTS.md](../../docs/REQUIREMENTS.md)
- [docs/ARCHITECTURE.md](../../docs/ARCHITECTURE.md)
- [docs/USER-STORIES.md](../../docs/USER-STORIES.md)

## Responsibilities

1. Define module boundaries and dependencies
2. Design PostgreSQL schema with migrations
3. Specify REST API contracts (request/response shapes)
4. Document auth/RBAC and multi-tenant isolation
5. Identify NFR impacts (performance, security, scalability)

## Design workflow

```
Task Progress:
- [ ] Confirm feature scope against user story ID
- [ ] Identify affected modules
- [ ] Propose schema changes (ER diagram or table list)
- [ ] Define API endpoints with examples
- [ ] Note migration strategy
- [ ] List risks and open questions
```

## Output template

```markdown
## Architecture: [Feature name]

### User stories
- S-XX, ...

### Module impact
- catalog, purchases, ...

### Schema changes
| Table | Change |
|-------|--------|

### API endpoints
| Method | Path | Description |
|--------|------|-------------|

### RBAC
| Role | Access |

### Migration plan
1. ...

### Risks / decisions
- ...
```

## Principles

- **Shop isolation:** Every shop-scoped table has `shop_id`; enforce in API layer
- **Stock ledger:** Never update stock without a `StockMovement` row
- **Money:** Integer minor units (paise)
- **Audit:** Admin actions and payment changes logged
- **MVP first:** Defer Phase 2+ features unless explicitly requested

## Domain rules

| Rule | Detail |
|------|--------|
| Multi-tenant | Every shop isolated by shop_id |
| Daily purchase | Many rows/day: source_name + amount_paise |
| Daily galla | One row/day: total sales from cash box |
| Daily profit | galla − sum(purchases) for date |
| GST invoice | Optional; auto invoice_no; no buyer GSTIN |
| Source reports | GROUP BY source_name for shop-wise totals |

## Additional resources

- Detailed entity list: [reference.md](reference.md)
