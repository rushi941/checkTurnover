import bcrypt from 'bcryptjs';
import type pg from 'pg';
import { addDaysIso, todayIso } from '@turnover/shared';
import { pool } from './pool.js';

type DbClient = pg.PoolClient;

const seedConfig = {
  adminEmail: process.env.SEED_ADMIN_EMAIL ?? 'rushisheth941@gmail.com',
  adminPassword: process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123',
  shopEmail: process.env.SEED_SHOP_EMAIL ?? 'rajesh@shreeganeshkirana.com',
  shopPassword: process.env.SEED_SHOP_PASSWORD ?? 'Turnover@2026',
  shopName: process.env.SEED_SHOP_NAME ?? 'Shree Ganesh Kirana & General Store',
};

function daysAgo(n: number): string {
  return addDaysIso(todayIso(), -n);
}

async function removeDemoData(client: DbClient) {
  const demoShop = await client.query<{ id: string }>(
    "SELECT id FROM shops WHERE name = 'Demo Kirana Store' LIMIT 1",
  );
  if (demoShop.rows.length === 0) return;

  const shopId = demoShop.rows[0].id;
  await client.query('DELETE FROM purchase_payments WHERE shop_id = $1', [shopId]);
  await client.query('DELETE FROM daily_purchases WHERE shop_id = $1', [shopId]);
  await client.query('DELETE FROM daily_vakro WHERE shop_id = $1', [shopId]);
  await client.query('DELETE FROM shop_kharcho WHERE shop_id = $1', [shopId]);
  await client.query('DELETE FROM monthly_targets WHERE shop_id = $1', [shopId]);
  await client.query('DELETE FROM purchase_sources WHERE shop_id = $1', [shopId]);
  await client.query("DELETE FROM users WHERE email = 'shop@demo.local'");
  await client.query("DELETE FROM users WHERE email = 'admin@turnover.local'");
  await client.query("DELETE FROM users WHERE email = 'admin@turnovercheck.com'");
  await client.query('DELETE FROM shops WHERE id = $1', [shopId]);
  console.log('Removed legacy demo shop and data.');
}

async function seedKharchoSamples(
  client: DbClient,
  shopId: string,
  month: string,
) {
  const monthStartDate = `${month}-01`;
  const kharchoSamples: { date: string; category: string; paise: number; note: string }[] = [
    { date: monthStartDate, category: 'bhadu', paise: 1800000, note: 'Shop rent — monthly' },
    { date: monthStartDate, category: 'nokar_salary', paise: 850000, note: 'Helper salary' },
    { date: daysAgo(10), category: 'bill', paise: 420000, note: 'Electricity bill' },
    { date: daysAgo(8), category: 'car_petrol', paise: 250000, note: 'Delivery van petrol' },
    { date: daysAgo(5), category: 'maintenance', paise: 120000, note: 'Fridge repair' },
    { date: daysAgo(3), category: 'emi', paise: 650000, note: 'Shop loan EMI' },
    { date: daysAgo(20), category: 'car_insurance', paise: 480000, note: 'Van insurance' },
    { date: daysAgo(1), category: 'bill', paise: 180000, note: 'Phone / internet' },
  ];

  for (const k of kharchoSamples) {
    await client.query(
      `INSERT INTO shop_kharcho (shop_id, date, category, amount_paise, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [shopId, k.date, k.category, k.paise, k.note],
    );
  }
}

async function seedShopData(client: DbClient, shopId: string) {
  const month = todayIso().slice(0, 7);

  const purchaseCount = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM daily_purchases WHERE shop_id = $1',
    [shopId],
  );
  const kharchoCount = await client.query<{ count: string }>(
    'SELECT COUNT(*)::text AS count FROM shop_kharcho WHERE shop_id = $1',
    [shopId],
  );

  if (Number(purchaseCount.rows[0].count) > 0) {
    if (Number(kharchoCount.rows[0].count) === 0) {
      console.log('Adding sample kharcho to existing shop…');
      await seedKharchoSamples(client, shopId, month);
    } else {
      console.log('Shop already has sample data — skipping.');
    }
    return;
  }

  const suppliers = [
    'Metro Cash & Carry',
    'Reliance Fresh Wholesale',
    'Shree Ram Traders',
    'Gujarat Agro Suppliers',
    'Patel Brothers Wholesale',
    'ABC Traders',
  ];

  for (const name of suppliers) {
    await client.query(
      `INSERT INTO purchase_sources (shop_id, name) VALUES ($1, $2)
       ON CONFLICT (shop_id, name) DO NOTHING`,
      [shopId, name],
    );
  }

  // ~30 days of realistic kirana purchases + nightly vakro
  for (let daysBack = 29; daysBack >= 0; daysBack -= 1) {
    const date = daysAgo(daysBack);
    const isWeekend = new Date(`${date}T12:00:00`).getDay() % 6 === 0;
    const purchaseRows = isWeekend ? 1 : 2 + (daysBack % 2);

    let dayPurchases = 0;
    for (let i = 0; i < purchaseRows; i += 1) {
      const supplier = suppliers[(daysBack + i) % suppliers.length];
      const amountPaise = 180000 + ((daysBack * 137 + i * 911) % 520000);
      let paidPaise = 0;

      if (daysBack === 3 && i === 0) {
        // Partial payment — still pending
        paidPaise = Math.floor(amountPaise * 0.4);
      } else if (daysBack > 7 && daysBack % 5 === 0 && i === 0) {
        // Fully paid older purchase
        paidPaise = amountPaise;
      } else if (daysBack === 1 && i === 0) {
        // Yesterday unpaid
        paidPaise = 0;
      }

      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO daily_purchases (shop_id, date, source_name, amount_paise, paid_amount_paise, note)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [
          shopId,
          date,
          supplier,
          amountPaise,
          paidPaise,
          daysBack === 0 ? 'Morning stock refill' : null,
        ],
      );

      if (paidPaise > 0) {
        await client.query(
          `INSERT INTO purchase_payments (purchase_id, shop_id, amount_paise, payment_date, payment_mode, note)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [rows[0].id, shopId, paidPaise, date, daysBack % 2 === 0 ? 'upi' : 'cash', 'Payment recorded'],
        );
      }

      dayPurchases += amountPaise;
    }

    // Vakro on most days (skip a few for realistic gaps)
    if (daysBack !== 5 && daysBack !== 12) {
      const vakroPaise = dayPurchases + 280000 + ((daysBack * 503) % 420000);
      await client.query(
        `INSERT INTO daily_vakro (shop_id, date, amount_paise) VALUES ($1, $2, $3)
         ON CONFLICT (shop_id, date) DO UPDATE SET amount_paise = EXCLUDED.amount_paise`,
        [shopId, date, vakroPaise],
      );
    }
  }

  await seedKharchoSamples(client, shopId, month);

  // Monthly target: 15 Lakh
  await client.query(
    `INSERT INTO monthly_targets (shop_id, month, target_paise) VALUES ($1, $2, $3)
     ON CONFLICT (shop_id, month) DO UPDATE SET target_paise = EXCLUDED.target_paise`,
    [shopId, month, 150000000],
  );

  console.log(`Loaded 30 days of purchases, vakro, kharcho, and payments for testing.`);
}

