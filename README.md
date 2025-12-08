# Metronome Billing Integration

A comprehensive billing integration system that manages customer lifecycle, subscriptions, and payments using Metronome (billing engine) and Stripe (payment provider).

## Architecture Overview

This project implements a dual-provider billing model:

- **Metronome**: Handles subscriptions, credits, invoices, and tier management
- **Stripe**: Manages payment methods and processes payments

### Project Structure

```
metronome-integration/
├── packages/
│   ├── types/                    # Shared TypeScript types
│   ├── mock-metronome-server/   # Mock Metronome API server
│   └── billing-service/         # Main billing integration service
├── data/                        # JSON file storage (created at runtime)
└── README.md
```

## Features

### ✅ Customer Onboarding
- Create customers in both Metronome and Stripe
- Set up initial subscriptions/contracts
- Attach payment methods
- Initialize credits based on tier

### ✅ Tier Management
- Upgrade/downgrade billing tiers
- Prorated billing calculations
- Credit adjustments
- Subscription lifecycle management (activate, cancel, reactivate)

### ✅ Payment Processing
- Payment method management
- Payment intent creation and confirmation
- Charge processing
- Payment failure handling

### ✅ Webhook Handling
- Metronome webhook processing
- Stripe webhook verification and processing
- Idempotency and retry logic
- Event storage

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Stripe test account (for payment processing)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Build all packages:

```bash
npm run build
```

3. Set up environment variables:

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Metronome Configuration
METRONOME_API_URL=http://localhost:3001
METRONOME_OAUTH_CLIENT_ID=your_client_id
METRONOME_OAUTH_CLIENT_SECRET=your_client_secret
METRONOME_OAUTH_TOKEN_URL=http://localhost:3001/oauth/token
METRONOME_OAUTH_SCOPE=billing:read billing:write

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Application Configuration
PORT=3000
MOCK_METRONOME_PORT=3001
NODE_ENV=development

# Storage
DATA_DIR=./data
```

### OAuth Credentials Format

The OAuth credentials can be provided in two ways:

**Option 1: JSON File (Recommended)**

Create a JSON file (e.g., `metronome-oauth-credentials.json`) with the following structure:

```json
{
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "token_url": "http://localhost:3001/oauth/token",
  "scope": "billing:read billing:write"
}
```

Then set the path in your `.env` file:
```env
METRONOME_OAUTH_CREDENTIALS_FILE=./metronome-oauth-credentials.json
```

**Option 2: Environment Variables**

Set individual environment variables in your `.env` file:
```env
METRONOME_OAUTH_CLIENT_ID=your_client_id
METRONOME_OAUTH_CLIENT_SECRET=your_client_secret
METRONOME_OAUTH_TOKEN_URL=http://localhost:3001/oauth/token
METRONOME_OAUTH_SCOPE=billing:read billing:write
```

**Note:** The file you provided appears to be a Google Cloud service account credential. For Metronome, you need OAuth client credentials (client_id/client_secret), not a service account. If you're using the mock server, any values will work for testing.

## Running the Services

### 1. Start Mock Metronome Server

In one terminal:

```bash
npm run dev:mock
```

The mock server will start on `http://localhost:3001`

### 2. Start Billing Service

In another terminal:

```bash
npm run dev:billing
```

**Note:** If you see "EADDRINUSE" error, the server is already running! Just open your browser to `http://localhost:3000`

**Alternative commands:**
- `npm run dev:billing:no-watch` - Run without file watching (if file watcher limit is reached)
- `npm run start:billing` - Run the built version (requires `npm run build` first)

The billing service will start on `http://localhost:3000` and serve the web UI.

## Web UI (Next.js Frontend)

The project includes a modern Next.js frontend with a professional UI.

### Running the Frontend

**Terminal 3 - Next.js Frontend:**
```bash
npm run dev:frontend
```

The frontend will start on `http://localhost:3002` (or next available port if 3002 is taken)

**Open your browser to:** `http://localhost:3002`

**Note:** Make sure both the Mock Metronome Server and Billing Service are running first.

### Features

