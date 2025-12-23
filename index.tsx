
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Iniciando renderização do React...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Erro crítico: Elemento #root não encontrado.");
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("React renderizado com sucesso.");
  } catch (err) {
    console.error("Erro fatal durante a renderização:", err);
    document.body.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>Erro no Aplicativo</h1>
        <p>Não foi possível iniciar o sistema. Verifique o console do navegador para detalhes.</p>
        <pre>${err instanceof Error ? err.message : String(err)}</pre>
      </div>
    `;
  }
}
