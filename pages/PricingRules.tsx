
import React, { useState } from 'react';
import { PricingRule } from '../types';

interface PricingRulesProps {
  pricing: PricingRule[];
  onAddPricingRule: (rule: PricingRule) => void;
  onUpdatePricingRule: (id: string, updates: Partial<PricingRule>) => void;
  onDeletePricingRule: (id: string) => { success: boolean, message: string };
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const PricingRules: React.FC<PricingRulesProps> = ({ 
  pricing, 
  onAddPricingRule, 
  onUpdatePricingRule, 
  onDeletePricingRule,
  showNotification
}) => {
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const getBrazilDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    const exists = pricing.find(p => p.id === editingRule.id);
    if (exists) {
      onUpdatePricingRule(editingRule.id, editingRule);
      showNotification("Regra atualizada!", "success");
    } else {
      onAddPricingRule(editingRule);
      showNotification("Nova regra criada!", "success");
    }
    
    setEditingRule(null);
  };

  const handleRemove = (id: string) => {
    const result = onDeletePricingRule(id);
    if (result.success) {
      showNotification(result.message, "success");
    } else {
      showNotification(result.message, "error");
    }
  };

  const filteredPricing = pricing.filter(p => showArchived ? true : p.active);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Tabela de Preços & Repasses</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão Temporal de Regras</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border ${showArchived ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200'}`}
          >
            {showArchived ? 'Ocultar Histórico' : 'Ver Histórico'}
          </button>
          
          <button 
            onClick={() => setEditingRule({ 
                id: Math.random().toString(36).substr(2, 5), 
                label: '', 
                durationMinutes: 60, 
                regularPrice: 0, 
                loyaltyPrice: 0, 
                regularCommission: 0, 
                loyaltyCommission: 0,
                active: true,
                validFrom: getBrazilDate()
            })}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center space-x-2"
          >
            <i className="fas fa-plus"></i>
            <span>Nova Regra</span>
          </button>
        </div>
      </header>

      {editingRule && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp border-4 border-indigo-600">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase text-sm">Configurar Regra Operacional</h3>
              <button onClick={() => setEditingRule(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo (Ex: 1 Hora)</label>
                  <input required value={editingRule.label} onChange={e => setEditingRule({...editingRule, label: e.target.value})} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none uppercase text-xs" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Válido Desde</label>
                  <input 
                    type="date" 
                    required 
                    value={editingRule.validFrom} 
                    onChange={e => setEditingRule({...editingRule, validFrom: e.target.value})} 
                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none uppercase text-xs" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4 p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <h4 className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Atendimento Normal</h4>
                  <div className="space-y-3">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Valor Cliente (R$)</label>
                    <input type="number" required value={editingRule.regularPrice} onChange={e => setEditingRule({...editingRule, regularPrice: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg bg-white border border-emerald-100 font-black text-emerald-600 outline-none text-xs" />
                    
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Comissão (R$)</label>
                    <input type="number" required value={editingRule.regularCommission} onChange={e => setEditingRule({...editingRule, regularCommission: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg bg-white border border-emerald-100 font-black text-emerald-600 outline-none text-xs" />
                  </div>
                </div>

                <div className="space-y-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                  <h4 className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Atendimento VIP</h4>
                  <div className="space-y-3">
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Valor Cliente (R$)</label>
                    <input type="number" required value={editingRule.loyaltyPrice} onChange={e => setEditingRule({...editingRule, loyaltyPrice: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg bg-white border border-indigo-100 font-black text-indigo-600 outline-none text-xs" />
                    
                    <label className="block text-[8px] font-black text-slate-400 uppercase">Comissão (R$)</label>
                    <input type="number" required value={editingRule.loyaltyCommission} onChange={e => setEditingRule({...editingRule, loyaltyCommission: parseFloat(e.target.value)})} className="w-full px-4 py-2 rounded-lg bg-white border border-indigo-100 font-black text-indigo-600 outline-none text-xs" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Duração (Minutos)</label>
                <input type="number" required value={editingRule.durationMinutes} onChange={e => setEditingRule({...editingRule, durationMinutes: parseInt(e.target.value)})} className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none text-xs" />
              </div>

              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-black transition-all">Salvar Regra</button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6">Vigência / Tempo</th>
                <th className="px-8 py-6">Vlr. Normal</th>
                <th className="px-8 py-6">Comis. Normal</th>
                <th className="px-8 py-6">Vlr. VIP</th>
                <th className="px-8 py-6">Comis. VIP</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPricing.map(p => (
                <tr key={p.id} className={`hover:bg-slate-50 transition-all group ${!p.active ? 'opacity-40 grayscale bg-slate-50' : ''}`}>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${p.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <p className="font-black text-[11px] text-slate-700 uppercase">{p.label}</p>
                    </div>
                    <p className="text-[7px] text-slate-400 font-bold uppercase mt-1">
                        De: {p.validFrom.split('-').reverse().join('/')} 
                        {p.validUntil && ` até ${p.validUntil.split('-').reverse().join('/')}`}
                    </p>
                    <p className="text-[7px] text-indigo-400 font-black uppercase mt-0.5">{p.durationMinutes} min</p>
                  </td>
                  <td className="px-8 py-6 font-black text-[11px] text-emerald-600">R$ {p.regularPrice.toFixed(2)}</td>
                  <td className="px-8 py-6 font-black text-[11px] text-slate-400">R$ {p.regularCommission.toFixed(2)}</td>
                  <td className="px-8 py-6 font-black text-[11px] text-indigo-600">R$ {p.loyaltyPrice.toFixed(2)}</td>
                  <td className="px-8 py-6 font-black text-[11px] text-slate-400">R$ {p.loyaltyCommission.toFixed(2)}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                        <button onClick={() => setEditingRule(p)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 hover:text-indigo-600 transition-colors flex items-center justify-center">
                            <i className="fas fa-pen text-[9px]"></i>
                        </button>
                        <button 
                            onClick={() => handleRemove(p.id)} 
                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-300 hover:text-red-500 transition-colors flex items-center justify-center"
                            title="Remover ou Desativar"
                        >
                            <i className="fas fa-trash text-[10px]"></i>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPricing.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-300">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhuma regra encontrada</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PricingRules;
