
import React from 'react';
import { Sale, Product, Expense, Client } from '../types';
import { TrendingUp, TrendingDown, Package, Users, BarChart3, Wallet, Award, Scale } from 'lucide-react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  clients: Client[];
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, expenses, clients }) => {
  
  // 1. Financials
  const totalSales = sales.reduce((acc, s) => acc + s.totalPrice, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  
  // Estimate COGS (Cost of Goods Sold)
  // Since sales history doesn't store historical purchase price, we approximate using current product purchase price
  // This is a common simplification for small apps.
  let totalCOGS = 0;
  sales.forEach(sale => {
      sale.items.forEach(item => {
          // Find current product info to get purchase price
          const product = products.find(p => p.id === item.productId);
          // If product deleted or no purchase price, assume 0 cost (full profit) or maybe 50%? Let's use 0 to be safe on "Real" profit.
          const cost = product?.purchasePrice || 0;
          totalCOGS += (cost * item.quantity);
      });
  });

  const grossProfit = totalSales - totalCOGS; // Marge Brute
  const netProfit = grossProfit - totalExpenses; // Bénéfice Net (Réel)
  
  const totalStockValue = products.reduce((acc, p) => acc + (p.price * p.quantity), 0);
  const totalStockCost = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * p.quantity), 0);
  const potentialStockProfit = totalStockValue - totalStockCost;

  const totalItemsInStock = products.reduce((acc, p) => acc + p.quantity, 0);

  // 2. Top Products
  const productSalesMap: Record<string, {name: string, qty: number, total: number}> = {};
  sales.forEach(sale => {
      sale.items.forEach(item => {
          if(!productSalesMap[item.productId]) {
              productSalesMap[item.productId] = { name: item.productName, qty: 0, total: 0 };
          }
          productSalesMap[item.productId].qty += item.quantity;
          productSalesMap[item.productId].total += (item.quantity * item.price);
      });
  });
  const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

  // 3. Top Clients
  const clientSalesMap: Record<string, {name: string, visits: number, total: number}> = {};
  sales.forEach(sale => {
      if(sale.clientId && sale.clientName) {
        if(!clientSalesMap[sale.clientId]) {
            clientSalesMap[sale.clientId] = { name: sale.clientName, visits: 0, total: 0 };
        }
        clientSalesMap[sale.clientId].visits += 1;
        clientSalesMap[sale.clientId].total += sale.totalPrice;
      }
  });
  const topClients = Object.values(clientSalesMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                <BarChart3 className="w-6 h-6" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Rapports & Statistiques</h2>
                <p className="text-slate-500">Vue d'ensemble de la performance de votre boutique.</p>
            </div>
        </div>

        {/* Big Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-500 font-medium mb-1">Chiffre d'Affaires</p>
                        <h3 className="text-2xl font-bold text-slate-800">{totalSales.toLocaleString('fr-FR')} F</h3>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp className="w-6 h-6"/></div>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full opacity-80"></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-500 font-medium mb-1">Marge Brute</p>
                        <h3 className="text-2xl font-bold text-indigo-700">{grossProfit.toLocaleString('fr-FR')} F</h3>
                    </div>
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Scale className="w-6 h-6"/></div>
                </div>
                <div className="text-xs text-slate-400 mt-2">Ventes - Coût d'achat produits</div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-500 font-medium mb-1">Total Dépenses</p>
                        <h3 className="text-2xl font-bold text-red-600">-{totalExpenses.toLocaleString('fr-FR')} F</h3>
                    </div>
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown className="w-6 h-6"/></div>
                </div>
                <div className="text-xs text-slate-400 mt-2">Sorties de caisse (Transport, Repas...)</div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg text-white">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-slate-300 font-medium mb-1">Bénéfice Net</p>
                        <h3 className="text-3xl font-bold text-white">{netProfit.toLocaleString('fr-FR')} F</h3>
                    </div>
                    <div className="p-2 bg-slate-700 text-yellow-400 rounded-lg"><Wallet className="w-6 h-6"/></div>
                </div>
                <p className="text-xs text-slate-400">Ce qu'il reste réellement dans la poche.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stock Valuation */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-indigo-600" />
                    Valorisation du Stock
                </h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-500">Coût d'achat total (Investissement)</span>
                        <span className="font-bold text-slate-700">{totalStockCost.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-slate-500">Valeur à la vente (Prévisionnel)</span>
                        <span className="font-bold text-slate-700">{totalStockValue.toLocaleString('fr-FR')} F</span>
                    </div>
                    <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg">
                        <span className="text-green-800 font-medium">Bénéfice potentiel dormant</span>
                        <span className="font-bold text-green-700 text-lg">+{potentialStockProfit.toLocaleString('fr-FR')} F</span>
                    </div>
                </div>
            </div>

             {/* Placeholder for future charts */}
             <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 flex items-center justify-center text-center">
                <div>
                    <Award className="w-12 h-12 text-indigo-300 mx-auto mb-2" />
                    <h4 className="font-bold text-indigo-900">Astuce Gestion</h4>
                    <p className="text-indigo-700/70 text-sm mt-2">
                        Pour augmenter votre marge, identifiez les produits avec le plus gros écart entre Prix Achat et Prix Vente dans le tableau "Inventaire".
                    </p>
                </div>
             </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    Top 5 Produits vendus
                </div>
                <div className="divide-y divide-slate-100">
                    {topProducts.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">Pas assez de données.</div>
                    ) : (
                        topProducts.map((p, i) => (
                            <div key={i} className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{i+1}</span>
                                    <span className="font-medium text-slate-700">{p.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800">{p.qty} ventes</div>
                                    <div className="text-xs text-slate-400">{p.total.toLocaleString()} F générés</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Top Clients */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600" />
                    Top 5 Meilleurs Clients
                </div>
                <div className="divide-y divide-slate-100">
                    {topClients.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-sm">Pas assez de données clients.</div>
                    ) : (
                        topClients.map((c, i) => (
                            <div key={i} className="p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{i+1}</span>
                                    <span className="font-medium text-slate-700">{c.name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-800">{c.total.toLocaleString()} F</div>
                                    <div className="text-xs text-slate-400">{c.visits} visites</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>

    </div>
  );
};
