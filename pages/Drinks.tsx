
import React, { useState, useMemo } from 'react';
import { DrinkProduct, DrinkOrder, Customer, PaymentMethod } from '../types';

interface DrinksProps {
  products: DrinkProduct[];
  orders: DrinkOrder[];
  customers: Customer[];
  onAddOrder: (order: Omit<DrinkOrder, 'id' | 'createdAt' | 'date'> & { date?: string }) => DrinkOrder;
  onUpdateOrder: (id: string, updates: Partial<DrinkOrder>) => void;
  onAddProduct: (product: Omit<DrinkProduct, 'id'>) => void;
  onUpdateProduct: (id: string, updates: Partial<DrinkProduct>) => void;
  showNotification: (msg: string, type: 'success' | 'error') => void;
}

const Drinks: React.FC<DrinksProps> = ({ 
  products, 
  orders, 
  customers, 
  onAddOrder, 
  onUpdateOrder, 
  onAddProduct,
  onUpdateProduct,
  showNotification 
}) => {
  const getBrazilDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const today = getBrazilDate();
  const now = new Date();

  const [view, setView] = useState<'OPEN' | 'HISTORY' | 'PRODUCTS'>('OPEN');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  
  const [historyViewMode, setHistoryViewMode] = useState<'DAILY' | 'MONTHLY' | 'ANNUAL'>('DAILY');
  const [historyFilterDate, setHistoryFilterDate] = useState(today);
  const [historyFilterMonth, setHistoryFilterMonth] = useState(now.getMonth() + 1);
  const [historyFilterYear, setHistoryFilterYear] = useState(now.getFullYear());
  
  const [selectedOrder, setSelectedOrder] = useState<DrinkOrder | null>(null);
  const [editingProduct, setEditingProduct] = useState<DrinkProduct | null>(null);
  const [activePayoutId, setActivePayoutId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const [orderDate, setOrderDate] = useState(today);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [tempItems, setTempItems] = useState<{ productId: string, name: string, quantity: number, unitPrice: number }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>();
  const [modalPaymentMethod, setModalPaymentMethod] = useState<PaymentMethod>('PIX');
  
  const [productFormData, setProductFormData] = useState({ name: '', price: 0, category: 'Bebida', active: true });

  const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const years = [2024, 2025, 2026, 2027];

  const openOrders = orders.filter(o => o.status === 'OPEN');
  
  const filteredHistoryOrders = useMemo(() => {
    return orders.filter(o => {
      if (o.status !== 'PAID') return false;
      const [year, month, day] = o.date.split('-').map(Number);
      
      if (historyViewMode === 'DAILY') return o.date === historyFilterDate;
      if (historyViewMode === 'MONTHLY') return year === historyFilterYear && month === historyFilterMonth;
      if (historyViewMode === 'ANNUAL') return year === historyFilterYear;
      return false;
    });
  }, [orders, historyViewMode, historyFilterDate, historyFilterMonth, historyFilterYear]);

  const cashReconciliation = useMemo(() => {
    const totals = { PIX: 0, CARTÃO: 0, DINHEIRO: 0, OUTROS: 0, TOTAL: 0 };
    filteredHistoryOrders.forEach(o => {
      if (o.paymentMethod) {
        totals[o.paymentMethod] = (totals[o.paymentMethod] || 0) + o.totalValue;
        totals.TOTAL += o.totalValue;
      }
    });
    return totals;
  }, [filteredHistoryOrders]);

  const revenueToday = orders.filter(o => o.status === 'PAID' && o.date === today).reduce((acc, o) => acc + o.totalValue, 0);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.loyaltyNickname?.toLowerCase().includes(customerSearch.toLowerCase())
    );
  }, [customers, customerSearch]);

  const handleOpenModal = (order?: DrinkOrder) => {
    if (order) {
      setSelectedOrder(order);
      setTempItems(order.items);
      setCustomerSearch(order.customerName);
      setSelectedCustomerId(order.customerId);
      setOrderDate(order.date);
    } else {
      setSelectedOrder(null);
      setTempItems([]);
      setSelectedProductId('');
      setCustomerSearch('');
      setSelectedCustomerId(undefined);
      setModalPaymentMethod('PIX');
      setOrderDate(today);
    }
    setIsModalOpen(true);
  };

  const handleOpenProductModal = (product?: DrinkProduct) => {
    if (product) {
      setEditingProduct(product);
      setProductFormData({ name: product.name, price: product.price, category: product.category, active: product.active });
    } else {
      setEditingProduct(null);
      setProductFormData({ name: '', price: 0, category: 'Bebida', active: true });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productFormData);
      showNotification("Produto atualizado!", "success");
    } else {
      onAddProduct(productFormData);
      showNotification("Novo produto cadastrado!", "success");
    }
    setIsProductModalOpen(false);
  };

  const addItemFromDropdown = () => {
    if (!selectedProductId) return;
    const p = products.find(prod => prod.id === selectedProductId);
    if (!p) return;

    setTempItems(prev => {
      const exists = prev.find(i => i.productId === p.id);
      if (exists) {
        return prev.map(i => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { productId: p.id, name: p.name, quantity: 1, unitPrice: p.price }];
    });
    setSelectedProductId('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setTempItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeItem = (productId: string) => {
    setTempItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSaveOrder = (isQuickSale: boolean = false) => {
    if (tempItems.length === 0) {
      showNotification("Adicione pelo menos um item.", "error");
      return;
    }

    const total = tempItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
    const finalCustomerName = customerSearch || "Consumidor";

    if (selectedOrder) {
      onUpdateOrder(selectedOrder.id, {
        items: tempItems,
        totalValue: total,
        customerName: finalCustomerName,
        customerId: selectedCustomerId,
        date: orderDate
      });
      showNotification("Comanda atualizada!", "success");
    } else {
      onAddOrder({
        customerName: finalCustomerName,
        customerId: selectedCustomerId,
        items: tempItems,
        totalValue: total,
        status: isQuickSale ? 'PAID' : 'OPEN',
        paymentMethod: isQuickSale ? modalPaymentMethod : undefined,
        date: orderDate
      });
      showNotification(isQuickSale ? `Venda concluída!` : "Comanda aberta!", "success");
    }
    setIsModalOpen(false);
  };

  const handleCloseOrder = (order: DrinkOrder, method: PaymentMethod) => {
    onUpdateOrder(order.id, {
      status: 'PAID',
      paymentMethod: method,
      closedAt: new Date().toISOString()
    });
    setActivePayoutId(null);
    showNotification(`Finalizada via ${method}!`, "success");
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fadeIn pb-20">
      {/* MODAL DE PRODUTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <form onSubmit={handleSaveProduct} className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp border-4 border-amber-500/20">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-slate-800 uppercase text-[10px] md:text-sm">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400"><i className="fas fa-times"></i></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome</label>
                  <input required value={productFormData.name} onChange={e => setProductFormData({...productFormData, name: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none uppercase text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço (R$)</label>
                    <input type="number" step="0.01" required value={productFormData.price} onChange={e => setProductFormData({...productFormData, price: parseFloat(e.target.value)})} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-black text-amber-600 outline-none text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                    <select value={productFormData.category} onChange={e => setProductFormData({...productFormData, category: e.target.value})} className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-black text-slate-700 outline-none uppercase text-[10px]">
                      <option>Água</option><option>Cerveja</option><option>Refrigerante</option><option>Suco</option><option>Dose</option><option>Outros</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-amber-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar</button>
              </div>
           </form>
        </div>
      )}

      {/* MODAL DE VENDA / COMANDA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp border-4 border-amber-500/20 flex flex-col h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-slate-800 uppercase text-[11px] tracking-tight">{selectedOrder ? 'Editando Comanda' : 'Nova Venda'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 transition-colors shadow-sm flex items-center justify-center"><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
               <div className="bg-amber-50/50 p-4 rounded-3xl border border-amber-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <i className="far fa-calendar-alt text-amber-500 text-sm"></i>
                    <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest">Data do Pedido</span>
                  </div>
                  <input 
                    type="date" 
                    value={orderDate} 
                    onChange={e => setOrderDate(e.target.value)}
                    onClick={(e) => { try { e.currentTarget.showPicker?.() } catch (err) {} }}
                    className="bg-white border border-amber-200 px-3 py-1.5 rounded-xl font-black text-amber-600 outline-none uppercase text-[10px] shadow-sm cursor-pointer"
                  />
               </div>

               <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cliente</label>
                  <div className="relative">
                    <input type="text" value={customerSearch} onFocus={() => setShowCustomerList(true)} onChange={e => setCustomerSearch(e.target.value)} placeholder="Buscar cliente..." className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-transparent outline-none font-black text-slate-700 text-[11px] uppercase" />
                    {showCustomerList && filteredCustomers.length > 0 && (
                      <div className="absolute z-50 top-full mt-2 left-0 right-0 bg-white border border-slate-100 shadow-2xl rounded-2xl max-h-40 overflow-y-auto scrollbar-hide">
                         {filteredCustomers.map(c => (
                           <div key={c.id} onClick={() => { setCustomerSearch(c.name); setSelectedCustomerId(c.id); setShowCustomerList(false); }} className="px-6 py-4 hover:bg-amber-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center">
                             <span className="text-[11px] font-black uppercase text-slate-600">{c.name}</span>
                             {c.isLoyalty && <span className="text-[8px] font-black text-amber-500">⭐ VIP</span>}
                           </div>
                         ))}
                      </div>
                    )}
                  </div>
               </div>
               <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Adicionar Item</label>
                  <div className="flex gap-3">
                     <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="flex-1 px-4 py-4 rounded-2xl bg-amber-50 border border-amber-100 font-black text-amber-900 text-[10px] uppercase cursor-pointer appearance-none">
                        <option value="">Selecione...</option>
                        {products.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
                     </select>
                     <button onClick={addItemFromDropdown} className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-plus"></i></button>
                  </div>
                  <div className="space-y-3">
                    {tempItems.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                         <div className="flex-1 min-w-0 pr-2">
                            <p className="text-[10px] font-black text-slate-700 uppercase truncate">{item.name}</p>
                            <p className="text-[9px] font-bold text-amber-500">R$ {item.unitPrice.toFixed(2)}</p>
                         </div>
                         <div className="flex items-center space-x-4">
                            <div className="flex items-center bg-slate-50 rounded-xl p-1">
                               <button onClick={() => updateQuantity(item.productId, -1)} className="w-8 h-8 rounded-lg bg-white text-slate-400 shadow-sm flex items-center justify-center"><i className="fas fa-minus text-[8px]"></i></button>
                               <span className="px-4 text-[11px] font-black text-slate-700">{item.quantity}</span>
                               <button onClick={() => updateQuantity(item.productId, 1)} className="w-8 h-8 rounded-lg bg-white text-slate-400 shadow-sm flex items-center justify-center"><i className="fas fa-plus text-[8px]"></i></button>
                            </div>
                            <button onClick={() => removeItem(item.productId)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><i className="fas fa-times"></i></button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-6">
               <div className="flex justify-between items-center px-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                  <p className="text-2xl font-black text-amber-600">R$ {tempItems.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0).toFixed(2)}</p>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleSaveOrder(false)} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">ABRIR COMANDA</button>
                  <button onClick={() => handleSaveOrder(true)} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest">CONCLUIR VENDA</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER E TABS */}
      <header className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">Bar & Bebidas</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Consumo e Estoque</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-right">
             <p className="text-[8px] font-black text-slate-300 uppercase leading-none mb-1">Caixa Hoje</p>
             <p className="text-lg font-black text-emerald-500">R$ {revenueToday.toFixed(2)}</p>
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-black shadow-lg transition-all flex items-center justify-center space-x-3 text-[11px] uppercase tracking-widest">
          <i className="fas fa-cash-register"></i>
          <span>Novo Atendimento</span>
        </button>
      </header>

      <nav className="flex space-x-1 bg-slate-100 p-1 rounded-2xl w-fit mx-auto">
         <button onClick={() => setView('OPEN')} className={`px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase transition-all ${view === 'OPEN' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>Abertas</button>
         <button onClick={() => setView('HISTORY')} className={`px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase transition-all ${view === 'HISTORY' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>Histórico & Caixa</button>
         <button onClick={() => setView('PRODUCTS')} className={`px-4 md:px-6 py-2 rounded-xl text-[8px] md:text-[9px] font-black uppercase transition-all ${view === 'PRODUCTS' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400'}`}>Estoque</button>
      </nav>

      {/* CONTEÚDO DAS TABS */}
      <section className="animate-fadeIn">
         {view === 'OPEN' && (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openOrders.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-300">
                   <p className="text-[9px] font-black uppercase tracking-[0.3em]">Nenhuma comanda aberta</p>
                </div>
              ) : (
                openOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 space-y-4 group">
                     <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-2">
                           <h4 className="font-black text-slate-800 uppercase text-[11px] leading-none truncate">{order.customerName}</h4>
                           <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Data: {order.date.split('-').reverse().join('/')}</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-[10px]"><i className="fas fa-beer"></i></div>
                     </div>
                     <div className="space-y-1 pt-2 border-t border-slate-50">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[9px] text-slate-500 font-bold uppercase">
                             <span className="truncate pr-2">{item.quantity}x {item.name}</span>
                             <span>R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                          </div>
                        ))}
                     </div>
                     <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[8px] font-black text-slate-400 uppercase">Total</span>
                        <span className="text-base font-black text-slate-800">R$ {order.totalValue.toFixed(2)}</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleOpenModal(order)} className="py-2.5 rounded-xl bg-slate-50 text-slate-400 text-[8px] font-black uppercase">Ajustar</button>
                        <button onClick={() => setActivePayoutId(activePayoutId === order.id ? null : order.id)} className="py-2.5 rounded-xl bg-emerald-600 text-white text-[8px] font-black uppercase">Baixa</button>
                     </div>
                     {activePayoutId === order.id && (
                        <div className="flex gap-1 mt-2 p-1 bg-slate-50 rounded-xl animate-fadeIn">
                          {(['PIX', 'CARTÃO', 'DINHEIRO'] as PaymentMethod[]).map(m => (
                            <button key={m} onClick={() => handleCloseOrder(order, m)} className="flex-1 py-2 bg-white text-[7px] font-black text-indigo-600 rounded-lg shadow-sm">{m}</button>
                          ))}
                        </div>
                     )}
                  </div>
                ))
              )}
           </div>
         )}

         {view === 'HISTORY' && (
           <div className="space-y-8">
              <div className="flex flex-col items-center space-y-6 animate-fadeIn">
                 <div className="flex bg-slate-100/80 p-1.5 rounded-full shadow-inner w-fit border border-slate-200/50">
                    <button onClick={() => setHistoryViewMode('DAILY')} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase transition-all tracking-wider ${historyViewMode === 'DAILY' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Dia</button>
                    <button onClick={() => setHistoryViewMode('MONTHLY')} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase transition-all tracking-wider ${historyViewMode === 'MONTHLY' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Mês</button>
                    <button onClick={() => setHistoryViewMode('ANNUAL')} className={`px-10 py-3 rounded-full text-[10px] font-black uppercase transition-all tracking-wider ${historyViewMode === 'ANNUAL' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Ano</button>
                 </div>

                 <div className="relative group">
                    <div className="bg-white px-10 py-4 rounded-full shadow-[0_15px_45px_rgba(0,0,0,0.08)] border border-slate-100 flex items-center justify-center min-w-[280px] transform transition-transform hover:scale-105">
                       {historyViewMode === 'DAILY' && (
                         <div className="flex items-center space-x-3">
                            <i className="far fa-calendar-alt text-indigo-400"></i>
                            <input 
                               type="date" 
                               value={historyFilterDate} 
                               onChange={e => setHistoryFilterDate(e.target.value)}
                               onClick={(e) => { try { e.currentTarget.showPicker?.() } catch (err) {} }}
                               className="bg-transparent border-none font-black text-indigo-600 text-sm md:text-base outline-none uppercase cursor-pointer"
                            />
                         </div>
                       )}
                       
                       {historyViewMode === 'MONTHLY' && (
                         <div className="flex items-center space-x-3">
                            <select value={historyFilterMonth} onChange={e => setHistoryFilterMonth(Number(e.target.value))} className="bg-transparent font-black text-indigo-600 text-sm md:text-base outline-none appearance-none cursor-pointer">
                               {months.map((m, i) => <option key={i} value={i + 1}>{m.toUpperCase()}</option>)}
                            </select>
                            <span className="text-indigo-200 font-black">/</span>
                            <select value={historyFilterYear} onChange={e => setHistoryFilterYear(Number(e.target.value))} className="bg-transparent font-black text-indigo-600 text-sm md:text-base outline-none appearance-none cursor-pointer">
                               {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                         </div>
                       )}

                       {historyViewMode === 'ANNUAL' && (
                         <select value={historyFilterYear} onChange={e => setHistoryFilterYear(Number(e.target.value))} className="bg-transparent font-black text-indigo-600 text-sm md:text-base outline-none appearance-none cursor-pointer px-4">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                         </select>
                       )}
                    </div>
                 </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn border-b-8 border-indigo-500/20">
                {[
                   { label: 'PIX', val: cashReconciliation.PIX, color: 'text-indigo-400' },
                   { label: 'CARTÃO', val: cashReconciliation.CARTÃO, color: 'text-emerald-400' },
                   { label: 'DINHEIRO', val: cashReconciliation.DINHEIRO, color: 'text-amber-400' },
                   { label: 'TOTAL PERÍODO', val: cashReconciliation.TOTAL, color: 'text-white' }
                ].map(item => (
                   <div key={item.label} className="bg-white/5 p-5 rounded-3xl border border-white/10 text-center">
                      <p className="text-[7px] font-black text-white/40 uppercase mb-2 tracking-[0.2em]">{item.label}</p>
                      <p className={`text-sm md:text-xl font-black ${item.color}`}>R$ {item.val.toFixed(2)}</p>
                   </div>
                ))}
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full text-left table-auto">
                     <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                         <tr>
                           <th className="px-4 md:px-8 py-6">Data / Hora</th>
                           <th className="px-4 md:px-8 py-6">Consumidor</th>
                           <th className="hidden md:table-cell px-4 md:px-8 py-6">Itens</th>
                           <th className="px-4 md:px-8 py-6 text-right">Total</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50 text-[10px]">
                         {filteredHistoryOrders.length === 0 ? (
                           <tr><td colSpan={4} className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-[9px]">Sem movimentação para este período</td></tr>
                         ) : (
                           filteredHistoryOrders.map(order => {
                             const isExpanded = expandedOrderId === order.id;
                             return (
                               <React.Fragment key={order.id}>
                                 <tr 
                                   onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                   className={`transition-colors cursor-pointer ${isExpanded ? 'bg-slate-50 border-l-4 border-indigo-500' : 'hover:bg-slate-50/50'}`}
                                 >
                                   <td className="px-4 md:px-8 py-6">
                                     <div className="flex items-center">
                                       <div>
                                         <p className="font-black text-slate-800">{order.date.split('-').reverse().join('/')}</p>
                                         <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                       </div>
                                       <i className={`fas fa-chevron-down ml-3 text-[10px] text-slate-300 transition-transform ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}></i>
                                     </div>
                                   </td>
                                   <td className="px-4 md:px-8 py-6 font-black uppercase text-slate-800 truncate max-w-[100px] md:max-w-none">{order.customerName}</td>
                                   <td className="hidden md:table-cell px-4 md:px-8 py-6 font-bold text-slate-400 uppercase">{order.items.length} itens</td>
                                   <td className="px-4 md:px-8 py-6 text-right font-black text-emerald-600 whitespace-nowrap">R$ {order.totalValue.toFixed(2)}</td>
                                 </tr>
                                 {isExpanded && (
                                   <tr className="animate-fadeIn">
                                     <td colSpan={4} className="px-4 md:px-8 py-4 bg-slate-50/50">
                                         <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                               <i className="fas fa-receipt mr-2 text-indigo-400"></i> Detalhes do Consumo
                                            </p>
                                            <div className="space-y-3">
                                               {order.items.map((item, idx) => (
                                                   <div key={idx} className="flex justify-between items-center border-b border-slate-50 last:border-0 pb-2 text-[10px]">
                                                       <div className="flex items-center space-x-3">
                                                         <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-black">{item.quantity}x</span>
                                                         <span className="font-bold text-slate-700 uppercase">{item.name}</span>
                                                       </div>
                                                       <span className="font-black text-slate-400">R$ {(item.quantity * item.unitPrice).toFixed(2)}</span>
                                                   </div>
                                               ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">Pagamento via {order.paymentMethod}</span>
                                                <span className="text-sm font-black text-slate-800">Total: R$ {order.totalValue.toFixed(2)}</span>
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
         )}

         {view === 'PRODUCTS' && (
           <div className="space-y-6">
              <div className="flex justify-between items-center px-4">
                 <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Controle de Estoque</h2>
                 <button onClick={() => handleOpenProductModal()} className="bg-amber-100 text-amber-700 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase border border-amber-200 shadow-sm hover:bg-amber-200 transition-all">Novo Produto</button>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[8px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Produto</th>
                      <th className="px-8 py-5">Preço</th>
                      <th className="px-8 py-5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-[10px]">
                    {products.map(p => (
                      <tr key={p.id} className={`hover:bg-slate-50/50 transition-all ${!p.active ? 'opacity-50' : ''}`}>
                        <td className="px-8 py-5"><span className={`px-2 py-0.5 rounded-lg font-black uppercase text-[7px] border ${p.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{p.active ? 'Ativo' : 'Off'}</span></td>
                        <td className="px-8 py-5 font-black uppercase text-slate-800">{p.name}</td>
                        <td className="px-8 py-5 font-black text-amber-600">R$ {p.price.toFixed(2)}</td>
                        <td className="px-8 py-5 text-right"><button onClick={() => handleOpenProductModal(p)} className="w-8 h-8 bg-slate-50 text-slate-300 hover:text-indigo-600 rounded-lg"><i className="fas fa-edit text-[9px]"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
         )}
      </section>
    </div>
  );
};

export default Drinks;
