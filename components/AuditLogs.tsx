
import React, { useState } from 'react';
import { LogEntry, LogCategory } from '../types';
import { ClipboardList, Search, Filter, Clock, Tag } from 'lucide-react';

interface AuditLogsProps {
  logs: LogEntry[];
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<LogCategory | 'ALL'>('ALL');

  const filteredLogs = logs.filter(log => {
      const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = filterCategory === 'ALL' || log.category === filterCategory;
      return matchesSearch && matchesCat;
  });

  const getCategoryColor = (cat: LogCategory) => {
      switch(cat) {
          case 'VENTE': return 'bg-green-100 text-green-700 border-green-200';
          case 'STOCK': return 'bg-blue-100 text-blue-700 border-blue-200';
          case 'FINANCE': return 'bg-red-100 text-red-700 border-red-200';
          case 'CLIENT': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'SYSTEM': return 'bg-slate-100 text-slate-700 border-slate-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-20">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ClipboardList className="w-6 h-6 text-slate-600" />
                    Journal d'activité
                </h3>
                <p className="text-slate-500 text-sm">Trace de toutes les actions effectuées dans l'application.</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                 <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher une action..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                 </div>
                 <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value as any)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                 >
                     <option value="ALL">Tout</option>
                     <option value="VENTE">Ventes</option>
                     <option value="STOCK">Stock</option>
                     <option value="CLIENT">Clients</option>
                     <option value="FINANCE">Finances</option>
                     <option value="SYSTEM">Système</option>
                 </select>
            </div>
         </div>

         <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                    <div className="p-10 text-center text-slate-400 italic">
                        Aucun historique trouvé.
                    </div>
                ) : (
                    filteredLogs.map(log => (
                        <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-3 w-40 shrink-0">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <div className="text-xs font-mono text-slate-500">
                                    {new Date(log.timestamp).toLocaleDateString('fr-FR')} <br/>
                                    {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                                </div>
                            </div>

                            <div className="shrink-0">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(log.category)}`}>
                                    {log.category}
                                </span>
                            </div>

                            <div className="flex-1 text-sm font-medium text-slate-700">
                                {log.message}
                            </div>
                        </div>
                    ))
                )}
             </div>
         </div>
    </div>
  );
};
