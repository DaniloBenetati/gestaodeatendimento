
import React, { useState, useMemo, useRef } from 'react';
import { Session, Provider, Customer, PricingRule, DrinkOrder } from '../types';
import { toPng } from 'html-to-image';

interface ReportsProps {
  sessions: Session[];
  providers: Provider[];
  customers: Customer[];
  pricing: PricingRule[];
  drinkOrders: DrinkOrder[];
}

const Reports: React.FC<ReportsProps> = ({ sessions, providers, customers, pricing, drinkOrders }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [dateStart, setDateStart] = useState('2024-01-01');
  const [dateEnd, setDateEnd] = useState(getLocalDate());
  const [activeTab, setActiveTab] = useState<'FINANCE' | 'PEAKS' | 'PROVIDERS' | 'DRINKS'>('FINANCE');

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.date >= dateStart && s.date <= dateEnd && s.status === 'PAID');
  }, [sessions, dateStart, dateEnd]);

  const filteredDrinkOrders = useMemo(() => {
    return drinkOrders.filter(o => o.date >= dateStart && o.date <= dateEnd && o.status === 'PAID');
  }, [drinkOrders, dateStart, dateEnd]);

  const financialStats = useMemo(() => {
    const revenueSess = filteredSessions.reduce((acc, s) => acc + Number(s.totalValue), 0);
    const revenueDrinks = filteredDrinkOrders.reduce((acc, o) => acc + Number(o.totalValue), 0);
    const commissions = filteredSessions.reduce((acc, s) => acc + (s.commissions?.reduce((cAcc, c) => cAcc + c.value, 0) || 0), 0);
    const totalRevenue = revenueSess + revenueDrinks;
    const average = filteredSessions.length > 0 ? revenueSess / filteredSessions.length : 0;
    return { revenue: totalRevenue, commissions, net: totalRevenue - commissions, average, revenueDrinks };
  }, [filteredSessions, filteredDrinkOrders]);

  const peakStats = useMemo(() => {
    const hours: Record<string, number> = {};
    const days: Record<string, number> = { "Dom": 0, "Seg": 0, "Ter": 0, "Qua": 0, "Qui": 0, "Sex": 0, "Sáb": 0 };
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    filteredSessions.forEach(s => {
      const hour = s.startTime.split(':')[0] + 'h';
      hours[hour] = (hours[hour] || 0) + 1;

      const dateObj = new Date(s.date + 'T12:00:00');
      const dayName = dayNames[dateObj.getDay()];
      days[dayName] = (days[dayName] || 0) + 1;
    });

    const sortedHours = Object.entries(hours).sort((a, b) => b[1] - a[1]);
    const maxHour = sortedHours[0]?.[1] || 1;
    const maxDay = Math.max(...Object.values(days)) || 1;

    return { hours: sortedHours, days, maxHour, maxDay };
  }, [filteredSessions]);

  const providerStats = useMemo(() => {
    const stats: Record<string, { sessions: number, commissions: number }> = {};
    filteredSessions.forEach(s => {
      s.providerIds.forEach(pId => {
        if (!stats[pId]) stats[pId] = { sessions: 0, commissions: 0 };
        stats[pId].sessions += 1;
        const c = s.commissions?.find(comm => comm.providerId === pId);
        if (c) stats[pId].commissions += c.value;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].commissions - a[1].commissions);
  }, [filteredSessions]);

  // Estatístico de Bebidas
  const drinkConsumptionStats = useMemo(() => {
    const ranking: Record<string, { name: string, total: number, items: number, isQuickSale: boolean }> = {};

    filteredDrinkOrders.forEach(order => {
      const key = order.customerId || 'quick_sale';
      if (!ranking[key]) {
        ranking[key] = {
          name: order.customerId ? (customers.find(c => c.id === order.customerId)?.name || order.customerName) : 'Venda Rápida (Geral)',
          total: 0,
          items: 0,
          isQuickSale: !order.customerId
        };
      }
      ranking[key].total += order.totalValue;
      ranking[key].items += order.items.reduce((acc, i) => acc + i.quantity, 0);
    });

    return Object.values(ranking).sort((a, b) => b.total - a.total);
  }, [filteredDrinkOrders, customers]);

  const handleDownloadImage = async () => {
    if (reportRef.current) {
      try {
        setIsGeneratingImage(true);
        if (toPng) {
          const dataUrl = await toPng(reportRef.current, { backgroundColor: '#ffffff' });
          const link = document.createElement('a');
          link.download = `relatorio_${activeTab.toLowerCase()}_${dateStart}.png`;
          link.href = dataUrl;
          link.click();
        }
      } catch (err) {
        console.error("Erro ao gerar imagem", err);
      } finally {
        setIsGeneratingImage(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Inteligência & Relatórios</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Análise de Performance e BI Operacional</p>
        </div>

        <div className="flex items-center gap-3 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-2">
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-slate-50 border-none px-3 py-2 rounded-xl text-[9px] font-black text-slate-600 outline-none uppercase" />
            <span className="text-slate-300 text-[8px] font-black uppercase">até</span>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-slate-50 border-none px-3 py-2 rounded-xl text-[9px] font-black text-slate-600 outline-none uppercase" />
          </div>
          <button onClick={handleDownloadImage} disabled={isGeneratingImage} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
            <i className={`fas ${isGeneratingImage ? 'fa-spinner fa-spin' : 'fa-camera'}`}></i>
          </button>
        </div>
      </header>

      <nav className="flex space-x-1 bg-slate-100/50 p-1 rounded-full w-fit">
        {[
          { id: 'FINANCE', label: 'Geral', icon: 'fa-coins' },
          { id: 'PEAKS', label: 'Fluxo', icon: 'fa-chart-bar' },
          { id: 'PROVIDERS', label: 'Equipe', icon: 'fa-user-ninja' },
          { id: 'DRINKS', label: 'Consumo Bebidas', icon: 'fa-glass-cheers' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <i className={`fas ${tab.icon} scale-90`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div ref={reportRef} className="space-y-8 bg-white rounded-[3rem] p-8 shadow-sm border border-slate-50">
        {activeTab === 'FINANCE' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard label="Faturamento Total" value={`R$ ${financialStats.revenue.toLocaleString()}`} color="indigo" icon="fa-money-bill-wave" />
              <StatCard label="Venda Bebidas" value={`R$ ${financialStats.revenueDrinks.toLocaleString()}`} color="amber" icon="fa-beer" />
              <StatCard label="Total Repasses" value={`R$ ${financialStats.commissions.toLocaleString()}`} color="indigo" icon="fa-handshake" opacity="opacity-40" />
              <StatCard label="Lucro Líquido" value={`R$ ${financialStats.net.toLocaleString()}`} color="emerald" icon="fa-wallet" />
            </div>
            <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mb-4">Ticket Médio por Sessão</p>
                <p className="text-7xl font-black tracking-tighter">R$ {financialStats.average.toFixed(0)}</p>
                <p className="text-[10px] font-bold mt-6 opacity-70 uppercase tracking-[0.2em]">{filteredSessions.length} Atendimentos Concluídos</p>
              </div>
              <i className="fas fa-chart-line absolute -right-10 -bottom-10 text-white/5 text-[200px] rotate-12"></i>
            </div>
          </div>
        )}

        {activeTab === 'PEAKS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Demanda por Dia da Semana</h3>
              <div className="flex items-end justify-between h-48 px-2">
                {Object.entries(peakStats.days).map(([day, count]) => (
                  <div key={day} className="flex flex-col items-center space-y-3 flex-1 group">
                    <div className="relative w-8 bg-indigo-500 rounded-t-xl transition-all duration-700 hover:bg-indigo-600" style={{ height: `${((count as number) / (peakStats.maxDay || 1)) * 100}%` }}>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase">{day}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Ranking de Horários (Pico)</h3>
              <div className="space-y-4">
                {peakStats.hours.slice(0, 6).map(([hour, count]) => (
                  <div key={hour} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                      <span className="text-slate-800">{hour}</span>
                      <span className="text-indigo-600">{count} Sessões</span>
                    </div>
                    <div className="h-2.5 bg-white rounded-full overflow-hidden border border-slate-200">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((count as number) / (peakStats.maxHour || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'PROVIDERS' && (
          <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden animate-fadeIn">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-8 py-6">Profissional</th>
                  <th className="px-8 py-6 text-center">Atendimentos</th>
                  <th className="px-8 py-6 text-right">Comissões Acumuladas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {providerStats.map(([name, data]) => (
                  <tr key={name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-slate-800 text-white rounded-xl flex items-center justify-center font-black text-xs">{name.charAt(0)}</div>
                        <span className="font-black text-slate-800 uppercase text-[11px]">{name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center font-black text-slate-500 text-[11px]">{data.sessions}</td>
                    <td className="px-8 py-6 text-right font-black text-indigo-600 text-[11px]">R$ {data.commissions.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'DRINKS' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ranking de Consumo por Cliente</h3>
              <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">Total Bar: R$ {financialStats.revenueDrinks.toLocaleString()}</span>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-6">Cliente</th>
                    <th className="px-8 py-6 text-center">Itens Consumidos</th>
                    <th className="px-8 py-6 text-right">Valor Total Gasto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {drinkConsumptionStats.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-12 text-slate-300 font-black uppercase text-[10px]">Sem dados de consumo no período</td></tr>
                  ) : (
                    drinkConsumptionStats.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${item.isQuickSale ? 'bg-slate-100 text-slate-400' : 'bg-amber-100 text-amber-700'}`}>
                              <i className={`fas ${item.isQuickSale ? 'fa-bolt' : 'fa-user'}`}></i>
                            </div>
                            <span className="font-black text-slate-800 uppercase text-[11px]">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center font-black text-slate-500 text-[11px]">{item.items} un.</td>
                        <td className="px-8 py-6 text-right font-black text-emerald-600 text-[11px]">R$ {item.total.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon, opacity }: any) => {
  const colors: any = {
    indigo: "bg-indigo-600 shadow-indigo-100",
    amber: "bg-amber-500 shadow-amber-100",
    emerald: "bg-emerald-600 shadow-emerald-100"
  };
  return (
    <div className={`p-6 rounded-[2.5rem] text-white ${colors[color]} shadow-xl relative overflow-hidden group transition-all transform hover:-translate-y-1 ${opacity || ''}`}>
      <div className="relative z-10 space-y-1">
        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-60">{label}</p>
        <p className="text-2xl font-black tracking-tighter">{value}</p>
      </div>
      <i className={`fas ${icon} absolute -right-4 -bottom-4 text-white/10 text-6xl rotate-12 group-hover:rotate-0 transition-transform duration-500`}></i>
    </div>
  );
};

export default Reports;
