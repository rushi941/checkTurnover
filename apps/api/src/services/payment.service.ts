import { pool } from '../db/pool.js';
import { rupeesToPaise } from '../utils/money.js';
import { mapPayment, mapPurchase } from '../utils/mappers.js';
import { todayIso } from '../utils/dates.js';

export async function recordPayment(
  shopId: string,
  purchaseId: string,
  input: {
    amount: number;
    paymentDate?: string;
    paymentMode?: string;
    note?: string;
  },
) {
  const amountPaise = rupeesToPaise(input.amount);
  const paymentDate = input.paymentDate ?? todayIso();
  const paymentMode = input.paymentMode ?? 'cash';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const purchaseRes = await client.query(
      'SELECT * FROM daily_purchases WHERE id = $1 AND shop_id = $2 FOR UPDATE',
      [purchaseId, shopId],
    );
    if (purchaseRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const purchase = purchaseRes.rows[0] as {
      amount_paise: string;
      paid_amount_paise: string;
    };
    const totalPaise = Number(purchase.amount_paise);
    const currentPaid = Number(purchase.paid_amount_paise ?? 0);
    const pending = totalPaise - currentPaid;

    if (amountPaise > pending) {
      await client.query('ROLLBACK');
      throw new Error(`Payment exceeds pending amount (${pending / 100} ₹)`);
    }

    await client.query(
      `INSERT INTO purchase_payments (purchase_id, shop_id, amount_paise, payment_date, payment_mode, note)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [purchaseId, shopId, amountPaise, paymentDate, paymentMode, input.note ?? null],
    );

    const { rows } = await client.query(
      `UPDATE daily_purchases
       SET paid_amount_paise = paid_amount_paise + $1, updated_at = NOW()
       WHERE id = $2 AND shop_id = $3
       RETURNING *`,
      [amountPaise, purchaseId, shopId],
    );

    await client.query('COMMIT');
    return mapPurchase(rows[0] as never);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function listPayments(shopId: string, purchaseId: string) {
  const { rows } = await pool.query(
    `SELECT pp.* FROM purchase_payments pp
     JOIN daily_purchases dp ON dp.id = pp.purchase_id
     WHERE pp.purchase_id = $1 AND pp.shop_id = $2 AND dp.shop_id = $2
     ORDER BY pp.payment_date DESC, pp.created_at DESC`,
    [purchaseId, shopId],
  );
  return rows.map((r) => mapPayment(r as never));
}

export async function markPurchasePaid(
  shopId: string,
  purchaseId: string,
  input?: { paymentDate?: string; paymentMode?: string; note?: string },
) {
  const purchaseRes = await pool.query(
    'SELECT * FROM daily_purchases WHERE id = $1 AND shop_id = $2',
    [purchaseId, shopId],
  );
  if (purchaseRes.rows.length === 0) return null;

  const purchase = purchaseRes.rows[0] as {
    amount_paise: string;
    paid_amount_paise: string;
  };
  const pending = Number(purchase.amount_paise) - Number(purchase.paid_amount_paise ?? 0);
  if (pending <= 0) return mapPurchase(purchaseRes.rows[0] as never);

  return recordPayment(shopId, purchaseId, {
    amount: pending / 100,
    paymentDate: input?.paymentDate,
    paymentMode: input?.paymentMode ?? 'cash',
    note: input?.note ?? 'Marked as fully paid',
  });
}

export async function markPurchaseUnpaid(shopId: string, purchaseId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const purchaseRes = await client.query(
      'SELECT * FROM daily_purchases WHERE id = $1 AND shop_id = $2 FOR UPDATE',
      [purchaseId, shopId],
    );
    if (purchaseRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      'DELETE FROM purchase_payments WHERE purchase_id = $1 AND shop_id = $2',
      [purchaseId, shopId],
    );

    const { rows } = await client.query(
      `UPDATE daily_purchases
       SET paid_amount_paise = 0, updated_at = NOW()
       WHERE id = $1 AND shop_id = $2
       RETURNING *`,
      [purchaseId, shopId],
    );

    await client.query('COMMIT');
    return mapPurchase(rows[0] as never);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Set total paid amount directly (0 = unpaid, partial, or full). Replaces payment history. */
export async function setPurchasePaidAmount(
  shopId: string,
  purchaseId: string,
  input: {
    paidAmount: number;
    paymentDate?: string;
    paymentMode?: string;
    note?: string;
  },
) {
  const newPaidPaise = rupeesToPaise(input.paidAmount);
  const paymentDate = input.paymentDate ?? todayIso();
  const paymentMode = input.paymentMode ?? 'cash';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const purchaseRes = await client.query(
      'SELECT * FROM daily_purchases WHERE id = $1 AND shop_id = $2 FOR UPDATE',
      [purchaseId, shopId],
    );
    if (purchaseRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    const totalPaise = Number(
      (purchaseRes.rows[0] as { amount_paise: string }).amount_paise,
    );
    if (newPaidPaise < 0 || newPaidPaise > totalPaise) {
      await client.query('ROLLBACK');
      throw new Error(`Paid amount must be between 0 and ${totalPaise / 100} ₹`);
    }

    await client.query(
      'DELETE FROM purchase_payments WHERE purchase_id = $1 AND shop_id = $2',
      [purchaseId, shopId],
    );

    if (newPaidPaise > 0) {
      await client.query(
        `INSERT INTO purchase_payments (purchase_id, shop_id, amount_paise, payment_date, payment_mode, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          purchaseId,
          shopId,
          newPaidPaise,
          paymentDate,
          paymentMode,
          input.note ?? 'Manual paid amount',
        ],
      );
    }

    const { rows } = await client.query(
      `UPDATE daily_purchases
       SET paid_amount_paise = $1, updated_at = NOW()
       WHERE id = $2 AND shop_id = $3
       RETURNING *`,
      [newPaidPaise, purchaseId, shopId],
    );

    await client.query('COMMIT');
    return mapPurchase(rows[0] as never);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getStorePendingPaise(shopId: string, sourceName: string): Promise<number> {
  const { rows } = await pool.query<{ pending: string }>(
    `SELECT COALESCE(SUM(amount_paise - paid_amount_paise), 0)::text AS pending
     FROM daily_purchases
     WHERE shop_id = $1 AND source_name = $2 AND paid_amount_paise < amount_paise`,
    [shopId, sourceName.trim()],
  );
  return Number(rows[0].pending);
}

/** Pay an amount against a store — oldest pending bills first (FIFO). */
export async function recordStorePayment(
  shopId: string,
  input: {
    sourceName: string;
    amount: number;
    paymentDate?: string;
    paymentMode?: string;
    note?: string;
  },
) {
  const paymentPaise = rupeesToPaise(input.amount);
  if (paymentPaise <= 0) {
    throw new Error('Payment amount must be greater than 0');
  }

  const paymentDate = input.paymentDate ?? todayIso();
  const paymentMode = input.paymentMode ?? 'cash';
  const sourceName = input.sourceName.trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pendingRes = await client.query<{
      id: string;
      amount_paise: string;
      paid_amount_paise: string;
    }>(
      `SELECT id, amount_paise, paid_amount_paise
       FROM daily_purchases
       WHERE shop_id = $1 AND source_name = $2 AND paid_amount_paise < amount_paise
       ORDER BY date ASC, created_at ASC
       FOR UPDATE`,
      [shopId, sourceName],
    );

    if (pendingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('No pending bills for this store');
    }

    const totalPendingPaise = pendingRes.rows.reduce(
      (sum, row) => sum + Number(row.amount_paise) - Number(row.paid_amount_paise),
      0,
    );

    if (paymentPaise > totalPendingPaise) {
      await client.query('ROLLBACK');
      throw new Error(`Payment exceeds pending amount (${totalPendingPaise / 100} ₹)`);
    }

    let remainingPaise = paymentPaise;
    let billsUpdated = 0;

    for (const row of pendingRes.rows) {
      if (remainingPaise <= 0) break;

      const billPending = Number(row.amount_paise) - Number(row.paid_amount_paise);
      const applyPaise = Math.min(remainingPaise, billPending);

      await client.query(
        `INSERT INTO purchase_payments (purchase_id, shop_id, amount_paise, payment_date, payment_mode, note)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          row.id,
          shopId,
          applyPaise,
          paymentDate,
          paymentMode,
          input.note ?? `Store payment — ${sourceName}`,
        ],
      );

      await client.query(
        `UPDATE daily_purchases
         SET paid_amount_paise = paid_amount_paise + $1, updated_at = NOW()
         WHERE id = $2 AND shop_id = $3`,
        [applyPaise, row.id, shopId],
      );

      remainingPaise -= applyPaise;
      billsUpdated += 1;
    }

    await client.query('COMMIT');
    return {
      sourceName,
      paidPaise: paymentPaise,
      billsUpdated,
      remainingPendingPaise: totalPendingPaise - paymentPaise,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
