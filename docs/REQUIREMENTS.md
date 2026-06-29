# TurnOverCheck — Product Requirements Document

> Shop & wholesaler inventory, sales, purchase, billing, and turnover analytics platform.

**Version:** 1.2  
**Last updated:** 2026-06-29  
**Status:** Approved — galla + multi-source purchase workflow

---

## 1. Vision

TurnOverCheck helps **shop owners** (kirana and general retail) check daily **turnover**: during the day they record **purchases from multiple shops** (shop name + amount), and at **night they enter one total — the galla** (whole day’s sales collection). The app shows daily profit, shop-wise purchase history, and monthly reports. **Admins** onboard businesses on a multi-tenant platform. **Wholesalers** can be linked as named purchase sources.

### Confirmed product decisions

| Decision | Choice |
|----------|--------|
| **Deployment** | **Multi-business SaaS** — many shops on one platform, strict data isolation |
| **Target users** | **Kirana + general retail** |
| **Daily purchase entry** | **Multiple entries per day** — each row: **source shop name + purchase amount** (e.g. bought from 5 shops → 5 rows) |
| **Daily sales entry** | **One galla total per day** (evening) — total sales amount from cash box / whole day collection; **not** item-by-item during the day |
| **GST invoices** | **Yes** — optional GST PDF when needed; **auto invoice number** per shop |
| **Buyer GSTIN** | **No** — not mandatory on invoices |
| **Multi-branch owner** | **No** — one login = one shop/business |
| **Amount entry** | **Direct** — user types purchase value and galla total; no item catalog required for core flow |

---

## 2. User Roles

| Role | Description | Primary goals |
|------|-------------|---------------|
| **Admin** | Platform operator (multi-business) | Create/manage many shops & wholesalers, system config, platform reports |
| **Shop Owner** | Kirana / general retail operator | Direct sale/purchase amounts, GST invoices, dashboard, bills, monthly reports |
| **Wholesaler** | Supplier/distributor | View shop orders, supply catalog, payment tracking |

---

## 3. Core Features (from your idea)

### 3.1 Admin

- [ ] Register and activate **Shop** accounts (name, address, GST, contact, login)
- [ ] Register and activate **Wholesaler** accounts
- [ ] Link shops to wholesalers (many-to-many)
- [ ] Deactivate/suspend accounts
- [ ] Platform-wide dashboard: total shops, active users, aggregate turnover
- [ ] Audit log of admin actions

### 3.2 Shop Owner — Daily Operations (core workflow)

#### Morning / day — purchases from multiple shops

- [ ] **Add purchase entries** — for each source: **shop/supplier name + purchase amount** (₹)
- [ ] **Multiple rows per day** — e.g. Mall Shop A ₹5,000, Shop B ₹3,200, Shop C ₹1,800 …
- [ ] **Saved source names** — quick pick from previously used shop names (optional autocomplete)
- [ ] **Edit/delete** today’s purchase rows before day is closed

#### Evening / night — galla (today’s total sales)

- [ ] **One galla entry per day** — single amount = **whole day’s sales** from galla (cash box / total collection)
- [ ] **Cannot duplicate** galla for same date (edit if wrong)
- [ ] Optional note (e.g. “mostly cash”, “Sunday rush”)

#### Daily dashboard (auto-calculated)

- [ ] **Today’s total purchases** = sum of all purchase rows today
- [ ] **Today’s galla sales** = evening entry
- [ ] **Today’s profit** = galla − total purchases
- [ ] **Purchase breakdown** — list each source shop name + amount today
- [ ] **Quick actions** — [+ Add purchase] [Enter tonight’s galla]

#### GST invoice (when needed — separate from galla)

- [ ] **GST sales invoice PDF** — for formal billing; amounts entered directly
- [ ] **Auto invoice number** per shop (e.g. `INV-2026-0001`)
- [ ] No mandatory buyer GSTIN
- [ ] Optional HSN / tax split; grand total entered directly

#### Phase 2 (not required for core turnover check)

- [ ] Item-level catalog, qty, stock tracking
- [ ] Low-stock alerts

