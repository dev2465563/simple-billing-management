/**
 * Metronome API Client
 * 
 * Handles OAuth authentication and API communication with Metronome.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  MetronomeOAuthCredentials,
  MetronomeCustomer,
  MetronomeContract,
  MetronomeInvoice,
  MetronomeCredit,
  BillingTier,
  BillingEntityType,
} from '@metronome-integration/types';

interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  expires_at: number;
}

export class MetronomeClient {
  private apiUrl: string;
  private credentials: MetronomeOAuthCredentials;
  private httpClient: AxiosInstance;
  private token: OAuthToken | null = null;

  constructor(apiUrl: string, credentials: MetronomeOAuthCredentials) {
    this.apiUrl = apiUrl.replace(/\/$/, ''); // Remove trailing slash
    this.credentials = credentials;
    this.httpClient = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Authenticate and get OAuth access token
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.token.expires_at > Date.now() + 60000) {
      // Token is valid for at least 1 more minute
      return this.token.access_token;
    }

    try {
      const response = await axios.post(this.credentials.token_url, {
        grant_type: 'client_credentials',
        client_id: this.credentials.client_id,
        client_secret: this.credentials.client_secret,
        scope: this.credentials.scope || 'billing:read billing:write',
      });

      const tokenData = response.data;
      this.token = {
        ...tokenData,
        expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
      };

      return this.token!.access_token;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Metronome authentication failed: ${axiosError.response?.status} ${axiosError.message}`
      );
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    const token = await this.authenticate();
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      const response = await this.httpClient.request<T>({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      throw new Error(
        `Metronome API error (${method} ${endpoint}): ${axiosError.response?.status} ${axiosError.message}`
      );
    }
  }

  // ========================================================================
  // Customer Operations
  // ========================================================================

  async createCustomer(params: {
    entity_id: string;
    entity_type: BillingEntityType;
    email: string;
    name: string;
    metadata?: Record<string, any>;
  }): Promise<MetronomeCustomer> {
    return this.request<MetronomeCustomer>('POST', '/api/v1/customers', params);
  }

  async getCustomer(id: string): Promise<MetronomeCustomer> {
    return this.request<MetronomeCustomer>('GET', `/api/v1/customers/${id}`);
  }

  async updateCustomer(id: string, updates: Partial<MetronomeCustomer>): Promise<MetronomeCustomer> {
    return this.request<MetronomeCustomer>('PATCH', `/api/v1/customers/${id}`, updates);
  }

  async listCustomers(): Promise<{ data: MetronomeCustomer[]; total: number }> {
    return this.request<{ data: MetronomeCustomer[]; total: number }>('GET', '/api/v1/customers');
  }

  // ========================================================================
  // Contract Operations
  // ========================================================================

  async createContract(params: {
    customer_id: string;
    tier: BillingTier;
    billing_period: 'monthly' | 'yearly';
    rate_card_id?: string;
  }): Promise<MetronomeContract> {
    return this.request<MetronomeContract>('POST', '/api/v1/contracts', params);
  }

  async getContract(id: string): Promise<MetronomeContract> {
    return this.request<MetronomeContract>('GET', `/api/v1/contracts/${id}`);
  }

  async updateContract(id: string, updates: Partial<MetronomeContract>): Promise<MetronomeContract> {
    return this.request<MetronomeContract>('PATCH', `/api/v1/contracts/${id}`, updates);
  }

  async cancelContract(id: string): Promise<MetronomeContract> {
    return this.request<MetronomeContract>('POST', `/api/v1/contracts/${id}/cancel`);
  }

  async listContracts(customerId?: string): Promise<{ data: MetronomeContract[]; total: number }> {
    const url = customerId
      ? `/api/v1/contracts?customer_id=${customerId}`
      : '/api/v1/contracts';
    return this.request<{ data: MetronomeContract[]; total: number }>('GET', url);
  }

  // ========================================================================
  // Invoice Operations
  // ========================================================================

  async createInvoice(params: {
    customer_id: string;
    contract_id: string;
    amount: number;
    currency?: string;
    line_items?: MetronomeInvoice['line_items'];
  }): Promise<MetronomeInvoice> {
    return this.request<MetronomeInvoice>('POST', '/api/v1/invoices', params);
  }

  async getInvoice(id: string): Promise<MetronomeInvoice> {
    return this.request<MetronomeInvoice>('GET', `/api/v1/invoices/${id}`);
  }

  async payInvoice(id: string): Promise<MetronomeInvoice> {
    return this.request<MetronomeInvoice>('POST', `/api/v1/invoices/${id}/pay`);
  }

  async listInvoices(customerId?: string): Promise<{ data: MetronomeInvoice[]; total: number }> {
    const url = customerId ? `/api/v1/invoices?customer_id=${customerId}` : '/api/v1/invoices';
    return this.request<{ data: MetronomeInvoice[]; total: number }>('GET', url);
  }

  // ========================================================================
  // Credit Operations
  // ========================================================================

  async applyCredit(params: {
    customer_id: string;
    amount: number;
    currency?: string;
    expires_at?: string;
  }): Promise<MetronomeCredit> {
    return this.request<MetronomeCredit>('POST', '/api/v1/credits', params);
  }

  async getCreditBalance(customerId: string): Promise<{
    customer_id: string;
    balance: number;
    currency: string;
    credits: Array<{
      id: string;
      amount: number;
      balance: number;
      expires_at?: string;
    }>;
  }> {
    return this.request('GET', `/api/v1/credits/balance?customer_id=${encodeURIComponent(customerId)}`);
  }

  async listCredits(customerId?: string): Promise<{ data: MetronomeCredit[]; total: number }> {
    const url = customerId
      ? `/api/v1/credits?customer_id=${encodeURIComponent(customerId)}`
      : '/api/v1/credits';
    return this.request<{ data: MetronomeCredit[]; total: number }>('GET', url);
  }
}