async function seed() {
  const client = await pool.connect();
  try {
    await removeDemoData(client);

    const adminEmail = seedConfig.adminEmail.toLowerCase();
    const adminExists = await client.query('SELECT 1 FROM users WHERE email = $1', [adminEmail]);
    const adminHash = await bcrypt.hash(seedConfig.adminPassword, 10);
    if (adminExists.rows.length === 0) {
      await client.query(
        `INSERT INTO users (email, password_hash, role, status)
         VALUES ($1, $2, 'admin', 'active')`,
        [adminEmail, adminHash],
      );
      console.log(`Created admin: ${seedConfig.adminEmail}`);
    } else {
      console.log(`Admin already exists: ${seedConfig.adminEmail}`);
    }

    const shopUser = await client.query<{ shop_id: string | null }>(
      'SELECT shop_id FROM users WHERE email = $1',
      [seedConfig.shopEmail.toLowerCase()],
    );

    let shopId: string;
    if (shopUser.rows.length === 0) {
      const shopRes = await client.query<{ id: string }>(
        `INSERT INTO shops (name, address, gstin, invoice_prefix)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [
          seedConfig.shopName,
          'Shop 12, Navrangpura Market, Ahmedabad, Gujarat 380009',
          '24AABCS1234F1Z5',
          'SGK',
        ],
      );
      shopId = shopRes.rows[0].id;
      const hash = await bcrypt.hash(seedConfig.shopPassword, 10);
      await client.query(
        `INSERT INTO users (email, password_hash, role, shop_id, status)
         VALUES ($1, $2, 'shop', $3, 'active')`,
        [seedConfig.shopEmail.toLowerCase(), hash, shopId],
      );
      console.log(`Created shop: ${seedConfig.shopName}`);
      console.log(`Shop login: ${seedConfig.shopEmail}`);
    } else {
      shopId = shopUser.rows[0].shop_id!;
      console.log(`Shop already exists: ${seedConfig.shopEmail}`);
    }

    await seedShopData(client, shopId);

    console.log('Seed complete.');
    console.log(`Admin login: ${seedConfig.adminEmail}`);
    console.log(`Shop login:  ${seedConfig.shopEmail}`);
    console.log('(Passwords are from SEED_ADMIN_PASSWORD / SEED_SHOP_PASSWORD in Render env)');
  } finally {
    client.release();
  }
}

export async function runSeed(): Promise<void> {
  await seed();
}

const isDirectRun = process.argv[1]?.includes('seed');
if (isDirectRun) {
  runSeed()
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(() => pool.end());
}
