
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Session, Provider, Customer, PaymentMethod, ProviderCommission, PricingRule } from '../types';

interface DashboardProps {
  sessions: Session[];
  customers: Customer[];
  providers: Provider[];
  pricing: PricingRule[];
  onConfirm: (id: string, method: PaymentMethod, value: number, commissions: ProviderCommission[]) => void;
  onUpdateSession: (id: string, updates: Partial<Session>) => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  sessions = [],
  customers = [],
  providers = [],
  pricing = [],
  onConfirm,
  onUpdateSession,
  onEditSession,
  showNotification
}) => {
  const [finishingSession, setFinishingSession] = useState<Session | null>(null);
  const [finalValue, setFinalValue] = useState<number>(0);
  const [actualStartTime, setActualStartTime] = useState<string>('');
  const [actualEndTime, setActualEndTime] = useState<string>('');
  const [finalDuration, setFinalDuration] = useState<number>(0);
  const [consideredDuration, setConsideredDuration] = useState<number>(0);
  const [finalMethod, setFinalMethod] = useState<PaymentMethod>('PIX');
  const [now, setNow] = useState(new Date());

  const getBrazilDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  const formatTimeDisplay = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const today = getBrazilDate();
  const todaySessions = useMemo(() => sessions.filter(s => s.date === today), [sessions, today]);
  const activeSessions = useMemo(() => todaySessions.filter(s => s.status === 'PENDING' && !s.isFinished), [todaySessions]);
  const futureSessions = useMemo(() => todaySessions.filter(s => s.status === 'SCHEDULED' && !s.isFinished), [todaySessions]);
  const canceledSessions = useMemo(() => todaySessions.filter(s => s.status === 'CANCELLED'), [todaySessions]);
  const completedTodayCount = useMemo(() => todaySessions.filter(s => s.status === 'PAID').length, [todaySessions]);

  const getMinutes = (time: string) => {
    if (!time) return 0;
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const getCustomer = (id: string) => customers.find(c => c.id === id);

  const formatHHMM = (time: string) => {
    if (!time) return '';
    const parts = time.split(':');
    if (parts.length < 2) return time;
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  };

  const busyProviderNames = useMemo(() => {
    const busy = new Set<string>();
    activeSessions.forEach(s => s.providerIds.forEach(p => busy.add(p)));
    return busy;
  }, [activeSessions]);

  const freeProviders = useMemo(() => {
    return providers.filter(p => p.active && !busyProviderNames.has(p.name));
  }, [providers, busyProviderNames]);

  // LÓGICA DE CÁLCULO ATUALIZADA: MÍNIMO É SEMPRE O CONTRATADO SE O ATENDIMENTO EXISTIR
  useEffect(() => {
    if (actualStartTime && actualEndTime && finishingSession) {
      const startMin = getMinutes(actualStartTime);
      const endMin = getMinutes(actualEndTime);
      let diff = endMin - startMin;
      if (diff < 0) diff += 1440;

      setFinalDuration(diff);

      const blocksOf30 = Math.floor(diff / 30);
      const extraMinutes = diff % 30;

      // Lógica de tolerância de 10 min para cima (arredondamento para blocos de 30)
      const billableBlocks = extraMinutes > 10 ? blocksOf30 + 1 : blocksOf30;
      const calculatedBillableMinutes = billableBlocks * 30;

      // REGRA: O mínimo a ser cobrado é o tempo contratado originalmente (30 ou 60)
      const contractedMinutes = finishingSession.durationMinutes;
      // Garantimos que finalBillable seja no mínimo contractedMinutes se o atendimento foi iniciado
      const finalBillable = Math.max(calculatedBillableMinutes, contractedMinutes);

      setConsideredDuration(finalBillable);

      const customer = getCustomer(finishingSession.customerId);
      const isVIP = customer?.isLoyalty || false;

      const hours = Math.floor(finalBillable / 60);
      const hasHalfHour = (finalBillable % 60) === 30;

      const rule1h = pricing.find(r => r.durationMinutes === 60);
      const rule30m = pricing.find(r => r.durationMinutes === 30);

      const priceH = isVIP ? (rule1h?.loyaltyPrice || 230) : (rule1h?.regularPrice || 290);
      const price30 = isVIP ? (rule30m?.loyaltyPrice || 190) : (rule30m?.regularPrice || 190);

      const calculatedTotal = (hours * priceH) + (hasHalfHour ? price30 : 0);
      setFinalValue(Math.round(calculatedTotal));
    }
  }, [actualStartTime, actualEndTime, finishingSession, pricing]);

  const handleStartSession = (session: Session) => {
    const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    onUpdateSession(session.id, { status: 'PENDING', startTime: timeNow });
    showNotification(`Iniciado às ${timeNow}`, "success");
  };

  const handleCompleteFinish = () => {
    if (!finishingSession) return;

    const customer = getCustomer(finishingSession.customerId);
    const isVIP = customer?.isLoyalty || false;

    const hours = Math.floor(consideredDuration / 60);
    const hasHalfHour = (consideredDuration % 60) === 30;

    const rule1h = pricing.find(r => r.durationMinutes === 60);
    const rule30m = pricing.find(r => r.durationMinutes === 30);

    const commH = isVIP ? (rule1h?.loyaltyCommission || 150) : (rule1h?.regularCommission || 170);
    const comm30 = isVIP ? (rule30m?.loyaltyCommission || 90) : (rule30m?.regularCommission || 90);

    const totalComm = (hours * commH) + (hasHalfHour ? comm30 : 0);

    const finalCommissions = finishingSession.providerIds.map(pName => ({
      providerId: pName,
      value: Math.round(totalComm),
      status: 'PENDING' as const
    }));

    onConfirm(finishingSession.id, finalMethod, Math.round(finalValue), finalCommissions);
    onUpdateSession(finishingSession.id, {
      status: 'PAID',
      isFinished: true,
      totalValue: Math.round(finalValue),
      startTime: actualStartTime,
      endTime: actualEndTime,
      durationMinutes: finalDuration,
      billedDurationMinutes: consideredDuration,
      commissions: finalCommissions
    });
    setFinishingSession(null);
    showNotification("Checkout concluído com sucesso.", "success");
  };

  const renderActiveCard = (sess: Session) => {
    const customer = getCustomer(sess.customerId);
    const startMin = getMinutes(sess.startTime);
    const scheduledEndMin = startMin + sess.durationMinutes;
    const isOverdue = currentMinutes > scheduledEndMin;
    const customerName = customer?.name || 'Cliente';

    return (
      <div key={sess.id} className={`p-4 md:p-5 rounded-[2.5rem] border shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 transition-all duration-500 animate-fadeIn ${isOverdue ? 'bg-red-50 border-red-300 shadow-red-100 ring-2 ring-red-100 ring-offset-2 animate-pulse' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center space-x-4 w-full lg:w-auto">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors shrink-0 ${isOverdue ? 'bg-red-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
            {sess.room}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-xs font-black uppercase leading-none truncate ${isOverdue ? 'text-red-900' : 'text-slate-800'}`}>
                {customerName}
                {customer?.isLoyalty && <i className="fas fa-crown ml-2 text-indigo-500 text-[10px]"></i>}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest border ${isOverdue ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {isOverdue ? 'Atrasado' : 'Em Atendimento'}
              </span>
              <p className={`text-[8px] font-bold uppercase truncate max-w-[150px] ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                {sess.providerIds.join(', ')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3 md:gap-5 w-full lg:w-auto">
          <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-200/50 shadow-inner shrink-0">
            <div className="text-center px-3 md:px-5 py-1.5 border-r border-slate-200/60">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Início</p>
              <p className="text-[10px] font-black text-slate-700 leading-none mt-1">{formatHHMM(sess.startTime)}</p>
            </div>
            <div className="text-center px-3 md:px-5 py-1.5">
              <p className={`text-[7px] font-black uppercase tracking-tighter ${isOverdue ? 'text-red-400' : 'text-indigo-400'}`}>Previsão</p>
              <p className={`text-[10px] font-black leading-none mt-1 ${isOverdue ? 'text-red-700' : 'text-indigo-600'}`}>
                {Math.floor(scheduledEndMin / 60).toString().padStart(2, '0')}:{(scheduledEndMin % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button onClick={() => onEditSession(sess)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-slate-100">
              <i className="fas fa-pen text-[9px]"></i>
            </button>
            <button onClick={() => {
              const timeNow = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              setFinishingSession(sess);
              setActualStartTime(sess.startTime);
              setActualEndTime(timeNow);
            }} className={`px-4 md:px-5 py-3 rounded-xl font-black uppercase text-[9px] transition-all border ${isOverdue ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600 hover:text-white'}`}>
              Baixa
            </button>
          </div>
        </div>
      </div>
    );
  };

  const currentCustomer = finishingSession ? getCustomer(finishingSession.customerId) : null;

  return (
    <div className="space-y-10 animate-fadeIn pb-24">
      {finishingSession && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl overflow-hidden animate-slideUp border-4 border-emerald-500/20">
            <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <div className="min-w-0 pr-4">
                <h3 className="font-black text-slate-800 uppercase text-[10px] leading-tight mb-1">Finalizar Atendimento</h3>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-black text-indigo-600 uppercase truncate">
                    {currentCustomer?.name || 'Cliente'}
                  </p>
                  {currentCustomer?.isLoyalty && currentCustomer?.loyaltyNickname && (
                    <span className="text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase">
                      Cod: {currentCustomer.loyaltyNickname}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setFinishingSession(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 shrink-0"><i className="fas fa-times"></i></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Início Real</label>
                  <input type="time" value={actualStartTime} onChange={e => setActualStartTime(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none text-xs text-center" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Saída Real</label>
                  <input type="time" value={actualEndTime} onChange={e => setActualEndTime(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 font-black text-indigo-600 outline-none text-xs text-center" />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-center space-y-2">
                <div className="flex justify-around items-center">
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Tempo Real</p>
                    <p className="text-sm font-black text-slate-600">{formatTimeDisplay(finalDuration)}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200"></div>
                  <div>
                    <p className="text-[8px] font-black text-indigo-400 uppercase">Considerado</p>
                    <p className="text-sm font-black text-indigo-600">{formatTimeDisplay(consideredDuration)}</p>
                  </div>
                </div>
                <p className="text-[7px] text-slate-400 font-bold uppercase italic mt-1">Piso de cobrança: Tempo Contratado ({finishingSession.durationMinutes} min)</p>
              </div>

              <div className="text-center space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Final (R$ Inteiro)</label>
                <div className="relative group">
                  <input type="number" value={finalValue} onChange={e => setFinalValue(Math.round(parseFloat(e.target.value)))} className="w-full px-6 py-5 rounded-3xl border-2 border-emerald-500 bg-white font-black text-4xl text-center text-emerald-600 outline-none shadow-xl shadow-emerald-50 transition-all focus:ring-4 focus:ring-emerald-500/10" />
                  <div className="absolute -top-3 -right-3 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"><i className="fas fa-coins text-[10px]"></i></div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pagamento</label>
                <div className="grid grid-cols-2 gap-2">
                  {['PIX', 'DINHEIRO', 'CARTÃO', 'OUTROS'].map(m => (
                    <button key={m} onClick={() => setFinalMethod(m as any)} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${finalMethod === m ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleCompleteFinish} className="w-full py-6 bg-emerald-600 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all active:scale-[0.98]">BAIXA E CONCLUIR</button>
            </div>
          </div>
        </div>
      )}

      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Painel Operacional</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sessões e Agendamentos Hoje</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-right">
            <p className="text-[7px] font-black text-slate-300 uppercase leading-none mb-1">Status Sistema</p>
            <p className="text-[10px] font-black text-emerald-500 flex items-center gap-1 justify-end">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> ONLINE
            </p>
          </div>
        </div>
        <Link to="/sessions" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black shadow-lg transition-all flex items-center justify-center space-x-3 text-[11px] uppercase tracking-widest">
          <i className="fas fa-plus"></i>
          <span>Nova Sessão / Agendamento</span>
        </Link>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Finalizados</p>
          <p className="text-xl font-black text-slate-800">{completedTodayCount}</p>
        </div>
        <div className="bg-indigo-600 p-4 rounded-2xl text-white text-center shadow-lg">
          <p className="text-[8px] font-black text-indigo-200 uppercase">Ativos</p>
          <p className="text-xl font-black">{activeSessions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
          <p className="text-[8px] font-black text-slate-400 uppercase">Próximos</p>
          <p className="text-xl font-black text-slate-800">{futureSessions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center shadow-sm">
          <p className="text-[8px] font-black text-red-400 uppercase">Total Dia</p>
          <p className="text-xl font-black text-slate-800">{todaySessions.length}</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-1">
          <i className="fas fa-play-circle mr-2 text-indigo-500"></i> Em Atendimento
        </h2>
        <div className="space-y-4">
          {activeSessions.length === 0 ? (
            <div className="py-12 bg-slate-50 border border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-slate-300">
              <p className="text-[9px] font-black uppercase tracking-widest">Aguardando atendimentos...</p>
            </div>
          ) : (
            activeSessions.map(sess => renderActiveCard(sess))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-1">
          <i className="far fa-calendar-alt mr-2 text-indigo-500"></i> Agendamentos Restantes
        </h2>
        <div className="space-y-3">
          {futureSessions.length === 0 ? (
            <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest text-center py-4">Sem novos agendamentos para hoje</p>
          ) : (
            futureSessions.map(sess => {
              const customer = getCustomer(sess.customerId);
              return (
                <div key={sess.id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group animate-fadeIn">
                  <div className="flex items-center space-x-4">
                    <div className="px-3 py-2 rounded-xl border bg-indigo-50 border-indigo-100 text-indigo-600 font-black text-[10px]">{formatHHMM(sess.startTime)}h</div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase leading-none truncate">{customer?.name || 'Cliente'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Sala {sess.room} • {formatTimeDisplay(sess.durationMinutes)} • {sess.providerIds.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100 mr-2">
                      Agendado
                    </span>
                    <button onClick={() => handleStartSession(sess)} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center border border-emerald-100"><i className="fas fa-play text-[9px]"></i></button>
                    <button onClick={() => onEditSession(sess)} className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-slate-100"><i className="fas fa-pen text-[9px]"></i></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-1">
          <i className="fas fa-ban mr-2 text-red-500"></i> Agendamentos Cancelados
        </h2>
        <div className="space-y-3">
          {canceledSessions.length === 0 ? (
            <p className="text-[9px] font-black text-slate-200 uppercase tracking-widest text-center py-4">Nenhum cancelamento hoje</p>
          ) : (
            canceledSessions.map(sess => {
              const customer = getCustomer(sess.customerId);
              return (
                <div key={sess.id} className="p-5 bg-red-50/50 rounded-[2rem] border border-red-100/50 shadow-sm flex items-center justify-between group animate-fadeIn grayscale hover:grayscale-0 transition-all">
                  <div className="flex items-center space-x-4">
                    <div className="px-3 py-2 rounded-xl border bg-white border-red-100 text-red-300 font-black text-[10px] relative">
                      {formatHHMM(sess.startTime)}h
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-px bg-red-300 rotate-12"></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase leading-none truncate line-through decoration-slate-300 decoration-2">{customer?.name || 'Cliente'}</p>
                      <p className="text-[9px] font-bold text-red-300 uppercase mt-1">Cancelado • {sess.providerIds.join(', ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => onEditSession(sess)} className="w-10 h-10 rounded-xl bg-white text-slate-300 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center border border-slate-100 shadow-sm" title="Ver Detalhes"><i className="fas fa-eye text-[9px]"></i></button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="space-y-4 pt-8 border-t border-slate-100">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
            <i className="fas fa-users mr-2 text-indigo-500"></i> Profissionais Disponíveis
          </h2>
          <span className="text-[8px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            {freeProviders.length} Livres
          </span>
        </div>

        {freeProviders.length === 0 ? (
          <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-dashed border-indigo-200 flex flex-col items-center justify-center text-center">
            <i className="fas fa-clock text-indigo-300 text-xl mb-2"></i>
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Toda a equipe está em atendimento no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {freeProviders.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[10px] uppercase shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {p.name.charAt(0)}
                  </div>
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{p.name}</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border bg-emerald-50 text-emerald-600 border-emerald-100">
                  Livre
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
