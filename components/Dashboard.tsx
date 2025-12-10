
import React, { useEffect, useState } from 'react';
import { InventoryStats, Product, Sale, Expense } from '../types';
import { Package, AlertTriangle, TrendingUp, DollarSign, Wallet, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ products, sales, expenses }) => {
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    expiredCount: 0,
    expiringSoonCount: 0,
    totalSales: 0
  });

  const [weeklySalesData, setWeeklySalesData] = useState<{date: string, total: number}[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<{name: string, count: number, percent: number}[]>([]);

  useEffect(() => {
    // 1. Calculate Basic Stats
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    let totalVal = 0;
    let lowStock = 0;
    let expired = 0;
    let expiringSoon = 0;

    const catCounts: Record<string, number> = {};

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

      // Count for categories
      const cat = p.categoryName || 'Autre';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
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

    // 2. Prepare Category Data
    const catData = Object.entries(catCounts).map(([name, count]) => ({
        name,
        count,
        percent: products.length > 0 ? (count / products.length) * 100 : 0
    })).sort((a,b) => b.count - a.count).slice(0, 5); // Top 5
    setCategoryDistribution(catData);

    // 3. Prepare Weekly Sales Chart Data
    const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i)); // -6, -5, ... -0
        return d.toISOString().split('T')[0];
    });

    const chartData = last7Days.map(date => {
        // Simple string match on date part
        const daySales = sales.filter(s => s.date.startsWith(date));
        const total = daySales.reduce((sum, s) => sum + s.totalPrice, 0);
        return { date, total };
    });
    setWeeklySalesData(chartData);

  }, [products, sales]);

  const formatMoney = (amount: number) => {
    return amount.toLocaleString('fr-FR') + ' F';
  };

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currentCashFlow = stats.totalSales - totalExpensesAmount;

  // Find max value for bar chart scaling
  const maxSaleDay = Math.max(...weeklySalesData.map(d => d.total), 1);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      
      {/* Top Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-sm font-medium text-slate-500">Chiffre d'Affaires</p>
                    <p className="text-2xl font-bold text-slate-800">{formatMoney(stats.totalSales)}</p>
                </div>
                <div className="bg-green-50 p-2 rounded-lg text-green-600">
                    <DollarSign className="w-5 h-5" />
                </div>
            </div>
            <div className="z-10 flex items-center gap-1 text-xs text-green-600 font-medium">
                <ArrowUpRight className="w-3 h-3" /> Revenu brut
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Current Cash Flow */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
             <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-sm font-medium text-slate-500">Solde Caisse (Net)</p>
                    <p className={`text-2xl font-bold ${currentCashFlow >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                        {formatMoney(currentCashFlow)}
                    </p>
                </div>
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <Wallet className="w-5 h-5" />
                </div>
            </div>
            <div className="z-10 text-xs text-slate-400">
                Après dépenses ({formatMoney(totalExpensesAmount)})
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Stock Value */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between h-32 relative overflow-hidden group">
             <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-sm font-medium text-slate-500">Valeur Stock</p>
                    <p className="text-2xl font-bold text-slate-800">{formatMoney(stats.totalValue)}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <TrendingUp className="w-5 h-5" />
                </div>
            </div>
            <div className="z-10 text-xs text-slate-400">
                {stats.totalProducts} produits en rayon
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Low Stock */}
        <div className={`p-6 rounded-xl shadow-sm border flex flex-col justify-between h-32 relative overflow-hidden transition-colors ${stats.lowStockCount > 0 ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start z-10">
                <div>
                    <p className={`text-sm font-medium ${stats.lowStockCount > 0 ? 'text-orange-800' : 'text-slate-500'}`}>Alerte Stock</p>
                    <p className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-orange-900' : 'text-slate-800'}`}>{stats.lowStockCount}</p>
                </div>
                <div className={`p-2 rounded-lg ${stats.lowStockCount > 0 ? 'bg-orange-200 text-orange-800' : 'bg-slate-50 text-slate-500'}`}>
                    <AlertTriangle className="w-5 h-5" />
                </div>
            </div>
            <div className="z-10 text-xs opacity-70">
                Produits à réapprovisionner
            </div>
        </div>
      </div>

      {/* Middle Section: Charts & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Weekly Sales Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-rose-500" />
                  Ventes des 7 derniers jours
              </h3>
              
              <div className="h-64 flex items-end gap-2 sm:gap-4">
                  {weeklySalesData.map((d, i) => {
                      const heightPercent = Math.max((d.total / maxSaleDay) * 100, 5); // Min 5% height
                      const dayName = new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' });
                      
                      return (
                          <div key={i} className="flex-1 flex flex-col items-center group">
                                <div className="w-full relative flex flex-col justify-end h-full">
                                    <div 
                                        style={{ height: `${heightPercent}%` }} 
                                        className="w-full bg-rose-100 hover:bg-rose-500 transition-all duration-500 rounded-t-lg relative group-hover:shadow-lg"
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                            {formatMoney(d.total)}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 mt-2 font-medium uppercase">{dayName}</span>
                          </div>
                      )
                  })}
              </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-500" />
                  Répartition Stock
              </h3>
              <div className="space-y-6">
                  {categoryDistribution.map((cat, i) => (
                      <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium text-slate-700">{cat.name}</span>
                              <span className="text-slate-500">{cat.count} produits ({Math.round(cat.percent)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-indigo-500 h-2.5 rounded-full" 
                                style={{ width: `${cat.percent}%` }}
                              ></div>
                          </div>
                      </div>
                  ))}
                  {categoryDistribution.length === 0 && (
                      <p className="text-slate-400 text-sm italic">Aucune donnée de catégorie.</p>
                  )}
              </div>
          </div>
      </div>

      {/* Bottom Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-800 mb-4">Produits expirant bientôt (30j)</h3>
                {stats.expiringSoonCount === 0 && stats.expiredCount === 0 ? (
                    <p className="text-slate-400 text-sm italic bg-slate-50 p-4 rounded-lg text-center">Tout est frais ! Aucun produit n'expire bientôt.</p>
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
                    <p className="text-slate-400 text-sm italic bg-slate-50 p-4 rounded-lg text-center">Stocks sains. Aucun produit sous le seuil.</p>
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
