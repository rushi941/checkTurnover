# Wireframes — Galla + purchase workflow

## Daily dashboard (shop)

```
┌─ Today · 29 Jun 2026 ─────────────────────┐
│  Purchases     Galla        Profit        │
│  ₹12,600      ₹15,800      ₹3,200         │
├───────────────────────────────────────────┤
│ Today's purchases                         │
│  Metro Wholesale          ₹6,500          │
│  Reliance Fresh           ₹4,000          │
│  Local Kirana Depot       ₹2,100          │
│  [+ Add purchase]                         │
├───────────────────────────────────────────┤
│ Tonight's galla                           │
│  ₹15,800  ✓ entered        [Edit galla]   │
│  — or —                                   │
│  [Enter galla amount]  ← evening action   │
└───────────────────────────────────────────┘
```

## Add purchase (quick)

```
Source shop name  [Metro Wholesale    ▼]
Amount (₹)        [6500              ]
Note (optional)   [                  ]
                  [Save]
```

## Enter galla (evening)

```
Date              [29 Jun 2026  today]
Today's galla (₹) [15800             ]
  = total sales in your cash box today
                  [Save galla]
```

## Purchases page (main screen)

```
┌─ Purchases ───────────────────────────────────────────────┐
│  Total purchases (filtered)          ₹2,18,600            │
│  36 entries · 3 stores                                    │
├───────────────────────────────────────────────────────────┤
│ Date      [This month ▼]   Store [All stores ▼]  [Search] │
│ Sort      [Date newest ▼]              [Clear] [Export]   │
├───────────────────────────────────────────────────────────┤
│  [ By store ]  [ All entries ]              [+ Add]       │
├───────────────────────────────────────────────────────────┤
│ BY STORE TAB:                                             │
│  Metro Wholesale      ₹1,85,000    24 entries   → drill   │
│  Reliance Fresh         ₹92,400    12 entries   → drill   │
│  Local Kirana Depot     ₹41,200     8 entries   → drill   │
└───────────────────────────────────────────────────────────┘

ALL ENTRIES TAB:
┌───────────────────────────────────────────────────────────┐
│ 29 Jun   Metro Wholesale        ₹6,500        [Edit][Del] │
│ 29 Jun   Reliance Fresh         ₹4,000        [Edit][Del] │
│ 28 Jun   Metro Wholesale       ₹12,000        [Edit][Del] │
│ ...                                                       │
└───────────────────────────────────────────────────────────┘
```

### Drill-down (tap store row)

```
┌─ Metro Wholesale · June 2026 ─────────────────────────────┐
│  Total from this store:  ₹1,85,000                        │
│  [← Back to all stores]                                   │
├───────────────────────────────────────────────────────────┤
│ 29 Jun   ₹6,500                                           │
│ 28 Jun   ₹12,000                                          │
│ 27 Jun   ₹8,200                                           │
│ ...                                                       │
└───────────────────────────────────────────────────────────┘
```

## Shop navigation (shop owner app)

```
[ Dashboard ]  [ Purchases ]  [ Galla ]  [ Reports ]  [ Invoices ]
     Home         ← this page    Evening    Monthly      GST PDF
```

## GST invoice (separate — when needed)

```
Invoice # INV-2026-0042  (auto)

Line items + amounts entered directly
[Generate PDF]  — no buyer GSTIN required
```
