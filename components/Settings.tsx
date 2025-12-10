
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Tag, ChevronDown, ChevronRight, Settings as SettingsIcon, X, Download, Upload, Save, AlertTriangle, Store, CreditCard, Users, Edit2 } from 'lucide-react';
import { Category, AttributeDefinition, AttributeType, PaymentMethodDef, LogCategory, User } from '../types';
import { UserManagement } from './UserManagement';

interface SettingsProps {
  shopName: string;
  onUpdateShopName: (name: string) => void;
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  paymentMethods: PaymentMethodDef[];
  onUpdatePaymentMethods: (methods: PaymentMethodDef[]) => void;
  onLog: (category: LogCategory, message: string) => void;
  users: User[];
  onUpdateUsers: (users: User[]) => void;
  currentUser: User;
}

type SettingsTab = 'GENERAL' | 'CATEGORIES' | 'PAYMENTS' | 'USERS';

export const Settings: React.FC<SettingsProps> = ({ 
    shopName, onUpdateShopName, 
    categories, onUpdateCategories,
    onExportData, onImportData,
    paymentMethods, onUpdatePaymentMethods,
    onLog,
    users, onUpdateUsers, currentUser
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('GENERAL');
  
  // CATEGORY STATE
  const [newCatName, setNewCatName] = useState('');
  const [expandedCatId, setExpandedCatId] = useState<string | null>(null);
  const [newAttrState, setNewAttrState] = useState<{
    name: string;
    type: AttributeType;
    options: string;
  }>({ name: '', type: 'text', options: '' });

  // PAYMENT STATE
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newPaymentColor, setNewPaymentColor] = useState<PaymentMethodDef['color']>('blue');
  
  // PAYMENT EDIT STATE
  const [editingPayment, setEditingPayment] = useState<PaymentMethodDef | null>(null);
  const [editPaymentName, setEditPaymentName] = useState('');
  const [editPaymentColor, setEditPaymentColor] = useState<PaymentMethodDef['color']>('blue');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---
  const getPaymentColorClass = (color: string) => {
      switch(color) {
          case 'blue': return 'bg-blue-500';
          case 'green': return 'bg-green-600';
          case 'orange': return 'bg-orange-500';
          case 'red': return 'bg-red-500';
          case 'indigo': return 'bg-indigo-500';
          case 'slate': return 'bg-slate-700';
          default: return 'bg-slate-500';
      }
  };

  // --- Handlers ---
  
  const handleUpdateName = (name: string) => {
      onUpdateShopName(name);
      onLog('SYSTEM', `Nom de la boutique modifié : ${name}`);
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCatName.trim(),
      attributes: []
    };
    onUpdateCategories([...categories, newCat]);
    onLog('SYSTEM', `Nouvelle catégorie ajoutée : ${newCat.name}`);
    setNewCatName('');
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Supprimer cette catégorie ?')) {
        const cat = categories.find(c => c.id === id);
        onUpdateCategories(categories.filter(c => c.id !== id));
        onLog('SYSTEM', `Catégorie supprimée : ${cat?.name}`);
    }
  };

  const handleAddAttribute = (catId: string) => {
    if (!newAttrState.name.trim()) return;
    
    const updatedCategories = categories.map(cat => {
      if (cat.id === catId) {
        return {
          ...cat,
          attributes: [...cat.attributes, {
            id: Date.now().toString(),
            name: newAttrState.name,
            type: newAttrState.type,
            options: newAttrState.type === 'select' ? newAttrState.options.split(',').map(s => s.trim()) : undefined
          }]
        };
      }
      return cat;
    });

    onUpdateCategories(updatedCategories);
    onLog('SYSTEM', `Attribut ajouté à la catégorie.`);
    setNewAttrState({ name: '', type: 'text', options: '' });
  };

  const handleDeleteAttribute = (catId: string, attrId: string) => {
      const updatedCategories = categories.map(cat => {
          if (cat.id === catId) {
              return {
                  ...cat,
                  attributes: cat.attributes.filter(a => a.id !== attrId)
              };
          }
          return cat;
      });
      onUpdateCategories(updatedCategories);
  };

  // PAYMENT HANDLERS
  const handleAddPaymentMethod = () => {
      if(!newPaymentName.trim()) return;
      const newMethod: PaymentMethodDef = {
          id: Date.now().toString(),
          name: newPaymentName,
          color: newPaymentColor
      };
      onUpdatePaymentMethods([...paymentMethods, newMethod]);
      onLog('SYSTEM', `Moyen de paiement ajouté : ${newPaymentName}`);
      setNewPaymentName('');
      setNewPaymentColor('blue');
  };

  const handleDeletePaymentMethod = (id: string) => {
      const method = paymentMethods.find(p => p.id === id);
      if(window.confirm(`Supprimer le moyen de paiement "${method?.name}" ?`)) {
          onUpdatePaymentMethods(paymentMethods.filter(p => p.id !== id));
          onLog('SYSTEM', `Moyen de paiement supprimé : ${method?.name}`);
      }
  };

  const startEditingPayment = (method: PaymentMethodDef) => {
      setEditingPayment(method);
      setEditPaymentName(method.name);
      setEditPaymentColor(method.color);
  };

  const handleSavePaymentEdit = () => {
      if(!editingPayment || !editPaymentName.trim()) return;
      
      const updatedMethods = paymentMethods.map(p => {
          if (p.id === editingPayment.id) {
              return { ...p, name: editPaymentName, color: editPaymentColor };
          }
          return p;
      });

      onUpdatePaymentMethods(updatedMethods);
      onLog('SYSTEM', `Moyen de paiement modifié : ${editingPayment.name} -> ${editPaymentName}`);
      setEditingPayment(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
          onImportData(file);
      }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)] animate-fade-in">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-100 p-2 flex flex-row md:flex-col gap-1 shrink-0 h-fit overflow-x-auto">
         <button 
            onClick={() => setActiveTab('GENERAL')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'GENERAL' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
         >
             <Store className="w-5 h-5" />
             Général & Sauvegarde
         </button>
         <button 
            onClick={() => setActiveTab('CATEGORIES')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'CATEGORIES' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
         >
             <Tag className="w-5 h-5" />
             Catégories du stock
         </button>
         <button 
            onClick={() => setActiveTab('PAYMENTS')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'PAYMENTS' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
         >
             <CreditCard className="w-5 h-5" />
             Moyens de paiement
         </button>
         <button 
            onClick={() => setActiveTab('USERS')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'USERS' ? 'bg-rose-50 text-rose-700' : 'text-slate-600 hover:bg-slate-50'}`}
         >
             <Users className="w-5 h-5" />
             Utilisateurs
         </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        
        {/* === GENERAL TAB === */}
        {activeTab === 'GENERAL' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Store className="w-5 h-5 text-indigo-600" />
                        Identité de la Boutique
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'établissement</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={shopName}
                                onChange={(e) => onUpdateShopName(e.target.value)}
                                className="flex-1 px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none"
                            />
                            <button 
                                onClick={() => handleUpdateName(shopName)}
                                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                            >
                                Enregistrer
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Save className="w-5 h-5 text-indigo-600" />
                        Gestion des Données (Sauvegarde)
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <h4 className="font-bold text-blue-800 mb-2">Sauvegarder</h4>
                            <p className="text-sm text-blue-600 mb-4">
                                Téléchargez un fichier de sauvegarde contenant tout votre stock, vos ventes et vos paramètres.
                            </p>
                            <button 
                                onClick={onExportData}
                                className="w-full py-2 bg-white border border-blue-200 text-blue-700 font-bold rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Exporter les données
                            </button>
                        </div>

                        <div className="flex-1 bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <h4 className="font-bold text-amber-800 mb-2">Restaurer</h4>
                            <p className="text-sm text-amber-600 mb-4">
                                Chargez un fichier de sauvegarde précédent. 
                                <span className="block font-bold mt-1 text-red-500">⚠ Attention: Cela écrasera les données actuelles.</span>
                            </p>
                            <label className="w-full py-2 bg-white border border-amber-200 text-amber-700 font-bold rounded-lg hover:bg-amber-100 flex items-center justify-center gap-2 cursor-pointer">
                                <Upload className="w-4 h-4" />
                                Importer une sauvegarde
                                <input 
                                    type="file" 
                                    accept=".json" 
                                    className="hidden" 
                                    ref={fileInputRef}
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* === CATEGORIES TAB === */}
        {activeTab === 'CATEGORIES' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-indigo-600" />
                        Gestion des Catégories
                    </h3>

                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            placeholder="Nouvelle catégorie..."
                            value={newCatName}
                            onChange={(e) => setNewCatName(e.target.value)}
                            className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none"
                        />
                        <button 
                            onClick={handleAddCategory}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Ajouter
                        </button>
                    </div>

                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat.id} className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between p-4 bg-slate-50">
                                    <button 
                                        onClick={() => setExpandedCatId(expandedCatId === cat.id ? null : cat.id)}
                                        className="flex items-center gap-2 font-bold text-slate-700 hover:text-indigo-600"
                                    >
                                        {expandedCatId === cat.id ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                                        {cat.name}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="text-slate-400 hover:text-red-600"
                                        title="Supprimer la catégorie"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {expandedCatId === cat.id && (
                                    <div className="p-4 border-t border-slate-100 bg-white">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Champs personnalisés</h4>
                                        
                                        <div className="space-y-2 mb-4">
                                            {cat.attributes.length === 0 && (
                                                <p className="text-sm text-slate-400 italic">Aucun attribut spécifique.</p>
                                            )}
                                            {cat.attributes.map(attr => (
                                                <div key={attr.id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                                                    <div>
                                                        <span className="font-semibold text-slate-700">{attr.name}</span>
                                                        <span className="text-slate-400 mx-2">•</span>
                                                        <span className="text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-xs">{attr.type}</span>
                                                        {attr.options && (
                                                            <span className="text-xs text-slate-400 ml-2">[{attr.options.join(', ')}]</span>
                                                        )}
                                                    </div>
                                                    <button onClick={() => handleDeleteAttribute(cat.id, attr.id)} className="text-slate-400 hover:text-red-500">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                            <div className="text-xs font-bold text-slate-500 mb-2">Ajouter un champ</div>
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                                <input 
                                                    type="text" 
                                                    placeholder="Nom (ex: Couleur)"
                                                    className="px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-900"
                                                    value={newAttrState.name}
                                                    onChange={e => setNewAttrState({...newAttrState, name: e.target.value})}
                                                />
                                                <select
                                                    className="px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-900"
                                                    value={newAttrState.type}
                                                    onChange={e => setNewAttrState({...newAttrState, type: e.target.value as AttributeType})}
                                                >
                                                    <option value="text">Texte libre</option>
                                                    <option value="select">Liste d'options</option>
                                                    <option value="number">Nombre</option>
                                                    <option value="checkbox">Oui/Non</option>
                                                </select>
                                                {newAttrState.type === 'select' && (
                                                    <input 
                                                        type="text" 
                                                        placeholder="Options (Rouge, Bleu...)"
                                                        className="px-2 py-1.5 text-sm border border-slate-300 rounded bg-white text-slate-900"
                                                        value={newAttrState.options}
                                                        onChange={e => setNewAttrState({...newAttrState, options: e.target.value})}
                                                    />
                                                )}
                                                <button 
                                                    onClick={() => handleAddAttribute(cat.id)}
                                                    className="px-3 py-1.5 bg-slate-800 text-white text-sm rounded hover:bg-slate-900"
                                                >
                                                    Ajouter
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* === PAYMENTS TAB === */}
        {activeTab === 'PAYMENTS' && (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        Moyens de Paiement
                    </h3>
                    
                    <p className="text-slate-500 text-sm mb-6">
                        Configurez les modes de paiement acceptés dans votre boutique (affichés sur la caisse).
                    </p>

                    {/* Add Form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom du moyen</label>
                             <input 
                                type="text"
                                placeholder="Ex: Chèque, Airtel Money..."
                                value={newPaymentName}
                                onChange={(e) => setNewPaymentName(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none"
                             />
                        </div>
                        <div className="w-full md:w-40">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Couleur</label>
                             <select 
                                value={newPaymentColor}
                                onChange={(e) => setNewPaymentColor(e.target.value as any)}
                                className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg outline-none"
                             >
                                 <option value="blue">Bleu</option>
                                 <option value="green">Vert</option>
                                 <option value="orange">Orange</option>
                                 <option value="red">Rouge</option>
                                 <option value="indigo">Indigo</option>
                                 <option value="slate">Gris</option>
                             </select>
                        </div>
                        <button 
                            onClick={handleAddPaymentMethod}
                            className="w-full md:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                        >
                            Ajouter
                        </button>
                    </div>

                    {/* List */}
                    <div className="space-y-2">
                        {paymentMethods.map(method => (
                            <div key={method.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg shadow-sm ${getPaymentColorClass(method.color)}`}></div>
                                    <span className="font-bold text-slate-700">{method.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => startEditingPayment(method)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeletePaymentMethod(method.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* === USERS TAB === */}
        {activeTab === 'USERS' && (
            <UserManagement 
                users={users} 
                onUpdateUsers={onUpdateUsers} 
                onLog={onLog} 
                currentUser={currentUser} 
            />
        )}
      </div>

      {/* EDIT PAYMENT MODAL */}
      {editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm animate-fade-in p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Modifier le paiement</h3>
                      <button onClick={() => setEditingPayment(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom</label>
                          <input 
                              type="text" 
                              value={editPaymentName}
                              onChange={e => setEditPaymentName(e.target.value)}
                              className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Couleur</label>
                          <div className="grid grid-cols-3 gap-2">
                              {['blue', 'green', 'orange', 'red', 'indigo', 'slate'].map(color => (
                                  <button
                                    key={color}
                                    onClick={() => setEditPaymentColor(color as any)}
                                    className={`h-10 rounded-lg border-2 transition-all ${getPaymentColorClass(color)} ${editPaymentColor === color ? 'border-slate-800 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                  />
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                      <button 
                          onClick={() => setEditingPayment(null)}
                          className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                      >
                          Annuler
                      </button>
                      <button 
                          onClick={handleSavePaymentEdit}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                          <Save className="w-4 h-4" /> Enregistrer
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
