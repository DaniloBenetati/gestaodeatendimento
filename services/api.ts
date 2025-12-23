
import { Session, Customer, Provider, PaymentMethod, ProviderCommission } from '../types';

// Simulador de latência de rede para preparar a UI
const delay = (ms = 500) => new Promise(res => setTimeout(res, ms));

export const api = {
  sessions: {
    async getAll(): Promise<Session[]> {
      await delay();
      const data = localStorage.getItem('clinic_sessions');
      return data ? JSON.parse(data) : [];
    },
    async upsert(session: Session | Omit<Session, 'id' | 'createdAt'>): Promise<Session> {
      await delay(300);
      const sessions = await this.getAll();
      const isUpdate = 'id' in session;
      
      const newSession: Session = isUpdate 
        ? session as Session 
        : { 
            ...session, 
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString()
          } as Session;

      const updated = isUpdate 
        ? sessions.map(s => s.id === newSession.id ? newSession : s)
        : [...sessions, newSession];

      localStorage.setItem('clinic_sessions', JSON.stringify(updated));
      return newSession;
    },
    async delete(id: string): Promise<void> {
      const sessions = await this.getAll();
      localStorage.setItem('clinic_sessions', JSON.stringify(sessions.filter(s => s.id !== id)));
    }
  },
  customers: {
    async getAll(): Promise<Customer[]> {
      await delay(200);
      const data = localStorage.getItem('clinic_customers');
      return data ? JSON.parse(data) : [];
    },
    async save(customer: Omit<Customer, 'id'>): Promise<Customer> {
      const customers = await this.getAll();
      const newCustomer = { ...customer, id: Math.random().toString(36).substr(2, 9) };
      localStorage.setItem('clinic_customers', JSON.stringify([...customers, newCustomer]));
      return newCustomer;
    }
  }
};
