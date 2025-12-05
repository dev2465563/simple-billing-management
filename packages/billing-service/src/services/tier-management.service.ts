/**
 * Tier Management Service
 * 
 * Handles billing tier upgrades, downgrades, and subscription lifecycle management.
 * Includes prorating logic and credit adjustments.
 */

import {
  TierChangeRequest,
  TierChangeResult,
  SubscriptionStatus,
  BillingTier,
  DEFAULT_TIER_CONFIGS,
} from '@metronome-integration/types';
import { MetronomeClient } from '../clients/metronome-client';
import { StripeClient } from '../clients/stripe-client';
import { JsonStorage } from '../storage/json-storage';

export class TierManagementService {
  constructor(
    private metronomeClient: MetronomeClient,
    private stripeClient: StripeClient,
    private storage: JsonStorage
  ) {}

  /**
   * Change customer's billing tier (upgrade or downgrade)
   */
  async changeTier(request: TierChangeRequest): Promise<TierChangeResult> {
    const { entityId, newTier, billingPeriod, effectiveDate } = request;

    // Get current customer and contract
    const metronomeCustomer = await this.storage.getMetronomeCustomerByEntityId(entityId);
    if (!metronomeCustomer) {
      throw new Error(`Customer not found for entity: ${entityId}`);
    }

    const currentContract = await this.storage.getActiveContractByCustomerId(
      metronomeCustomer.id
    );
    if (!currentContract) {
      throw new Error(`No active contract found for customer: ${metronomeCustomer.id}`);
    }

    const oldTier = currentContract.tier;
    const newTierConfig = DEFAULT_TIER_CONFIGS[newTier];

    if (!newTierConfig) {
      throw new Error(`Invalid tier: ${newTier}`);
    }

    // If tier hasn't changed, just update billing period if different
    if (oldTier === newTier) {
      if (currentContract.billing_period !== billingPeriod) {
        return this.updateBillingPeriod(currentContract, billingPeriod!);
      }
      throw new Error(`Customer is already on ${newTier} tier`);
    }

    // Calculate prorated amount
    const proratedAmount = this.calculateProratedAmount(
      currentContract,
      oldTier,
      newTier,
      billingPeriod || currentContract.billing_period
    );

    // Cancel current contract
    await this.metronomeClient.cancelContract(currentContract.id);

    // Create new contract with new tier
    const newContract = await this.metronomeClient.createContract({
      customer_id: metronomeCustomer.id,
      tier: newTier,
      billing_period: billingPeriod || currentContract.billing_period,
      rate_card_id: `rate_${newTier}`,
    });

    await this.storage.saveContract(newContract);

    // Adjust credits based on tier change
    await this.adjustCreditsForTierChange(
      metronomeCustomer.id,
      oldTier,
      newTier,
      currentContract.billing_period
    );

    // Handle payment if upgrade (prorated amount > 0)
    if (proratedAmount > 0) {
      await this.processTierChangePayment(
        entityId,
        proratedAmount,
        oldTier,
        newTier
      );
    }

    // Create invoice for tier change if needed
    if (proratedAmount !== 0) {
      try {
        const invoice = await this.metronomeClient.createInvoice({
          customer_id: metronomeCustomer.id,
          contract_id: newContract.id,
          amount: Math.abs(proratedAmount),
          currency: 'USD',
          line_items: [
            {
              id: `line_${Date.now()}`,
              description: `Tier change from ${oldTier} to ${newTier}${proratedAmount < 0 ? ' (credit)' : ''}`,
              quantity: 1,
              unit_price: Math.abs(proratedAmount),
              amount: Math.abs(proratedAmount),
            },
          ],
        });

        await this.storage.saveInvoice(invoice);

        // Auto-pay if credit (downgrade)
        if (proratedAmount < 0) {
          await this.metronomeClient.payInvoice(invoice.id);
        }
      } catch (error) {
        console.warn(`Failed to create tier change invoice: ${error}`);
      }
    }

    return {
      entityId,
      oldTier,
      newTier,
      contract: newContract,
      proratedAmount,
    };
  }

  /**
   * Update billing period for existing contract
   */
  private async updateBillingPeriod(
    contract: any,
    newBillingPeriod: 'monthly' | 'yearly'
  ): Promise<TierChangeResult> {
    const updated = await this.metronomeClient.updateContract(contract.id, {
      billing_period: newBillingPeriod,
    });

    await this.storage.saveContract(updated);

    return {
      entityId: contract.customer_id,
      oldTier: contract.tier,
      newTier: contract.tier,
      contract: updated,
    };
  }