- **Modern Next.js 14** with App Router
- **Tailwind CSS** for styling
- **Real-time status** indicators
- **Responsive design** - works on all devices
- **Dashboard** with service health monitoring
- **Workflow visualization** showing the complete billing process
- **Actions tab**: Onboard customers, change tiers, check status
- **Customers tab**: View all onboarded customers with their tiers and status
- **Workflow Guide**: Complete documentation and step-by-step guide
- **Auto-refresh** for customer list and status

## Usage Examples

### Customer Onboarding

```typescript
import { CustomerOnboardingService, MetronomeClient, StripeClient, JsonStorage } from '@billing-service';

const onboardingService = new CustomerOnboardingService(
  metronomeClient,
  stripeClient,
  storage
);

const result = await onboardingService.onboardCustomer({
  entity: {
    id: 'user-123',
    type: 'user',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  tier: 'pro',
  billingPeriod: 'monthly',
  paymentMethodId: 'pm_1234567890', // Optional
});
```

### Tier Management

```typescript
import { TierManagementService } from '@billing-service';

const tierService = new TierManagementService(metronomeClient, stripeClient, storage);

// Upgrade tier
const result = await tierService.changeTier({
  entityId: 'user-123',
  newTier: 'team',
  billingPeriod: 'yearly',
});

// Get subscription status
const status = await tierService.getSubscriptionStatus('user-123');

// Cancel subscription
await tierService.cancelSubscription('user-123');
```

### Webhook Handling

The billing service provides webhook endpoints:

- `POST /webhooks/metronome` - Metronome webhooks
- `POST /webhooks/stripe` - Stripe webhooks (with signature verification)

## API Endpoints

### Billing Service API

- `GET /health` - Health check
- `POST /api/onboard` - Onboard a new customer
- `POST /api/tier/change` - Change customer tier
- `GET /api/subscription/:entityId` - Get subscription status
- `POST /webhooks/metronome` - Metronome webhook endpoint
- `POST /webhooks/stripe` - Stripe webhook endpoint

### Mock Metronome API

- `POST /oauth/token` - OAuth token endpoint
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer
- `POST /api/v1/contracts` - Create contract
- `GET /api/v1/contracts/:id` - Get contract
- `POST /api/v1/contracts/:id/cancel` - Cancel contract
- `POST /api/v1/invoices` - Create invoice
- `POST /api/v1/invoices/:id/pay` - Pay invoice
- `POST /api/v1/credits` - Apply credits
- `GET /api/v1/credits/balance` - Get credit balance

## Testing

### Manual Testing Instructions

The implementation can be tested manually using the API endpoints or the web UI.

#### Prerequisites
1. Start the mock Metronome server: `npm run dev:mock`
2. Start the billing service: `npm run dev:billing`
3. (Optional) Start the frontend: `npm run dev:frontend`

#### Test 1: Customer Onboarding

**Via API:**
```bash
curl -X POST http://localhost:3000/api/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "entity": {
      "id": "user-test-1",
      "type": "user",
      "name": "Test User",
      "email": "test@example.com",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    },
    "tier": "pro",
    "billingPeriod": "monthly"
  }'
```

**Via Web UI:**
1. Navigate to `http://localhost:3002/customers/new`
2. Fill in customer details
3. Select tier and billing period
4. Click "Onboard Customer"
5. Verify success message and customer appears in customer list

**Expected Result:**
- Customer created in Metronome
- Customer created in Stripe
- Contract/subscription created
- Credits initialized based on tier
- Customer appears in `/api/customers` endpoint

#### Test 2: Tier Management - Upgrade

**Via API:**
```bash
curl -X POST http://localhost:3000/api/tier/change \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "user-test-1",
    "newTier": "team",
    "billingPeriod": "yearly"
  }'
```

**Via Web UI:**
1. Navigate to `http://localhost:3002/customers`
2. Find the customer
3. Use tier management component to change tier
4. Verify tier change and proration

**Expected Result:**
- Old contract cancelled
- New contract created with new tier
- Prorated amount calculated
- Credits adjusted
- Subscription status updated

#### Test 3: Get Subscription Status

**Via API:**
```bash
curl http://localhost:3000/api/subscription/user-test-1
```

