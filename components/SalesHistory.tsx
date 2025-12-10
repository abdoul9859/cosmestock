
import React, { useState, useMemo } from 'react';
import { Sale, Client, PaymentMethodDef, SalePayment } from '../types';
import { Calendar, TrendingUp, ChevronDown, ChevronRight, Package, User, Trash2, Edit2, X, Save, PlusCircle, Filter, Search, RotateCcw } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  clients: Client[];
  paymentMethods: PaymentMethodDef[];
  onDeleteSale: (id: string) => void;
  onUpdateSale: (sale: Sale) => void;
  // Payment Handlers
  onAddPayment: (saleId: string, payment: SalePayment) => void;
  onDeletePayment: (saleId: string, paymentId: string) => void;
  onUpdatePayment: (saleId: string, payment: SalePayment) => void;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ 
    sales, clients, paymentMethods, 
    onDeleteSale, onUpdateSale,
    onAddPayment, onDeletePayment, onUpdatePayment
}) => {
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);
  
  // FILTERS STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PARTIAL'>('ALL');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');

  // Edit Sale State (Main info)
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  // Add/Edit Payment State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [currentSaleIdForPayment, setCurrentSaleIdForPayment] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<SalePayment | null>(null); // If null, we are adding
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [payDate, setPayDate] = useState('');

  // FILTER LOGIC
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
        // 1. Search (Client name or Total price or ID)
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
            (sale.clientName || '').toLowerCase().includes(term) ||
            sale.totalPrice.toString().includes(term) ||
            sale.id.includes(term);

        // 2. Status
        const matchesStatus = 
            filterStatus === 'ALL' || 
            (filterStatus === 'PAID' && (sale.status === 'PAID' || !sale.status)) || // Handle legacy sales as PAID
            (filterStatus === 'PARTIAL' && (sale.status === 'PARTIAL' || sale.status === 'UNPAID'));

        // 3. Date Range
        let matchesDate = true;
        const saleDate = new Date(sale.date);
        
        if (filterDateStart) {
            const startDate = new Date(filterDateStart);
            startDate.setHours(0, 0, 0, 0);
            if (saleDate < startDate) matchesDate = false;
        }

        if (filterDateEnd && matchesDate) { // Only check end if start matched
            const endDate = new Date(filterDateEnd);
            endDate.setHours(23, 59, 59, 999);
            if (saleDate > endDate) matchesDate = false;
        }

        return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, searchTerm, filterStatus, filterDateStart, filterDateEnd]);

  const toggleExpand = (id: string) => {
    setExpandedSaleId(expandedSaleId === id ? null : id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(window.confirm("ATTENTION : Supprimer cette vente va rétablir le stock des produits vendus.\n\nÊtes-vous sûr de vouloir continuer ?")) {
          onDeleteSale(id);
      }
  };

  const resetFilters = () => {
      setSearchTerm('');
      setFilterStatus('ALL');
      setFilterDateStart('');
      setFilterDateEnd('');
  };

  // --- SALE EDITING ---
  const handleEditClick = (sale: Sale, e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingSale(sale);
  };

  const handleSaveSaleEdit = () => {
      if(editingSale) {
          onUpdateSale(editingSale);
          setEditingSale(null);
      }
  };

  // --- PAYMENT MANAGEMENT ---
  const openAddPayment = (saleId: string) => {
      setCurrentSaleIdForPayment(saleId);
      setEditingPayment(null);
      setPayAmount('');
      setPayMethod(paymentMethods[0]?.name || 'Espèces');
      setPayDate(new Date().toISOString().slice(0, 16));
      setPaymentModalOpen(true);
  };

  const openEditPayment = (saleId: string, payment: SalePayment) => {
      setCurrentSaleIdForPayment(saleId);
      setEditingPayment(payment);
      setPayAmount(payment.amount.toString());
      setPayMethod(payment.method);
      setPayDate(payment.date.slice(0, 16));
      setPaymentModalOpen(true);
  };

  const handleSavePayment = () => {
      if(!currentSaleIdForPayment || !payAmount) return;

      const paymentData: SalePayment = {
          id: editingPayment ? editingPayment.id : Date.now().toString(),
          amount: parseFloat(payAmount),
          method: payMethod,
          date: new Date(payDate).toISOString()
      };

      if(editingPayment) {
          onUpdatePayment(currentSaleIdForPayment, paymentData);
      } else {
          onAddPayment(currentSaleIdForPayment, paymentData);
      }
      setPaymentModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-[calc(100vh-140px)]">
      {/* HEADER & FILTERS */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Historique des Ventes
            </h3>
            <span className="text-sm font-medium bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500">
                {filteredSales.length} résultats
            </span>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Rechercher (Client, Montant...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-rose-400"
                />
             </div>
             
             <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                 <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm focus:outline-none"
                 >
                     <option value="ALL">Tous les statuts</option>
                     <option value="PAID">Payé (Complet)</option>
                     <option value="PARTIAL">Crédit / Partiel</option>
                 </select>

                 <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <input 
                        type="date"
                        value={filterDateStart}
                        onChange={(e) => setFilterDateStart(e.target.value)}
                        className="py-2 text-sm bg-transparent outline-none text-slate-700 w-32"
                        style={{colorScheme: 'light'}}
                    />
                    <span className="text-slate-400">-</span>
                    <input 
                        type="date"
                        value={filterDateEnd}
                        onChange={(e) => setFilterDateEnd(e.target.value)}
                        className="py-2 text-sm bg-transparent outline-none text-slate-700 w-32"
                        style={{colorScheme: 'light'}}
                    />
                 </div>

                 {(searchTerm || filterStatus !== 'ALL' || filterDateStart || filterDateEnd) && (
                     <button 
                        onClick={resetFilters}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg"
                        title="Réinitialiser les filtres"
                     >
                         <RotateCcw className="w-4 h-4" />
                     </button>
                 )}
             </div>
        </div>
      </div>

      {/* LIST */}
      <div className="overflow-auto flex-1 p-4">
        <div className="space-y-3">
            {filteredSales.length === 0 ? (
                <div className="text-center py-10 text-slate-400 italic">
                    Aucune vente ne correspond à vos critères.
                </div>
            ) : (
                filteredSales.map(sale => {
                    const isExpanded = expandedSaleId === sale.id;
                    const itemCount = sale.items ? sale.items.reduce((acc, i) => acc + i.quantity, 0) : 1; 
                    const isPartial = sale.status === 'PARTIAL' || sale.status === 'UNPAID';

                    return (
                        <div key={sale.id} className={`border rounded-xl overflow-hidden transition-all ${isExpanded ? 'border-green-200 shadow-sm' : 'border-slate-100'}`}>
                            {/* Header Row */}
                            <div 
                                onClick={() => toggleExpand(sale.id)}
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 bg-white group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${isPartial ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
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
                                        <span className="block font-bold text-slate-800 text-lg">{sale.totalPrice.toLocaleString('fr-FR')} F</span>
                                        <div className="flex justify-end gap-1">
                                            {isPartial ? (
                                                <span className="text-[10px] uppercase font-bold text-white bg-orange-500 px-1.5 rounded">
                                                    Reste: {sale.balance?.toLocaleString()} F
                                                </span>
                                            ) : (
                                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 rounded">
                                                    PAYÉ
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => handleEditClick(sale, e)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                            title="Modifier infos"
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
                                <div className="bg-slate-50 p-4 border-t border-slate-100 text-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Column 1: Items */}
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Panier</h4>
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
                                                <div className="text-slate-400 italic">Détails non disponibles.</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 2: Payments */}
                                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide">Suivi des Règlements</h4>
                                            {isPartial && (
                                                <button 
                                                    onClick={() => openAddPayment(sale.id)}
                                                    className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded font-bold hover:bg-indigo-100 flex items-center gap-1"
                                                >
                                                    <PlusCircle className="w-3 h-3" /> Ajouter
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            {sale.payments && sale.payments.length > 0 ? (
                                                sale.payments.map(pay => (
                                                    <div key={pay.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded border border-slate-100 hover:border-blue-200 group/pay">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700">{pay.amount.toLocaleString()} F</span>
                                                            <span className="text-slate-400">{new Date(pay.date).toLocaleDateString()} - {pay.method}</span>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover/pay:opacity-100 transition-opacity">
                                                            <button onClick={() => openEditPayment(sale.id, pay)} className="p-1 hover:text-blue-600"><Edit2 className="w-3 h-3"/></button>
                                                            <button onClick={() => onDeletePayment(sale.id, pay.id)} className="p-1 hover:text-red-600"><Trash2 className="w-3 h-3"/></button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-slate-400 italic p-2">Aucun paiement enregistré (Legacy)</div>
                                            )}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500">RESTE À PAYER</span>
                                            <span className={`font-bold ${sale.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {sale.balance?.toLocaleString()} F
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
      </div>

      {/* Edit Sale Modal (Main Info) */}
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
                            className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
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
                            className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                            style={{ colorScheme: 'light' }}
                         />
                     </div>
                 </div>

                 <div className="mt-6 flex gap-3">
                     <button onClick={() => setEditingSale(null)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                         Annuler
                     </button>
                     <button onClick={handleSaveSaleEdit} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium flex items-center justify-center gap-2">
                         <Save className="w-4 h-4" /> Enregistrer
                     </button>
                 </div>
             </div>
        </div>
      )}

      {/* Payment Add/Edit Modal */}
      {paymentModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">
                      {editingPayment ? 'Modifier le règlement' : 'Ajouter un règlement'}
                  </h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Montant (FCFA)</label>
                          <input 
                              type="number" 
                              value={payAmount}
                              onChange={e => setPayAmount(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-slate-900 bg-white"
                              autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Moyen de paiement</label>
                          <select 
                              value={payMethod}
                              onChange={e => setPayMethod(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                          >
                              {paymentMethods.map(pm => (
                                  <option key={pm.id} value={pm.name}>{pm.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Date</label>
                          <input 
                              type="datetime-local"
                              value={payDate}
                              onChange={e => setPayDate(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                              style={{ colorScheme: 'light' }}
                          />
                      </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                      <button onClick={() => setPaymentModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Annuler</button>
                      <button onClick={handleSavePayment} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold">Valider</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
