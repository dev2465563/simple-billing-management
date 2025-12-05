import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const MOCK_API_URL = process.env.NEXT_PUBLIC_MOCK_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Customer {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'organization';
  tier: 'free' | 'pro' | 'team' | 'enterprise';
  status: string;
  creditsBalance: number;
}

export interface OnboardRequest {
  entity: {
    id?: string;
    type: 'user' | 'organization';
    name: string;
    email: string;
    createdAt: string;
    updatedAt: string;
  };
  tier?: 'free' | 'pro' | 'team' | 'enterprise';
  billingPeriod?: 'monthly' | 'yearly';
  paymentMethodId?: string;
}

export interface TierChangeRequest {
  entityId: string;
  newTier: 'free' | 'pro' | 'team' | 'enterprise';
  billingPeriod?: 'monthly' | 'yearly';
  effectiveDate?: string;
}

export interface SubscriptionStatus {
  entityId: string;
  tier: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  creditsBalance: number;
  nextInvoiceDate?: string;
}

export const apiClient = {
  // Health checks
  async checkHealth() {
    const [billing, mock] = await Promise.all([
      api.get('/health').catch(() => ({ data: { status: 'error' } })),
      axios.get(`${MOCK_API_URL}/health`).catch(() => ({ data: { status: 'error' } })),
    ]);
    return {
      billing: billing.data.status === 'ok',
      mock: mock.data.status === 'ok',
    };
  },

  // Customers
  async getCustomers(): Promise<{ data: Customer[]; total: number }> {
    const response = await api.get('/api/customers');
    return response.data;
  },

  // Onboarding
  async onboardCustomer(data: OnboardRequest) {
    const response = await api.post('/api/onboard', data);
    return response.data;
  },

  // Tier management
  async changeTier(data: TierChangeRequest) {
    const response = await api.post('/api/tier/change', data);
    return response.data;
  },

  // Subscription status
  async getSubscriptionStatus(entityId: string): Promise<SubscriptionStatus> {
    const response = await api.get(`/api/subscription/${entityId}`);
    return response.data;
  },
};


