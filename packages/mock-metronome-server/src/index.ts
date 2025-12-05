/**
 * Mock Metronome Billing API Server
 * 
 * This server emulates Metronome's billing API for testing and development.
 * It provides endpoints for customer management, contracts, invoices, credits, and webhooks.
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import {
  MetronomeCustomer,
  MetronomeContract,
  MetronomeInvoice,
  MetronomeCredit,
  MetronomeWebhookEvent,
  BillingTier,
  BillingEntityType,
  DEFAULT_TIER_CONFIGS,
} from '@metronome-integration/types';

const app = express();
const PORT = process.env.MOCK_METRONOME_PORT || 3001;

// In-memory storage (in production, this would be a database)
const storage = {
  customers: new Map<string, MetronomeCustomer>(),
  contracts: new Map<string, MetronomeContract>(),
  invoices: new Map<string, MetronomeInvoice>(),
  credits: new Map<string, MetronomeCredit>(),
  webhookEvents: [] as MetronomeWebhookEvent[],
};

// OAuth token storage (simple mock)
const oauthTokens = new Map<string, { access_token: string; expires_at: number }>();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// OAuth Endpoints
// ============================================================================

app.post('/oauth/token', (req: Request, res: Response) => {
  const { client_id, client_secret, grant_type } = req.body;

  // Simple OAuth mock - in production, validate credentials properly
  if (grant_type === 'client_credentials') {
    const access_token = `mock_token_${uuidv4()}`;
    const expires_at = Date.now() + 3600000; // 1 hour

    oauthTokens.set(access_token, { access_token, expires_at });

    res.json({
      access_token,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'billing:read billing:write',
    });
  } else {
    res.status(400).json({ error: 'unsupported_grant_type' });
  }
});

// OAuth middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);
  const tokenData = oauthTokens.get(token);

  if (!tokenData || tokenData.expires_at < Date.now()) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  next();
};

// ============================================================================
// Customer Endpoints
// ============================================================================

app.post('/api/v1/customers', authenticate, (req: Request, res: Response) => {
  const { entity_id, entity_type, email, name, metadata } = req.body;

  if (!entity_id || !entity_type || !email || !name) {
    return res.status(400).json({ error: 'Missing required fields: entity_id, entity_type, email, name' });
  }

  const customer: MetronomeCustomer = {
    id: `cust_${uuidv4()}`,
    entity_id,
    entity_type: entity_type as BillingEntityType,
    email,
    name,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: metadata || {},
  };

  storage.customers.set(customer.id, customer);

  // Emit webhook event
  emitWebhookEvent('customer.created', customer);

  res.status(201).json(customer);
});

app.get('/api/v1/customers/:id', authenticate, (req: Request, res: Response) => {
  const customer = storage.customers.get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  res.json(customer);
});

app.patch('/api/v1/customers/:id', authenticate, (req: Request, res: Response) => {
  const customer = storage.customers.get(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const updated: MetronomeCustomer = {
    ...customer,
    ...req.body,
    id: customer.id, // Prevent ID changes
    updated_at: new Date().toISOString(),
  };

  storage.customers.set(customer.id, updated);
  emitWebhookEvent('customer.updated', updated);

  res.json(updated);
});

app.get('/api/v1/customers', authenticate, (req: Request, res: Response) => {
  const customers = Array.from(storage.customers.values());
  res.json({ data: customers, total: customers.length });
});

// ============================================================================
// Contract (Subscription) Endpoints
// ============================================================================

app.post('/api/v1/contracts', authenticate, (req: Request, res: Response) => {
  const { customer_id, tier, billing_period, rate_card_id } = req.body;

  if (!customer_id || !tier || !billing_period) {
    return res.status(400).json({ error: 'Missing required fields: customer_id, tier, billing_period' });
  }

  const customer = storage.customers.get(customer_id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const tierConfig = DEFAULT_TIER_CONFIGS[tier as BillingTier];
  if (!tierConfig) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const now = new Date();
  const endDate = new Date(now);
  if (billing_period === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const contract: MetronomeContract = {
    id: `contract_${uuidv4()}`,
    customer_id,
    tier: tier as BillingTier,
    status: 'active',
    billing_period: billing_period as 'monthly' | 'yearly',
    start_date: now.toISOString(),
    end_date: endDate.toISOString(),
    rate_card_id: rate_card_id || `rate_${tier}`,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  storage.contracts.set(contract.id, contract);

  // Initialize credits for the customer
  initializeCredits(customer_id, tierConfig.monthlyCredits);

  emitWebhookEvent('contract.created', contract);

  res.status(201).json(contract);
});

app.get('/api/v1/contracts/:id', authenticate, (req: Request, res: Response) => {
  const contract = storage.contracts.get(req.params.id);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  res.json(contract);
});

app.patch('/api/v1/contracts/:id', authenticate, (req: Request, res: Response) => {
  const contract = storage.contracts.get(req.params.id);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const updated: MetronomeContract = {
    ...contract,
    ...req.body,
    id: contract.id,
    updated_at: new Date().toISOString(),
  };

  storage.contracts.set(contract.id, updated);
  emitWebhookEvent('contract.updated', updated);

  res.json(updated);
});

app.post('/api/v1/contracts/:id/cancel', authenticate, (req: Request, res: Response) => {
  const contract = storage.contracts.get(req.params.id);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const updated: MetronomeContract = {
    ...contract,
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  storage.contracts.set(contract.id, updated);
  emitWebhookEvent('contract.cancelled', updated);

  res.json(updated);
});

app.get('/api/v1/contracts', authenticate, (req: Request, res: Response) => {
  const customerId = req.query.customer_id as string;
  let contracts = Array.from(storage.contracts.values());

  if (customerId) {
    contracts = contracts.filter((c) => c.customer_id === customerId);
  }

  res.json({ data: contracts, total: contracts.length });
});

// ============================================================================
// Invoice Endpoints
// ============================================================================

app.post('/api/v1/invoices', authenticate, (req: Request, res: Response) => {
  const { customer_id, contract_id, amount, currency, line_items } = req.body;

  if (!customer_id || !contract_id || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields: customer_id, contract_id, amount' });
  }

  const contract = storage.contracts.get(contract_id);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

  const invoice: MetronomeInvoice = {
    id: `inv_${uuidv4()}`,
    customer_id,
    contract_id,
    amount,
    currency: currency || 'USD',
    status: 'open',
    due_date: dueDate.toISOString(),
    created_at: now.toISOString(),
    line_items: line_items || [
      {
        id: `line_${uuidv4()}`,
        description: `Subscription for ${contract.tier} tier`,
        quantity: 1,
        unit_price: amount,
        amount,
      },
    ],
  };

  storage.invoices.set(invoice.id, invoice);
  emitWebhookEvent('invoice.created', invoice);

  res.status(201).json(invoice);
});

app.get('/api/v1/invoices/:id', authenticate, (req: Request, res: Response) => {
  const invoice = storage.invoices.get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }
  res.json(invoice);
});

app.post('/api/v1/invoices/:id/pay', authenticate, (req: Request, res: Response) => {
  const invoice = storage.invoices.get(req.params.id);
  if (!invoice) {
    return res.status(404).json({ error: 'Invoice not found' });
  }

  const updated: MetronomeInvoice = {
    ...invoice,
    status: 'paid',
    paid_at: new Date().toISOString(),
  };

  storage.invoices.set(invoice.id, updated);
  emitWebhookEvent('invoice.paid', updated);

  res.json(updated);
});

app.get('/api/v1/invoices', authenticate, (req: Request, res: Response) => {
  const customerId = req.query.customer_id as string;
  let invoices = Array.from(storage.invoices.values());

  if (customerId) {
    invoices = invoices.filter((i) => i.customer_id === customerId);
  }

  res.json({ data: invoices, total: invoices.length });
});

// ============================================================================
// Credit Endpoints
// ============================================================================

function initializeCredits(customerId: string, amount: number) {
  const credit: MetronomeCredit = {
    id: `credit_${uuidv4()}`,
    customer_id: customerId,
    amount,
    balance: amount,
    currency: 'USD',
    created_at: new Date().toISOString(),
  };

  storage.credits.set(credit.id, credit);
  emitWebhookEvent('credit.applied', credit);
}

app.post('/api/v1/credits', authenticate, (req: Request, res: Response) => {
  const { customer_id, amount, currency, expires_at } = req.body;

  if (!customer_id || amount === undefined) {
    return res.status(400).json({ error: 'Missing required fields: customer_id, amount' });
  }

  const credit: MetronomeCredit = {
    id: `credit_${uuidv4()}`,
    customer_id,
    amount,
    balance: amount,
    currency: currency || 'USD',
    expires_at: expires_at || undefined,
    created_at: new Date().toISOString(),
  };

  storage.credits.set(credit.id, credit);
  emitWebhookEvent('credit.applied', credit);

  res.status(201).json(credit);
});

app.get('/api/v1/credits/balance', authenticate, (req: Request, res: Response) => {
  const customerId = req.query.customer_id as string;
  if (!customerId) {
    return res.status(400).json({ error: 'Missing customer_id query parameter' });
  }

  const credits = Array.from(storage.credits.values()).filter((c) => c.customer_id === customerId);
  const totalBalance = credits.reduce((sum, c) => sum + c.balance, 0);

  res.json({
    customer_id: customerId,
    balance: totalBalance,
    currency: 'USD',
    credits: credits.map((c) => ({
      id: c.id,
      amount: c.amount,
      balance: c.balance,
      expires_at: c.expires_at,
    })),
  });
});

app.get('/api/v1/credits', authenticate, (req: Request, res: Response) => {
  const customerId = req.query.customer_id as string;
  let credits = Array.from(storage.credits.values());

  if (customerId) {
    credits = credits.filter((c) => c.customer_id === customerId);
  }

  res.json({ data: credits, total: credits.length });
});

// ============================================================================
// Webhook Endpoints
// ============================================================================

function emitWebhookEvent(type: MetronomeWebhookEvent['type'], data: any) {
  const event: MetronomeWebhookEvent = {
    id: `evt_${uuidv4()}`,
    type,
    data,
    created_at: new Date().toISOString(),
  };

  storage.webhookEvents.push(event);
  console.log(`[Webhook] ${type}`, event.id);
}

app.get('/api/v1/webhooks/events', authenticate, (req: Request, res: Response) => {
  const events = storage.webhookEvents;
  res.json({ data: events, total: events.length });
});

// ============================================================================
// Health Check
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'mock-metronome-server' });
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, () => {
  console.log(`🚀 Mock Metronome Server running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/health`);
});

export default app;