  /**
   * Calculate prorated amount for tier change
   */
  private calculateProratedAmount(
    currentContract: any,
    oldTier: BillingTier,
    newTier: BillingTier,
    billingPeriod: 'monthly' | 'yearly'
  ): number {
    const oldConfig = DEFAULT_TIER_CONFIGS[oldTier];
    const newConfig = DEFAULT_TIER_CONFIGS[newTier];

    const oldPrice = billingPeriod === 'monthly' ? oldConfig.monthlyPrice : oldConfig.yearlyPrice;
    const newPrice = billingPeriod === 'monthly' ? newConfig.monthlyPrice : newConfig.yearlyPrice;

    // Calculate days remaining in current billing period
    const startDate = new Date(currentContract.start_date);
    const endDate = new Date(currentContract.end_date || new Date());
    const now = new Date();

    if (now >= endDate) {
      // Period has ended, no proration needed
      return newPrice - oldPrice;
    }

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate prorated amounts
    const proratedOldPrice = (oldPrice / totalDays) * remainingDays;
    const proratedNewPrice = (newPrice / totalDays) * remainingDays;

    // Return difference (positive = upgrade cost, negative = downgrade credit)
    return proratedNewPrice - proratedOldPrice;
  }

  /**
   * Adjust credits when tier changes
   */
  private async adjustCreditsForTierChange(
    customerId: string,
    oldTier: BillingTier,
    newTier: BillingTier,
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<void> {
    const oldConfig = DEFAULT_TIER_CONFIGS[oldTier];
    const newConfig = DEFAULT_TIER_CONFIGS[newTier];

    // Calculate credit difference
    const creditDifference = newConfig.monthlyCredits - oldConfig.monthlyCredits;

    if (creditDifference !== 0) {
      // Apply credit adjustment
      await this.metronomeClient.applyCredit({
        customer_id: customerId,
        amount: creditDifference,
        currency: 'USD',
      });
    }
  }

  /**
   * Process payment for tier change
   */
  private async processTierChangePayment(
    customerId: string,
    amount: number,
    oldTier: BillingTier,
    newTier: BillingTier
  ): Promise<void> {
    const stripeCustomer = await this.storage.getStripeCustomerByEntityId(customerId);
    if (!stripeCustomer) {
      throw new Error(`Stripe customer not found for entity: ${customerId}`);
    }

    // Get default payment method
    const paymentMethods = await this.stripeClient.listPaymentMethods(stripeCustomer.id);
    if (paymentMethods.length === 0) {
      console.warn(`No payment method found for customer ${customerId}, skipping payment`);
      return;
    }

    const defaultPaymentMethod = paymentMethods[0];

    try {
      await this.stripeClient.createCharge({
        amount,
        currency: 'USD',
        customerId: stripeCustomer.id,
        paymentMethodId: defaultPaymentMethod.id,
        description: `Tier upgrade from ${oldTier} to ${newTier}`,
        metadata: {
          tier_change: `${oldTier}_to_${newTier}`,
        },
      });
    } catch (error) {
      throw new Error(`Failed to process tier change payment: ${error}`);
    }
  }

  /**
   * Get subscription status for an entity
   */
  async getSubscriptionStatus(entityId: string): Promise<SubscriptionStatus | null> {
    const metronomeCustomer = await this.storage.getMetronomeCustomerByEntityId(entityId);
    if (!metronomeCustomer) {
      return null;
    }

    const contract = await this.storage.getActiveContractByCustomerId(metronomeCustomer.id);
    if (!contract) {
      return null;
    }

    const creditBalance = await this.metronomeClient.getCreditBalance(metronomeCustomer.id);

    return {
      entityId,
      tier: contract.tier,
      status: contract.status,
      currentPeriodStart: new Date(contract.start_date),
      currentPeriodEnd: contract.end_date ? new Date(contract.end_date) : new Date(),
      creditsBalance: creditBalance.balance,
      nextInvoiceDate: contract.end_date ? new Date(contract.end_date) : undefined,
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(entityId: string): Promise<void> {
    const metronomeCustomer = await this.storage.getMetronomeCustomerByEntityId(entityId);
    if (!metronomeCustomer) {
      throw new Error(`Customer not found for entity: ${entityId}`);
    }

    const contract = await this.storage.getActiveContractByCustomerId(metronomeCustomer.id);
    if (!contract) {
      throw new Error(`No active contract found for customer: ${metronomeCustomer.id}`);
    }

    await this.metronomeClient.cancelContract(contract.id);
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(
    entityId: string,
    tier?: BillingTier,
    billingPeriod?: 'monthly' | 'yearly'
  ): Promise<void> {
    const metronomeCustomer = await this.storage.getMetronomeCustomerByEntityId(entityId);
    if (!metronomeCustomer) {
      throw new Error(`Customer not found for entity: ${entityId}`);
    }

    // Get the most recent contract
    const contracts = await this.storage.getContractsByCustomerId(metronomeCustomer.id);
    const lastContract = contracts.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    if (!lastContract) {
      throw new Error(`No contract found for customer: ${metronomeCustomer.id}`);
    }

    const reactivationTier = tier || lastContract.tier;
    const reactivationPeriod = billingPeriod || lastContract.billing_period;

    // Create new active contract
    await this.metronomeClient.createContract({
      customer_id: metronomeCustomer.id,
      tier: reactivationTier,
      billing_period: reactivationPeriod,
      rate_card_id: `rate_${reactivationTier}`,
    });
  }
}


