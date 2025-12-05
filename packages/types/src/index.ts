/**
 * Shared TypeScript types and interfaces for Metronome billing integration
 */

// ============================================================================
// Billing Entities
// ============================================================================

export type BillingEntityType = 'user' | 'organization';

export interface BillingEntity {
  id: string;
  type: BillingEntityType;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BillingEntity {
  type: 'user';
}

export interface Organization extends BillingEntity {
  type: 'organization';
  members?: string[]; // User IDs
}

// ============================================================================
// Billing Tiers
// ============================================================================

export type BillingTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface TierConfig {
  id: BillingTier;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  monthlyCredits: number;
  features: string[];
  maxStorageGB?: number;
  maxInferenceRequests?: number;
}

export const DEFAULT_TIER_CONFIGS: Record<BillingTier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyCredits: 1000,
    features: ['Basic storage', 'Public repositories'],
    maxStorageGB: 15,
    maxInferenceRequests: 1000,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 9,
    yearlyPrice: 90, // ~$7.50/month when paid yearly
    monthlyCredits: 10000,
    features: ['Unlimited storage', 'Private repositories', 'Priority support'],
    maxStorageGB: 100,
    maxInferenceRequests: 10000,
  },
  team: {
    id: 'team',
    name: 'Team',
    monthlyPrice: 29,
    yearlyPrice: 290, // ~$24/month when paid yearly
    monthlyCredits: 50000,
    features: ['Everything in Pro', 'Team collaboration', 'Advanced analytics'],
    maxStorageGB: 500,
    maxInferenceRequests: 50000,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 0, // Custom pricing
    yearlyPrice: 0, // Custom pricing
    monthlyCredits: 0, // Custom credits
    features: ['Everything in Team', 'Custom integrations', 'Dedicated support', 'SLA'],
    maxStorageGB: -1, // Unlimited
    maxInferenceRequests: -1, // Unlimited
  },
};

// ============================================================================
// Metronome API Types
// ============================================================================

export interface MetronomeOAuthCredentials {
  client_id: string;
  client_secret: string;
  token_url: string;
  scope?: string;
}

export interface MetronomeCustomer {
  id: string;
  entity_id: string; // Our internal entity ID
  entity_type: BillingEntityType;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface MetronomeContract {
  id: string;
  customer_id: string;
  tier: BillingTier;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  billing_period: 'monthly' | 'yearly';
  start_date: string;
  end_date?: string;
  cancelled_at?: string;
  rate_card_id: string;
  created_at: string;
  updated_at: string;
}

export interface MetronomeInvoice {
  id: string;
  customer_id: string;
  contract_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  due_date: string;
  paid_at?: string;
  created_at: string;
  line_items: MetronomeInvoiceLineItem[];
}

export interface MetronomeInvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface MetronomeCredit {
  id: string;
  customer_id: string;
  amount: number;
  balance: number;
  currency: string;
  expires_at?: string;
  created_at: string;
}

export interface MetronomeWebhookEvent {
  id: string;
  type: MetronomeWebhookEventType;
  data: any;
  created_at: string;
}

export type MetronomeWebhookEventType =
  | 'customer.created'
  | 'customer.updated'
  | 'contract.created'
  | 'contract.updated'
  | 'contract.cancelled'
  | 'invoice.created'
  | 'invoice.paid'
  | 'invoice.failed'
  | 'credit.applied'
  | 'credit.expired';

// ============================================================================
// Stripe API Types
// ============================================================================

export interface StripeCustomer {
  id: string;
  entity_id: string; // Our internal entity ID
  email: string;
  name: string;
  created: number;
  metadata?: Record<string, string>;
}

export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: number;
}

export interface StripeWebhookEvent {
  id: string;
  type: StripeWebhookEventType;
  data: {
    object: any;
  };
  created: number;
}

export type StripeWebhookEventType =
  | 'payment_method.attached'
  | 'payment_method.detached'
  | 'payment_intent.succeeded'
  | 'payment_intent.failed'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'customer.created'
  | 'customer.updated';

// ============================================================================
// Service Types
// ============================================================================

export interface CustomerOnboardingRequest {
  entity: BillingEntity;
  tier?: BillingTier;
  billingPeriod?: 'monthly' | 'yearly';
  paymentMethodId?: string; // Stripe payment method ID
}

export interface CustomerOnboardingResult {
  entity: BillingEntity;
  metronomeCustomer: MetronomeCustomer;
  stripeCustomer: StripeCustomer;
  contract: MetronomeContract;
  paymentMethod?: StripePaymentMethod;
}

export interface TierChangeRequest {
  entityId: string;
  newTier: BillingTier;
  billingPeriod?: 'monthly' | 'yearly';
  effectiveDate?: Date;
}

export interface TierChangeResult {
  entityId: string;
  oldTier: BillingTier;
  newTier: BillingTier;
  contract: MetronomeContract;
  proratedAmount?: number;
}

export interface SubscriptionStatus {
  entityId: string;
  tier: BillingTier;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  creditsBalance: number;
  nextInvoiceDate?: Date;
}

// ============================================================================
// Storage Types
// ============================================================================

export interface StorageData {
  entities: Record<string, BillingEntity>;
  metronomeCustomers: Record<string, MetronomeCustomer>;
  stripeCustomers: Record<string, StripeCustomer>;
  contracts: Record<string, MetronomeContract>;
  invoices: Record<string, MetronomeInvoice>;
  credits: Record<string, MetronomeCredit>;
  webhookEvents: MetronomeWebhookEvent[];
}

