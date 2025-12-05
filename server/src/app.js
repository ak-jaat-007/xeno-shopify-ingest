import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import shopifyRoutes from './routes/shopifyRoutes.js';
import ingestRoutes from './routes/ingestRoutes.js'; 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// DEBUGGING MIDDLEWARE (Prints requests to Terminal)
// ----------------------------------------------------
app.use((req, res, next) => {
  console.log(`🔍 Incoming Request: ${req.method} ${req.url}`);
  next();
});

// ----------------------------------------------------
// REGISTER ROUTES
// ----------------------------------------------------

console.log('✅ Registering /api/shopify routes...');
app.use('/api/shopify', shopifyRoutes);

console.log('✅ Registering /api/ingest routes...');
app.use('/api/ingest', ingestRoutes);

// ----------------------------------------------------

// Health Check Route
app.get('/', (req, res) => {
  res.send('Xeno Shopify Ingestion Service is Running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`👉 Test Auth URL: http://localhost:${PORT}/api/shopify/auth?shop=YOUR-STORE.myshopify.com`);
});