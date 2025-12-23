
import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface UsersProps {
  users: User[];
  onAdd: (user: Omit<User, 'id'>) => void;
  onUpdate: (id: string, updates: Partial<User>) => void;
  onDelete: (id: string) => void;
}

const Users: React.FC<UsersProps> = ({ users, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    role: 'STAFF' as UserRole, 
    active: true 
  });

  const roleLabels: Record<UserRole, { label: string, desc: string, color: string, icon: string }> = {
    ADMIN: { label: 'Administrador', desc: 'Controle Total', color: 'bg-slate-900', icon: 'fa-user-shield' },
    MANAGER: { label: 'Gerência', desc: 'Gestão Financeira', color: 'bg-indigo-600', icon: 'fa-user-tie' },
    STAFF: { label: 'Atendente', desc: 'Operação Diária', color: 'bg-emerald-500', icon: 'fa-user-tag' }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate(editingId, formData);
    } else {
      onAdd(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', username: '', password: '', role: 'STAFF', active: true });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role,
      active: user.active
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestão de Equipe</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hierarquia de Acesso e Segurança</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-black transition-all flex items-center space-x-2 text-[10px] uppercase tracking-widest"
        >
          <i className="fas fa-user-plus"></i>
          <span>Novo Usuário</span>
        </button>
      </header>

      {showForm && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl border-4 border-slate-900 animate-slideUp space-y-8 relative"
          >
            <button 
              type="button" 
              onClick={resetForm} 
              className="absolute top-6 right-6 text-slate-300 hover:text-red-500"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            <div className="text-center mb-4">
              <h3 className="font-black text-slate-800 uppercase text-lg tracking-tighter">
                {editingId ? 'Editar Usuário' : 'Novo Acesso'}
              </h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Defina as credenciais e nível de acesso</p>
            </div>

            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Colaborador</label>
                 <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-700 uppercase text-xs focus:border-indigo-300" placeholder="NOME COMPLETO" />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login (ID)</label>
                   <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-700 text-xs focus:border-indigo-300" placeholder="EX: joao.atendente" />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                   <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-slate-700 text-xs focus:border-indigo-300" placeholder="••••••••" />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nível de Hierarquia</label>
                 <div className="grid grid-cols-3 gap-2">
                   {(['STAFF', 'MANAGER', 'ADMIN'] as UserRole[]).map(role => (
                     <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({...formData, role})}
                        className={`py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${formData.role === role ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                     >
                       {role === 'STAFF' ? 'Atendente' : role === 'MANAGER' ? 'Gerência' : 'Admin'}
                     </button>
                   ))}
                 </div>
               </div>
            </div>

            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all">
              {editingId ? 'Salvar Alterações' : 'Cadastrar no Sistema'}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className={`bg-white p-8 rounded-[2.5rem] border transition-all hover:shadow-md group ${user.active ? 'border-slate-50' : 'grayscale opacity-50 border-red-100'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${roleLabels[user.role].color} text-white rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-lg`}>
                <i className={`fas ${roleLabels[user.role].icon}`}></i>
              </div>
              <div className="flex space-x-1">
                <button 
                  onClick={() => handleEdit(user)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-300 hover:text-indigo-600 transition-colors"
                  title="Editar Usuário"
                >
                  <i className="fas fa-edit text-[10px]"></i>
                </button>
                <button 
                  onClick={() => onUpdate(user.id, { active: !user.active })} 
                  className={`w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 transition-colors ${user.active ? 'text-slate-300 hover:text-amber-500' : 'text-emerald-500'}`}
                  title={user.active ? "Suspender Acesso" : "Ativar Acesso"}
                >
                  <i className={`fas ${user.active ? 'fa-power-off' : 'fa-check'} text-[10px]`}></i>
                </button>
                {user.id !== 'u1' && (
                  <button 
                    onClick={() => confirm(`Excluir definitivamente ${user.name}?`) && onDelete(user.id)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <i className="fas fa-trash-alt text-[10px]"></i>
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-tight">{user.name}</h3>
                <p className="text-[10px] font-bold text-slate-300">@{user.username}</p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg text-white uppercase ${roleLabels[user.role].color}`}>
                    {roleLabels[user.role].label}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                </div>
                <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed">{roleLabels[user.role].desc}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
               <span className="text-[9px] font-black uppercase text-slate-400">Status: {user.active ? 'Ativo' : 'Inativo'}</span>
               {user.password && <span className="text-[8px] text-slate-200 font-bold uppercase">Senha Configurada</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Users;
