
import React, { useRef } from 'react';

const Manual: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sections = [
    {
      title: "Painel de Controle",
      icon: "fa-chart-pie",
      color: "bg-indigo-600",
      content: [
        "Acompanhe a disponibilidade da equipe em tempo real logo na entrada.",
        "Alertas visuais mostram profissionais ocupados e salas em uso.",
        "Use o checkout para registrar o horário exato de saída e calcular o repasse final."
      ]
    },
    {
      title: "Agenda & Operação",
      icon: "fa-calendar-check",
      color: "bg-amber-500",
      content: [
        "Visualize reservas futuras por data na Agenda de Salas.",
        "Atendimentos ativos são gerenciados pelo Dashboard principal.",
        "O sistema avisa sobre conflitos de agenda para o mesmo profissional."
      ]
    },
    {
      title: "Lançamento de Sessões",
      icon: "fa-file-invoice-dollar",
      color: "bg-emerald-600",
      content: [
        "O sistema valida se os profissionais selecionados estão livres no horário.",
        "O preço VIP é aplicado automaticamente para clientes fidelizados.",
        "Defina a Sala e o horário de início para garantir o controle da operação."
      ]
    },
    {
      title: "Fechamento & Repasses",
      icon: "fa-vault",
      color: "bg-slate-900",
      content: [
        "Alterne entre visão 'Diária' e 'Mensal' para conferir os ganhos.",
        "Os repasses são baseados nas Regras de Negócio (Normal vs VIP).",
        "Liquide os pagamentos de comissão clicando em 'Liquidar' no extrato do profissional."
      ]
    }
  ];

  const handleExportBackup = () => {
    const data: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('clinic_')) data[key] = localStorage.getItem(key);
    }
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_sistema_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (confirm("SUBSTITUIR DADOS? Isso apagará o que está no computador agora.")) {
          Object.keys(data).forEach(key => { if (key.startsWith('clinic_')) localStorage.setItem(key, data[key]); });
          window.location.reload();
        }
      } catch (err) { alert("Arquivo inválido."); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 px-2">
      <header className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">Manual Operacional</h1>
        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Guia de Utilização e Segurança de Dados</p>
      </header>

      {/* SEGURANÇA */}
      <div className="bg-slate-900 p-10 md:p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
           <div className="max-w-sm space-y-4 text-center md:text-left">
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Segurança Total</h2>
              <p className="text-slate-400 text-xs font-bold leading-relaxed">
                Este sistema armazena dados **apenas localmente** no seu navegador. 
                Recomendamos a exportação periódica de backups para evitar perda de informações.
              </p>
           </div>
           <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <button onClick={handleExportBackup} className="px-10 py-6 bg-white text-slate-900 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center">
                 <i className="fas fa-download mr-3"></i> Exportar Dados
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-10 py-6 bg-white/10 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center">
                 <i className="fas fa-upload mr-3"></i> Restaurar Dados
              </button>
              <input type="file" ref={fileInputRef} onChange={handleImportBackup} accept=".json" className="hidden" />
           </div>
        </div>
        <i className="fas fa-shield-halved absolute -right-20 -bottom-20 text-white/5 text-[300px] rotate-12"></i>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
            <div className="p-10 space-y-8">
              <div className="flex items-center space-x-5">
                <div className={`${section.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  <i className={`fas ${section.icon} text-xl`}></i>
                </div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-base">{section.title}</h3>
              </div>
              
              <ul className="space-y-4">
                {section.content.map((item, i) => (
                  <li key={i} className="flex items-start space-x-4 text-[11px] text-slate-500 leading-relaxed font-bold uppercase tracking-wide">
                    <span className="mt-1 w-1.5 h-1.5 bg-indigo-200 rounded-full shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-10 opacity-30">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Gestão Profissional de Atendimentos</p>
      </div>
    </div>
  );
};

export default Manual;
