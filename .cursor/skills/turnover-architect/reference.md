# Entity Reference

## Enums

```
UserRole: admin | shop | wholesaler
StockMovementType: purchase | sale | adjustment | return_sale | return_purchase
PaymentMode: cash | upi | card | credit | bank
PurchaseStatus: pending | partial | paid
```

## Indexes (recommended)

- `Product(shop_id, sku)` UNIQUE
- `Sale(shop_id, date)`
- `Purchase(shop_id, wholesaler_id, date)`
- `StockMovement(shop_id, product_id, created_at)`

## Wholesaler link

`ShopWholesalerLink` enables:
- Shop selects wholesaler on purchase entry
- Wholesaler portal filters purchases by link

## Report queries

**Daily dashboard (shop):**
- SUM(sales.total) WHERE date = today
- SUM(purchases.total) WHERE date = today
- Products WHERE stock <= reorder_level

**Monthly turnover:**
- COGS = SUM(sale_line.qty * product.avg_cost) or purchase cost
- Avg inventory = (opening_value + closing_value) / 2
