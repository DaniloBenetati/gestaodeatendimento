
import React, { useState } from 'react';
import { Provider } from '../types';

interface ProvidersProps {
  providers: Provider[];
  onAdd: (provider: Omit<Provider, 'id'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Provider>) => void;
}

const Providers: React.FC<ProvidersProps> = ({ providers, onAdd, onDelete, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Provider, 'id'>>({ 
    name: '', 
    specialty: '', 
    active: true,
    realName: '',
    pixKey: '',
    phone: '',
    bankDetails: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    setShowForm(false);
    setEditingId(null);
    setFormData({ 
      name: '', 
      specialty: '', 
      active: true,
      realName: '',
      pixKey: '',
      phone: '',
      bankDetails: ''
    });
  };

  const handleEdit = (p: Provider) => {
    setFormData({
      name: p.name,
      specialty: p.specialty,
      active: p.active,
      realName: p.realName || '',
      pixKey: p.pixKey || '',
      phone: p.phone || '',
      bankDetails: p.bankDetails || ''
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Equipe Profissional</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Colaboradores</p>
        </div>
        <button 
          onClick={() => { 
            setShowForm(true); 
            setEditingId(null); 
            setFormData({ 
              name: '', 
              specialty: '', 
              active: true,
              realName: '',
              pixKey: '',
              phone: '',
              bankDetails: ''
            }); 
          }} 
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center space-x-2"
        >
          <i className="fas fa-plus"></i> 
          <span>Novo Cadastro</span>
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp border-4 border-indigo-600">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50">
               <div>
                 <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-none">
                    {editingId ? 'Editar Profissional' : 'Novo Cadastro'}
                 </h3>
                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Dados Operacionais e Financeiros</p>
               </div>
               <button onClick={() => setShowForm(false)} className="w-10 h-10 bg-white rounded-full border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm hover:text-red-500 transition-colors">
                 <i className="fas fa-times"></i>
               </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
               <div className="space-y-5">
                  <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] border-b border-indigo-50 pb-2">Identificação em Sala</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Guerra (Agenda)</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none uppercase text-xs" placeholder="NOME NA AGENDA" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Especialidade / Cargo</label>
                      <input required value={formData.specialty} onChange={e => setFormData({...formData, specialty: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none uppercase text-xs" placeholder="EX: MASSOTERAPEUTA" />
                    </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.2em] border-b border-amber-50 pb-2">Informações de Contato e Repasse</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                        <input value={formData.realName} onChange={e => setFormData({...formData, realName: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none uppercase text-xs" placeholder="NOME COMPLETO" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp (DDD + NÚMERO)</label>
                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-emerald-600 outline-none text-xs" placeholder="11999999999" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave PIX</label>
                        <input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-indigo-600 outline-none text-xs" placeholder="CPF, E-MAIL OU ALEATÓRIA" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dados Bancários / Obs</label>
                        <input value={formData.bankDetails} onChange={e => setFormData({...formData, bankDetails: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-black text-slate-600 outline-none text-xs" placeholder="AG / CONTA / BANCO" />
                      </div>
                    </div>
                  </div>
               </div>

               <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all active:scale-[0.98]">
                 {editingId ? 'ATUALIZAR REGISTRO' : 'CONCLUIR CADASTRO'}
               </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-6 w-24">Status</th>
                <th className="px-8 py-6">Profissional</th>
                <th className="px-8 py-6">Cargo</th>
                <th className="px-8 py-6">Contato / PIX</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {providers.map(p => (
                <tr key={p.id} className={`hover:bg-slate-50/80 transition-all group ${!p.active ? 'bg-slate-50/30' : ''}`}>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => onUpdate(p.id, { active: !p.active })}
                      className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 flex items-center ${p.active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${p.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <p className="font-black text-[11px] text-slate-800 uppercase leading-none">{p.name}</p>
                    {p.phone && <p className="text-[7px] text-emerald-500 font-black uppercase mt-1"><i className="fab fa-whatsapp mr-1"></i>{p.phone}</p>}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border ${p.active ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                      {p.specialty}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[10px] font-bold text-slate-600 uppercase truncate max-w-[150px]">{p.realName || '---'}</p>
                    <p className="text-[8px] font-black text-indigo-400 truncate max-w-[150px]">{p.pixKey || 'Sem PIX'}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end space-x-2">
                        <button 
                            onClick={() => handleEdit(p)}
                            className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center"
                        >
                            <i className="fas fa-pen text-[10px]"></i>
                        </button>
                        <button 
                            onClick={() => confirm(`Deseja remover ${p.name}?`) && onDelete(p.id)} 
                            className="w-9 h-9 rounded-xl bg-red-50 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white flex items-center justify-center"
                        >
                            <i className="fas fa-trash text-[10px]"></i>
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Providers;
