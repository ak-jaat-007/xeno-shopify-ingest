import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

import { performDataSync } from '../services/dataSyncService.js';

// FIX: Pass empty object {} to prevent Prisma 7 crash
const prisma = new PrismaClient({});

export const triggerSync = async (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).json({ error: 'Shop domain parameter is required.' });
  }

  try {
    const merchant = await prisma.tenant.findUnique({
      where: { shopDomain: shop },
    });

    if (!merchant || !merchant.accessToken) {
      return res.status(401).json({ error: 'Merchant not authenticated or not found.' });
    }

    const syncResult = await performDataSync(shop, merchant.accessToken);

    res.status(200).json({
      message: 'Data ingestion pipeline executed successfully.',
      metrics: syncResult,
    });

  } catch (error) {
    console.error('Ingestion Controller Error:', error);
    res.status(500).json({ error: 'Internal Server Error during sync.' });
  }
};