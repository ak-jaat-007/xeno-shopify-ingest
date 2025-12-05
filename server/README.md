Xeno Shopify Data Ingestion Service 🚀

This is a multi-tenant data ingestion service designed to help enterprise retailers onboard, integrate, and analyze their customer data from Shopify. It features a robust backend for data synchronization and a React-based dashboard for real-time insights.

🏗️ Architecture & Tech Stack

Backend: Node.js with Express.js

Database: PostgreSQL (managed via Prisma ORM)

Frontend: React.js (Vite) + Tailwind CSS + Recharts

Integration: Shopify Admin API (REST)

Tunneling: Ngrok (for local OAuth development)

🛠️ Features

Multi-Tenancy:

Supports multiple Shopify stores simultaneously.

Uses shopDomain as a unique identifier to isolate data per tenant.

Secure OAuth 2.0 Handshake:

Implements the official Shopify OAuth flow to obtain and store permanent Access Tokens securely.

Resilient Data Ingestion:

Fetches Products, Orders, and Customers.

Fault Tolerance: Automatically handles API permission errors (e.g., skips "Protected Customer Data" if unapproved) without crashing the pipeline.

Insights Dashboard:

Visualizes key metrics: Total Revenue, Order Count, Product Inventory.

Real-time sync trigger from the UI.

📂 Database Schema

The application uses a relational database schema defined in Prisma:

Tenant: Stores store domain and API access tokens.

Product: Stores inventory data, linked to Tenant.

Customer: Stores shopper details, linked to Tenant.

Order: Stores transaction history, linked to Tenant and Customer.

🚀 Setup Instructions

1. Prerequisites

Node.js (v18 or higher)

PostgreSQL installed locally or a cloud instance (e.g., Neon.tech)

Shopify Partner Account

Ngrok (for exposing localhost)

2. Backend Setup

Navigate to the server directory and install dependencies:

cd server
npm install


Create a .env file in the server/ directory:

DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/xeno_db?schema=public"
PORT=5000
SHOPIFY_API_KEY="your_shopify_client_id"
SHOPIFY_API_SECRET="your_shopify_client_secret"
SHOPIFY_SCOPES="read_products,read_orders,read_customers"
SHOPIFY_REDIRECT_URI="[https://your-ngrok-url.ngrok-free.app/api/shopify/callback](https://your-ngrok-url.ngrok-free.app/api/shopify/callback)"


Initialize the database:

npx prisma generate
npx prisma db push
npm run dev


3. Frontend Setup

Open a new terminal, navigate to the client directory, and install dependencies:

cd client
npm install
npm run dev


4. Shopify Configuration

Create an App in the Shopify Partners Dashboard.

In Configuration, set the App URL to your Ngrok URL (e.g., https://xxxx.ngrok-free.app).

Set the Allowed Redirection URL to https://xxxx.ngrok-free.app/api/shopify/callback.

🧪 API Endpoints

Method

Endpoint

Description

GET

/api/shopify/auth

Initiates the OAuth installation flow. Query param: ?shop=example.myshopify.com

GET

/api/shopify/callback

Handles the code exchange and registers the tenant in the DB.

GET

/api/ingest/sync

Triggers the data sync pipeline for a specific shop.

⚠️ Assumptions & Limitations

Protected Data: Shopify requires specific approval to access PII (Personally Identifiable Information) like Customer Names and Emails. This application attempts to sync customers but gracefully skips them if permission is denied (403 Forbidden), ensuring Products and Orders still sync.

Rate Limiting: The current implementation processes data in batches. For a high-scale production environment, I would implement a job queue (like BullMQ/Redis) to handle Shopify's API rate limits (40/second).

Authentication: The dashboard currently uses a simple domain check. In production, this would be behind a secure login system.