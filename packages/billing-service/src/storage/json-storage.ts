/**
 * JSON File Storage Layer
 * 
 * Provides persistence for billing data using JSON files.
 * In production, this would be replaced with a proper database.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  StorageData,
  BillingEntity,
  MetronomeCustomer,
  StripeCustomer,
  MetronomeContract,
  MetronomeInvoice,
  MetronomeCredit,
  MetronomeWebhookEvent,
} from '@metronome-integration/types';

export class JsonStorage {
  private dataDir: string;
  private dataFile: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.dataFile = path.join(dataDir, 'billing-data.json');
  }

  /**
   * Initialize storage directory and load existing data
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Initialize file if it doesn't exist
    try {
      await fs.access(this.dataFile);
    } catch {
      const initialData: StorageData = {
        entities: {},
        metronomeCustomers: {},
        stripeCustomers: {},
        contracts: {},
        invoices: {},
        credits: {},
        webhookEvents: [],
      };
      await this.writeData(initialData);
    }
  }

  /**
   * Read data from JSON file
   */
  private async readData(): Promise<StorageData> {
    try {
      const content = await fs.readFile(this.dataFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to read storage file: ${error}`);
    }
  }

  /**
   * Write data to JSON file
   */
  private async writeData(data: StorageData): Promise<void> {
    try {
      await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write storage file: ${error}`);
    }
  }

  // ========================================================================
  // Entity Operations
  // ========================================================================

  async saveEntity(entity: BillingEntity): Promise<void> {
    const data = await this.readData();
    data.entities[entity.id] = entity;
    await this.writeData(data);
  }

  async getEntity(id: string): Promise<BillingEntity | null> {
    const data = await this.readData();
    return data.entities[id] || null;
  }

  async getAllEntities(): Promise<BillingEntity[]> {
    const data = await this.readData();
    return Object.values(data.entities);
  }

  // ========================================================================
  // Metronome Customer Operations
  // ========================================================================

  async saveMetronomeCustomer(customer: MetronomeCustomer): Promise<void> {
    const data = await this.readData();
    data.metronomeCustomers[customer.id] = customer;
    await this.writeData(data);
  }

  async getMetronomeCustomer(id: string): Promise<MetronomeCustomer | null> {
    const data = await this.readData();
    return data.metronomeCustomers[id] || null;
  }

  async getMetronomeCustomerByEntityId(entityId: string): Promise<MetronomeCustomer | null> {
    const data = await this.readData();
    return (
      (Object.values(data.metronomeCustomers) as MetronomeCustomer[]).find(
        (c) => c.entity_id === entityId
      ) || null
    );
  }

  // ========================================================================
  // Stripe Customer Operations
  // ========================================================================

  async saveStripeCustomer(customer: StripeCustomer): Promise<void> {
    const data = await this.readData();
    data.stripeCustomers[customer.id] = customer;
    await this.writeData(data);
  }

  async getStripeCustomer(id: string): Promise<StripeCustomer | null> {
    const data = await this.readData();
    return data.stripeCustomers[id] || null;
  }

  async getStripeCustomerByEntityId(entityId: string): Promise<StripeCustomer | null> {
    const data = await this.readData();
    return (
      (Object.values(data.stripeCustomers) as StripeCustomer[]).find(
        (c) => c.entity_id === entityId
      ) || null
    );
  }

  // ========================================================================
  // Contract Operations
  // ========================================================================

  async saveContract(contract: MetronomeContract): Promise<void> {
    const data = await this.readData();
    data.contracts[contract.id] = contract;
    await this.writeData(data);
  }

  async getContract(id: string): Promise<MetronomeContract | null> {
    const data = await this.readData();
    return data.contracts[id] || null;
  }

  async getContractsByCustomerId(customerId: string): Promise<MetronomeContract[]> {
    const data = await this.readData();
    return (Object.values(data.contracts) as MetronomeContract[]).filter(
      (c) => c.customer_id === customerId
    );
  }

  async getActiveContractByCustomerId(customerId: string): Promise<MetronomeContract | null> {
    const contracts = await this.getContractsByCustomerId(customerId);
    return contracts.find((c) => c.status === 'active') || null;
  }

  // ========================================================================
  // Invoice Operations
  // ========================================================================

  async saveInvoice(invoice: MetronomeInvoice): Promise<void> {
    const data = await this.readData();
    data.invoices[invoice.id] = invoice;
    await this.writeData(data);
  }

  async getInvoice(id: string): Promise<MetronomeInvoice | null> {
    const data = await this.readData();
    return data.invoices[id] || null;
  }

  async getInvoicesByCustomerId(customerId: string): Promise<MetronomeInvoice[]> {
    const data = await this.readData();
    return (Object.values(data.invoices) as MetronomeInvoice[]).filter(
      (i) => i.customer_id === customerId
    );
  }

  // ========================================================================
  // Credit Operations
  // ========================================================================

  async saveCredit(credit: MetronomeCredit): Promise<void> {
    const data = await this.readData();
    data.credits[credit.id] = credit;
    await this.writeData(data);
  }

  async getCreditsByCustomerId(customerId: string): Promise<MetronomeCredit[]> {
    const data = await this.readData();
    return (Object.values(data.credits) as MetronomeCredit[]).filter(
      (c) => c.customer_id === customerId
    );
  }

  // ========================================================================
  // Webhook Event Operations
  // ========================================================================

  async saveWebhookEvent(event: MetronomeWebhookEvent): Promise<void> {
    const data = await this.readData();
    data.webhookEvents.push(event);
    // Keep only last 1000 events
    if (data.webhookEvents.length > 1000) {
      data.webhookEvents = data.webhookEvents.slice(-1000);
    }
    await this.writeData(data);
  }

  async getWebhookEvents(limit?: number): Promise<MetronomeWebhookEvent[]> {
    const data = await this.readData();
    const events = data.webhookEvents.slice().reverse(); // Most recent first
    return limit ? events.slice(0, limit) : events;
  }
}