**Via Web UI:**
1. Navigate to `http://localhost:3002/subscriptions`
2. Enter entity ID
3. View subscription details

**Expected Result:**
- Returns current tier, billing period, contract status, credits balance

#### Test 4: List All Customers

**Via API:**
```bash
curl http://localhost:3000/api/customers
```

**Via Web UI:**
1. Navigate to `http://localhost:3002/customers`
2. View all onboarded customers with their tiers and status

**Expected Result:**
- Returns list of all customers with their billing information

#### Test 5: Health Checks

```bash
# Billing service health
curl http://localhost:3000/health

# Mock Metronome server health
curl http://localhost:3001/health
```

**Expected Result:**
- Both services return healthy status

### Testing Scenarios

1. **Onboard Free Tier Customer**: Verify no invoice is created
2. **Onboard Paid Tier Customer**: Verify invoice creation and payment processing
3. **Upgrade Tier**: Verify proration calculation and credit adjustment
4. **Downgrade Tier**: Verify credit refund and tier change
5. **Change Billing Period**: Verify contract update (monthly ↔ yearly)
6. **Cancel Subscription**: Verify contract cancellation
7. **Reactivate Subscription**: Verify contract reactivation
8. **Webhook Processing**: Test webhook endpoints with sample events

### Integration Testing

For end-to-end testing:
1. Start all services (mock server, billing service, frontend)
2. Use the web UI to perform complete workflows
3. Verify data persistence in `packages/billing-service/data/billing-data.json`
4. Check logs for any errors or warnings

## Billing Tiers

The system supports four billing tiers:

| Tier | Monthly Price | Yearly Price | Monthly Credits | Features |
|------|--------------|--------------|-----------------|----------|
| Free | $0 | $0 | 1,000 | Basic storage, Public repositories |
| Pro | $9 | $90 | 10,000 | Unlimited storage, Private repos, Priority support |
| Team | $29 | $290 | 50,000 | Everything in Pro + Team collaboration, Analytics |
| Enterprise | Custom | Custom | Custom | Everything in Team + Custom integrations, SLA |

## Design Decisions

### 1. Package Structure
- **Separate packages**: Each major component (types, mock server, billing service) is in its own package for better modularity and reusability.

### 2. Storage Layer
- **JSON file storage**: Chosen for simplicity and ease of testing. In production, this would be replaced with a proper database (PostgreSQL, MongoDB, etc.).

### 3. OAuth Authentication
- **Client credentials flow**: Used for server-to-server authentication with Metronome. Tokens are cached and automatically refreshed.

### 4. Webhook Processing
- **Idempotency**: Events are tracked to prevent duplicate processing.
- **Retry logic**: Failed webhook processing is retried with exponential backoff.
- **Async processing**: Webhooks are processed asynchronously to avoid blocking.

### 5. Prorating Logic
- **Daily proration**: Tier changes are prorated based on remaining days in the billing period.
- **Credit for downgrades**: Customers receive credits when downgrading tiers.

### 6. Error Handling
- **Graceful degradation**: Payment method attachment failures don't block onboarding.
- **Comprehensive logging**: All operations are logged for debugging and monitoring.

## Trade-offs

1. **JSON File Storage vs Database**
   - ✅ Simple, no setup required
   - ❌ Not suitable for production scale
   - **Decision**: Use JSON for development/testing, document database migration path

2. **Synchronous vs Asynchronous Operations**
   - ✅ Synchronous for critical operations (onboarding, tier changes)
   - ✅ Asynchronous for webhooks and background tasks
   - **Decision**: Hybrid approach based on operation criticality

3. **Mock Server vs Real Metronome**
   - ✅ Mock server allows development without Metronome account
   - ✅ Can test edge cases and error scenarios
   - **Decision**: Provide mock server, document real Metronome integration

## Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Rate limiting and API throttling
- [ ] Comprehensive monitoring and metrics
- [ ] Admin dashboard for billing management
- [ ] Email notifications for billing events
- [ ] Advanced analytics and reporting
- [ ] Multi-currency support
- [ ] Tax calculation integration

## License

MIT

