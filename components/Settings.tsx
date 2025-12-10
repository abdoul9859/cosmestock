
import React, { useState, useRef } from 'react';
import { Plus, Trash2, Tag, ChevronDown, ChevronRight, Settings as SettingsIcon, X, Download, Upload, Save, AlertTriangle, Store, CreditCard, Users } from 'lucide-react';
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---
  
  const handleUpdateName = (name: string) => {
      onUpdateShopName(name);
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat: Category = {
      id: Date.now().toString(),
      name: newCatName.trim(),
      attributes: []
    };
    onUpdateCategories([...categories, newCat]);
    onLog('SYSTEM', `Nouvelle catégorie créée : ${newCat.name}`);
    setNewCatName('');
  };

  const handleRemoveCategory = (cat: Category) => {
    onUpdateCategories(categories.filter(c => c.id !== cat.id));
    onLog('SYSTEM', `Catégorie supprimée : ${cat.name}`);
  };

  const handleAddAttribute = (catId: string) => {
    if (!newAttrState.name.trim()) return;

    const newAttr: AttributeDefinition = {
      id: Date.now().toString(),
      name: newAttrState.name,
      type: newAttrState.type,
      options: newAttrState.type === 'select' 
        ? newAttrState.options.split(',').map(s => s.trim()).filter(Boolean)
        : undefined
    };

    const updatedCats = categories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, attributes: [...cat.attributes, newAttr] };
      }
      return cat;
    });

    onUpdateCategories(updatedCats);
    onLog('SYSTEM', `Attribut ajouté à la catégorie : ${newAttr.name}`);
    setNewAttrState({ name: '', type: 'text', options: '' });
  };

  const handleRemoveAttribute = (catId: string, attrId: string) => {
    const updatedCats = categories.map(cat => {
      if (cat.id === catId) {
        return { ...cat, attributes: cat.attributes.filter(a => a.id !== attrId) };
      }
      return cat;
    });
    onUpdateCategories(updatedCats);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        if(window.confirm("ATTENTION : Importer une sauvegarde va écraser toutes les données actuelles. Êtes-vous sûr ?")) {
            onImportData(e.target.files[0]);
            onLog('SYSTEM', "Restauration des données depuis une sauvegarde");
        }
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
  };

  const handleRemovePaymentMethod = (pm: PaymentMethodDef) => {
      if(window.confirm("Supprimer ce moyen de paiement ?")) {
          onUpdatePaymentMethods(paymentMethods.filter(p => p.id !== pm.id));
          onLog('SYSTEM', `Moyen de paiement supprimé : ${pm.name}`);
      }
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in flex flex-col md:flex-row gap-6">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
            <button 
                onClick={() => setActiveTab('GENERAL')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'GENERAL' ? 'bg-white shadow-sm text-rose-600 border border-rose-100' : 'text-slate-600 hover:bg-white/50'}`}
            >
                <Store className="w-5 h-5" /> Général & Sauvegarde
            </button>
            
            {/* Admin Only Tabs */}
            {currentUser.role === 'ADMIN' && (
                <button 
                    onClick={() => setActiveTab('USERS')}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'USERS' ? 'bg-white shadow-sm text-rose-600 border border-rose-100' : 'text-slate-600 hover:bg-white/50'}`}
                >
                    <Users className="w-5 h-5" /> Utilisateurs
                </button>
            )}

            <button 
                onClick={() => setActiveTab('CATEGORIES')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'CATEGORIES' ? 'bg-white shadow-sm text-rose-600 border border-rose-100' : 'text-slate-600 hover:bg-white/50'}`}
            >
                <Tag className="w-5 h-5" /> Catégories
            </button>
            <button 
                onClick={() => setActiveTab('PAYMENTS')}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors flex items-center gap-3 ${activeTab === 'PAYMENTS' ? 'bg-white shadow-sm text-rose-600 border border-rose-100' : 'text-slate-600 hover:bg-white/50'}`}
            >
                <CreditCard className="w-5 h-5" /> Paiements
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">

        {activeTab === 'GENERAL' && (
            <>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Store className="w-6 h-6 text-rose-600" />
                        Identité de la Boutique
                    </h3>
                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la boutique</label>
                        <input 
                            type="text"
                            value={shopName}
                            onChange={(e) => handleUpdateName(e.target.value)}
                            onBlur={() => onLog('SYSTEM', `Nom de la boutique modifié : ${shopName}`)}
                            className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none font-bold"
                            placeholder="Ma Super Boutique"
                            disabled={currentUser.role !== 'ADMIN'}
                        />
                        {currentUser.role !== 'ADMIN' && <p className="text-xs text-red-500 mt-1">Seul l'admin peut modifier ce nom.</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Save className="w-6 h-6 text-indigo-600" />
                        Sauvegarde & Données
                    </h3>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-800">
                            Vos données sont stockées uniquement sur cet appareil. Pensez à faire une sauvegarde régulière.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                            onClick={onExportData}
                            className="flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                        >
                            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full group-hover:scale-110 transition-transform">
                                <Download className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <span className="block font-bold text-slate-800">Exporter les données</span>
                                <span className="text-xs text-slate-500">Télécharger le fichier de sauvegarde</span>
                            </div>
                        </button>

                        {currentUser.role === 'ADMIN' && (
                            <div className="relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    accept=".json"
                                    onChange={handleFileChange}
                                    className="hidden" 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-full flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                                >
                                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full group-hover:scale-110 transition-transform">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <div className="text-left">
                                        <span className="block font-bold text-slate-800">Restaurer les données</span>
                                        <span className="text-xs text-slate-500">Importer un fichier de sauvegarde</span>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}

        {activeTab === 'USERS' && currentUser.role === 'ADMIN' && (
            <UserManagement 
                users={users} 
                onUpdateUsers={onUpdateUsers} 
                onLog={onLog} 
                currentUser={currentUser}
            />
        )}

        {activeTab === 'CATEGORIES' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Tag className="w-6 h-6 text-rose-600" />
                    Configuration des Catégories
                </h3>
                <p className="text-slate-500 mb-6">
                Créez des catégories et définissez des champs personnalisés pour chacune.
                </p>

                {/* Add Category */}
                <div className="flex gap-2 mb-8">
                    <input 
                        type="text" 
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="Nom de la nouvelle catégorie..."
                        className="flex-1 px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                    />
                    <button 
                        onClick={handleAddCategory}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Créer
                    </button>
                </div>

                {/* Categories List */}
                <div className="space-y-4">
                    {categories.map((cat) => {
                    const isExpanded = expandedCatId === cat.id;
                    
                    return (
                        <div key={cat.id} className={`border rounded-xl transition-all ${isExpanded ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-white'}`}>
                            {/* Header */}
                            <div 
                            className="flex items-center justify-between p-4 cursor-pointer select-none"
                            onClick={() => setExpandedCatId(isExpanded ? null : cat.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {isExpanded ? <ChevronDown className="w-5 h-5 text-rose-500"/> : <ChevronRight className="w-5 h-5 text-slate-400"/>}
                                    <span className={`font-semibold text-lg ${isExpanded ? 'text-rose-700' : 'text-slate-700'}`}>{cat.name}</span>
                                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                                    {cat.attributes.length} attributs
                                    </span>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if(window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) handleRemoveCategory(cat);
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body (Attributes) */}
                            {isExpanded && (
                            <div className="p-4 border-t border-rose-100 bg-white/50 rounded-b-xl animate-fade-in">
                                
                                <div className="mb-4 space-y-2">
                                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Attributs personnalisés</h4>
                                    {cat.attributes.length === 0 && (
                                    <p className="text-sm text-slate-400 italic">Aucun champ spécifique configuré.</p>
                                    )}
                                    {cat.attributes.map(attr => (
                                    <div key={attr.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg">
                                        <div className="flex items-center gap-3">
                                        <span className="font-medium text-slate-800">{attr.name}</span>
                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500 border border-slate-200 capitalize">{attr.type}</span>
                                        </div>
                                        <button onClick={() => handleRemoveAttribute(cat.id, attr.id)} className="text-slate-400 hover:text-red-500">
                                        <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    ))}
                                </div>

                                {/* Add Attribute Form */}
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                    <SettingsIcon className="w-4 h-4" />
                                    Ajouter un champ
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    <div className="md:col-span-4">
                                        <label className="text-xs text-slate-500 mb-1 block">Nom du champ</label>
                                        <input 
                                        type="text" 
                                        placeholder="Ex: Couleur"
                                        value={newAttrState.name}
                                        onChange={e => setNewAttrState({...newAttrState, name: e.target.value})}
                                        className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded focus:border-rose-400 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <label className="text-xs text-slate-500 mb-1 block">Type</label>
                                        <select 
                                        value={newAttrState.type}
                                        onChange={e => setNewAttrState({...newAttrState, type: e.target.value as AttributeType})}
                                        className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded focus:border-rose-400 outline-none text-sm"
                                        >
                                        <option value="text">Texte</option>
                                        <option value="number">Nombre</option>
                                        <option value="select">Liste déroulante</option>
                                        <option value="checkbox">Case à cocher</option>
                                        </select>
                                    </div>
                                    {newAttrState.type === 'select' && (
                                        <div className="md:col-span-4">
                                            <label className="text-xs text-slate-500 mb-1 block">Options</label>
                                            <input 
                                            type="text" 
                                            placeholder="Rouge, Vert..."
                                            value={newAttrState.options}
                                            onChange={e => setNewAttrState({...newAttrState, options: e.target.value})}
                                            className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded focus:border-rose-400 outline-none text-sm"
                                            />
                                        </div>
                                    )}
                                    <div className={newAttrState.type === 'select' ? "md:col-span-1" : "md:col-span-5"}>
                                        <button 
                                        onClick={() => handleAddAttribute(cat.id)}
                                        className="w-full px-3 py-2 bg-slate-800 text-white rounded hover:bg-slate-900 text-sm font-medium transition-colors"
                                        >
                                        <Plus className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                    </div>
                                </div>

                            </div>
                            )}
                        </div>
                    );
                    })}
                </div>
            </div>
        )}

        {activeTab === 'PAYMENTS' && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-rose-600" />
                    Moyens de Paiement
                </h3>
                <p className="text-slate-500 mb-6">
                    Configurez les boutons de paiement disponibles dans la caisse.
                </p>

                <div className="flex gap-2 mb-6 items-end">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                        <input 
                            type="text" 
                            value={newPaymentName}
                            onChange={(e) => setNewPaymentName(e.target.value)}
                            className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 outline-none"
                        />
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Couleur</label>
                        <select 
                            value={newPaymentColor}
                            onChange={(e) => setNewPaymentColor(e.target.value as any)}
                            className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none cursor-pointer"
                        >
                            <option value="blue">Bleu</option>
                            <option value="orange">Orange</option>
                            <option value="green">Vert</option>
                            <option value="slate">Gris</option>
                            <option value="indigo">Indigo</option>
                            <option value="red">Rouge</option>
                        </select>
                    </div>
                    <button 
                        onClick={handleAddPaymentMethod}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {paymentMethods.map(pm => (
                        <div key={pm.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-white">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold bg-${pm.color}-500`}>
                                    {pm.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-medium text-slate-800">{pm.name}</span>
                            </div>
                            <button 
                                onClick={() => handleRemovePaymentMethod(pm)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
             </div>
        )}

        </div>
    </div>
  );
};
