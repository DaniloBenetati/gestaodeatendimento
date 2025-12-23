
import React, { useState, useMemo } from 'react';
import { Session, PaymentMethod, Provider, Customer } from '../types';

interface ClosureProps {
  sessions: Session[];
  providers: Provider[];
  customers: Customer[];
  onMarkPaid: (providerName: string, sessionIds: string[], method: PaymentMethod) => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const DailyClosure: React.FC<ClosureProps> = ({ sessions, providers, customers, onMarkPaid, showNotification }) => {
  const [viewMode, setViewMode] = useState<'DAILY' | 'MONTHLY' | 'ANNUAL'>('DAILY');
  const [selectedMethods, setSelectedMethods] = useState<Record<string, PaymentMethod>>({});
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  
  const getBrazilDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [viewDate, setViewDate] = useState(getBrazilDate());
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const years = [2024, 2025, 2026, 2027];

  const formatTimeDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m.toString().padStart(2, '0')}h`;
  };

  const filteredSessions = useMemo(() => {
    return (sessions || []).filter(s => {
      if (s.status !== 'PAID') return false;
      const sessionDateParts = s.date.split('-'); 
      const sYear = parseInt(sessionDateParts[0]);
      const sMonth = parseInt(sessionDateParts[1]);
      
      if (viewMode === 'DAILY') return s.date === viewDate;
      if (viewMode === 'MONTHLY') return sYear === viewYear && sMonth === viewMonth;
      if (viewMode === 'ANNUAL') return sYear === viewYear;
      return false;
    });
  }, [sessions, viewMode, viewDate, viewMonth, viewYear]);

  const totalRevenue = Math.round(filteredSessions.reduce((acc, curr) => acc + (Number(curr.totalValue) || 0), 0));
  const totalCommissions = Math.round(filteredSessions.reduce((acc, s) => {
    return acc + (s.commissions?.reduce((cAcc, c) => cAcc + (Number(c.value) || 0), 0) || 0);
  }, 0));
  const netValue = totalRevenue - totalCommissions;

  const providerSummary = useMemo(() => {
    return providers.map(p => {
      const participations = filteredSessions.filter(s => s.providerIds.includes(p.name));
      const sessionDetails = participations.map(s => {
        const customer = customers.find(c => c.id === s.customerId);
        const commObj = s.commissions?.find(c => c.providerId === p.name);
        
        return {
          sessionId: s.id,
          client: customer?.name || 'Cliente',
          nickname: customer?.loyaltyNickname,
          isVIP: customer?.isLoyalty || false,
          time: s.startTime,
          endTime: s.endTime,
          duration: s.durationMinutes,
          billedDuration: s.billedDurationMinutes || s.durationMinutes,
          date: s.date,
          value: Math.round(commObj?.value || 0),
          status: commObj?.status || 'PENDING',
          paidAt: commObj?.paidAt,
          pMethod: commObj?.paymentMethod
        };
      }).sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));

      const totalInPeriod = Math.round(sessionDetails.reduce((acc, curr) => acc + curr.value, 0));
      const pendingAmount = Math.round(sessionDetails.filter(d => d.status === 'PENDING').reduce((acc, curr) => acc + curr.value, 0));
      const paidAmount = Math.round(sessionDetails.filter(d => d.status === 'PAID').reduce((acc, curr) => acc + curr.value, 0));
      const pendingIds = sessionDetails.filter(d => d.status === 'PENDING').map(ps => ps.sessionId);
      
      return { 
        ...p, 
        sessionDetails, 
        totalInPeriod, 
        pendingAmount, 
        paidAmount,
        pendingIds,
        hasHistory: sessionDetails.length > 0 
      };
    }).filter(p => p.hasHistory);
  }, [filteredSessions, providers, customers]);

  const handleSendWhatsApp = (provider: any) => {
    const periodLabel = viewMode === 'DAILY' ? viewDate.split('-').reverse().join('/') : 
                      viewMode === 'MONTHLY' ? `${months[viewMonth-1]}/${viewYear}` : `${viewYear}`;
    
    let message = `*DEMONSTRATIVO DE REPASSE*\n`;
    message += `🗓️ Ref: ${periodLabel}\n\n`;
    message += `-----------------------------------\n`;
    
    provider.sessionDetails.forEach((d: any) => {
      const statusIcon = d.status === 'PAID' ? '✅' : '⏳';
      const formattedDate = d.date.split('-').reverse().slice(0,2).join('/');
      
      message += `${statusIcon} *${formattedDate}*\n`;
      message += `⏰ Horário: ${d.time} às ${d.endTime || '--:--'} (${formatTimeDisplay(d.billedDuration)})\n`;
      message += `👤 Cliente: ${d.client}\n`;
      if (d.isVIP && d.nickname) {
        message += `🏷️ Codinome: ${d.nickname}\n`;
      }
      message += `💰 Repasse: *R$ ${d.value}.00*\n`;
      
      if (d.status === 'PAID') {
        const dateObj = new Date(d.paidAt);
        const paidDate = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('pt-BR') : '---';
        message += `🏷️ Pago em: ${paidDate} via ${d.pMethod}\n`;
      } else {
        message += `🏷️ Status: AGUARDANDO BAIXA\n`;
      }
      message += `-----------------------------------\n`;
    });
    
    const isFullyPaid = provider.pendingAmount === 0;
    message += `\n*RESUMO FINANCEIRO:*`;
    message += `\nTOTAL ACUMULADO: *R$ ${provider.totalInPeriod}.00*`;
    message += `\nSTATUS: ${isFullyPaid ? '100% LIQUIDADO ✅' : 'PENDENTE DE BAIXA ⏳'}`;
    
    if (!isFullyPaid) {
      message += `\nSALDO A RECEBER: R$ ${provider.pendingAmount}.00`;
    }

    const encoded = encodeURIComponent(message);
    const phone = provider.phone?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/${phone ? '55' + phone : ''}?text=${encoded}`, '_blank');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6 pb-12 animate-fadeIn px-2 md:px-4">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Fechamento de Caixa</h1>
            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Conferência Operacional e Financeira</p>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-fit shadow-inner border border-slate-200/50">
            <button onClick={() => setViewMode('DAILY')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all ${viewMode === 'DAILY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Dia</button>
            <button onClick={() => setViewMode('MONTHLY')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all ${viewMode === 'MONTHLY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Mês</button>
            <button onClick={() => setViewMode('ANNUAL')} className={`flex-1 md:flex-none px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase transition-all ${viewMode === 'ANNUAL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Ano</button>
          </div>
        </div>

        <div className="bg-white p-3 md:p-4 rounded-3xl border border-slate-100 shadow-sm animate-fadeIn">
          {viewMode === 'DAILY' && (
            <div className="flex items-center justify-center space-x-3">
              <i className="far fa-calendar-alt text-indigo-500"></i>
              <input type="date" value={viewDate} onChange={e => setViewDate(e.target.value)} className="bg-transparent font-black text-indigo-600 outline-none uppercase text-xs cursor-pointer" />
            </div>
          )}
          {viewMode === 'MONTHLY' && (
            <div className="flex items-center justify-center space-x-4">
              <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl font-black text-indigo-600 text-[10px] outline-none uppercase">
                {months.map((m, i) => <option key={i} value={i + 1}>{m.toUpperCase()}</option>)}
              </select>
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl font-black text-indigo-600 text-[10px] outline-none uppercase">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
          {viewMode === 'ANNUAL' && (
            <div className="flex items-center justify-center">
              <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))} className="bg-slate-50 border border-slate-100 px-6 py-2 rounded-xl font-black text-indigo-600 text-[10px] outline-none uppercase">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
        <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between md:flex-col items-center md:items-start overflow-hidden">
           <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Bruto Total</p>
           <p className="text-sm md:text-xl font-black text-slate-800 truncate">R$ {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between md:flex-col items-center md:items-start overflow-hidden">
           <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Repasses</p>
           <p className="text-sm md:text-xl font-black text-amber-500 truncate">R$ {totalCommissions.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between md:flex-col items-center md:items-start overflow-hidden">
           <p className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">Líquido Caixa</p>
           <p className="text-sm md:text-xl font-black text-emerald-500 truncate">R$ {netValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        {providerSummary.map((ps) => (
          <div key={ps.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden transition-all">
            <div 
              onClick={() => setExpandedProvider(expandedProvider === ps.id ? null : ps.id)} 
              className="p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors gap-3"
            >
              <div className="flex items-center space-x-3 md:space-x-4 min-w-[140px]">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm">
                  {ps.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-[10px] md:text-xs font-black text-slate-800 uppercase leading-none">{ps.name}</h3>
                  <div className="mt-1 flex flex-col">
                    <span className="text-[8px] text-slate-400 font-bold uppercase">REPASSE PENDENTE: <span className="text-red-500">R$ {ps.pendingAmount}</span></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right ml-auto">
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-black text-slate-800 uppercase leading-none">TOTAL: R$ {ps.totalInPeriod}</p>
                  <p className="text-[7px] text-emerald-500 font-black uppercase mt-1">PAGO: R$ {ps.paidAmount}</p>
                </div>
                <i className={`fas fa-chevron-down text-slate-200 text-[10px] transition-transform ${expandedProvider === ps.id ? 'rotate-180 text-indigo-500' : ''}`}></i>
              </div>
            </div>

            {expandedProvider === ps.id && (
              <div className="px-3 md:px-5 pb-8 animate-slideDown bg-slate-50/30">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-4 gap-4 border-t border-slate-100">
                   <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Demonstrativo de Atendimentos</h4>
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(ps); }}
                     className="w-full md:w-auto flex items-center justify-center space-x-2 bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all text-[8px] font-black uppercase shadow-sm"
                   >
                     <i className="fab fa-whatsapp text-sm"></i>
                     <span>Gerar Folha Mensagem</span>
                   </button>
                </div>

                {/* EXTRATO EM FORMATO TABULAR CLEAN - AJUSTADO COM COLUNA PGTO. */}
                <div className="bg-white rounded-[1.5rem] md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-separate border-spacing-0 table-auto">
                         <thead>
                            <tr className="bg-slate-50 text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                               <th className="px-3 md:px-6 py-4">Sessão / Baixa</th>
                               <th className="px-3 md:px-6 py-4 text-center">Considerado</th>
                               <th className="px-3 md:px-6 py-4 text-center">Pgto.</th>
                               <th className="px-3 md:px-6 py-4 text-right">Repasse</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-50">
                            {ps.sessionDetails.map((d, i) => (
                               <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-3 md:px-6 py-4">
                                     <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-[9px] md:text-[10px] font-black text-slate-800 uppercase leading-none truncate max-w-[80px] md:max-w-none">{d.client}</span>
                                        {d.isVIP && <i className="fas fa-crown text-amber-500 text-[7px] md:text-[8px]"></i>}
                                     </div>
                                     <div className="flex flex-col mt-0.5">
                                        <span className="text-[7px] md:text-[8px] font-bold text-slate-400 uppercase leading-none whitespace-nowrap">
                                          {d.time} às {d.endTime || '--:--'}
                                        </span>
                                        {d.isVIP && d.nickname && (
                                          <span className="text-[7px] md:text-[8px] font-black text-indigo-500 uppercase tracking-tighter mt-0.5 whitespace-nowrap">
                                            COD: {d.nickname}
                                          </span>
                                        )}
                                     </div>
                                  </td>
                                  <td className="px-3 md:px-6 py-4 text-center text-[10px] md:text-[11px] font-black text-indigo-600 uppercase whitespace-nowrap">
                                     {formatTimeDisplay(d.billedDuration)}
                                  </td>
                                  <td className="px-3 md:px-6 py-4 text-center">
                                     <span className={`text-[7px] md:text-[8px] font-black px-2 py-1 rounded-lg border uppercase whitespace-nowrap ${d.status === 'PAID' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-amber-50 text-amber-500 border-amber-100'}`}>
                                        {d.status === 'PAID' ? 'Pago' : 'Pendente'}
                                     </span>
                                  </td>
                                  <td className="px-3 md:px-6 py-4 text-right">
                                     <div className="flex items-center justify-end gap-1.5">
                                        <span className="text-[10px] md:text-[11px] font-black text-slate-800 tracking-tighter whitespace-nowrap">
                                          R$ {d.value}
                                        </span>
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>

                {ps.pendingAmount > 0 && (
                  <div className="flex flex-col gap-3 p-4 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 mt-4">
                    <p className="text-[8px] font-black text-indigo-400 uppercase text-center tracking-widest">Liquidação Financeira</p>
                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200/50">
                      {['PIX', 'DINHEIRO', 'CARTÃO'].map(m => (
                        <button key={m} onClick={() => setSelectedMethods({...selectedMethods, [ps.name]: m as any})} className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase transition-all ${ (selectedMethods[ps.name] || 'PIX') === m ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>
                          {m}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => {
                        onMarkPaid(ps.name, ps.pendingIds, selectedMethods[ps.name] || 'PIX');
                        showNotification(`Liquidado para ${ps.name}`, "success");
                      }} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-[0.98] transition-transform">
                      PAGAR AGORA: R$ {ps.pendingAmount}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyClosure;