### 3.3 Purchases page (dedicated screen — P0)

Main navigation item: **Purchases** — full history and totals with filters.

#### Summary header (always visible)

- [ ] **Grand total purchases** for current filter selection (big number at top)
- [ ] **Entry count** — how many purchase rows match filters
- [ ] **Source count** — how many different stores in result

#### Filters

| Filter | Options |
|--------|---------|
| **Date range** | Today, This week, This month, Custom from–to |
| **Store / source** | All stores, or pick one (dropdown of saved source names) |
| **Search** | Type store name (partial match) |
| **Sort** | Date (newest first), Amount (high–low), Store name (A–Z) |

#### Two view tabs on same page

**Tab 1 — By store (summary)**  
Grouped list — answers “from which store, how much total?”

| Store name | Total purchased | # of entries | Last purchase |
|------------|-----------------|--------------|---------------|
| Metro Wholesale | ₹1,85,000 | 24 | 28 Jun |
| Reliance Fresh | ₹92,400 | 12 | 29 Jun |

- Tap a store row → drill down to all entries for that store (within date filter)

**Tab 2 — All entries (detail)**  
Flat list of every purchase row:

| Date | Store name | Amount | Note |
|------|------------|--------|------|
| 29 Jun | Metro Wholesale | ₹6,500 | — |
| 29 Jun | Reliance Fresh | ₹4,000 | — |

- [ ] **Edit / delete** from detail list (same day or any date per policy)
- [ ] **[+ Add purchase]** button on this page too

#### Actions

- [ ] **Export** filtered results to Excel/PDF
- [ ] **Clear filters** one tap
- [ ] Filters persist in URL (shareable / back button works)

### 3.4 Shop Owner — Reports & Analytics

- [ ] **Daily statistics** — on Dashboard: galla, purchases, profit
- [ ] **Monthly report** — day-wise galla vs purchases, monthly profit; export PDF/Excel
- [ ] Purchases page covers shop-wise totals (section 3.3); Reports page focuses on galla + profit trends

### 3.5 Wholesaler

- [ ] View linked shops and their purchase orders/bills
- [ ] Product catalog (items they supply, rates)
- [ ] Payment received / pending summary per shop
- [ ] Optional: confirm/dispatch orders (Phase 2)

---

## 4. Additional Features (industry research — recommended)

Sources: retail inventory best practices, Indian shop billing apps (GST POS), wholesale ERP guides.

### 4.1 Must-have (Phase 1)

| Feature | Why |
|---------|-----|
| Multi-row daily purchase (shop name + amount) | Matches real workflow — buy from many shops in a day |
| Single daily galla entry | End-of-day total sales from cash box |
| Daily profit dashboard | Core “turnover check” — sales vs purchase |
| Purchases page with filters | One screen: total + filter by store/date + grouped & detail views |
| GST invoice PDF + auto invoice number | Compliance when formal bill needed |
| Mobile-responsive UI | Phone entry morning & night |
| RBAC + multi-tenant isolation | SaaS security |
| Saved purchase source names | Faster re-entry of same shop names |

### 4.2 Should-have (Phase 2)

| Feature | Why |
|---------|-----|
| Barcode/QR scan for items | Faster billing and stock in |
| Sales & purchase returns | Returns are major source of inventory drift |
| Expense tracking | True profit calculation |
| WhatsApp/SMS bill share | Common in Indian retail |
| Multi-branch shops | One owner, multiple locations |
| Reorder suggestions (min stock rules) | Automated replenishment hints |
| Top products / dead stock reports | Data-driven purchasing |
| Export for accountant (Tally-friendly CSV) | Month-end close |

### 4.3 Nice-to-have (Phase 3)

| Feature | Why |
|---------|-----|
| Demand forecasting (ML) | Predict seasonal demand |
| Inter-shop stock transfer | Multi-location optimization |
| Batch/expiry tracking (FMCG/pharmacy) | Compliance and FEFO picking |
| Embedded payments / UPI integration | Faster collections |
| Admin analytics across all shops | SaaS operator insights |
| Offline mode with sync | Unreliable connectivity in shops |

