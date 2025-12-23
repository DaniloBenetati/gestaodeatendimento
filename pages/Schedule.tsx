
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Session, Customer, Provider } from '../types';

interface ScheduleProps {
  sessions: Session[];
  customers: Customer[];
  providers: Provider[];
  onUpdateSession: (id: string, updates: Partial<Session>) => void;
  onEditSession: (session: Session) => void;
  onDeleteSession: (id: string) => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const Schedule: React.FC<ScheduleProps> = ({ 
  sessions, 
  customers, 
  providers, 
  onEditSession
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '').toUpperCase();
  };

  const dateOptions = useMemo(() => {
    const dates = [];
    for (let i = -7; i <= 21; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayElement = scrollContainerRef.current.querySelector('[data-today="true"]');
      if (todayElement) {
        todayElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, []);

  const selectedDateStr = formatDateStr(selectedDate);
  
  const dailySessions = useMemo(() => {
    return (sessions || [])
      .filter(s => {
        // Filtro estrito: Mesma data E status exatamente igual a SCHEDULED
        const isDateMatch = s.date === selectedDateStr;
        const isOnlyScheduled = s.status === 'SCHEDULED';
        const isNotFinished = !s.isFinished;
        const matchesProvider = filterProviderId ? s.providerIds.includes(filterProviderId) : true;
        
        return isDateMatch && isOnlyScheduled && isNotFinished && matchesProvider;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [sessions, selectedDateStr, filterProviderId]);

  const getCustomer = (id: string) => customers.find(c => c.id === id);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-auto animate-fadeIn relative">
      <header className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-md pt-2 pb-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <div>
            <h1 className="text-xl font-black text-slate-800 uppercase tracking-tighter leading-none">Agenda</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Apenas Agendamentos</p>
          </div>
          
          <div className="flex items-center gap-2">
            <select 
              value={filterProviderId}
              onChange={(e) => setFilterProviderId(e.target.value)}
              className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-slate-600 outline-none shadow-sm cursor-pointer"
            >
              <option value="">Equipe Geral</option>
              {providers.filter(p => p.active).map(p => (
                <option key={p.id} value={p.name}>{p.name.toUpperCase()}</option>
              ))}
            </select>
            <Link to="/sessions" className="hidden md:flex bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg items-center space-x-2">
              <i className="fas fa-plus"></i>
              <span>Novo</span>
            </Link>
          </div>
        </div>

        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide space-x-3 px-2 py-2 snap-x"
        >
          {dateOptions.map((date, idx) => {
            const isSelected = formatDateStr(date) === selectedDateStr;
            const isToday = formatDateStr(date) === formatDateStr(new Date());
            return (
              <button
                key={idx}
                data-today={isToday}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 w-14 h-20 rounded-[1.5rem] flex flex-col items-center justify-center transition-all snap-center border-2 ${
                  isSelected 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-105' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                }`}
              >
                <span className={`text-[8px] font-black uppercase mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {getDayName(date)}
                </span>
                <span className="text-base font-black tracking-tighter">{date.getDate()}</span>
                {isToday && !isSelected && (
                  <div className="w-1 h-1 bg-indigo-600 rounded-full mt-1"></div>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <div className="flex-1 px-2 space-y-3 pb-24 overflow-y-auto scrollbar-hide">
        {dailySessions.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <i className="far fa-calendar-times text-2xl"></i>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">Sem agendamentos para este dia</p>
            <button onClick={() => setSelectedDate(new Date())} className="mt-4 text-[9px] font-black text-indigo-600 uppercase hover:underline">Ir para Hoje</button>
          </div>
        ) : (
          dailySessions.map((session) => {
            const customer = getCustomer(session.customerId);
            
            return (
              <div 
                key={session.id}
                onClick={() => onEditSession(session)}
                className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center gap-4 group active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-400"></div>

                <div className="flex flex-col items-center justify-center min-w-[60px] border-r border-slate-50 pr-4">
                  <span className="text-sm font-black text-slate-800 leading-none">{session.startTime}</span>
                  <span className="text-[7px] font-black text-slate-400 uppercase mt-1">{session.durationMinutes} MIN</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-black text-slate-800 uppercase truncate">
                      {customer?.name || 'Cliente'}
                    </h3>
                    {customer?.isLoyalty && (
                      <span className="text-[7px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-black uppercase">VIP</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center text-slate-400 text-[8px] font-bold uppercase tracking-tight">
                      <i className="fas fa-door-open mr-1 text-[7px]"></i>
                      Sala {session.room}
                    </div>
                    <div className="flex items-center text-indigo-500 text-[8px] font-black uppercase tracking-tight">
                      <i className="fas fa-user-ninja mr-1 text-[7px]"></i>
                      {session.providerIds.join(' + ')}
                    </div>
                  </div>
                </div>

                <div className="text-right flex flex-col items-end gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest border bg-indigo-50 text-indigo-600 border-indigo-100">
                    Agendado
                  </span>
                  <p className="text-[10px] font-black text-slate-800">R$ {session.totalValue.toFixed(0)}</p>
                </div>

                <div className="md:hidden text-slate-200">
                   <i className="fas fa-chevron-right text-[10px]"></i>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Link 
        to="/sessions" 
        className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-xl z-50 active:scale-90 transition-transform"
      >
        <i className="fas fa-plus"></i>
      </Link>
    </div>
  );
};

export default Schedule;
