
import React, { useState } from 'react';
import { Client, LogCategory } from '../types';
import { Users, Trash2, Search, Phone, Plus, MapPin } from 'lucide-react';

interface ClientsProps {
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
  onLog: (category: LogCategory, message: string) => void;
}

export const Clients: React.FC<ClientsProps> = ({ clients, onUpdateClients, onLog }) => {
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddClient = () => {
      if(!newClientName.trim()) return;
      const newClient: Client = {
          id: Date.now().toString(),
          name: newClientName,
          phone: newClientPhone,
          address: newClientAddress
      };
      onUpdateClients([...clients, newClient]);
      onLog('CLIENT', `Nouveau client ajouté : ${newClientName}`);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientAddress('');
  };

  const handleRemoveClient = (client: Client) => {
      if(window.confirm(`Supprimer le client ${client.name} ?`)) {
          onUpdateClients(clients.filter(c => c.id !== client.id));
          onLog('CLIENT', `Client supprimé : ${client.name}`);
      }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Users className="w-6 h-6 text-rose-600" />
                Gestion des Clients
            </h3>
            <p className="text-slate-500 mb-6">
                Ajoutez vos clients pour suivre leur historique et les retrouver rapidement lors de la vente.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="md:col-span-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Nom du client</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Aissatou Diallo"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                </div>
                <div className="md:col-span-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Téléphone (Optionnel)</label>
                    <input 
                        type="text" 
                        placeholder="Ex: 77 000 00 00"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                </div>
                <div className="md:col-span-1 w-full">
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Adresse (Optionnel)</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Dakar, Plateau"
                        value={newClientAddress}
                        onChange={(e) => setNewClientAddress(e.target.value)}
                        className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                </div>
                <button 
                    onClick={handleAddClient}
                    disabled={!newClientName.trim()}
                    className="md:col-span-1 w-full px-6 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter
                </button>
            </div>
        </div>

        {/* List Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <div className="font-semibold text-slate-700 flex items-center gap-2">
                    Liste des clients <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{clients.length}</span>
                 </div>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-rose-300 w-48"
                    />
                 </div>
            </div>

            <div className="divide-y divide-slate-100">
                {filteredClients.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic">
                        {searchTerm ? "Aucun client ne correspond à la recherche." : "Aucun client enregistré pour le moment."}
                    </div>
                ) : (
                    filteredClients.map(client => (
                        <div key={client.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800">{client.name}</div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-slate-500">
                                        {client.phone && (
                                            <span className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {client.phone}
                                            </span>
                                        )}
                                        {client.address && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {client.address}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRemoveClient(client)} 
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );
};