---

## 5. Key Metrics & Formulas

| Metric | Formula | Use |
|--------|---------|-----|
| **Daily profit** | Galla sales − Sum(purchase amounts) for that day | Turnover check |
| **Monthly profit** | Sum(galla) − Sum(purchases) for month | Monthly report |
| **Source shop total** | Sum(purchase amounts) grouped by source name | Shop-wise bill view |
| **Turnover ratio (simple)** | Monthly sales ÷ monthly purchases | Higher = more markup/efficiency |

---

## 6. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Security** | JWT auth, password hashing, **multi-tenant shop data isolation** (no cross-business access) |
| **Tenancy** | One platform, many independent businesses; each shop is an isolated tenant |
| **Performance** | Dashboard loads < 2s for 10k transactions/month |
| **Availability** | 99.5% uptime target |
| **Data** | Daily backup; soft-delete for transactions |
| **Compliance** | GST invoice fields; audit logs |
| **Localization** | English + Hindi (Phase 2); INR currency |

---

## 7. User Flows (summary)

```
Admin creates Shop account → shop owner logs in

DAY (morning / afternoon):
  Shop owner adds purchase rows:
    Shop A → ₹5,000
    Shop B → ₹3,200
    Shop C → ₹1,800
  Dashboard shows running total purchases

NIGHT (evening):
  Shop owner enters galla → today’s total sales ₹12,500
  Dashboard shows: Purchases ₹10,000 | Galla ₹12,500 | Profit ₹2,500

ANYTIME:
  View shop-wise purchase history (grouped by source name)
  Generate monthly report PDF/Excel
  Optional: create GST invoice with auto invoice number

Wholesaler (optional): sees linked shop’s purchase totals if admin linked them
```

---

## 8. Out of Scope (v1)

- Full accounting / GST return filing
- E-commerce / online marketplace sync
- Manufacturing / BOM
- Native mobile apps (responsive web first)

---

## 9. Success Criteria

1. Shop owner can add 5 purchase rows (shop name + amount) in under 2 minutes
2. Shop owner can enter one galla total at night in under 30 seconds
3. Dashboard shows correct profit (galla − purchases) immediately
4. Shop-wise report shows correct totals per source name
5. **Purchases page** filters by store/date and shows correct grand total
6. GST invoice gets auto incrementing invoice number per shop
7. Admin can onboard a new shop in under 2 minutes

---

## 10. Product decisions (locked)

| Question | Decision |
|----------|----------|
| Single vs multi-tenant? | **Multi-business SaaS** |
| Daily purchase model? | **Multiple rows: source shop name + amount** |
| Daily sales model? | **One galla total per day** (evening) |
| Item-level inventory in v1? | **No** — amount-only turnover check; items in Phase 2 |
| GST in v1? | **Yes** — optional PDF invoice, separate from galla |
| Auto invoice number? | **Yes** — per shop, auto-increment |
| Buyer GSTIN required? | **No** |
| Multi-branch one owner? | **No** — one login, one shop |
| Target market? | **Kirana + general retail** |

### Example day

| Time | Action |
|------|--------|
| 10:00 | Purchase from **Reliance Fresh** → ₹4,000 |
| 12:00 | Purchase from **Metro Wholesale** → ₹6,500 |
| 15:00 | Purchase from **Local Kirana Depot** → ₹2,100 |
| 21:00 | Enter **galla** → ₹15,800 |
| — | Dashboard: Purchases **₹12,600** · Galla **₹15,800** · Profit **₹3,200** |

---

## References

- [ChecklistGuro — Inventory software features](https://checklistguro.com/blog/how-to-find-and-choose-the-best-inventory-management-software)
- [Claimlane — Retail inventory KPIs](https://www.claimlane.com/resources/blog/inventory-management-software-for-retail-store)
- [Logic ERP — Wholesale billing features](https://www.logicerp.com/blog/best-wholesale-billing-software-for-distributors-features-benefits-complete-guide-2026/)
- [myofficebook — Indian shop billing modules](https://myofficebook.com/)
