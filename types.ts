
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  password?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  isLoyalty: boolean;
  loyaltyNickname?: string;
  observations?: string;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  active: boolean;
  realName?: string;
  pixKey?: string;
  phone?: string;
  bankDetails?: string;
}

export type PaymentMethod = 'DINHEIRO' | 'CARTÃO' | 'PIX' | 'OUTROS';

export interface ProviderCommission {
  providerId: string;
  value: number;
  status: 'PENDING' | 'PAID';
  paidAt?: string;
  paymentMethod?: PaymentMethod;
}

export interface PricingRule {
  id: string;
  label: string;
  durationMinutes: number;
  regularPrice: number;
  loyaltyPrice: number;
  regularCommission: number;
  loyaltyCommission: number;
  active: boolean;
  validFrom: string;
  validUntil?: string;
}

export interface Session {
  id: string;
  customerId: string;
  providerIds: string[];
  date: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  billedDurationMinutes?: number;
  room: string;
  totalValue: number;
  paymentMethod: PaymentMethod;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'DELIVERED' | 'SCHEDULED';
  isFinished?: boolean;
  recordedBy: string;
  createdAt: string;
  commissions: ProviderCommission[];
  priceRuleId?: string;
  // Snapshot da regra no momento da criação
  commissionSnapshot?: {
    regular: number;
    loyalty: number;
  };
  priceSnapshot?: {
    regular: number;
    loyalty: number;
  };
  supplies?: SessionSupply[];
}

export interface Supply {
  id: string;
  name: string;
  description?: string;
  value: number;
  active: boolean;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionSupply {
  id: string;
  sessionId: string;
  supplyId: string;
  providerId: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  createdAt: string;
}

// --- MÓDULO DE BEBIDAS ---

export interface DrinkProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  active: boolean;
}

export interface DrinkOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface DrinkOrder {
  id: string;
  customerId?: string;
  customerName: string;
  items: DrinkOrderItem[];
  totalValue: number;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  paymentMethod?: PaymentMethod;
  date: string;
  createdAt: string;
  closedAt?: string;
}

export interface DailyClosure {
  id: string;
  date: string;
  totalRevenue: number;
  netProfit: number;
  paymentBreakdown: Record<PaymentMethod, number>;
  closedBy: string;
  closedAt: string;
}
