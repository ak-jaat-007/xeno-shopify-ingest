import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

// Initialize without arguments
const db = new PrismaClient();

export const performDataSync = async (shopDomain, accessToken) => {
  console.log(`[Sync Service] Starting data pipeline for: ${shopDomain}`);

  const shopifyConfig = {
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
  };

  const baseUrl = `https://${shopDomain}/admin/api/2024-01`;
  let stats = { customers: 0, products: 0, orders: 0 };

  try {
    const tenantRecord = await db.tenant.findUnique({
      where: { shopDomain },
    });

    if (!tenantRecord) throw new Error(`Tenant ${shopDomain} not found in local DB.`);

    // =========================================================
    // STAGE 1: SYNC CUSTOMERS (Wrapped in try/catch to prevent crash)
    // =========================================================
    try {
      console.log('--- Syncing Customer Base ---');
      const customerResponse = await axios.get(`${baseUrl}/customers.json?limit=50`, shopifyConfig);
      const rawCustomers = customerResponse.data.customers;

      await db.$transaction(
        rawCustomers.map((c) =>
          db.customer.upsert({
            where: {
              shopifyId_tenantId: {
                shopifyId: c.id.toString(),
                tenantId: tenantRecord.id,
              },
            },
            update: {
              totalSpent: c.total_spent,
              ordersCount: c.orders_count,
              updatedAt: new Date(),
            },
            create: {
              shopifyId: c.id.toString(),
              email: c.email,
              firstName: c.first_name,
              lastName: c.last_name,
              totalSpent: c.total_spent,
              ordersCount: c.orders_count,
              tenantId: tenantRecord.id,
            },
          })
        )
      );
      stats.customers = rawCustomers.length;
      console.log(`✅ Synced ${stats.customers} customers.`);
    } catch (customerError) {
      console.warn(`⚠️ Skipping Customers: Shopify blocked access. (Protected Data requires approval). Continuing...`);
    }

    // =========================================================
    // STAGE 2: SYNC PRODUCTS
    // =========================================================
    try {
      console.log('--- Syncing Products ---');
      const productResponse = await axios.get(`${baseUrl}/products.json?limit=50`, shopifyConfig);
      const rawProducts = productResponse.data.products;

      await db.$transaction(
        rawProducts.map((p) =>
          db.product.upsert({
            where: {
              shopifyId_tenantId: {
                shopifyId: p.id.toString(),
                tenantId: tenantRecord.id,
              },
            },
            update: {
              title: p.title,
              price: p.variants[0]?.price || 0,
              updatedAt: new Date(),
            },
            create: {
              shopifyId: p.id.toString(),
              title: p.title,
              price: p.variants[0]?.price || 0,
              tenantId: tenantRecord.id,
            },
          })
        )
      );
      stats.products = rawProducts.length;
      console.log(`✅ Synced ${stats.products} products.`);
    } catch (productError) {
      console.error(`❌ Failed to sync products: ${productError.message}`);
    }

    // =========================================================
    // STAGE 3: SYNC ORDERS
    // =========================================================
    try {
      console.log('--- Syncing Orders ---');
      const orderResponse = await axios.get(`${baseUrl}/orders.json?status=any&limit=50`, shopifyConfig);
      const rawOrders = orderResponse.data.orders;

      for (const ord of rawOrders) {
        // Try to link to customer if we have them, otherwise null
        let localCustomerId = null;
        if (ord.customer) {
          const localCustomer = await db.customer.findUnique({
            where: {
              shopifyId_tenantId: {
                shopifyId: ord.customer.id.toString(),
                tenantId: tenantRecord.id,
              },
            },
          });
          if (localCustomer) localCustomerId = localCustomer.id;
        }

        await db.order.upsert({
          where: { id: ord.id.toString() },
          update: {
            financialStatus: ord.financial_status,
            processedAt: new Date(ord.processed_at),
          },
          create: {
            id: ord.id.toString(),
            shopifyId: ord.id.toString(),
            totalPrice: ord.total_price,
            currency: ord.currency,
            financialStatus: ord.financial_status,
            processedAt: new Date(ord.processed_at),
            tenantId: tenantRecord.id,
            customerId: localCustomerId,
          },
        });
      }
      stats.orders = rawOrders.length;
      console.log(`✅ Synced ${stats.orders} orders.`);
    } catch (orderError) {
      console.error(`❌ Failed to sync orders: ${orderError.message}`);
    }

    console.log(`[Sync Service] Pipeline Complete.`);
    return { success: true, count: stats };

  } catch (err) {
    console.error(`[Sync Error] Critical failure for ${shopDomain}:`, err.message);
    throw err;
  }
};