# TurnOverCheck — User Stories

Format: `As a [role], I want [goal], so that [benefit]`

---

## Admin

| ID | Story | Priority |
|----|-------|----------|
| A-01 | As admin, I want to create shop accounts with login credentials, so shops can use the app | P0 |
| A-02 | As admin, I want to create wholesaler accounts (optional sources), so suppliers can be linked | P1 |
| A-03 | As admin, I want to link shops to wholesalers, so purchase source names can match real suppliers | P2 |
| A-04 | As admin, I want to deactivate accounts, so I can offboard users | P1 |
| A-05 | As admin, I want a platform dashboard, so I see aggregate activity | P2 |

---

## Shop Owner — daily turnover (core)

| ID | Story | Priority |
|----|-------|----------|
| S-01 | As shop owner, I want to add multiple purchase rows per day (shop name + amount), so I record buying from many shops | P0 |
| S-02 | As shop owner, I want to enter one galla total at night, so I record my whole day’s sales in one number | P0 |
| S-03 | As shop owner, I want a daily dashboard (purchases, galla, profit), so I check turnover instantly | P0 |
| S-04 | As shop owner, I want saved source shop names, so I pick “Metro Wholesale” quickly next time | P1 |
| S-05 | As shop owner, I want a **Purchases page** showing total purchases with filters (date, store name), so I see how much I bought and from where | P0 |
| S-05a | As shop owner, I want **By store** view on Purchases page (grouped totals per store), so I know “Metro → ₹1,85,000 this month” | P0 |
| S-05b | As shop owner, I want **All entries** view with every purchase row, so I see date-wise detail | P0 |
| S-06 | As shop owner, I want monthly report (day-wise galla vs purchases), so I analyze the month | P0 |
| S-07 | As shop owner, I want to edit/delete today’s purchase rows, so I fix mistakes | P0 |
| S-08 | As shop owner, I want GST invoice PDF with auto invoice number, so I bill when needed without buyer GSTIN | P0 |

---

## Shop Owner — deferred (Phase 2)

| ID | Story | Priority |
|----|-------|----------|
| S-P2-01 | As shop owner, I want item-level catalog and stock, so I track products by SKU | P2 |
| S-P2-02 | As shop owner, I want payment tracking per source shop, so I know outstanding dues | P2 |

---

## Wholesaler

| ID | Story | Priority |
|----|-------|----------|
| W-01 | As wholesaler, I want to see linked shops, so I know my customers | P2 |
| W-02 | As wholesaler, I want to see purchase totals from linked shops, so I track volume | P2 |

---

## Cross-cutting

| ID | Story | Priority |
|----|-------|----------|
| X-01 | As any user, I want secure login, so my data is protected | P0 |
| X-02 | As shop owner, I want only my shop’s data visible, so other businesses cannot see my data | P0 |
| X-03 | As user, I want mobile-friendly screens, so I can add purchases and galla on phone | P0 |
| X-04 | As platform admin, I want each business isolated, so we host many shops safely | P0 |
