
import React, { useState } from 'react';
import { Sale, Client, PaymentMethodDef } from '../types';
import { Calendar, TrendingUp, ChevronDown, ChevronRight, Package, User, CreditCard, Trash2, Edit2, X, Save } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  clients: Client[];
  paymentMethods: PaymentMethodDef[];
  onDeleteSale: (id: string) => void;
  onUpdateSale: (sale: Sale) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ 
    sales, clients, paymentMethods, 
    onDeleteSale, onUpdateSale 
}) => {
  const sortedSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  
  // Edit State
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedSaleId(expandedSaleId === id ? null : id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("ATTENTION : Supprimer cette vente va rétablir le stock des produits vendus.\n\nÊtes-vous sûr de vouloir continuer ?")) {
          onDeleteSale(id);
      }
  };

  const handleEditClick = (sale: Sale, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingSale(sale);
  };

  const handleSaveEdit = () => {
      if(editingSale) {
          onUpdateSale(editingSale);
          setEditingSale(null);
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-140px)]">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Historique des Ventes
        </h3>
        <span className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500">
            {sales.length} transactions
        </span>
      </div>

      <div className="overflow-auto flex-1 p-4">
        <div className="space-y-3">
            {sortedSales.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">
                    Aucune vente enregistrée pour le moment.
                </div>
            ) : (
                sortedSales.map(sale => {
                    const isExpanded = expandedSaleId === sale.id;
                    const itemCount = sale.items ? sale.items.reduce((acc, i) => acc + i.quantity, 0) : 1; 

                    return (
                        <div key={sale.id} className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-green-200 shadow-sm' : 'border-slate-100'}`}>
                            {/* Header Row */}
                            <div 
                                onClick={() => toggleExpand(sale.id)}
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 bg-white group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${isExpanded ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Package className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(sale.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} 
                                            {' • '} 
                                            {new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                                            {itemCount} articles
                                            {sale.clientName && (
                                                <span className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                                    <User className="w-3 h-3"/> {sale.clientName}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <span className="block font-bold text-green-700 text-lg">{sale.totalPrice.toLocaleString('fr-FR')} F</span>
                                        {sale.paymentMethod && (
                                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{sale.paymentMethod}</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleEditClick(sale, e)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="Modifier"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(sale.id, e)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Supprimer (Rétablir stock)"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400"/> : <ChevronRight className="w-5 h-5 text-slate-400"/>}
                                </div>
                            </div>

                            {/* Details Row */}
                            {isExpanded && (
                                <div className="bg-slate-50 p-4 border-t border-slate-100 text-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Détail du panier</h4>
                                        <div className="text-right text-xs text-slate-500">
                                            <div>Sous-total: {sale.subTotal?.toLocaleString('fr-FR')}</div>
                                            {sale.discount > 0 && <div className="text-green-600">Remise: -{sale.discount.toLocaleString('fr-FR')}</div>}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {sale.items ? (
                                            sale.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                                                    <span className="text-slate-700 font-medium">
                                                        <span className="text-slate-400 mr-2">{item.quantity}x</span>
                                                        {item.productName}
                                                    </span>
                                                    <span className="text-slate-600 font-mono">{(item.price * item.quantity).toLocaleString('fr-FR')}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-400 italic">Détails non disponibles pour cette ancienne vente.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Modifier la vente</h3>
                    <button onClick={() => setEditingSale(null)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                 </div>

                 <div className="space-y-4">
                     <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Moyen de paiement</label>
                         <select 
                            value={editingSale.paymentMethod}
                            onChange={(e) => setEditingSale({...editingSale, paymentMethod: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                         >
                             {paymentMethods.map(pm => (
                                 <option key={pm.id} value={pm.name}>{pm.name}</option>
                             ))}
                         </select>
                     </div>

                     <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Client</label>
                         <select 
                            value={editingSale.clientId || ''}
                            onChange={(e) => {
                                const c = clients.find(cl => cl.id === e.target.value);
                                setEditingSale({
                                    ...editingSale, 
                                    clientId: c?.id, 
                                    clientName: c?.name
                                })
                            }}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                         >
                             <option value="">-- Aucun client --</option>
                             {clients.map(c => (
                                 <option key={c.id} value={c.id}>{c.name}</option>
                             ))}
                         </select>
                     </div>

                     <div>
                         <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Date</label>
                         <input 
                            type="datetime-local"
                            value={editingSale.date.slice(0, 16)}
                            onChange={(e) => setEditingSale({...editingSale, date: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                            style={{ colorScheme: 'light' }}
                         />
                     </div>
                 </div>

                 <div className="mt-6 flex gap-3">
                     <button onClick={() => setEditingSale(null)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                         Annuler
                     </button>
                     <button onClick={handleSaveEdit} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium flex items-center justify-center gap-2">
                         <Save className="w-4 h-4" /> Enregistrer
                     </button>
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};
