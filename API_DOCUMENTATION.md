# API Documentation

## Metronome API Client

### Authentication

The Metronome client uses OAuth 2.0 client credentials flow for authentication.

```typescript
import { MetronomeClient } from '@billing-service';
import { MetronomeOAuthCredentials } from '@metronome-integration/types';

const credentials: MetronomeOAuthCredentials = {
  client_id: 'your_client_id',
  client_secret: 'your_client_secret',
  token_url: 'http://localhost:3001/oauth/token',
  scope: 'billing:read billing:write',
};

const client = new MetronomeClient('http://localhost:3001', credentials);
```

### Customer Operations

#### Create Customer

```typescript
const customer = await client.createCustomer({
  entity_id: 'user-123',
  entity_type: 'user',
  email: 'user@example.com',
  name: 'John Doe',
  metadata: { /* optional */ },
});
```

#### Get Customer

```typescript
const customer = await client.getCustomer('cust_123');
```

#### Update Customer

```typescript
const updated = await client.updateCustomer('cust_123', {
  name: 'Jane Doe',
  email: 'jane@example.com',
});
```

#### List Customers

```typescript
const { data, total } = await client.listCustomers();
```

### Contract Operations

#### Create Contract

```typescript
const contract = await client.createContract({
  customer_id: 'cust_123',
  tier: 'pro',
  billing_period: 'monthly',
  rate_card_id: 'rate_pro', // optional
});
```

#### Get Contract

```typescript
const contract = await client.getContract('contract_123');
```

#### Update Contract

```typescript
const updated = await client.updateContract('contract_123', {
  tier: 'team',
  billing_period: 'yearly',
});
```

#### Cancel Contract

```typescript
const cancelled = await client.cancelContract('contract_123');
```

#### List Contracts

```typescript
// All contracts
const { data, total } = await client.listContracts();

// Contracts for specific customer
const { data, total } = await client.listContracts('cust_123');
```

### Invoice Operations

#### Create Invoice

```typescript
const invoice = await client.createInvoice({
  customer_id: 'cust_123',
  contract_id: 'contract_123',
  amount: 29.00,
  currency: 'USD',
  line_items: [ /* optional */ ],
});
```

#### Get Invoice

```typescript
const invoice = await client.getInvoice('inv_123');
```

#### Pay Invoice

```typescript
const paid = await client.payInvoice('inv_123');
```

#### List Invoices

```typescript
// All invoices
const { data, total } = await client.listInvoices();

// Invoices for specific customer
const { data, total } = await client.listInvoices('cust_123');
```

### Credit Operations

#### Apply Credit

```typescript
const credit = await client.applyCredit({
  customer_id: 'cust_123',
  amount: 1000,
  currency: 'USD',
  expires_at: '2024-12-31T23:59:59Z', // optional
});
```

#### Get Credit Balance

```typescript
const balance = await client.getCreditBalance('cust_123');
// Returns: { customer_id, balance, currency, credits: [...] }
```

#### List Credits

```typescript
// All credits
const { data, total } = await client.listCredits();

// Credits for specific customer
const { data, total } = await client.listCredits('cust_123');
```

## Stripe API Client

### Initialize Client

```typescript
import { StripeClient } from '@billing-service';

const client = new StripeClient(
  'sk_test_your_secret_key',
  'whsec_your_webhook_secret' // optional
);
```

### Customer Operations

#### Create Customer

```typescript
const customer = await client.createCustomer({
  entity_id: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
  metadata: { /* optional */ },
});
```

#### Get Customer

```typescript
const customer = await client.getCustomer('cus_123');
```

#### Update Customer

```typescript
const updated = await client.updateCustomer('cus_123', {
  email: 'newemail@example.com',
  name: 'Jane Doe',
});
```

#### List Customers

```typescript
const customers = await client.listCustomers({
  email: 'user@example.com', // optional filter
  limit: 100, // optional
});
```

### Payment Method Operations

#### Attach Payment Method

```typescript
const paymentMethod = await client.attachPaymentMethod(
  'cus_123',
  'pm_1234567890'
);
```

#### Detach Payment Method

```typescript
await client.detachPaymentMethod('pm_1234567890');
```

#### List Payment Methods

```typescript
const methods = await client.listPaymentMethods('cus_123');
```

#### Get Payment Method

```typescript
const method = await client.getPaymentMethod('pm_1234567890');
```

### Payment Processing

#### Create Payment Intent

```typescript
const paymentIntent = await client.createPaymentIntent({
  amount: 29.00,
  currency: 'USD',
  customerId: 'cus_123',
  paymentMethodId: 'pm_1234567890', // optional
  metadata: { /* optional */ },
});
```

#### Confirm Payment Intent

```typescript
const confirmed = await client.confirmPaymentIntent(
  'pi_1234567890',
  'pm_1234567890' // optional
);
```

#### Get Payment Intent

```typescript
const intent = await client.getPaymentIntent('pi_1234567890');
```

