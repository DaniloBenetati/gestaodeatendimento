
import React, { useState } from 'react';
import { Customer, Session } from '../types';

interface CustomersProps {
  customers: Customer[];
  sessions: Session[];
  onUpdate: (id: string, updates: Partial<Customer>) => void;
  onAdd: (customer: Omit<Customer, 'id'>) => void;
}

const Customers: React.FC<CustomersProps> = ({ customers, sessions, onUpdate, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', isLoyalty: false, loyaltyNickname: '', observations: '' });

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.loyaltyNickname?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getCustomerStats = (id: string) => {
    const customerSessions = sessions.filter(s => s.customerId === id && s.status === 'PAID');
    return { count: customerSessions.length, spent: customerSessions.reduce((acc, curr) => acc + curr.totalValue, 0) };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    setFormData({ name: '', phone: '', isLoyalty: false, loyaltyNickname: '', observations: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (c: Customer) => {
    setFormData({
      name: c.name,
      phone: c.phone || '',
      isLoyalty: c.isLoyalty,
      loyaltyNickname: c.loyaltyNickname || '',
      observations: c.observations || ''
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Base de Clientes</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Carteira ({customers.length})</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', phone: '', isLoyalty: false, loyaltyNickname: '', observations: '' }); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center space-x-2 text-[10px] uppercase tracking-widest">
          <i className="fas fa-plus"></i>
          <span>Novo Cliente</span>
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[3rem] shadow-2xl border-4 border-indigo-600 w-full max-w-lg space-y-6 animate-slideUp">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none">{editingId ? 'Editar Cadastro' : 'Novo Cliente'}</h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-slate-300 hover:text-red-500"><i className="fas fa-times"></i></button>
             </div>
             <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-700 uppercase text-xs" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-700 uppercase text-xs" />
                </div>
                <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="hidden" checked={formData.isLoyalty} onChange={e => setFormData({...formData, isLoyalty: e.target.checked})} />
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center mr-3 ${formData.isLoyalty ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200'}`}>
                      {formData.isLoyalty && <i className="fas fa-check text-white text-[10px]"></i>}
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-600">Cliente VIP ⭐</span>
                  </label>
                  {formData.isLoyalty && (
                    <div className="animate-slideDown pt-4 border-t border-slate-100">
                      <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Codinome VIP</label>
                      <input required type="text" value={formData.loyaltyNickname} onChange={e => setFormData({...formData, loyaltyNickname: e.target.value})} className="w-full px-4 py-3 mt-1 bg-white border border-indigo-100 rounded-xl outline-none font-black text-indigo-600 uppercase text-xs" />
                    </div>
                  )}
                </div>
             </div>
             <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl">Confirmar Dados</button>
          </form>
        </div>
      )}

      <div className="relative">
         <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
         <input type="text" placeholder="Filtrar por nome ou codinome..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm font-black text-slate-700 uppercase text-[10px] outline-none focus:border-indigo-400" />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">Cliente</th>
                <th className="px-8 py-6">Status / Codinome</th>
                <th className="px-8 py-6 text-center">Sessões</th>
                <th className="px-8 py-6 text-right">Acumulado</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCustomers.map(customer => {
                const stats = getCustomerStats(customer.id);
                return (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] uppercase ${customer.isLoyalty ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                          {customer.name.charAt(0)}
                        </div>
                        <p className="font-black text-[10px] text-slate-800 uppercase">{customer.name}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       {customer.isLoyalty ? (
                         <div className="flex items-center space-x-2">
                           <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border border-indigo-100">VIP</span>
                           <span className="text-[10px] font-black text-indigo-400 uppercase">{customer.loyaltyNickname}</span>
                         </div>
                       ) : (
                         <span className="text-slate-300 text-[9px] font-bold uppercase tracking-widest">Normal</span>
                       )}
                    </td>
                    <td className="px-8 py-6 text-center font-black text-slate-500 text-[10px]">{stats.count}</td>
                    <td className="px-8 py-6 text-right font-black text-indigo-600 text-[11px]">R$ {stats.spent.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right">
                       <button onClick={() => handleEdit(customer)} className="w-8 h-8 bg-slate-50 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><i className="fas fa-pen text-[9px]"></i></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Customers;
