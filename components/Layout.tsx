
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  onEditProfile: (user: any) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onEditProfile }) => {
  const location = useLocation();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const userRole = (user?.role || '').toUpperCase();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'fa-chart-line' },
    { path: '/schedule', label: 'Agenda', icon: 'fa-calendar-alt' },
    { path: '/sessions', label: 'Novo Atendimento', icon: 'fa-plus-circle' },
    { path: '/drinks', label: 'Bebidas', icon: 'fa-glass-cheers' },
    { path: '/providers', label: 'Profissionais', icon: 'fa-users-cog' },
    { path: '/history', label: 'Histórico', icon: 'fa-history' },
    { path: '/customers', label: 'Clientes', icon: 'fa-user-friends' },
  ];

  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    navItems.push({ path: '/pricing', label: 'Regras de Negócio', icon: 'fa-tags' });
    navItems.push({ path: '/closure', label: 'Financeiro', icon: 'fa-vault' });
    navItems.push({ path: '/reports', label: 'Relatórios', icon: 'fa-chart-pie' });
  }

  if (userRole === 'ADMIN') {
    navItems.push({ path: '/users', label: 'Usuários', icon: 'fa-user-shield' });
  }

  const activeClass = "bg-indigo-600 text-white shadow-xl transform translate-x-2";
  const inactiveClass = "text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:hidden bg-white p-4 flex justify-between items-center border-b border-slate-100">
        <span className="font-black text-slate-800 text-xs uppercase tracking-tight">Gestão de Atendimento</span>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}><i className="fas fa-bars"></i></button>
      </div>

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="mb-10 px-2">
            <span className="font-black text-slate-800 text-sm uppercase tracking-tighter block">Gestão de Atendimento</span>
            <span className="font-black text-indigo-500 text-[10px] uppercase tracking-[0.2em] block">Controle Operacional</span>
          </div>
          
          <nav className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${location.pathname === item.path ? activeClass : inactiveClass}`}
              >
                <i className={`fas ${item.icon} w-5 text-center`}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-slate-50">
            <button 
              onClick={() => onEditProfile(user)}
              className="w-full text-left px-5 py-3 mb-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 transition-all group"
            >
               <div className="flex items-center justify-between mb-1">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-400">Meus Dados</p>
                 <i className="fas fa-cog text-[8px] text-slate-300 group-hover:text-indigo-400"></i>
               </div>
               <p className="text-[10px] font-black text-indigo-600 uppercase truncate">{user.name}</p>
               <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter">{user.role}</p>
            </button>
            <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 py-3 text-slate-300 hover:text-red-500 rounded-2xl text-[9px] font-black uppercase transition-all">
              <i className="fas fa-power-off"></i>
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