#### Create Charge

```typescript
const charge = await client.createCharge({
  amount: 29.00,
  currency: 'USD',
  customerId: 'cus_123',
  paymentMethodId: 'pm_1234567890', // optional
  description: 'Subscription payment',
  metadata: { /* optional */ },
});
```

#### Get Charge

```typescript
const charge = await client.getCharge('ch_1234567890');
```

### Webhook Verification

```typescript
const event = client.verifyWebhookSignature(
  rawBody, // Buffer or string
  signature // From Stripe-Signature header
);
```

## Customer Onboarding Service

### Onboard Customer

```typescript
import { CustomerOnboardingService } from '@billing-service';

const service = new CustomerOnboardingService(
  metronomeClient,
  stripeClient,
  storage
);

const result = await service.onboardCustomer({
  entity: {
    id: 'user-123',
    type: 'user',
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  tier: 'pro', // optional, defaults to 'free'
  billingPeriod: 'monthly', // optional, defaults to 'monthly'
  paymentMethodId: 'pm_1234567890', // optional
});
```

### Get Onboarding Status

```typescript
const status = await service.getOnboardingStatus('user-123');
// Returns: { onboarded: boolean, metronomeCustomerId?, stripeCustomerId?, contractId? }
```

## Tier Management Service

### Change Tier

```typescript
import { TierManagementService } from '@billing-service';

const service = new TierManagementService(
  metronomeClient,
  stripeClient,
  storage
);

const result = await service.changeTier({
  entityId: 'user-123',
  newTier: 'team',
  billingPeriod: 'yearly', // optional
  effectiveDate: new Date(), // optional
});
```

### Get Subscription Status

```typescript
const status = await service.getSubscriptionStatus('user-123');
// Returns: {
//   entityId: string,
//   tier: BillingTier,
//   status: 'active' | 'cancelled' | 'expired' | 'pending',
//   currentPeriodStart: Date,
//   currentPeriodEnd: Date,
//   creditsBalance: number,
//   nextInvoiceDate?: Date,
// }
```

### Cancel Subscription

```typescript
await service.cancelSubscription('user-123');
```

### Reactivate Subscription

```typescript
await service.reactivateSubscription(
  'user-123',
  'pro', // optional tier, uses last tier if not provided
  'monthly' // optional billing period
);
```

## Webhook Service

### Process Metronome Webhook

```typescript
import { WebhookService } from '@billing-service';

const service = new WebhookService(
  metronomeClient,
  stripeClient,
  storage
);

await service.processMetronomeWebhook({
  id: 'evt_123',
  type: 'invoice.paid',
  data: { /* event data */ },
  created_at: new Date().toISOString(),
});
```

### Process Stripe Webhook

```typescript
await service.processStripeWebhook({
  id: 'evt_123',
  type: 'payment_intent.succeeded',
  data: { object: { /* Stripe object */ } },
  created: Date.now(),
});
```

### Retry Webhook Processing

```typescript
await service.retryWebhookProcessing(async () => {
  // Your webhook processing logic
  return await processWebhook(event);
});
```

## Storage Operations

### Initialize Storage

```typescript
import { JsonStorage } from '@billing-service';

const storage = new JsonStorage('./data');
await storage.initialize();
```

### Entity Operations

```typescript
// Save entity
await storage.saveEntity(entity);

// Get entity
const entity = await storage.getEntity('entity-123');

// Get all entities
const entities = await storage.getAllEntities();
```

### Metronome Customer Operations

```typescript
// Save customer
await storage.saveMetronomeCustomer(customer);

// Get customer by ID
const customer = await storage.getMetronomeCustomer('cust_123');

// Get customer by entity ID
const customer = await storage.getMetronomeCustomerByEntityId('user-123');
```

### Stripe Customer Operations

```typescript
// Save customer
await storage.saveStripeCustomer(customer);

// Get customer by ID
const customer = await storage.getStripeCustomer('cus_123');

// Get customer by entity ID
const customer = await storage.getStripeCustomerByEntityId('user-123');
```

### Contract Operations

```typescript
// Save contract
await storage.saveContract(contract);

// Get contract
const contract = await storage.getContract('contract_123');

// Get contracts by customer
const contracts = await storage.getContractsByCustomerId('cust_123');

// Get active contract
const contract = await storage.getActiveContractByCustomerId('cust_123');
```

### Invoice Operations

```typescript
// Save invoice
await storage.saveInvoice(invoice);

// Get invoice
const invoice = await storage.getInvoice('inv_123');

// Get invoices by customer
const invoices = await storage.getInvoicesByCustomerId('cust_123');
```

### Credit Operations

```typescript
// Save credit
await storage.saveCredit(credit);

// Get credits by customer
const credits = await storage.getCreditsByCustomerId('cust_123');
```

### Webhook Event Operations

```typescript
// Save webhook event
await storage.saveWebhookEvent(event);

// Get webhook events
const events = await storage.getWebhookEvents(100); // optional limit
```


