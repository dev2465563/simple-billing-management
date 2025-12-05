/**
 * Stripe API Client
 * 
 * Handles Stripe payment operations including customer management,
 * payment methods, and payment processing.
 */

import Stripe from 'stripe';
import { StripeCustomer, StripePaymentMethod } from '@metronome-integration/types';

export class StripeClient {
  private stripe: Stripe;
  private webhookSecret?: string;

  constructor(secretKey: string, webhookSecret?: string) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });
    this.webhookSecret = webhookSecret;
  }

  // ========================================================================
  // Customer Operations
  // ========================================================================

  async createCustomer(params: {
    entity_id: string;
    email: string;
    name: string;
    metadata?: Record<string, string>;
  }): Promise<StripeCustomer> {
    const customer = await this.stripe.customers.create({
      email: params.email,
      name: params.name,
      metadata: {
        entity_id: params.entity_id,
        ...params.metadata,
      },
    });

    return this.mapStripeCustomer(customer);
  }

  async getCustomer(id: string): Promise<StripeCustomer> {
    const customer = await this.stripe.customers.retrieve(id);
    if (customer.deleted) {
      throw new Error(`Customer ${id} has been deleted`);
    }
    return this.mapStripeCustomer(customer as Stripe.Customer);
  }

  async updateCustomer(
    id: string,
    updates: Partial<{ email: string; name: string; metadata: Record<string, string> }>
  ): Promise<StripeCustomer> {
    const customer = await this.stripe.customers.update(id, updates);
    return this.mapStripeCustomer(customer);
  }

  async listCustomers(params?: { email?: string; limit?: number }): Promise<StripeCustomer[]> {
    const customers = await this.stripe.customers.list({
      email: params?.email,
      limit: params?.limit || 100,
    });

    return customers.data.map((c) => this.mapStripeCustomer(c));
  }

  // ========================================================================
  // Payment Method Operations
  // ========================================================================

  async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<StripePaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return this.mapPaymentMethod(paymentMethod);
  }

  async detachPaymentMethod(paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.detach(paymentMethodId);
  }

  async listPaymentMethods(customerId: string): Promise<StripePaymentMethod[]> {
    const paymentMethods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return paymentMethods.data.map((pm) => this.mapPaymentMethod(pm));
  }

  async getPaymentMethod(id: string): Promise<StripePaymentMethod> {
    const paymentMethod = await this.stripe.paymentMethods.retrieve(id);
    return this.mapPaymentMethod(paymentMethod);
  }

  // ========================================================================
  // Payment Processing
  // ========================================================================

  async createPaymentIntent(params: {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.create({
      amount: params.amount * 100, // Convert to cents
      currency: params.currency.toLowerCase(),
      customer: params.customerId,
      payment_method: params.paymentMethodId,
      confirm: params.paymentMethodId ? true : false,
      metadata: params.metadata || {},
    });
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId?: string
  ): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    });
  }

  async getPaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.retrieve(id);
  }

  // ========================================================================
  // Charge Operations
  // ========================================================================

  async createCharge(params: {
    amount: number;
    currency: string;
    customerId: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, string>;
  }): Promise<Stripe.Charge> {
    const chargeParams: Stripe.ChargeCreateParams = {
      amount: params.amount * 100, // Convert to cents
      currency: params.currency.toLowerCase(),
      customer: params.customerId,
      description: params.description,
      metadata: params.metadata || {},
    };

    // If payment method is provided, use it as source
    if (params.paymentMethodId) {
      chargeParams.source = params.paymentMethodId;
    }

    return await this.stripe.charges.create(chargeParams);
  }

  async getCharge(id: string): Promise<Stripe.Charge> {
    return await this.stripe.charges.retrieve(id);
  }

  // ========================================================================
  // Webhook Verification
  // ========================================================================

  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private mapStripeCustomer(customer: Stripe.Customer): StripeCustomer {
    return {
      id: customer.id,
      entity_id: customer.metadata?.entity_id || '',
      email: customer.email || '',
      name: customer.name || '',
      created: customer.created,
      metadata: customer.metadata || {},
    };
  }

  private mapPaymentMethod(paymentMethod: Stripe.PaymentMethod): StripePaymentMethod {
    return {
      id: paymentMethod.id,
      type: paymentMethod.type === 'card' ? 'card' : 'bank_account',
      card:
        paymentMethod.type === 'card' && paymentMethod.card
          ? {
              brand: paymentMethod.card.brand,
              last4: paymentMethod.card.last4,
              exp_month: paymentMethod.card.exp_month,
              exp_year: paymentMethod.card.exp_year,
            }
          : undefined,
      created: paymentMethod.created,
    };
  }
}

