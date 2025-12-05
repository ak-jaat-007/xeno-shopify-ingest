import express from 'express';
import { login, callback } from '../controllers/shopifyController.js';

const router = express.Router();

// Route: /api/shopify/auth?shop=store.myshopify.com
// This connects to the 'login' function in your controller
router.get('/auth', login);

// Route: /api/shopify/callback
// This is where Shopify sends the user back
router.get('/callback', callback);

export default router;