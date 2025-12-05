import axios from 'axios';
import crypto from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

// FIX: Pass empty object {} to prevent Prisma 7 crash
const prisma = new PrismaClient({});

export const login = (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send('Missing "shop" parameter.');
  }

  const scopes = process.env.SHOPIFY_SCOPES || 'read_products,read_orders,read_customers';
  const redirectUri = process.env.SHOPIFY_REDIRECT_URI;
  const apiKey = process.env.SHOPIFY_API_KEY;
  const state = crypto.randomBytes(16).toString('hex');

  const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${redirectUri}&state=${state}`;

  res.redirect(installUrl);
};

export const callback = async (req, res) => {
  const { shop, hmac, code } = req.query;
  const apiSecret = process.env.SHOPIFY_API_SECRET;

  if (!shop || !hmac || !code) {
    return res.status(400).send('Required parameters missing');
  }

  const map = Object.assign({}, req.query);
  delete map['hmac'];
  const message = new URLSearchParams(map).toString();
  const generatedHmac = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

  if (generatedHmac !== hmac) {
    return res.status(403).send('HMAC validation failed.');
  }

  try {
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code,
    });

    const { access_token } = response.data;

    await prisma.tenant.upsert({
      where: { shopDomain: shop },
      update: { accessToken: access_token, isActive: true },
      create: {
        shopDomain: shop,
        accessToken: access_token,
        isActive: true,
      },
    });

    console.log(`🎉 Tenant registered: ${shop}`);
    res.send('App installed successfully! You can close this tab.');

  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    res.status(500).send('Error during OAuth handshake');
  }
};