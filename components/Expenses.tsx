
import React, { useState } from 'react';
import { Expense, LogCategory } from '../types';
import { Wallet, TrendingDown, X, Plus, Calendar } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onUpdateExpenses: (expenses: Expense[]) => void;
  onLog: (category: LogCategory, message: string) => void;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onUpdateExpenses, onLog }) => {
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  const handleAddExpense = () => {
      if(!newExpenseDesc || !newExpenseAmount) return;
      const amount = parseFloat(newExpenseAmount);
      const newExp: Expense = {
          id: Date.now().toString(),
          description: newExpenseDesc,
          amount: amount,
          date: new Date().toISOString()
      };
      onUpdateExpenses([...expenses, newExp]);
      onLog('FINANCE', `Dépense ajoutée : -${amount}F (${newExpenseDesc})`);
      setNewExpenseDesc('');
      setNewExpenseAmount('');
  };

  const handleRemoveExpense = (exp: Expense) => {
      if(window.confirm('Supprimer cette dépense ?')) {
        onUpdateExpenses(expenses.filter(e => e.id !== exp.id));
        onLog('FINANCE', `Dépense supprimée : ${exp.description}`);
      }
  }

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
        
        {/* Summary Card */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-200">
             <div className="flex items-center gap-3 mb-2 opacity-90">
                <Wallet className="w-6 h-6" />
                <span className="font-medium text-lg">Total des Sorties de Caisse</span>
             </div>
             <div className="text-4xl font-bold">
                {totalExpenses.toLocaleString('fr-FR')} FCFA
             </div>
             <p className="text-sm mt-2 opacity-80">
                Ces montants sont déduits de votre caisse réelle mais n'affectent pas le chiffre d'affaires des ventes.
             </p>
        </div>

        {/* Add Form */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                Nouvelle Dépense
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-[2] w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Motif</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Repas midi, Transport, Facture Senelec..."
                        value={newExpenseDesc}
                        onChange={(e) => setNewExpenseDesc(e.target.value)}
                        className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all"
                    />
                </div>
                <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Montant (FCFA)</label>
                    <input 
                        type="number" 
                        placeholder="0"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 transition-all font-mono font-bold"
                    />
                </div>
                <button 
                    onClick={handleAddExpense}
                    className="w-full md:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter
                </button>
            </div>
        </div>

        {/* History List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-semibold text-slate-700">
                Historique des dépenses
             </div>
             
             <div className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic">
                        Aucune dépense enregistrée.
                    </div>
                ) : (
                    [...expenses].reverse().map(exp => (
                        <div key={exp.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-lg">{exp.description}</div>
                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(exp.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        {' à '}
                                        {new Date(exp.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-red-600 text-lg">-{exp.amount.toLocaleString('fr-FR')} F</span>
                                <button 
                                    onClick={() => handleRemoveExpense(exp)} 
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
             </div>
        </div>
    </div>
  );
};
