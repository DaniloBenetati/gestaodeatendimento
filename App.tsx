
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sessions from './pages/Sessions';
import Schedule from './pages/Schedule';
import History from './pages/History';
import DailyClosure from './pages/DailyClosure';
import Reports from './pages/Reports';
import Providers from './pages/Providers';
import Customers from './pages/Customers';
import Users from './pages/Users';
import Manual from './pages/Manual';
import PricingRules from './pages/PricingRules';
import Drinks from './pages/Drinks';
import { Session, User } from './types';

const App: React.FC = () => {
  const store = useStore();
  const [notification, setNotification] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [editingEntity, setEditingEntity] = useState<{ type: 'customer' | 'provider' | 'user' | 'session', data: any } | null>(null);

  const showNotification = useCallback((msg: string, type: 'success' | 'error') => {
    setNotification({ msg, type });
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!store.currentUser) {
    return <Login users={store.users} onLogin={store.login} />;
  }

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    try {
      if (editingEntity.type === 'customer') {
        store.updateCustomer(editingEntity.data.id, editingEntity.data);
        showNotification("Cliente atualizado!", "success");
      } else if (editingEntity.type === 'session') {
        store.updateSession(editingEntity.data.id, editingEntity.data);
        showNotification("Registro atualizado!", "success");
      } else if (editingEntity.type === 'user') {
        store.updateUser(editingEntity.data.id, editingEntity.data);
        showNotification("Dados de acesso atualizados!", "success");
      }
      setEditingEntity(null);
    } catch (err) {
      showNotification("Erro ao processar alteração.", "error");
    }
  };

  const handleCancelSessionModalAction = (e: React.MouseEvent) => {
    e.preventDefault();
    if (editingEntity && editingEntity.type === 'session' && editingEntity.data.id) {
      if (window.confirm("TEM CERTEZA? O agendamento será movido para o controle de cancelados do dia.")) {
        store.updateSession(editingEntity.data.id, {
          status: 'CANCELLED',
          isFinished: false
        });
        showNotification("Agendamento cancelado com sucesso.", "success");
        setEditingEntity(null);
      }
    }
  };

  const openEditSession = (session: Session) => {
    setEditingEntity({ type: 'session', data: { ...session } });
  };

  const openEditProfile = (user: User) => {
    setEditingEntity({ type: 'user', data: { ...user } });
  };

  return (
    <HashRouter>
      {notification && (
        <div className={`fixed top-6 right-6 z-[9999] flex items-center space-x-4 px-8 py-5 rounded-[2rem] shadow-2xl animate-slideInRight border-2 ${notification.type === 'success' ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
          <i className={`fas ${notification.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} text-lg`}></i>
          <div className="flex flex-col">
            <p className="font-black text-[10px] uppercase tracking-widest">{notification.msg}</p>
          </div>
        </div>
      )}

      {editingEntity && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-slideUp border-4 border-indigo-600 flex flex-col max-h-[95vh] relative">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">
                {editingEntity.type === 'user' ? 'Meus Dados' : 'Ajustar Detalhes'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingEntity(null)}
                className="w-10 h-10 bg-white rounded-full border border-slate-200 text-slate-400 flex items-center justify-center shadow-sm hover:text-red-500 transition-all active:scale-90"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-hide p-8 space-y-6 flex-1">
              <form id="edit-form" onSubmit={handleSaveEdit} className="space-y-6">
                {editingEntity.type === 'user' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Exibido</label>
                      <input required value={editingEntity.data.name} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, name: e.target.value } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none uppercase text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID de Usuário</label>
                      <input required value={editingEntity.data.username} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, username: e.target.value } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none text-xs" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha</label>
                      <input required type="password" value={editingEntity.data.password} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, password: e.target.value } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none text-xs" placeholder="••••••••" />
                    </div>
                  </div>
                )}

                {editingEntity.type === 'session' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</label>
                        <input required type="date" value={editingEntity.data.date} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, date: e.target.value } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none uppercase text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</label>
                        <input required type="time" value={editingEntity.data.startTime} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, startTime: e.target.value } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none uppercase text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profissional</label>
                      <select value={editingEntity.data.providerIds[0] || ''} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, providerIds: [e.target.value] } })} className="w-full px-5 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl font-black text-indigo-700 outline-none uppercase text-xs">
                        {store.providers.filter(p => p.active).map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sala</label>
                        <input required value={editingEntity.data.room} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, room: e.target.value } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none uppercase text-xs" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração (Min)</label>
                        <input required type="number" value={editingEntity.data.durationMinutes} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, durationMinutes: parseInt(e.target.value) } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none uppercase text-xs" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Cobrado (R$)</label>
                      <input required type="number" value={editingEntity.data.totalValue} onChange={e => setEditingEntity({ ...editingEntity, data: { ...editingEntity.data, totalValue: parseFloat(e.target.value) } })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none uppercase text-xs" />
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 shrink-0 space-y-4">
              <button
                form="edit-form"
                type="submit"
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl transition-all active:scale-[0.98]"
              >
                CONFIRMAR E SALVAR
              </button>
              {editingEntity.type === 'session' && (
                <button
                  type="button"
                  onClick={handleCancelSessionModalAction}
                  className="w-full py-4 bg-white border-2 border-red-200 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <i className="fas fa-ban"></i>
                  <span>Cancelar este Agendamento</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Layout user={store.currentUser} onLogout={store.logout} onEditProfile={openEditProfile}>
        <Routes>
          <Route path="/" element={<Dashboard sessions={store.sessions} customers={store.customers} providers={store.providers} pricing={store.pricing} onConfirm={store.confirmSession} onUpdateSession={store.updateSession} onEditSession={openEditSession} onDeleteSession={store.deleteSession} showNotification={showNotification} />} />
          <Route path="/schedule" element={<Schedule sessions={store.sessions} customers={store.customers} providers={store.providers} onUpdateSession={store.updateSession} onEditSession={openEditSession} onDeleteSession={store.deleteSession} showNotification={showNotification} />} />
          <Route path="/sessions" element={<Sessions sessions={store.sessions} customers={store.customers} providers={store.providers} pricing={store.pricing} onAddSession={store.addSession} onAddCustomer={store.addCustomer} showNotification={showNotification} />} />
          <Route path="/drinks" element={<Drinks products={store.drinkProducts} orders={store.drinkOrders} customers={store.customers} onAddOrder={store.addDrinkOrder} onUpdateOrder={store.updateDrinkOrder} onAddProduct={store.addDrinkProduct} onUpdateProduct={store.updateDrinkProduct} showNotification={showNotification} />} />
          <Route path="/history" element={<History sessions={store.sessions} providers={store.providers} customers={store.customers} onDeleteSession={store.deleteSession} />} />
          <Route path="/customers" element={<Customers customers={store.customers} sessions={store.sessions} onUpdate={store.updateCustomer} onAdd={store.addCustomer} />} />
          <Route path="/providers" element={<Providers providers={store.providers} onAdd={store.addProvider} onDelete={store.deleteProvider} onUpdate={store.updateProvider} />} />
          <Route path="/pricing" element={(store.currentUser.role === 'ADMIN' || store.currentUser.role === 'MANAGER') ? <PricingRules pricing={store.pricing} onAddPricingRule={store.addPricingRule} onUpdatePricingRule={store.updatePricingRule} onDeletePricingRule={store.deletePricingRule} showNotification={showNotification} /> : <Navigate to="/" />} />
          <Route path="/users" element={store.currentUser.role === 'ADMIN' ? <Users users={store.users} onAdd={() => { }} onUpdate={store.updateUser} onDelete={() => { }} /> : <Navigate to="/" />} />
          <Route path="/manual" element={<Manual />} />
          <Route path="/closure" element={(store.currentUser.role === 'ADMIN' || store.currentUser.role === 'MANAGER') ? <DailyClosure sessions={store.sessions} providers={store.providers} customers={store.customers} pricing={store.pricing} onMarkPaid={store.markCommissionPaid} showNotification={showNotification} /> : <Navigate to="/" />} />
          <Route path="/reports" element={(store.currentUser.role === 'ADMIN' || store.currentUser.role === 'MANAGER') ? <Reports sessions={store.sessions} providers={store.providers} customers={store.customers} pricing={store.pricing} drinkOrders={store.drinkOrders} /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
