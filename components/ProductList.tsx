
import React, { useState, useMemo } from 'react';
import { Product, Category, User } from '../types';
import { Search, Trash2, Edit2, Plus, Filter, ShoppingCart, Image as ImageIcon, MoreHorizontal, TrendingUp } from 'lucide-react';

interface ProductListProps {
  products: Product[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
  onAdd: () => void;
  onSell: (product: Product) => void;
  currentUser: User;
}

export const ProductList: React.FC<ProductListProps> = ({ 
    products, categories, 
    onDelete, onEdit, onAdd, onSell,
    currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('All');

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategoryId === 'All' || p.categoryId === filterCategoryId;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategoryId]);

  const canEdit = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const canSeeCost = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header Actions */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 mb-4 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 placeholder-slate-400"
            />
          </div>
          
          <div className="relative">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <select 
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="pl-9 pr-8 py-3 bg-white text-slate-900 border border-slate-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-400 cursor-pointer"
             >
                <option value="All">Toutes catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>

        {canEdit && (
            <button 
                onClick={onAdd}
                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-sm w-full md:w-auto justify-center"
            >
                <Plus className="w-5 h-5" />
                Nouveau Produit
            </button>
        )}
      </div>

      {/* Desktop Table View (Hidden on Mobile) */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1 relative">
         <div className="absolute inset-0 overflow-auto">
            <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                <th className="p-4 md:p-6 text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Image</th>
                <th className="p-4 md:p-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produit</th>
                <th className="p-4 md:p-6 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Catégorie</th>
                <th className="p-4 md:p-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Prix</th>
                <th className="p-4 md:p-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Qté</th>
                <th className="p-4 md:p-6 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">État</th>
                <th className="p-4 md:p-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                    <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">
                            Aucun produit trouvé.
                        </td>
                    </tr>
                ) : (
                    filteredProducts.map(product => {
                        const isLowStock = product.quantity <= product.minThreshold;
                        const isExpired = product.expirationDate && new Date(product.expirationDate) < new Date();
                        
                        return (
                            <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-4 md:p-6">
                                <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                                    {product.image ? (
                                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-5 h-5 text-slate-300" />
                                    )}
                                </div>
                            </td>
                            <td className="p-4 md:p-6">
                                <div className="font-bold text-slate-800 text-sm md:text-base">{product.name}</div>
                                <div className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-2">
                                    {product.size && <span>Taille: {product.size}</span>}
                                    {product.expirationDate && <span>Exp: {product.expirationDate}</span>}
                                </div>
                            </td>
                            <td className="p-4 md:p-6 hidden md:table-cell">
                                <span className="inline-block px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                                    {product.categoryName}
                                </span>
                            </td>
                            <td className="p-4 md:p-6 text-right font-medium text-slate-700 whitespace-nowrap">
                                <div>{product.price.toLocaleString('fr-FR')} <span className="text-xs text-slate-400">FCFA</span></div>
                                {canSeeCost && product.purchasePrice ? (
                                    <div className="text-[10px] text-slate-400 mt-0.5" title="Prix d'achat">
                                        Achat: {product.purchasePrice.toLocaleString()} F
                                    </div>
                                ) : null}
                            </td>
                            <td className="p-4 md:p-6 text-center">
                                <span className={`font-bold text-sm md:text-base ${isLowStock ? 'text-red-600' : 'text-slate-700'}`}>
                                    {product.quantity}
                                </span>
                            </td>
                            <td className="p-4 md:p-6 hidden md:table-cell">
                                <div className="flex gap-1 flex-wrap">
                                    {isLowStock && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                            STOCK BAS
                                        </span>
                                    )}
                                    {isExpired && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                                            EXPIRÉ
                                        </span>
                                    )}
                                    {!isLowStock && !isExpired && (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
                                            OK
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="p-4 md:p-6 text-right">
                                <div className="flex items-center justify-end gap-3">
                                    <button 
                                        onClick={() => onSell(product)}
                                        className="p-2 md:p-2.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                                        title="Ajouter à la vente"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                    </button>
                                    
                                    {canEdit && (
                                        <>
                                            <button 
                                                onClick={() => onEdit(product)}
                                                className="p-2 md:p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-colors shadow-sm"
                                                title="Modifier"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(window.confirm('Voulez-vous vraiment supprimer ce produit ?')) onDelete(product.id);
                                                }}
                                                className="p-2 md:p-2.5 bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 rounded-lg transition-colors shadow-sm"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
            </table>
         </div>
      </div>

      {/* Mobile Tile View */}
      <div className="md:hidden flex-1 overflow-y-auto pb-20">
         <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map(product => {
                const isLowStock = product.quantity <= product.minThreshold;
                return (
                    <div key={product.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex gap-4">
                            <div className="w-24 h-24 rounded-lg bg-slate-100 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="w-8 h-8 text-slate-300" />
                            )}
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-sm">{product.name}</h3>
                                        <span className="text-xs text-slate-500">{product.categoryName}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-slate-800">{product.price.toLocaleString('fr-FR')} F</span>
                                    </div>
                                </div>
                                
                                <div className="flex gap-2 mt-2">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isLowStock ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                        Qté: {product.quantity}
                                        </span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-3">
                                <button 
                                    onClick={() => onSell(product)}
                                    className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm font-bold border border-green-100 hover:bg-green-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart className="w-4 h-4"/> Vendre
                                </button>
                                {canEdit && (
                                    <>
                                        <button 
                                            onClick={() => onEdit(product)}
                                            className="p-2 bg-slate-50 text-slate-600 rounded-lg border border-slate-200"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(window.confirm('Supprimer ?')) onDelete(product.id);
                                            }}
                                            className="p-2 bg-red-50 text-red-600 rounded-lg border border-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
         </div>
      </div>
    </div>
  );
};
