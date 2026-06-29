---
name: turnover-design-review
description: Reviews and proposes UI/UX for TurnOverCheck — shop dashboard, daily entry forms, billing views, reports. Use for wireframes, component design, accessibility, and mobile-first shop workflows.
---

# TurnOverCheck — Design Review

## Users & devices

- **Shop owners:** Primary mobile users; quick daily entry
- **Admin:** Desktop; bulk onboarding
- **Wholesaler:** Tablet/desktop; read-heavy dashboards

## Design principles

1. **Daily tasks in ≤3 taps** — sales entry, purchase entry, view dashboard
2. **Numbers first** — big KPI cards on dashboard
3. **Wholesaler context clear** — always show supplier name on purchases/bills
4. **Low cognitive load** — minimal fields per screen; progressive disclosure

## Screen inventory (MVP)

| Screen | Role | Priority |
|--------|------|----------|
| Login | All | P0 |
| Admin: shop list + create | Admin | P0 |
| Shop: daily dashboard | Shop | P0 |
| Shop: add purchase (modal/sheet) | Shop | P0 |
| Shop: enter galla | Shop | P0 |
| **Shop: Purchases page** (filters + by-store + all entries) | Shop | P0 |
| Shop: monthly report | Shop | P0 |
| Shop: GST invoice | Shop | P0 |
| Wholesaler: shop list | Wholesaler | P2 |

## Dashboard layout (shop)

```
┌─────────────────────────────┐
│ Purchases │ Galla │ Profit  │
├─────────────────────────────┤
│ Today's purchase rows        │
├─────────────────────────────┤
│ [+ Purchase] [Enter galla]   │
│ Nav: Dashboard · Purchases · Reports
└─────────────────────────────┘
```

## Component library

Use **shadcn/ui + Tailwind**:
- Card for KPIs
- DataTable for bills/products
- Sheet/Dialog for quick entry forms
- DateRangePicker for reports

## Review checklist

- [ ] Mobile breakpoint (320px+) usable
- [ ] Touch targets ≥ 44px
- [ ] Color contrast WCAG AA
- [ ] Error states on forms
- [ ] Empty states (no products, no sales yet)
- [ ] Loading skeletons on dashboard
- [ ] INR formatting consistent

## Output template

```markdown
## Design Review: [Screen/feature]

### User goal
...

### Recommendations
1. ...

### Wireframe (ascii or description)
...

### Accessibility notes
...

### Open questions
...
```

## Wireframe reference

See [wireframes.md](wireframes.md) for bill management and report layouts.
