/**
 * Customer Onboarding Service
 * 
 * Handles the complete customer onboarding process:
 * 1. Create customer in Metronome
 * 2. Create customer in Stripe
 * 3. Set up initial subscription/contract
 * 4. Attach payment method (if provided)
 * 5. Initialize credits
 */

import { v4 as uuidv4 } from 'uuid';
import {
  BillingEntity,
  CustomerOnboardingRequest,
  CustomerOnboardingResult,
  BillingTier,
  DEFAULT_TIER_CONFIGS,
} from '@metronome-integration/types';
import { MetronomeClient } from '../clients/metronome-client';
import { StripeClient } from '../clients/stripe-client';
import { JsonStorage } from '../storage/json-storage';

export class CustomerOnboardingService {
  constructor(
    private metronomeClient: MetronomeClient,
    private stripeClient: StripeClient,
    private storage: JsonStorage
  ) {}

  /**
   * Onboard a new customer (user or organization)
   */
  async onboardCustomer(request: CustomerOnboardingRequest): Promise<CustomerOnboardingResult> {
    const { entity, tier = 'free', billingPeriod = 'monthly', paymentMethodId } = request;

    // Generate entity ID if not provided
    if (!entity.id) {
      entity.id = uuidv4();
    }

    // Set timestamps
    const now = new Date();
    entity.createdAt = now;
    entity.updatedAt = now;

    // 1. Save entity locally
    await this.storage.saveEntity(entity);

    // 2. Create customer in Metronome
    const metronomeCustomer = await this.metronomeClient.createCustomer({
      entity_id: entity.id,
      entity_type: entity.type,
      email: entity.email,
      name: entity.name,
      metadata: {
        created_at: entity.createdAt.toISOString(),
      },
    });

    // Save Metronome customer
    await this.storage.saveMetronomeCustomer(metronomeCustomer);

    // 3. Create customer in Stripe
    const stripeCustomer = await this.stripeClient.createCustomer({
      entity_id: entity.id,
      email: entity.email,
      name: entity.name,
      metadata: {
        metronome_customer_id: metronomeCustomer.id,
        entity_type: entity.type,
      },
    });

    // Save Stripe customer
    await this.storage.saveStripeCustomer(stripeCustomer);

    // 4. Attach payment method if provided
    let paymentMethod;
    if (paymentMethodId) {
      try {
        paymentMethod = await this.stripeClient.attachPaymentMethod(
          stripeCustomer.id,
          paymentMethodId
        );
      } catch (error) {
        console.warn(`Failed to attach payment method: ${error}`);
        // Continue onboarding even if payment method attachment fails
      }
    }

    // 5. Create initial contract/subscription
    const tierConfig = DEFAULT_TIER_CONFIGS[tier];
    const contract = await this.metronomeClient.createContract({
      customer_id: metronomeCustomer.id,
      tier,
      billing_period: billingPeriod,
      rate_card_id: `rate_${tier}`,
    });

    // Save contract
    await this.storage.saveContract(contract);

    // 6. Generate initial invoice if tier is not free
    if (tier !== 'free' && tierConfig.monthlyPrice > 0) {
      try {
        const invoice = await this.metronomeClient.createInvoice({
          customer_id: metronomeCustomer.id,
          contract_id: contract.id,
          amount: billingPeriod === 'monthly' ? tierConfig.monthlyPrice : tierConfig.yearlyPrice,
          currency: 'USD',
        });

        await this.storage.saveInvoice(invoice);

        // Process payment if payment method is available
        if (paymentMethod) {
          try {
            await this.processInitialPayment(stripeCustomer.id, invoice, paymentMethod.id);
            await this.metronomeClient.payInvoice(invoice.id);
          } catch (error) {
            console.warn(`Failed to process initial payment: ${error}`);
            // Invoice remains unpaid, will be retried later
          }
        }
      } catch (error) {
        console.warn(`Failed to create initial invoice: ${error}`);
      }
    }

    return {
      entity,
      metronomeCustomer,
      stripeCustomer,
      contract,
      paymentMethod,
    };
  }

  /**
   * Process initial payment for subscription
   */
  private async processInitialPayment(
    stripeCustomerId: string,
    invoice: { id: string; amount: number; currency: string },
    paymentMethodId: string
  ): Promise<void> {
    try {
      // Create payment intent
      const paymentIntent = await this.stripeClient.createPaymentIntent({
        amount: invoice.amount,
        currency: invoice.currency,
        customerId: stripeCustomerId,
        paymentMethodId,
        metadata: {
          invoice_id: invoice.id,
          type: 'subscription_initial_payment',
        },
      });

      // If payment intent needs confirmation, confirm it
      if (paymentIntent.status === 'requires_confirmation') {
        await this.stripeClient.confirmPaymentIntent(paymentIntent.id, paymentMethodId);
      }
    } catch (error) {
      throw new Error(`Payment processing failed: ${error}`);
    }
  }

  /**
   * Get onboarding status for an entity
   */
  async getOnboardingStatus(entityId: string): Promise<{
    onboarded: boolean;
    metronomeCustomerId?: string;
    stripeCustomerId?: string;
    contractId?: string;
  }> {
    const metronomeCustomer = await this.storage.getMetronomeCustomerByEntityId(entityId);
    const stripeCustomer = await this.storage.getStripeCustomerByEntityId(entityId);

    if (!metronomeCustomer || !stripeCustomer) {
      return { onboarded: false };
    }

    const contract = await this.storage.getActiveContractByCustomerId(metronomeCustomer.id);

    return {
      onboarded: true,
      metronomeCustomerId: metronomeCustomer.id,
      stripeCustomerId: stripeCustomer.id,
      contractId: contract?.id,
    };
  }
}

