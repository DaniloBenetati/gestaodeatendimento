
import React, { useState } from 'react';
import { Supply } from '../types';

interface SuppliesProps {
    supplies: Supply[];
    onAddSupply: (supply: Omit<Supply, 'id' | 'createdAt' | 'updatedAt'>) => void;
    onUpdateSupply: (id: string, updates: Partial<Supply>) => void;
    onDeleteSupply: (id: string) => void;
    showNotification: (msg: string, type: 'success' | 'error') => void;
}

const Supplies: React.FC<SuppliesProps> = ({ supplies, onAddSupply, onUpdateSupply, onDeleteSupply, showNotification }) => {
    const [showModal, setShowModal] = useState(false);
    const [editingSupply, setEditingSupply] = useState<Supply | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        value: '',
        active: true,
        effectiveDate: new Date().toISOString().split('T')[0]
    });

    const handleOpenModal = (supply?: Supply) => {
        if (supply) {
            setEditingSupply(supply);
            setFormData({
                name: supply.name,
                description: supply.description || '',
                value: supply.value.toString(),
                active: supply.active,
                effectiveDate: supply.effectiveDate
            });
        } else {
            setEditingSupply(null);
            setFormData({
                name: '',
                description: '',
                value: '',
                active: true,
                effectiveDate: new Date().toISOString().split('T')[0]
            });
        }
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.value) {
            showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const supplyData = {
            name: formData.name,
            description: formData.description,
            value: parseFloat(formData.value),
            active: formData.active,
            effectiveDate: formData.effectiveDate
        };

        if (editingSupply) {
            onUpdateSupply(editingSupply.id, supplyData);
            showNotification('Insumo atualizado com sucesso', 'success');
        } else {
            onAddSupply(supplyData);
            showNotification('Insumo criado com sucesso', 'success');
        }

        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este insumo?')) {
            onDeleteSupply(id);
            showNotification('Insumo excluído com sucesso', 'success');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fadeIn px-4">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Insumos</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gestão de Toalhas, Refeições e Outros</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full md:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                >
                    + Novo Insumo
                </button>
            </header>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-6 py-4 text-left">Nome</th>
                                <th className="px-6 py-4 text-left">Descrição</th>
                                <th className="px-6 py-4 text-center">Valor</th>
                                <th className="px-6 py-4 text-center">Vigência</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {supplies.map(supply => (
                                <tr key={supply.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="text-[11px] font-black text-slate-800 uppercase">{supply.name}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] text-slate-500">{supply.description || '-'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-[11px] font-black text-emerald-600">R$ {supply.value.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-[10px] text-slate-500">{new Date(supply.effectiveDate).toLocaleDateString('pt-BR')}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[8px] font-black px-3 py-1 rounded-full ${supply.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                            {supply.active ? 'ATIVO' : 'INATIVO'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleOpenModal(supply)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                <i className="fas fa-edit text-[10px]"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supply.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <i className="fas fa-trash text-[10px]"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-slideUp">
                        <h2 className="text-xl font-black text-slate-800 uppercase mb-6">
                            {editingSupply ? 'Editar Insumo' : 'Novo Insumo'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-xs outline-none focus:bg-white focus:border-indigo-200"
                                    placeholder="Ex: Toalha, Refeição"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descrição</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-xs outline-none focus:bg-white focus:border-indigo-200"
                                    placeholder="Descrição opcional"
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor (R$) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-xs outline-none focus:bg-white focus:border-indigo-200"
                                    placeholder="0.00"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Data de Vigência</label>
                                <input
                                    type="date"
                                    value={formData.effectiveDate}
                                    onChange={e => setFormData({ ...formData, effectiveDate: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 font-bold text-slate-700 text-xs outline-none focus:bg-white focus:border-indigo-200"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.active}
                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="active" className="text-[10px] font-black text-slate-700 uppercase">Ativo</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg"
                                >
                                    {editingSupply ? 'Atualizar' : 'Criar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Supplies;
