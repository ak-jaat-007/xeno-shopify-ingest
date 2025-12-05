import express from 'express';
import { triggerSync } from '../controllers/ingestController.js';

const router = express.Router();

// Define the route for manual synchronization
// Accessible at: http://localhost:5000/api/ingest/sync
router.get('/sync', triggerSync);

export default router;