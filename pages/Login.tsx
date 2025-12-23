
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // States para "Esqueci minha senha"
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    setForgotMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + '/#reset-password',
      });

      if (error) throw error;
      setForgotMessage('Link de recuperação enviado com sucesso!');
      setForgotEmail('');
    } catch (err: any) {
      setForgotMessage('Erro ao enviar link. Verifique o e-mail.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Tentando login local...');
      console.log('Usuários disponíveis:', users);
      console.log('Input:', username, password);

      // 1. Tentar login local primeiro (para admin / compatibilidade)
      const localUser = users.find(u =>
        (u.username === username || u.id === username) &&
        u.password === password &&
        u.active
      );

      console.log('Resultado localUser:', localUser);

      if (localUser) {
        onLogin(localUser);
        return; // Login local bem-sucedido, interrompe fluxo
      }

      // 2. Se não encontrou localmente, tentar Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) throw error;

      // onLogin será chamado automaticamente pelo listener do useStore para Supabase
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message === 'Invalid login credentials' ? 'Credenciais inválidas' : 'Erro ao autenticar. Verifique dados.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-[440px] z-10 animate-fade-in">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20">

          <div className="pt-16 pb-10 px-10 text-center">
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Gestão de Atendimentos</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">Acesse sua conta master ou de staff</p>
          </div>

          <form onSubmit={handleSubmit} className="px-10 pb-12 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 p-3 rounded-xl text-red-500 text-[10px] font-black uppercase text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-indigo-600">Email de Acesso</label>
                <div className="relative">
                  <i className="far fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-400"></i>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 transition-colors group-focus-within:text-indigo-600">Senha Privada</label>
                <div className="relative">
                  <i className="far fa-eye-slash absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-400"></i>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-sm"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center space-x-3 disabled:opacity-50 disabled:transform-none"
            >
              {isLoading ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                <>
                  <span>LOGIN</span>
                  <i className="fas fa-arrow-right text-[10px]"></i>
                </>
              )}
            </button>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-500 transition-colors"
              >
                Esqueci minha senha
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-black text-slate-200 uppercase tracking-tighter">v3.0 Premium</span>
                <i className="fas fa-lock text-[8px] text-indigo-400"></i>
              </div>
            </div>
          </form>
        </div>

        <p className="text-center mt-8 text-white/30 text-[9px] font-black uppercase tracking-[0.5em]">Secure Enterprise Connection</p>
      </div>

      {/* Modal de Esqueci Minha Senha */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-white/20 relative animate-slideUp">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                <i className="fas fa-key"></i>
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Recuperar Acesso</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">
                Digite seu e-mail para receber as instruções
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {forgotMessage && (
                <div className={`p-3 rounded-xl text-[10px] font-black uppercase text-center ${forgotMessage.includes('sucesso') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {forgotMessage}
                </div>
              )}

              <div className="group">
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">E-mail Cadastrado</label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all font-bold text-slate-700 text-xs"
                  placeholder="exemplo@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isForgotLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
              >
                {isForgotLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Enviar Link de Recuperação'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-4">
              <p className="text-[9px] text-slate-400">
                Para contas administrativas locais (admin/gerente), contate o suporte técnico diretamente.
              </p>

              <a
                href="/app-release.apk"
                download="GestaoAtendimento.apk"
                className="inline-flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition-colors"
              >
                <i className="fab fa-android text-lg"></i>
                <span>Baixar App Android</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
