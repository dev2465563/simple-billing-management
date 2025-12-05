/**
 * Billing Service HTTP Server
 * 
 * Provides HTTP endpoints for webhook handling and API operations.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import {
  MetronomeClient,
  StripeClient,
  CustomerOnboardingService,
  TierManagementService,
  WebhookService,
  JsonStorage,
} from './index';
import { loadOAuthCredentials } from './utils/credentials-loader';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from project root
// Try multiple possible locations
const envPaths = [
  path.resolve(process.cwd(), '.env'), // Project root when running from npm scripts
  path.resolve(__dirname, '../../../.env'), // Relative to compiled file
  path.resolve(__dirname, '../../../../.env'), // Alternative relative path
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize storage
const storage = new JsonStorage(process.env.DATA_DIR || './data');

// Load OAuth credentials from JSON file or environment variables
// Option 1: Provide path to credentials JSON file via METRONOME_OAUTH_CREDENTIALS_FILE env var
// Option 2: Use individual environment variables (METRONOME_OAUTH_CLIENT_ID, etc.)
// Option 3: For mock server, defaults will be used if nothing is provided
const credentialsPath = process.env.METRONOME_OAUTH_CREDENTIALS_FILE;
const metronomeCredentials = loadOAuthCredentials(credentialsPath);

const metronomeClient = new MetronomeClient(
  process.env.METRONOME_API_URL || 'http://localhost:3001',
  metronomeCredentials
);

const stripeClient = new StripeClient(
  process.env.STRIPE_SECRET_KEY || '',
  process.env.STRIPE_WEBHOOK_SECRET
);

// Initialize services
const onboardingService = new CustomerOnboardingService(metronomeClient, stripeClient, storage);
const tierManagementService = new TierManagementService(metronomeClient, stripeClient, storage);
const webhookService = new WebhookService(metronomeClient, stripeClient, storage);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw({ type: 'application/json' })); // For Stripe webhooks

// ============================================================================
// Root Route
// ============================================================================

app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'billing-service',
    version: '1.0.0',
    description: 'Metronome billing integration API',
    endpoints: {
      health: '/health',
      api: {
        onboard: 'POST /api/onboard',
        changeTier: 'POST /api/tier/change',
        getSubscription: 'GET /api/subscription/:entityId',
        getCustomers: 'GET /api/customers',
      },
      webhooks: {
        metronome: 'POST /webhooks/metronome',
        stripe: 'POST /webhooks/stripe',
      },
    },
  });
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'billing-service' });
});

// ============================================================================
// Webhook Endpoints
// ============================================================================

app.post('/webhooks/metronome', async (req: Request, res: Response) => {
  try {
    const event = req.body;
    await webhookService.processMetronomeWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Metronome webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.post('/webhooks/stripe', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const event = stripeClient.verifyWebhookSignature(req.body, signature);
    await webhookService.processStripeWebhook({
      id: event.id,
      type: event.type as any,
      data: { object: event.data.object },
      created: event.created,
    });

    res.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ error: 'Webhook verification failed' });
  }
});

// ============================================================================
// API Endpoints (for testing/demo purposes)
// ============================================================================

app.post('/api/onboard', async (req: Request, res: Response) => {
  try {
    const result = await onboardingService.onboardCustomer(req.body);
    res.json(result);
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post('/api/tier/change', async (req: Request, res: Response) => {
  try {
    const result = await tierManagementService.changeTier(req.body);
    res.json(result);
  } catch (error) {
    console.error('Tier change error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/subscription/:entityId', async (req: Request, res: Response) => {
  try {
    const status = await tierManagementService.getSubscriptionStatus(req.params.entityId);
    if (!status) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json(status);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/customers', async (req: Request, res: Response) => {
  try {
    const entities = await storage.getAllEntities();
    const customers = await Promise.all(
      entities.map(async (entity) => {
        const status = await tierManagementService.getSubscriptionStatus(entity.id);
        return {
          id: entity.id,
          name: entity.name,
          email: entity.email,
          type: entity.type,
          tier: status?.tier || 'free',
          status: status?.status || 'unknown',
          creditsBalance: status?.creditsBalance || 0,
        };
      })
    );
    res.json({ data: customers, total: customers.length });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// Server Startup
// ============================================================================

if (require.main === module) {
  // Initialize storage before starting server
  storage
    .initialize()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Billing Service running on http://localhost:${PORT}`);
        console.log(`📚 Health check: http://localhost:${PORT}/health`);
        console.log(`🔌 API endpoints available at http://localhost:${PORT}/api`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize storage:', error);
      process.exit(1);
    });
}

export default app;

