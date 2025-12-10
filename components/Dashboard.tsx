import React, { useEffect, useState } from 'react';
import { InventoryStats, Product, Sale } from '../types';
import { Package, AlertTriangle, CalendarX, TrendingUp, Sparkles, Loader2, DollarSign } from 'lucide-react';
import { getInventoryInsights } from '../services/geminiService';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

export const Dashboard: React.FC<DashboardProps> = ({ products, sales }) => {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    totalSales: 0
  });
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    // Calculate Stats
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let totalVal = 0;
    let lowStock = 0;
    let expired = 0;
    let expiringSoon = 0;

    products.forEach(p => {
      totalVal += p.price * p.quantity;
      if (p.quantity <= p.minThreshold) lowStock++;
      
      if (p.expirationDate) {
        const expDate = new Date(p.expirationDate);
        if (expDate < now) {
          expired++;
        } else if (expDate <= thirtyDaysFromNow) {
          expiringSoon++;
        }
      }
    });

    const totalSalesRevenue = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);

    setStats({
      totalProducts: products.length,
      totalValue: totalVal,
      lowStockCount: lowStock,
      expiredCount: expired,
      expiringSoonCount: expiringSoon,
      totalSales: totalSalesRevenue
    });
  }, [products, sales]);

  const askAi = async () => {
    setLoadingAi(true);
    const advice = await getInventoryInsights(products);
    setAiAdvice(advice);
    setLoadingAi(false);
  };

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' FCFA';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Produits</p>
            <p className="text-2xl font-bold text-slate-800">{stats.totalProducts}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-full">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        {/* Total Sales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Ventes Totales</p>
            <p className="text-2xl font-bold text-slate-800">{formatMoney(stats.totalSales)}</p>
          </div>
          <div className="bg-green-50 p-3 rounded-full">
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Valeur du Stock</p>
            <p className="text-2xl font-bold text-slate-800">{formatMoney(stats.totalValue)}</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-full">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className={`p-6 rounded-xl shadow-sm border flex items-center justify-between ${stats.lowStockCount > 0 ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100'}`}>
          <div>
            <p className={`text-sm font-medium ${stats.lowStockCount > 0 ? 'text-orange-700' : 'text-slate-500'}`}>Stock Faible</p>
            <p className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-orange-800' : 'text-slate-800'}`}>{stats.lowStockCount}</p>
          </div>
          <div className={`p-3 rounded-full ${stats.lowStockCount > 0 ? 'bg-orange-200' : 'bg-orange-50'}`}>
            <AlertTriangle className={`w-6 h-6 ${stats.lowStockCount > 0 ? 'text-orange-700' : 'text-orange-600'}`} />
          </div>
        </div>
      </div>

      {/* AI Assistant Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            L'Assistant Intelligent
          </h3>
          <button 
            onClick={askAi}
            disabled={loadingAi}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyser mon stock'}
          </button>
        </div>
        
        {aiAdvice ? (
           <div className="bg-white/80 p-4 rounded-lg text-indigo-900 text-sm leading-relaxed whitespace-pre-line border border-indigo-100">
             {aiAdvice}
           </div>
        ) : (
          <p className="text-indigo-700/70 text-sm">
            Cliquez sur "Analyser mon stock" pour recevoir des conseils personnalisés basés sur vos produits (promotions suggérées, réapprovisionnement, etc.).
          </p>
        )}
      </div>

        {/* Quick Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Produits expirant bientôt (30j)</h3>
                {stats.expiringSoonCount === 0 && stats.expiredCount === 0 ? (
                    <p className="text-slate-400 text-sm italic">Tout est frais ! Aucun produit n'expire bientôt.</p>
                ) : (
                    <ul className="space-y-3">
                        {products
                         .filter(p => p.expirationDate)
                         .filter(p => {
                            const d = new Date(p.expirationDate!);
                            const now = new Date();
                            const thirty = new Date();
                            thirty.setDate(now.getDate() + 30);
                            return d <= thirty;
                         })
                         .sort((a,b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime())
                         .slice(0, 5)
                         .map(p => {
                             const isExpired = new Date(p.expirationDate!) < new Date();
                             return (
                                <li key={p.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                                    <span className="font-medium text-slate-700">{p.name}</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isExpired ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {p.expirationDate}
                                    </span>
                                </li>
                             )
                         })
                        }
                    </ul>
                )}
            </div>

             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Stock Critique</h3>
                 {stats.lowStockCount === 0 ? (
                    <p className="text-slate-400 text-sm italic">Stocks sains. Aucun produit sous le seuil.</p>
                ) : (
                    <ul className="space-y-3">
                        {products
                         .filter(p => p.quantity <= p.minThreshold)
                         .sort((a,b) => a.quantity - b.quantity)
                         .slice(0, 5)
                         .map(p => (
                            <li key={p.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2 last:border-0">
                                <span className="font-medium text-slate-700">{p.name}</span>
                                <div className="flex items-center gap-2">
                                     <span className="text-slate-500 text-xs">Seuil: {p.minThreshold}</span>
                                     <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                                        Reste: {p.quantity}
                                    </span>
                                </div>
                            </li>
                         ))
                        }
                    </ul>
                )}
            </div>
        </div>
    </div>
  );
};