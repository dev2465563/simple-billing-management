/**
 * Webhook Service
 * 
 * Handles webhook events from Metronome and Stripe.
 * Processes events asynchronously with retry logic and idempotency.
 */

import {
  MetronomeWebhookEvent,
  MetronomeWebhookEventType,
  StripeWebhookEvent,
  StripeWebhookEventType,
} from '@metronome-integration/types';
import { MetronomeClient } from '../clients/metronome-client';
import { StripeClient } from '../clients/stripe-client';
import { JsonStorage } from '../storage/json-storage';

interface ProcessedEvent {
  id: string;
  processedAt: Date;
}

export class WebhookService {
  private processedEvents = new Set<string>(); // In-memory cache for idempotency
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor(
    private metronomeClient: MetronomeClient,
    private stripeClient: StripeClient,
    private storage: JsonStorage
  ) {}

  // ========================================================================
  // Metronome Webhook Handlers
  // ========================================================================

  /**
   * Process Metronome webhook event
   */
  async processMetronomeWebhook(event: MetronomeWebhookEvent): Promise<void> {
    // Check idempotency
    if (this.processedEvents.has(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    try {
      // Save event to storage
      await this.storage.saveWebhookEvent(event);

      // Process based on event type
      await this.handleMetronomeEvent(event.type, event.data);

      // Mark as processed
      this.processedEvents.add(event.id);
    } catch (error) {
      console.error(`Failed to process Metronome webhook ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle specific Metronome event types
   */
  private async handleMetronomeEvent(
    eventType: MetronomeWebhookEventType,
    data: any
  ): Promise<void> {
    switch (eventType) {
      case 'customer.created':
        await this.handleCustomerCreated(data);
        break;
      case 'customer.updated':
        await this.handleCustomerUpdated(data);
        break;
      case 'contract.created':
        await this.handleContractCreated(data);
        break;
      case 'contract.updated':
        await this.handleContractUpdated(data);
        break;
      case 'contract.cancelled':
        await this.handleContractCancelled(data);
        break;
      case 'invoice.created':
        await this.handleInvoiceCreated(data);
        break;
      case 'invoice.paid':
        await this.handleInvoicePaid(data);
        break;
      case 'invoice.failed':
        await this.handleInvoiceFailed(data);
        break;
      case 'credit.applied':
        await this.handleCreditApplied(data);
        break;
      case 'credit.expired':
        await this.handleCreditExpired(data);
        break;
      default:
        console.warn(`Unknown Metronome event type: ${eventType}`);
    }
  }

  private async handleCustomerCreated(data: any): Promise<void> {
    console.log(`Customer created: ${data.id}`);
    // Additional business logic can be added here
  }

  private async handleCustomerUpdated(data: any): Promise<void> {
    console.log(`Customer updated: ${data.id}`);
    // Additional business logic can be added here
  }

  private async handleContractCreated(data: any): Promise<void> {
    console.log(`Contract created: ${data.id} for customer ${data.customer_id}`);
    // Additional business logic can be added here
  }

  private async handleContractUpdated(data: any): Promise<void> {
    console.log(`Contract updated: ${data.id}`);
    // Additional business logic can be added here
  }

  private async handleContractCancelled(data: any): Promise<void> {
    console.log(`Contract cancelled: ${data.id}`);
    // Additional business logic can be added here
  }

  private async handleInvoiceCreated(data: any): Promise<void> {
    console.log(`Invoice created: ${data.id} for ${data.amount} ${data.currency}`);
    // Additional business logic can be added here
    // e.g., send notification, trigger payment processing
  }

  private async handleInvoicePaid(data: any): Promise<void> {
    console.log(`Invoice paid: ${data.id}`);
    // Additional business logic can be added here
    // e.g., update subscription status, send confirmation
  }

  private async handleInvoiceFailed(data: any): Promise<void> {
    console.log(`Invoice failed: ${data.id}`);
    // Additional business logic can be added here
    // e.g., retry payment, notify customer, suspend service
  }

  private async handleCreditApplied(data: any): Promise<void> {
    console.log(`Credit applied: ${data.id} for ${data.amount} ${data.currency}`);
    // Additional business logic can be added here
  }

  private async handleCreditExpired(data: any): Promise<void> {
    console.log(`Credit expired: ${data.id}`);
    // Additional business logic can be added here
  }

  // ========================================================================
  // Stripe Webhook Handlers
  // ========================================================================

  /**
   * Process Stripe webhook event
   */
  async processStripeWebhook(event: StripeWebhookEvent): Promise<void> {
    // Check idempotency
    if (this.processedEvents.has(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`);
      return;
    }

    try {
      // Process based on event type
      await this.handleStripeEvent(event.type, event.data.object);

      // Mark as processed
      this.processedEvents.add(event.id);
    } catch (error) {
      console.error(`Failed to process Stripe webhook ${event.id}:`, error);
      throw error;
    }
  }

  /**
   * Handle specific Stripe event types
   */
  private async handleStripeEvent(eventType: StripeWebhookEventType, data: any): Promise<void> {
    switch (eventType) {
      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(data);
        break;
      case 'payment_method.detached':
        await this.handlePaymentMethodDetached(data);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(data);
        break;
      case 'payment_intent.failed':
        await this.handlePaymentIntentFailed(data);
        break;
      case 'charge.succeeded':
        await this.handleChargeSucceeded(data);
        break;
      case 'charge.failed':
        await this.handleChargeFailed(data);
        break;
      case 'customer.created':
        await this.handleStripeCustomerCreated(data);
        break;
      case 'customer.updated':
        await this.handleStripeCustomerUpdated(data);
        break;
      default:
        console.warn(`Unknown Stripe event type: ${eventType}`);
    }
  }

  private async handlePaymentMethodAttached(data: any): Promise<void> {
    console.log(`Payment method attached: ${data.id} to customer ${data.customer}`);
    // Additional business logic can be added here
  }

  private async handlePaymentMethodDetached(data: any): Promise<void> {
    console.log(`Payment method detached: ${data.id}`);
    // Additional business logic can be added here
  }

  private async handlePaymentIntentSucceeded(data: any): Promise<void> {
    console.log(`Payment intent succeeded: ${data.id}`);
    // Additional business logic can be added here
    // e.g., update invoice status in Metronome
  }

  private async handlePaymentIntentFailed(data: any): Promise<void> {
    console.log(`Payment intent failed: ${data.id}`);
    // Additional business logic can be added here
    // e.g., retry payment, notify customer
  }

  private async handleChargeSucceeded(data: any): Promise<void> {
    console.log(`Charge succeeded: ${data.id} for ${data.amount / 100} ${data.currency}`);
    // Additional business logic can be added here
  }

  private async handleChargeFailed(data: any): Promise<void> {
    console.log(`Charge failed: ${data.id}`);
    // Additional business logic can be added here
    // e.g., retry payment, suspend service
  }

  private async handleStripeCustomerCreated(data: any): Promise<void> {
    console.log(`Stripe customer created: ${data.id}`);
    // Additional business logic can be added here
  }

  private async handleStripeCustomerUpdated(data: any): Promise<void> {
    console.log(`Stripe customer updated: ${data.id}`);
    // Additional business logic can be added here
  }

  // ========================================================================
  // Retry Logic
  // ========================================================================

  /**
   * Retry webhook processing with exponential backoff
   */
  async retryWebhookProcessing<T>(
    fn: () => Promise<T>,
    retries: number = this.maxRetries
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await this.delay(this.retryDelay * (this.maxRetries - retries + 1));
        return this.retryWebhookProcessing(fn, retries - 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}


