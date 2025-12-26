
import React, { useState, useEffect } from 'react';
import { Customer, Provider, PricingRule, Session, PaymentMethod } from '../types';

interface SessionsProps {
  sessions: Session[];
  customers: Customer[];
  providers: Provider[];
  pricing: PricingRule[];
  onAddSession: (session: Omit<Session, 'id' | 'createdAt' | 'recordedBy'>) => void;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const Sessions: React.FC<SessionsProps> = ({ sessions, customers, providers, pricing, onAddSession, onAddCustomer, showNotification }) => {
  const [providerCount, setProviderCount] = useState<number>(1);
  const [selectedProviderIds, setSelectedProviderIds] = useState<string[]>(['']);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [sessionType, setSessionType] = useState<'NOW' | 'FUTURE'>('NOW');

  const getBrazilDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatTimeDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const durationOptions = Array.from({ length: 20 }, (_, i) => {
    const mins = (i + 1) * 30;
    return { label: formatTimeDisplay(mins), value: mins };
  });

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    isLoyalty: false,
    loyaltyNickname: '',
    priceRuleId: '1h',
    paymentMethod: 'PIX' as PaymentMethod,
    date: getBrazilDate(),
    startTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    room: '1',
    paymentTiming: 'AFTER' as 'NOW' | 'AFTER',
    customDuration: 60,
    customValue: 150
  });

  useEffect(() => {
    if (sessionType === 'NOW') {
      const interval = setInterval(() => {
        setFormData(f => ({
          ...f,
          startTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }));
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [sessionType]);

  const filteredExistingCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.loyaltyNickname?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const selectCustomer = (c: Customer) => {
    setCustomerSearch(c.name);
    setIsNewCustomer(false);
    setFormData({
      ...formData,
      customerName: c.name,
      customerPhone: c.phone,
      isLoyalty: c.isLoyalty,
      loyaltyNickname: c.loyaltyNickname || ''
    });
  };

  useEffect(() => {
    if (providerCount > 1) {
      setFormData(f => ({ ...f, customValue: 0, priceRuleId: 'custom' }));
      return;
    }

    const rule = pricing.find(r => r.durationMinutes === formData.customDuration && r.active);
    if (rule) {
      setFormData(f => ({
        ...f,
        customValue: Math.round(f.isLoyalty ? rule.loyaltyPrice : rule.regularPrice),
        priceRuleId: rule.id
      }));
    } else {
      const basePrice = formData.isLoyalty ? 120 : 150;
      const suggestedValue = (formData.customDuration / 60) * basePrice;
      setFormData(f => ({ ...f, customValue: Math.round(suggestedValue), priceRuleId: 'custom' }));
    }
  }, [formData.customDuration, formData.isLoyalty, pricing, providerCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validProviders = selectedProviderIds.filter(id => id !== '');
    if (validProviders.length === 0) { showNotification("Selecione um profissional.", "error"); return; }

    let customer = customers.find(c => c.name.toLowerCase() === formData.customerName.toLowerCase());
    if (!customer) {
      customer = onAddCustomer({
        name: formData.customerName,
        phone: formData.customerPhone,
        isLoyalty: formData.isLoyalty,
        loyaltyNickname: formData.loyaltyNickname
      });
    }

    const isPaidNow = formData.paymentTiming === 'NOW';
    const rule = pricing.find(r => r.id === formData.priceRuleId);
    const status = isPaidNow ? 'PAID' : (sessionType === 'NOW' ? 'PENDING' : 'SCHEDULED');

    const currentCommissions = validProviders.map(pName => {
      let commVal = 0;
      if (validProviders.length === 1) {
        let basePrice = 0;
        if (rule) {
          commVal = formData.isLoyalty ? rule.loyaltyCommission : rule.regularCommission;
          basePrice = formData.isLoyalty ? rule.loyaltyPrice : rule.regularPrice;

          if (formData.customValue !== basePrice && basePrice > 0) {
            commVal = commVal * (formData.customValue / basePrice);
          }
        } else {
          commVal = formData.customValue * 0.4;
        }
      }

      return {
        providerId: pName,
        value: Math.round(commVal),
        status: (isPaidNow ? 'PAID' : 'PENDING') as 'PAID' | 'PENDING'
      };
    });

    onAddSession({
      customerId: customer.id,
      providerIds: validProviders,
      date: formData.date,
      startTime: formData.startTime,
      durationMinutes: formData.customDuration,
      room: formData.room,
      priceRuleId: formData.priceRuleId,
      totalValue: Math.round(formData.customValue),
      commissions: currentCommissions,
      paymentMethod: formData.paymentMethod,
      status,
      commissionSnapshot: rule ? { regular: Math.round(rule.regularCommission), loyalty: Math.round(rule.loyaltyCommission) } : undefined,
      priceSnapshot: rule ? { regular: Math.round(rule.regularPrice), loyalty: Math.round(rule.loyaltyPrice) } : undefined
    });

    setFormData(prev => ({ ...prev, customerName: '', customerPhone: '', loyaltyNickname: '', isLoyalty: false }));
    setCustomerSearch('');
    setIsNewCustomer(true);
    setSelectedProviderIds(['']);
    setProviderCount(1);
    showNotification("Registro realizado com sucesso!", "success");
  };

  return (
    <div className="max-w-4xl mx-auto animate-slideUp pb-12">
      <header className="mb-6 px-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Novo Atendimento</h1>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Operação Clínica</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl shadow-inner w-fit">
          <button type="button" onClick={() => setSessionType('NOW')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center space-x-2 ${sessionType === 'NOW' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
            <i className="fas fa-play text-[8px]"></i> <span>Imediato</span>
          </button>
          <button type="button" onClick={() => setSessionType('FUTURE')} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center space-x-2 ${sessionType === 'FUTURE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
            <i className="fas fa-calendar-alt text-[8px]"></i> <span>Agendar</span>
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <i className="fas fa-user-tag mr-2"></i> Identificação
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <input required type="text" value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setFormData({ ...formData, customerName: e.target.value }); setIsNewCustomer(true); }} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 outline-none font-black text-slate-700 placeholder:text-slate-300 uppercase text-xs" placeholder="PESQUISAR CLIENTE..." />
                {customerSearch && isNewCustomer && filteredExistingCustomers.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-40 overflow-y-auto scrollbar-hide">
                    {filteredExistingCustomers.map(c => (
                      <div key={c.id} onClick={() => selectCustomer(c)} className="px-6 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-700 uppercase">{c.name}</span>
                        {c.isLoyalty && <span className="text-[8px] font-black text-indigo-500 uppercase">⭐ VIP</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="hidden" checked={formData.isLoyalty} onChange={e => setFormData({ ...formData, isLoyalty: e.target.checked })} />
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center mr-3 transition-all ${formData.isLoyalty ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}>
                    {formData.isLoyalty && <i className="fas fa-check text-white text-[8px]"></i>}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${formData.isLoyalty ? 'text-indigo-600' : 'text-slate-400'}`}>Cliente VIP ⭐</span>
                </label>
                {formData.isLoyalty && (
                  <div className="animate-slideDown mt-3">
                    <input required type="text" value={formData.loyaltyNickname} onChange={e => setFormData({ ...formData, loyaltyNickname: e.target.value })} className="w-full px-4 py-2 rounded-xl bg-white border border-indigo-100 font-black text-indigo-600 outline-none uppercase text-[10px]" placeholder="APELIDO FIDELIDADE" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center">
              <i className="fas fa-users-cog mr-2"></i> Profissional
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                <button type="button" onClick={() => setProviderCount(Math.max(1, providerCount - 1))} className="w-8 h-8 bg-white rounded-xl text-slate-400 shadow-sm"><i className="fas fa-minus text-[10px]"></i></button>
                <span className="text-[9px] font-black text-slate-700 uppercase">{providerCount} PROFISSIONAL</span>
                <button type="button" onClick={() => setProviderCount(Math.min(5, providerCount + 1))} className="w-8 h-8 bg-white rounded-xl text-slate-400 shadow-sm"><i className="fas fa-plus text-[10px]"></i></button>
              </div>
              {Array.from({ length: providerCount }).map((_, idx) => (
                <select key={idx} required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent font-black text-slate-700 text-[10px] uppercase outline-none focus:bg-white focus:border-indigo-100" value={selectedProviderIds[idx] || ''} onChange={(e) => {
                  const newIds = [...selectedProviderIds];
                  newIds[idx] = e.target.value;
                  setSelectedProviderIds(newIds);
                }}>
                  <option value="">SELECIONAR PROFISSIONAL...</option>
                  {providers
                    .filter(p => p.active && (!selectedProviderIds.includes(p.name) || selectedProviderIds[idx] === p.name))
                    .map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 text-center">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tempo</label>
            <select value={formData.customDuration} onChange={e => setFormData({ ...formData, customDuration: parseInt(e.target.value) })} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 text-center font-black text-slate-700 outline-none uppercase text-[10px] border border-transparent focus:border-indigo-100">
              {durationOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5 text-center">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sala</label>
            <input type="text" value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 text-center font-black text-slate-700 outline-none uppercase text-[10px] border border-transparent focus:border-indigo-100" />
          </div>
          <div className="space-y-1.5 text-center">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Início</label>
            <input type={sessionType === 'NOW' ? 'text' : 'time'} readOnly={sessionType === 'NOW'} value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} className={`w-full px-4 py-3.5 rounded-2xl text-center font-black outline-none text-[10px] ${sessionType === 'NOW' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-700 border border-transparent focus:border-indigo-100'}`} />
          </div>
          <div className="space-y-1.5 text-center">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Liquidação</label>
            <select value={formData.paymentTiming} onChange={e => setFormData({ ...formData, paymentTiming: e.target.value as any })} className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 text-[9px] font-black text-slate-700 outline-none uppercase border border-transparent focus:border-indigo-100">
              <option value="AFTER">No Checkout</option>
              <option value="NOW">Antecipado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Previsão Financeira (Valor Inteiro)</span>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-[8px] font-black text-slate-300 uppercase">Valor Total</p>
              <p className="text-xs font-black text-indigo-600">R$ {Math.round(formData.customValue)}</p>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl transition-all active:scale-[0.98]">
          {sessionType === 'NOW' ? 'Iniciar Atendimento' : 'Salvar Agendamento'}
        </button>
      </form>
    </div>
  );
};

export default Sessions;
