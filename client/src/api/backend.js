import axios from 'axios';

// This must match your Backend Server URL
const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const triggerIngestion = async (shopDomain) => {
  try {
    // Calls the backend endpoint: /api/ingest/sync
    const response = await apiClient.get(`/ingest/sync?shop=${shopDomain}`);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : new Error('Network Error');
  }
};