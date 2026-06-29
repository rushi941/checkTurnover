# Developer Standards

## Naming

| Item | Convention |
|------|------------|
| API routes | kebab-case `/daily-sales` |
| DB tables | snake_case `sale_lines` |
| TS types | PascalCase `PurchaseLine` |
| React components | PascalCase `DailyDashboard.tsx` |

## API response shape

```typescript
// Success list
{ data: T[], meta: { page, limit, total } }

// Success single
{ data: T }

// Error
{ error: string, code?: string }
```

## Shared types location

`packages/shared/src/types/` — import in both web and api.

## Validation example (purchase)

```typescript
{
  wholesalerId: uuid,
  billNo: string,
  date: ISO date,
  lines: [{ productId, qty, rate }],
  paidAmount?: number  // paise
}
```

## Frontend API client

- Centralize in `apps/web/src/lib/api.ts`
- Attach JWT from auth context
- Handle 401 → redirect login
