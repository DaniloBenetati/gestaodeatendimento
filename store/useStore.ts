
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Customer, Provider, Session, PaymentMethod, ProviderCommission, PricingRule, DrinkProduct, DrinkOrder } from '../types';

const getBrazilDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const INITIAL_PRICING: PricingRule[] = [
  {
    id: '30m',
    label: '30 Minutos',
    durationMinutes: 30,
    regularPrice: 190,
    loyaltyPrice: 190,
    regularCommission: 90,
    loyaltyCommission: 90,
    active: true,
    validFrom: '2024-01-01'
  },
  {
    id: '1h',
    label: '1 Hora',
    durationMinutes: 60,
    regularPrice: 290,
    loyaltyPrice: 230,
    regularCommission: 170,
    loyaltyCommission: 150,
    active: true,
    validFrom: '2024-01-01'
  },
];

const INITIAL_PROVIDERS: Provider[] = [
  "Ana", "Beatriz", "Carla", "Daniela", "Eduarda", "Fernanda", "Gabriela", "Helena",
  "Isabela", "Juliana", "Karine", "Larissa", "Mariana", "Natália", "Olívia", "Patrícia",
  "Raquel", "Sabrina", "Tatiana", "Vanessa"
].map((name, i) => ({
  id: `p${i + 1}`,
  name,
  specialty: "Especialista",
  active: true,
  pixKey: "pix@clinica.com"
}));

const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Roberto Silva', phone: '11999990001', isLoyalty: false },
  { id: 'c2', name: 'Marcos Oliveira', phone: '11999990002', isLoyalty: true, loyaltyNickname: 'Marcos VIP' },
  { id: 'c3', name: 'André Santos', phone: '11999990003', isLoyalty: false },
  { id: 'c4', name: 'Felipe Costa', phone: '11999990004', isLoyalty: true },
  { id: 'c5', name: 'Lucas Lima', phone: '11999990005', isLoyalty: false }
];

const today = getBrazilDate();

// Gerador de dados conforme solicitado pelo usuário
const generateRequestedData = (): Session[] => {
  const sessions: Session[] = [];

  // 15 Finalizados (Status PAID) com profissionais repetidos
  const finishProviders = ["Daniela", "Beatriz", "Ana"];
  for (let i = 0; i < 15; i++) {
    const pName = finishProviders[i % 3];
    sessions.push({
      id: `f-${i}`,
      customerId: (i % 2 === 0) ? 'c1' : 'c2',
      providerIds: [pName],
      date: '2025-12-22',
      startTime: `${10 + (i % 8)}:00`,
      durationMinutes: 60,
      room: String((i % 4) + 1),
      totalValue: 290,
      paymentMethod: 'PIX',
      status: 'PAID',
      isFinished: true,
      recordedBy: 'admin',
      createdAt: new Date().toISOString(),
      commissions: [{ providerId: pName, value: 170, status: (i < 5 ? 'PAID' : 'PENDING'), paidAt: i < 5 ? '2025-12-22T15:00:00Z' : undefined, paymentMethod: i < 5 ? 'PIX' : undefined }],
      priceRuleId: '1h'
    });
  }

  // 4 Em andamento (Status PENDING)
  for (let i = 0; i < 4; i++) {
    sessions.push({
      id: `active-${i}`,
      customerId: `c${i + 1}`,
      providerIds: [INITIAL_PROVIDERS[i + 5].name],
      date: today,
      startTime: '14:00',
      durationMinutes: 60,
      room: String(i + 1),
      totalValue: 290,
      paymentMethod: 'PIX',
      status: 'PENDING',
      recordedBy: 'admin',
      createdAt: new Date().toISOString(),
      commissions: [],
      priceRuleId: '1h'
    });
  }

  // 5 Agendados (Status SCHEDULED)
  for (let i = 0; i < 5; i++) {
    sessions.push({
      id: `sched-${i}`,
      customerId: `c${(i % 3) + 1}`,
      providerIds: [INITIAL_PROVIDERS[i + 10].name],
      date: today,
      startTime: '18:00',
      durationMinutes: 60,
      room: '2',
      totalValue: 290,
      paymentMethod: 'PIX',
      status: 'SCHEDULED',
      recordedBy: 'admin',
      createdAt: new Date().toISOString(),
      commissions: [],
      priceRuleId: '1h'
    });
  }

  return sessions;
};

