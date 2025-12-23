
import React, { useState, useMemo } from 'react';
import { Session, Provider, Customer } from '../types';

interface HistoryProps {
  sessions: Session[];
  providers: Provider[];
  customers: Customer[];
  onDeleteSession: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ sessions, providers, customers, onDeleteSession }) => {
  const getBrazilDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const today = getBrazilDate();
  const [viewMode, setViewMode] = useState<'DATE' | 'MONTHLY' | 'ANNUAL'>('DATE');
  const [filterDate, setFilterDate] = useState(today);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [filterProvider, setFilterProvider] = useState('');

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const years = [2024, 2025, 2026, 2027];

  const filteredSessions = sessions.filter(s => {
    const [sYear, sMonth] = s.date.split('-').map(Number);
    if (viewMode === 'DATE') return s.date === filterDate;
    if (viewMode === 'MONTHLY') return sYear === viewYear && sMonth === viewMonth;
    if (viewMode === 'ANNUAL') return sYear === viewYear;
    return true;
  }).filter(s => filterProvider ? s.providerIds.includes(filterProvider) : true)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));

  const getCustomerInfo = (id: string) => customers.find(c => c.id === id);

  const getCustomerMetrics = (customerId: string) => {
    const history = sessions.filter(s => s.customerId === customerId && s.status === 'PAID');
    const totalSpent = history.reduce((acc, s) => acc + s.totalValue, 0);
    const totalSessions = history.length;
    return { totalSpent, totalSessions };
  };

  const getPayoutInfo = (session: Session) => {
    if (session.status !== 'PAID') return { date: '---', method: '---', isPaid: false };
    const firstComm = session.commissions?.find(c => c.status === 'PAID');
    if (!firstComm) return { date: '---', method: '---', isPaid: false };
    
    return {
      date: new Date(firstComm.paidAt || '').toLocaleDateString('pt-BR'),
      method: firstComm.paymentMethod || '---',
      isPaid: true
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12 px-2">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Histórico Consolidado</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Auditoria de Atendimentos</p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit shadow-inner self-start md:self-end">
            <button onClick={() => setViewMode('DATE')} className={`px-4 md:px-5 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${viewMode === 'DATE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Diário</button>
            <button onClick={() => setViewMode('MONTHLY')} className={`px-4 md:px-5 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${viewMode === 'MONTHLY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Mensal</button>
            <button onClick={() => setViewMode('ANNUAL')} className={`px-4 md:px-5 py-2 rounded-xl text-[8px] font-black uppercase transition-all ${viewMode === 'ANNUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Anual</button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
            <div className="flex items-center space-x-3">
              <i className="far fa-calendar-alt text-indigo-400 text-xs"></i>
              <span className="text-[9px] font-black text-slate-400 uppercase">Período</span>
            </div>
            {viewMode === 'DATE' ? (
              <input 
                type="date" 
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)} 
                onClick={(e) => { try { e.currentTarget.showPicker?.() } catch (err) {} }} 
                className="bg-transparent font-black text-indigo-600 outline-none uppercase text-[10px] text-right cursor-pointer" 
              />
            ) : (
              <div className="flex gap-2">
                {viewMode === 'MONTHLY' && (
                  <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} className="bg-transparent font-black text-indigo-600 outline-none uppercase text-[9px]">
                    {months.map((m, i) => <option key={i} value={i + 1}>{m.toUpperCase()}</option>)}
                  </select>
                )}
                <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} className="bg-transparent font-black text-indigo-600 outline-none uppercase text-[9px]">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
            <div className="flex items-center space-x-3">
              <i className="fas fa-user-ninja text-indigo-400 text-xs"></i>
              <span className="text-[9px] font-black text-slate-400 uppercase">Profissional</span>
            </div>
            <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)} className="bg-transparent font-black text-indigo-600 outline-none uppercase text-[9px] text-right max-w-[150px]">
                <option value="">TODOS</option>
                {providers.map(p => <option key={p.id} value={p.name}>{p.name.toUpperCase()}</option>)}
             </select>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                <th className="px-4 md:px-6 py-5">Atendimento</th>
                <th className="px-4 md:px-6 py-5">Cliente</th>
                <th className="hidden lg:table-cell px-4 md:px-6 py-5">Equipe</th>
                <th className="px-4 md:px-6 py-5 text-center">Status</th>
                <th className="px-4 md:px-6 py-5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-300">
                    <p className="text-[9px] font-black uppercase tracking-widest">Nenhum registro encontrado</p>
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const payout = getPayoutInfo(session);
                  const isCancelled = session.status === 'CANCELLED';
                  const isExpanded = expandedSessionId === session.id;
                  const customer = getCustomerInfo(session.customerId);
                  const metrics = getCustomerMetrics(session.customerId);
                  
                  return (
                    <React.Fragment key={session.id}>
                      <tr 
                        onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                        className={`hover:bg-indigo-50/30 cursor-pointer transition-all ${isCancelled ? 'bg-red-50/20' : ''} ${isExpanded ? 'bg-indigo-50/50' : ''}`}
                      >
                        <td className="px-4 md:px-6 py-5">
                          <p className={`font-black text-[10px] uppercase ${isCancelled ? 'text-slate-400' : 'text-slate-800'} flex items-center`}>
                            {session.date.split('-').reverse().slice(0,2).join('/')}
                            <i className={`fas fa-chevron-down ml-2 text-[7px] text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                          </p>
                          <p className="text-[8px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">{session.startTime}</p>
                        </td>
                        <td className="px-4 md:px-6 py-5">
                          <p className={`font-black text-[10px] uppercase leading-none truncate max-w-[80px] md:max-w-[150px] ${isCancelled ? 'text-slate-400' : 'text-slate-800'}`}>
                            {customer?.name || 'Consumidor'}
                          </p>
                          {customer?.isLoyalty && (
                            <span className="text-[6px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">⭐ VIP</span>
                          )}
                        </td>
                        <td className="hidden lg:table-cell px-4 md:px-6 py-5">
                          <div className="flex flex-wrap gap-1">
                            {session.providerIds.map((p, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-lg text-[7px] font-black uppercase border border-slate-100">{p}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-5 text-center">
                          <span className={`text-[7px] font-black px-2 py-1 rounded-lg border uppercase ${isCancelled ? 'text-red-400 border-red-100 bg-red-50' : payout.isPaid ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                            {isCancelled ? 'Cancel' : payout.isPaid ? 'OK' : 'Pendente'}
                          </span>
                        </td>
                        <td className={`px-4 md:px-6 py-5 text-right font-black text-[10px] ${isCancelled ? 'text-slate-300 line-through' : 'text-slate-800'}`}>
                          R$ {session.totalValue.toFixed(2)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-indigo-50/20 animate-fadeIn">
                          <td colSpan={5} className="px-4 md:px-10 py-6 border-b border-indigo-100/50">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div className="bg-white/90 p-5 rounded-[2rem] border border-indigo-100/50 shadow-sm space-y-4">
                                   <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                         <i className="fas fa-id-card"></i>
                                      </div>
                                      <div>
                                         <h4 className="text-[10px] font-black text-slate-800 uppercase leading-none">{customer?.name || 'Cliente'}</h4>
                                         <p className="text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-1">Acumulado na Casa</p>
                                      </div>
                                   </div>
                                   
                                   <div className="grid grid-cols-2 gap-3">
                                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/20">
                                         <p className="text-[7px] font-black text-indigo-400 uppercase mb-1">Faturamento Total</p>
                                         <p className="text-[12px] font-black text-indigo-600">R$ {metrics.totalSpent.toFixed(2)}</p>
                                      </div>
                                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/20">
                                         <p className="text-[7px] font-black text-indigo-400 uppercase mb-1">Total de Visitas</p>
                                         <p className="text-[12px] font-black text-indigo-600">{metrics.totalSessions} Sessões</p>
                                      </div>
                                   </div>
                                </div>

                                <div className="bg-white/90 p-5 rounded-[2rem] border border-indigo-100/50 shadow-sm space-y-4">
                                   <p className="text-[9px] font-black text-indigo-800 uppercase tracking-widest flex items-center">
                                      <i className="fas fa-info-circle mr-2"></i> Detalhes deste Atendimento
                                   </p>
                                   <div className="space-y-2">
                                      <div className="flex justify-between items-center text-[9px] border-b border-slate-50 pb-2">
                                         <span className="font-black text-slate-400 uppercase">Sala / Equipe</span>
                                         <span className="font-black text-slate-700 uppercase">S{session.room} • {session.providerIds.join(', ')}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-[9px] border-b border-slate-50 pb-2">
                                         <span className="font-black text-slate-400 uppercase">Pagamento</span>
                                         <span className="font-black text-emerald-600 uppercase">{session.paymentMethod || '---'}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-[9px]">
                                         <span className="font-black text-slate-400 uppercase">Lançado por</span>
                                         <span className="font-black text-slate-600 uppercase truncate max-w-[100px]">{session.recordedBy}</span>
                                      </div>
                                   </div>
                                </div>
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