const generateDrinkOrders = (): DrinkOrder[] => {
  return [
    { id: 'do1', customerName: 'Roberto Silva', customerId: 'c1', items: [{ productId: 'd1', name: 'Heineken', quantity: 2, unitPrice: 15 }], totalValue: 30, status: 'PAID', paymentMethod: 'PIX', date: '2025-12-22', createdAt: new Date().toISOString() },
    { id: 'do2', customerName: 'Consumidor', items: [{ productId: 'd2', name: 'Água', quantity: 1, unitPrice: 5 }], totalValue: 5, status: 'PAID', paymentMethod: 'DINHEIRO', date: '2025-12-23', createdAt: new Date().toISOString() },
    { id: 'do3', customerName: 'Marcos VIP', customerId: 'c2', items: [{ productId: 'd1', name: 'Heineken', quantity: 5, unitPrice: 15 }], totalValue: 75, status: 'PAID', paymentMethod: 'PIX', date: '2025-12-24', createdAt: new Date().toISOString() }
  ];
};

const safeParse = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaultValue;
    return JSON.parse(saved);
  } catch (e) {
    return defaultValue;
  }
};

export const useStore = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Estado inicial vazio - será populado pelo Supabase
  const [providers, setProviders] = useState<Provider[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [users, setUsers] = useState<User[]>([]); // Será populado pelo profiles
  const [pricing, setPricing] = useState<PricingRule[]>([]);
  const [drinkProducts, setDrinkProducts] = useState<DrinkProduct[]>([]);
  const [drinkOrders, setDrinkOrders] = useState<DrinkOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Função para carregar dados do Supabase
  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { data: msgProviders },
        { data: msgCustomers },
        { data: msgSessions },
        { data: msgPricing },
        { data: msgDrinkProducts },
        { data: msgDrinkOrders },
        { data: msgProfiles }
      ] = await Promise.all([
        supabase.from('providers').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('sessions').select('*'),
        supabase.from('pricing_rules').select('*'),
        supabase.from('drink_products').select('*'),
        supabase.from('drink_orders').select('*'),
        supabase.from('profiles').select('*')
      ]);

      if (msgProviders) setProviders(msgProviders.map(p => ({
        ...p,
        pixKey: p.pix_key,
        bankDetails: p.bank_details
      })));

      if (msgCustomers) setCustomers(msgCustomers.map(c => ({
        ...c,
        isLoyalty: c.is_loyalty,
        loyaltyNickname: c.loyalty_nickname
      })));

      if (msgSessions) setSessions(msgSessions.map((s: any) => ({
        ...s,
        customerId: s.customer_id,
        providerIds: s.provider_ids,
        startTime: s.start_time,
        paymentMethod: s.payment_method,
        isFinished: s.is_finished,
        recordedBy: s.recorded_by,
        totalValue: s.total_value,
        priceRuleId: s.price_rule_id,
        durationMinutes: s.duration_minutes,
        billedDurationMinutes: s.billed_duration_minutes
      })));

      if (msgPricing) setPricing(msgPricing.map(p => ({
        ...p,
        durationMinutes: p.duration_minutes,
        regularPrice: p.regular_price,
        loyaltyPrice: p.loyalty_price,
        regularCommission: p.regular_commission,
        loyaltyCommission: p.loyalty_commission,
        validFrom: p.valid_from
      })));

      if (msgDrinkProducts) setDrinkProducts(msgDrinkProducts);

      if (msgDrinkOrders) setDrinkOrders(msgDrinkOrders.map(o => ({
        ...o,
        customerName: o.customer_name,
        customerId: o.customer_id,
        totalValue: o.total_value,
        paymentMethod: o.payment_method,
        createdAt: o.created_at
      })));

      if (msgProfiles) setUsers(msgProfiles);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Carregar sessão
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        setCurrentUser({
          id: session.user.id,
          username: metadata.username || session.user.email || '',
          name: metadata.name || 'Usuário',
          role: metadata.role || 'STAFF',
          active: true
        });
        // Se houver sessão Supabase, removemos qualquer rastro de login manual/local
        localStorage.removeItem('local_user');
      } else {
        // Tentar carregar usuário local se não houver Supabase
        const savedUser = localStorage.getItem('local_user');
        if (savedUser) {
          try {
            setCurrentUser(JSON.parse(savedUser));
          } catch (e) {
            localStorage.removeItem('local_user');
          }
        }
      }
    });

    // 2. Carregar dados iniciais
    loadData();

    // 3. Setup listener de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata;
        setCurrentUser({
          id: session.user.id,
          username: metadata.username || session.user.email || '',
          name: metadata.name || 'Usuário',
          role: metadata.role || 'STAFF',
          active: true
        });
        localStorage.removeItem('local_user');
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('local_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (user: User) => {
    localStorage.setItem('local_user', JSON.stringify(user));
    setCurrentUser(user);
  };
  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('local_user');
    setCurrentUser(null);
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    // Para users/profiles a lógica é mais complexa pois envolve auth, por enquanto atualizamos apenas a tabela profiles
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (!error) {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    }
  };

  const addSession = async (sessionData: Omit<Session, 'id' | 'createdAt' | 'recordedBy'>) => {
    const newSession = {
      customer_id: sessionData.customerId,
      provider_ids: sessionData.providerIds,
      date: sessionData.date,
      start_time: sessionData.startTime,
      duration_minutes: sessionData.durationMinutes,
      room: sessionData.room,
      total_value: sessionData.totalValue,
      payment_method: sessionData.paymentMethod,
      status: sessionData.status,
      is_finished: sessionData.isFinished || false,
      recorded_by: currentUser?.id || 'system',
      commissions: sessionData.commissions || [],
      price_rule_id: sessionData.priceRuleId
    };

    const { data, error } = await supabase.from('sessions').insert(newSession).select().single();

    if (!error && data) {
      // Mapear de volta para frontend camelCase
      const formattedSession: Session = {
        ...data,
        customerId: data.customer_id,
        providerIds: data.provider_ids,
        startTime: data.start_time,
        paymentMethod: data.payment_method,
        isFinished: data.is_finished,
        recordedBy: data.recorded_by,
        totalValue: data.total_value,
        priceRuleId: data.price_rule_id
      };
      setSessions(prev => [...prev, formattedSession]);
    }
  };

  const updateSession = async (id: string, updates: Partial<Session>) => {
    // Converter updates para snake_case
    const dbUpdates: any = {};
    if (updates.customerId !== undefined) dbUpdates.customer_id = updates.customerId;
    if (updates.providerIds !== undefined) dbUpdates.provider_ids = updates.providerIds;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
    if (updates.isFinished !== undefined) dbUpdates.is_finished = updates.isFinished;
    if (updates.totalValue !== undefined) dbUpdates.total_value = updates.totalValue;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.room !== undefined) dbUpdates.room = updates.room;
    if (updates.commissions !== undefined) dbUpdates.commissions = updates.commissions;

    const { error } = await supabase.from('sessions').update(dbUpdates).eq('id', id);

    if (!error) {
      setSessions(prev => {
        const newList = prev.map(s => s.id === id ? { ...s, ...updates } : s);
        return [...newList];
      });
    }
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const confirmSession = async (id: string, method: PaymentMethod, value: number, commissions: ProviderCommission[]) => {
    const updates = {
      status: 'PAID',
      payment_method: method,
      total_value: value,
      commissions: commissions,
      is_finished: true
    };
    const { error } = await supabase.from('sessions').update(updates).eq('id', id);
    if (!error) {
      setSessions(prev => prev.map(s => s.id === id ? { ...s, status: 'PAID', paymentMethod: method, totalValue: value, commissions, isFinished: true } : s));
    }
  };

  const markCommissionPaid = async (providerName: string, sessionIds: string[], method: PaymentMethod) => {
    // Buscar sessões para atualizar
    const sessionsToUpdate = sessions.filter(s => sessionIds.includes(s.id));

    // Atualizar no banco uma a uma (ou criar RPC function para batch update se desempenho for crítico)
    for (const session of sessionsToUpdate) {
      if (!session.commissions) continue;

      const updatedCommissions = session.commissions.map(c =>
        (c.providerId === providerName && c.status === 'PENDING')
          ? { ...c, status: 'PAID' as const, paidAt: new Date().toISOString(), paymentMethod: method }
          : c
      );

      const { error } = await supabase.from('sessions').update({ commissions: updatedCommissions }).eq('id', session.id);

      if (!error) {
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, commissions: updatedCommissions } : s));
      }
    }
  };

  const addPricingRule = async (rule: PricingRule) => {
    const dbRule = {
      id: rule.id,
      label: rule.label,
      duration_minutes: rule.durationMinutes,
      regular_price: rule.regularPrice,
      loyalty_price: rule.loyaltyPrice,
      regular_commission: rule.regularCommission,
      loyalty_commission: rule.loyaltyCommission,
      active: rule.active,
      valid_from: rule.validFrom
    };
    const { error } = await supabase.from('pricing_rules').insert(dbRule);
    if (!error) setPricing(prev => [...prev, rule]);
  };

  const updatePricingRule = async (id: string, updates: Partial<PricingRule>) => {
    const dbUpdates: any = {};
    if (updates.label !== undefined) dbUpdates.label = updates.label;
    if (updates.durationMinutes !== undefined) dbUpdates.duration_minutes = updates.durationMinutes;
    if (updates.regularPrice !== undefined) dbUpdates.regular_price = updates.regularPrice;
    if (updates.loyaltyPrice !== undefined) dbUpdates.loyalty_price = updates.loyaltyPrice;
    if (updates.regularCommission !== undefined) dbUpdates.regular_commission = updates.regularCommission;
    if (updates.loyaltyCommission !== undefined) dbUpdates.loyalty_commission = updates.loyaltyCommission;
    if (updates.active !== undefined) dbUpdates.active = updates.active;

    const { error } = await supabase.from('pricing_rules').update(dbUpdates).eq('id', id);
    if (!error) setPricing(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePricingRule = async (id: string) => {
    const { error } = await supabase.from('pricing_rules').delete().eq('id', id);
    if (!error) {
      setPricing(prev => prev.filter(p => p.id !== id));
      return { success: true, message: "Removida." };
    }
    return { success: false, message: "Erro ao remover." };
  };

  const addDrinkOrder = async (order: any) => {
    const dbOrder = {
      customer_name: order.customerName,
      customer_id: order.customerId,
      items: order.items,
      total_value: order.totalValue,
      status: order.status,
      payment_method: order.paymentMethod,
      date: order.date
    };
    const { data, error } = await supabase.from('drink_orders').insert(dbOrder).select().single();
    if (!error && data) {
      const newOrder = {
        ...data,
        customerName: data.customer_name,
        customerId: data.customer_id,
        totalValue: data.total_value,
        paymentMethod: data.payment_method,
        createdAt: data.created_at
      };
      setDrinkOrders(prev => [...prev, newOrder]);
      return newOrder;
    }
  };

  const updateDrinkOrder = async (id: string, updates: Partial<DrinkOrder>) => {
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;

    const { error } = await supabase.from('drink_orders').update(dbUpdates).eq('id', id);
    if (!error) setDrinkOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const addDrinkProduct = async (product: any) => {
    const { data, error } = await supabase.from('drink_products').insert(product).select().single();
    if (!error && data) setDrinkProducts(prev => [...prev, data]);
  };

  const updateDrinkProduct = async (id: string, updates: Partial<DrinkProduct>) => {
    const { error } = await supabase.from('drink_products').update(updates).eq('id', id);
    if (!error) setDrinkProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addCustomer = async (customer: any) => {
    const dbCustomer = {
      name: customer.name,
      phone: customer.phone,
      is_loyalty: customer.isLoyalty,
      loyalty_nickname: customer.loyaltyNickname,
      observations: customer.observations
    };
    const { data, error } = await supabase.from('customers').insert(dbCustomer).select().single();
    if (!error && data) {
      const newCustomer = {
        ...data,
        isLoyalty: data.is_loyalty,
        loyaltyNickname: data.loyalty_nickname
      };
      setCustomers(prev => [...prev, newCustomer]);
      return newCustomer;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.isLoyalty !== undefined) dbUpdates.is_loyalty = updates.isLoyalty;
    if (updates.loyaltyNickname !== undefined) dbUpdates.loyalty_nickname = updates.loyaltyNickname;
    if (updates.observations !== undefined) dbUpdates.observations = updates.observations;

    const { error } = await supabase.from('customers').update(dbUpdates).eq('id', id);
    if (!error) setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addProvider = async (provider: Omit<Provider, 'id'>) => {
    const dbProvider = {
      name: provider.name,
      specialty: provider.specialty,
      active: provider.active,
      real_name: provider.realName,
      pix_key: provider.pixKey,
      phone: provider.phone,
      bank_details: provider.bankDetails
    };
    console.log("Tentando adicionar provider:", dbProvider);
    const { data, error } = await supabase.from('providers').insert(dbProvider).select().single();

    if (error) {
      console.error("Erro ao adicionar provider:", error);
    }

    if (!error && data) {
      console.log("Provider adicionado com sucesso:", data);
      const newProvider: Provider = {
        ...data,
        realName: data.real_name,
        pixKey: data.pix_key,
        bankDetails: data.bank_details
      };
      setProviders(prev => [...prev, newProvider]);
    }
  };

  const updateProvider = async (id: string, updates: Partial<Provider>) => {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.specialty !== undefined) dbUpdates.specialty = updates.specialty;
    if (updates.active !== undefined) dbUpdates.active = updates.active;
    if (updates.realName !== undefined) dbUpdates.real_name = updates.realName;
    if (updates.pixKey !== undefined) dbUpdates.pix_key = updates.pixKey;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.bankDetails !== undefined) dbUpdates.bank_details = updates.bankDetails;

    const { error } = await supabase.from('providers').update(dbUpdates).eq('id', id);
    if (!error) setProviders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProvider = async (id: string) => {
    const { error } = await supabase.from('providers').delete().eq('id', id);
    if (!error) setProviders(prev => prev.filter(p => p.id !== id));
  };

  return {
    currentUser, login, logout, users, updateUser,
    providers, setProviders, addProvider, updateProvider, deleteProvider,
    customers, addCustomer, updateCustomer,
    sessions, addSession, updateSession, deleteSession, confirmSession,
    pricing, addPricingRule, updatePricingRule, deletePricingRule, setPricing,
    drinkProducts, addDrinkProduct, updateDrinkProduct,
    drinkOrders, addDrinkOrder, updateDrinkOrder,
    markCommissionPaid
  };
};
