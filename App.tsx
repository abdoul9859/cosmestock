
import React, { useState, useEffect } from 'react';
import { ViewState, Product, Sale, Category, SaleItem, Client, Expense, PaymentMethodDef, LogEntry, LogCategory, User, SalePayment, SaleStatus } from './types';
import { Dashboard } from './components/Dashboard';
import { ProductList } from './components/ProductList';
import { ImportTools } from './components/ImportTools';
import { SalesHistory } from './components/SalesHistory';
import { Settings } from './components/Settings';
import { POS } from './components/POS';
import { Clients } from './components/Clients';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import { AuditLogs } from './components/AuditLogs';
import { Login } from './components/Login';
import { LayoutDashboard, ShoppingBag, Import, Menu, X, Plus, Save, TrendingUp, Settings as SettingsIcon, Image as ImageIcon, Upload, ShoppingCart, ScanLine, Users, Wallet, BarChart3, ClipboardList, LogOut } from 'lucide-react';
import { generateMarketingDescription } from './services/geminiService';

// Default Data
const DEFAULT_CATEGORIES: Category[] = [
  { 
      id: 'cat_1', 
      name: 'Cosmétique', 
      attributes: [
          { id: 'attr_1', name: 'Type de peau', type: 'select', options: ['Grasse', 'Sèche', 'Mixte', 'Normale'] },
          { id: 'attr_2', name: 'Contenance', type: 'text' }
      ] 
  },
  { 
      id: 'cat_2', 
      name: 'Vêtement', 
      attributes: [
          { id: 'attr_3', name: 'Matière', type: 'text' },
          { id: 'attr_4', name: 'Couleur', type: 'text' }
      ] 
  },
  { id: 'cat_3', name: 'Accessoire', attributes: [] },
  { id: 'cat_4', name: 'Autre', attributes: [] }
];

const DEFAULT_PAYMENT_METHODS: PaymentMethodDef[] = [
    { id: 'pm_1', name: 'Espèces', color: 'green' },
    { id: 'pm_2', name: 'Wave', color: 'blue' },
    { id: 'pm_3', name: 'OM', color: 'orange' },
    { id: 'pm_4', name: 'Carte', color: 'slate' },
];

const DEFAULT_USERS: User[] = [
    { id: 'u1', username: 'admin', pin: '1234', role: 'ADMIN', name: 'Administrateur' },
    { id: 'u2', username: 'manager', pin: '1234', role: 'MANAGER', name: 'Manager Boutique' },
    { id: 'u3', username: 'caisse', pin: '1234', role: 'CASHIER', name: 'Caissière' }
];

const MOCK_PRODUCTS: Product[] = [
  { 
    id: '1', 
    name: 'Sérum Vitamine C', 
    categoryId: 'cat_1',
    categoryName: 'Cosmétique', 
    price: 15000,
    purchasePrice: 7500,
    quantity: 12, 
    minThreshold: 5, 
    expirationDate: '2024-06-15',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&h=200&fit=crop',
    barcode: '123456789',
    customAttributes: { 'attr_1': 'Mixte', 'attr_2': '30ml' }
  },
  { 
    id: '2', 
    name: 'Robe Boheme Rouge', 
    categoryId: 'cat_2',
    categoryName: 'Vêtement', 
    price: 25000, 
    purchasePrice: 12000,
    quantity: 3, 
    minThreshold: 2, 
    size: 'M',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=200&h=200&fit=crop',
    barcode: '987654321',
    customAttributes: { 'attr_3': 'Coton', 'attr_4': 'Rouge' }
  },
];

const MOCK_CLIENTS: Client[] = [
    { id: 'c1', name: 'Cliente Passante', phone: '' },
    { id: 'c2', name: 'Awa Diop', phone: '770000000', notes: 'Préfère les produits bio' }
];


const App: React.FC = () => {
  // AUTH STATE
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [view, setView] = useState<ViewState>('POS'); // Default to POS usually
  
  // Data State
  const [shopName, setShopName] = useState(() => localStorage.getItem('shopName') || 'CosméStock');

  const [users, setUsers] = useState<User[]>(() => {
      const saved = localStorage.getItem('users');
      return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('categories_v2');
    if (saved) return JSON.parse(saved);
    return DEFAULT_CATEGORIES;
  });

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDef[]>(() => {
      const saved = localStorage.getItem('paymentMethods');
      if (saved) return JSON.parse(saved) : DEFAULT_PAYMENT_METHODS;
      return DEFAULT_PAYMENT_METHODS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    let loadedProducts = saved ? JSON.parse(saved) : MOCK_PRODUCTS;
    // Fix legacy data
    if(loadedProducts.length > 0 && !loadedProducts[0].categoryId) {
        return loadedProducts.map((p: any) => ({
            ...p,
            categoryId: categories.find(c => c.name === p.category)?.id || 'cat_4',
            categoryName: p.category || 'Autre',
            customAttributes: {}
        }));
    }
    return loadedProducts;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('sales');
    let loadedSales = saved ? JSON.parse(saved) : [];
    
    // MIGRATION: Ensure all sales have payments array and correct status
    return loadedSales.map((s: any) => {
        if (!s.payments || s.payments.length === 0) {
            // Convert legacy single payment method to payments array
            const method = s.paymentMethod || 'Espèces';
            const initialPayment: SalePayment = {
                id: 'pay_' + s.id,
                amount: s.totalPrice,
                method: method,
                date: s.date
            };
            return {
                ...s,
                payments: [initialPayment],
                balance: 0,
                status: 'PAID'
            };
        }
        return s;
    });
  });

  const [clients, setClients] = useState<Client[]>(() => {
      const saved = localStorage.getItem('clients');
      return saved ? JSON.parse(saved) : MOCK_CLIENTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
      const saved = localStorage.getItem('expenses');
      return saved ? JSON.parse(saved) : [];
  });

  const [logs, setLogs] = useState<LogEntry[]>(() => {
      const saved = localStorage.getItem('logs');
      return saved ? JSON.parse(saved) : [];
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [generatingDesc, setGeneratingDesc] = useState(false);

  // POS Redirect State
  const [posInitialProduct, setPosInitialProduct] = useState<Product | null>(null);

  // Persistence
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('categories_v2', JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem('clients', JSON.stringify(clients)); }, [clients]);
  useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('shopName', shopName); }, [shopName]);
  useEffect(() => { localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods)); }, [paymentMethods]);
  useEffect(() => { localStorage.setItem('logs', JSON.stringify(logs)); }, [logs]);

  // LOGGING FUNCTION
  const logAction = (category: LogCategory, message: string) => {
      const newLog: LogEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          category,
          message,
          user: currentUser ? currentUser.username : 'Système'
      };
      setLogs(prev => [newLog, ...prev]);
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      logAction('AUTH', `Connexion utilisateur : ${user.username}`);
      
      // Redirect to appropriate view based on role
      if (user.role === 'CASHIER') {
          setView('POS');
      } else {
          setView('DASHBOARD');
      }
  };

  const handleLogout = () => {
      if(currentUser) {
        logAction('AUTH', `Déconnexion utilisateur : ${currentUser.username}`);
      }
      setCurrentUser(null);
  };

  const handleDelete = (id: string) => {
    if(currentUser?.role === 'CASHIER') return; // Security check
    const product = products.find(p => p.id === id);
    if(product) {
        setProducts(products.filter(p => p.id !== id));
        logAction('STOCK', `Produit supprimé : ${product.name}`);
    }
  };

  const handleImport = (newProducts: Product[]) => {
    const processedProducts = newProducts.map(p => {
        const existingCat = categories.find(c => c.name === p.categoryName);
        return {
            ...p,
            categoryId: existingCat ? existingCat.id : 'cat_4', // Default to Autre if not found
            categoryName: existingCat ? existingCat.name : 'Autre'
        };
    });
    setProducts([...products, ...processedProducts]);
    logAction('STOCK', `${processedProducts.length} produits importés via CSV`);
    alert(`${processedProducts.length} produits ajoutés avec succès !`);
    setView('INVENTORY');
  };

  // Export Data to JSON
  const handleExportData = () => {
    const data = {
        shopName,
        users, // Include users in backup
        products,
        categories,
        paymentMethods,
        sales,
        clients,
        expenses,
        logs,
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${shopName.replace(/\s+/g, '_')}_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    logAction('SYSTEM', "Export manuel des données (Sauvegarde)");
  };

  // Import Data from JSON
  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target?.result as string);
            if(data.products && data.categories && data.sales) {
                setProducts(data.products);
                setCategories(data.categories);
                setSales(data.sales);
                if(data.clients) setClients(data.clients);
                if(data.expenses) setExpenses(data.expenses);
                if(data.shopName) setShopName(data.shopName);
                if(data.paymentMethods) setPaymentMethods(data.paymentMethods);
                if(data.logs) setLogs(data.logs);
                if(data.users) setUsers(data.users);
                alert("Données restaurées avec succès !");
            } else {
                alert("Format de fichier invalide.");
            }
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la lecture du fichier.");
        }
    };
    reader.readAsText(file);
  };

  // Product Management Handlers
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
        categoryId: categories[0]?.id || '',
        quantity: 0,
        price: 0,
        purchasePrice: 0,
        minThreshold: 5,
        image: '',
        customAttributes: {}
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product, customAttributes: product.customAttributes || {} });
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, image: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) return;

    const selectedCat = categories.find(c => c.id === formData.categoryId);
    const catName = selectedCat ? selectedCat.name : 'Autre';

    const finalProductData = {
        ...formData,
        categoryName: catName,
        price: Number(formData.price) || 0,
        purchasePrice: Number(formData.purchasePrice) || 0,
        quantity: Number(formData.quantity) || 0,
        minThreshold: Number(formData.minThreshold) || 5,
    } as Product;

    if (editingProduct) {
        // Log changes
        const changes: string[] = [];
        if(editingProduct.price !== finalProductData.price) changes.push(`Prix (${editingProduct.price}➔${finalProductData.price})`);
        if(editingProduct.quantity !== finalProductData.quantity) changes.push(`Stock (${editingProduct.quantity}➔${finalProductData.quantity})`);
        if(editingProduct.name !== finalProductData.name) changes.push(`Nom modifié`);
        if(editingProduct.purchasePrice !== finalProductData.purchasePrice) changes.push(`Prix Achat (${editingProduct.purchasePrice}➔${finalProductData.purchasePrice})`);

        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...finalProductData } : p));
        
        const changeMsg = changes.length > 0 ? changes.join(', ') : 'Mise à jour mineure';
        logAction('STOCK', `Modification produit "${finalProductData.name}" : ${changeMsg}`);
    } else {
        const newProduct: Product = {
            ...finalProductData,
            id: Date.now().toString(),
        };
        setProducts([...products, newProduct]);
        logAction('STOCK', `Ajout nouveau produit : ${finalProductData.name} (Qté: ${finalProductData.quantity})`);
    }
    setIsModalOpen(false);
  };

  const handleAiDescription = async () => {
     if(!formData.name || !formData.categoryId) return;
     setGeneratingDesc(true);
     const catName = categories.find(c => c.id === formData.categoryId)?.name || '';
     const desc = await generateMarketingDescription(formData.name, catName);
     if(desc) {
        try {
            await navigator.clipboard.writeText(desc);
            alert(`✨ Description suggérée :\n\n"${desc}"\n\n(Copiée dans le presse-papier)`);
        } catch (error) {
            console.error(error);
            alert(`✨ Description suggérée :\n\n"${desc}"`);
        }
     } else {
        alert("Impossible de générer une description.");
     }
     setGeneratingDesc(false);
  }

  // POS Handlers
  const handleRedirectToPOS = (product: Product) => {
    setPosInitialProduct(product);
    setView('POS');
  };

  const handleProcessSale = (items: SaleItem[], subTotal: number, discount: number, paymentMethod: string, client?: Client, amountPaid?: number) => {
    // 1. Update Stock
    const updatedProducts = products.map(p => {
        const cartItem = items.find(i => i.productId === p.id);
        if (cartItem) {
            return { ...p, quantity: p.quantity - cartItem.quantity };
        }
        return p;
    });
    setProducts(updatedProducts);

    const total = Math.max(0, subTotal - discount);
    
    // Determine initial payment
    // If amountPaid is undefined or greater than total, we assume full payment (change is given back)
    // If amountPaid is LESS than total, it's a partial payment
    const effectivePaid = amountPaid !== undefined && amountPaid < total ? amountPaid : total;
    
    const initialPayment: SalePayment = {
        id: Date.now().toString() + '_p',
        amount: effectivePaid,
        method: paymentMethod,
        date: new Date().toISOString()
    };

    const balance = total - effectivePaid;
    const status: SaleStatus = balance <= 0 ? 'PAID' : 'PARTIAL';

    // 2. Create Sale Record
    const newSale: Sale = {
        id: Date.now().toString(),
        items: items,
        subTotal: subTotal,
        discount: discount,
        totalPrice: total,
        date: new Date().toISOString(),
        paymentMethod: paymentMethod, // Legacy reference
        payments: [initialPayment],
        balance: balance,
        status: status,
        clientId: client?.id,
        clientName: client?.name
    };
    setSales([...sales, newSale]);

    const statusMsg = status === 'PARTIAL' ? ` (Partiel - Reste: ${balance}F)` : '';
    logAction('VENTE', `Vente validée : ${total.toLocaleString()} F (${items.length} articles) - Paiement: ${paymentMethod}${statusMsg}`);
  };

  // Sales Management Handlers
  const handleDeleteSale = (saleId: string) => {
      const saleToDelete = sales.find(s => s.id === saleId);
      if(!saleToDelete) return;

      // Restore stock
      const restoredProducts = products.map(p => {
          const item = saleToDelete.items?.find(i => i.productId === p.id);
          if(item) {
              return { ...p, quantity: p.quantity + item.quantity };
          }
          return p;
      });

      setProducts(restoredProducts);
      setSales(sales.filter(s => s.id !== saleId));
      logAction('VENTE', `Annulation vente : ${saleToDelete.totalPrice.toLocaleString()} F (Stock rétabli)`);
  };

  const handleUpdateSale = (updatedSale: Sale) => {
      const oldSale = sales.find(s => s.id === updatedSale.id);
      setSales(sales.map(s => s.id === updatedSale.id ? updatedSale : s));
      
      // Detailed Logging for Sale Edit
      if(oldSale) {
          const changes: string[] = [];
          if(oldSale.clientId !== updatedSale.clientId) changes.push(`Client (${oldSale.clientName || 'Aucun'} ➔ ${updatedSale.clientName || 'Aucun'})`);
          if(oldSale.date !== updatedSale.date) changes.push(`Date modifiée`);
          
          const changeMsg = changes.length > 0 ? changes.join(', ') : 'Détails mis à jour';
          logAction('VENTE', `Modification vente (${updatedSale.totalPrice.toLocaleString()} F) : ${changeMsg}`);
      }
  };

  // PAYMENT MANAGEMENT (ADD / EDIT / DELETE)
  const handleAddPaymentToSale = (saleId: string, payment: SalePayment) => {
      const sale = sales.find(s => s.id === saleId);
      if(!sale) return;

      const newPayments = [...sale.payments, payment];
      const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = sale.totalPrice - totalPaid;
      const status: SaleStatus = balance <= 0 ? 'PAID' : 'PARTIAL';

      const updatedSale = { ...sale, payments: newPayments, balance, status };
      setSales(sales.map(s => s.id === saleId ? updatedSale : s));
      
      logAction('FINANCE', `Règlement ajouté sur vente #${sale.id.slice(-4)} : +${payment.amount}F (${payment.method})`);
  };

  const handleDeletePaymentFromSale = (saleId: string, paymentId: string) => {
      const sale = sales.find(s => s.id === saleId);
      if(!sale) return;

      const paymentToDelete = sale.payments.find(p => p.id === paymentId);
      const newPayments = sale.payments.filter(p => p.id !== paymentId);
      const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = sale.totalPrice - totalPaid;
      const status: SaleStatus = balance <= 0 ? 'PAID' : (totalPaid === 0 ? 'UNPAID' : 'PARTIAL');

      const updatedSale = { ...sale, payments: newPayments, balance, status };
      setSales(sales.map(s => s.id === saleId ? updatedSale : s));

      if(paymentToDelete) {
          logAction('FINANCE', `Règlement supprimé sur vente #${sale.id.slice(-4)} : -${paymentToDelete.amount}F`);
      }
  };

  const handleUpdatePaymentInSale = (saleId: string, updatedPayment: SalePayment) => {
      const sale = sales.find(s => s.id === saleId);
      if(!sale) return;

      const newPayments = sale.payments.map(p => p.id === updatedPayment.id ? updatedPayment : p);
      const totalPaid = newPayments.reduce((sum, p) => sum + p.amount, 0);
      const balance = sale.totalPrice - totalPaid;
      const status: SaleStatus = balance <= 0 ? 'PAID' : 'PARTIAL';

      const updatedSale = { ...sale, payments: newPayments, balance, status };
      setSales(sales.map(s => s.id === saleId ? updatedSale : s));
      
      logAction('FINANCE', `Règlement modifié sur vente #${sale.id.slice(-4)}`);
  };

  // Get current category definition for dynamic form
  const currentCategory = categories.find(c => c.id === formData.categoryId);

  const handleAttributeChange = (attrId: string, value: any) => {
      setFormData(prev => ({
          ...prev,
          customAttributes: {
              ...prev.customAttributes,
              [attrId]: value
          }
      }));
  };

  // Profit Calc for Modal
  const estimatedProfit = (formData.price || 0) - (formData.purchasePrice || 0);

  // --- RENDER LOGIN IF NOT AUTHENTICATED ---
  if (!currentUser) {
      return <Login users={users} onLogin={handleLogin} shopName={shopName} />;
  }

  // --- PERMISSIONS HELPERS ---
  const role = currentUser.role;
  const canSeeDashboard = role === 'ADMIN' || role === 'MANAGER';
  const canSeeInventory = role === 'ADMIN' || role === 'MANAGER' || role === 'CASHIER';
  const canSeeReports = role === 'ADMIN' || role === 'MANAGER';
  const canSeeExpenses = role === 'ADMIN' || role === 'MANAGER';
  const canSeeSettings = role === 'ADMIN'; // Only admin sees settings (Users, Backup, Cats)
  const canSeeLogs = role === 'ADMIN';

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-rose-500 to-rose-700 bg-clip-text text-transparent truncate" title={shopName}>
            {shopName}
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="px-4 space-y-1 mt-2">
            
          {canSeeDashboard && (
              <button 
                onClick={() => { setView('DASHBOARD'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'DASHBOARD' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Tableau de bord
              </button>
          )}

          {canSeeReports && (
            <button 
                onClick={() => { setView('REPORTS'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'REPORTS' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <BarChart3 className="w-5 h-5" />
                Rapports & Stats
            </button>
          )}
          
          <button 
            onClick={() => { setView('POS'); setSidebarOpen(false); setPosInitialProduct(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'POS' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            Caisse / Vente
          </button>

          {canSeeInventory && (
              <button 
                onClick={() => { setView('INVENTORY'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'INVENTORY' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <ShoppingBag className="w-5 h-5" />
                Inventaire
              </button>
          )}

          <button 
            onClick={() => { setView('SALES'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'SALES' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <TrendingUp className="w-5 h-5" />
            Historique
          </button>

          <button 
            onClick={() => { setView('CLIENTS'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'CLIENTS' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Users className="w-5 h-5" />
            Clients
          </button>

          {canSeeExpenses && (
            <button 
                onClick={() => { setView('EXPENSES'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'EXPENSES' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Wallet className="w-5 h-5" />
                Dépenses
            </button>
          )}

          <div className="pt-4 mt-2 border-t border-slate-100">
             
             {canSeeLogs && (
                <button 
                    onClick={() => { setView('LOGS'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'LOGS' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <ClipboardList className="w-5 h-5" />
                    Journal
                </button>
             )}

             {role !== 'CASHIER' && (
                <button 
                    onClick={() => { setView('IMPORT'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'IMPORT' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <Import className="w-5 h-5" />
                    Importer
                </button>
             )}

            {canSeeSettings && (
                <button 
                    onClick={() => { setView('SETTINGS'); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'SETTINGS' ? 'bg-rose-50 text-rose-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                    <SettingsIcon className="w-5 h-5" />
                    Paramètres
                </button>
            )}

            <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-red-500 transition-colors mt-2"
            >
                <LogOut className="w-5 h-5" />
                Déconnexion
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-500 p-2 -ml-2 hover:bg-slate-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="ml-auto flex items-center gap-4">
            <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-800">{currentUser.name}</div>
                <div className="text-xs text-slate-500 uppercase">{currentUser.role}</div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                role === 'ADMIN' ? 'bg-slate-800' : 
                role === 'MANAGER' ? 'bg-indigo-600' : 'bg-rose-600'
            }`}>
                {currentUser.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Content Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-7xl mx-auto h-full">
                <div className="mb-4 shrink-0">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {view === 'DASHBOARD' && 'Tableau de Bord'}
                        {view === 'REPORTS' && 'Rapports Financiers'}
                        {view === 'INVENTORY' && 'Gestion du Stock'}
                        {view === 'SALES' && 'Historique des Ventes'}
                        {view === 'IMPORT' && 'Importer des Données'}
                        {view === 'SETTINGS' && 'Paramètres'}
                        {view === 'POS' && 'Caisse Enregistreuse'}
                        {view === 'CLIENTS' && 'Fichier Clients'}
                        {view === 'EXPENSES' && 'Dépenses & Sorties'}
                        {view === 'LOGS' && 'Journal d\'activité'}
                    </h2>
                </div>

                {view === 'DASHBOARD' && canSeeDashboard && <Dashboard products={products} sales={sales} expenses={expenses} />}
                
                {view === 'REPORTS' && canSeeReports && <Reports products={products} sales={sales} expenses={expenses} clients={clients} />}
                
                {view === 'LOGS' && canSeeLogs && <AuditLogs logs={logs} />}

                {view === 'POS' && (
                    <POS 
                        shopName={shopName}
                        products={products} 
                        categories={categories}
                        clients={clients}
                        onAddClient={(newClient) => {
                            setClients([...clients, newClient]);
                            logAction('CLIENT', `Ajout rapide client : ${newClient.name}`);
                        }}
                        onProcessSale={handleProcessSale}
                        initialProductToAdd={posInitialProduct}
                        paymentMethods={paymentMethods}
                    />
                )}

                {view === 'INVENTORY' && canSeeInventory && (
                    <ProductList 
                        products={products} 
                        categories={categories}
                        onDelete={handleDelete} 
                        onEdit={handleOpenEdit} 
                        onAdd={handleOpenAdd}
                        onSell={handleRedirectToPOS}
                        currentUser={currentUser}
                    />
                )}
                
                {view === 'SALES' && (
                    <SalesHistory 
                        sales={sales} 
                        clients={clients}
                        paymentMethods={paymentMethods}
                        onDeleteSale={handleDeleteSale}
                        onUpdateSale={handleUpdateSale}
                        onAddPayment={handleAddPaymentToSale}
                        onDeletePayment={handleDeletePaymentFromSale}
                        onUpdatePayment={handleUpdatePaymentInSale}
                    />
                )}
                
                {view === 'IMPORT' && role !== 'CASHIER' && <ImportTools onImport={handleImport} />}
                
                {view === 'CLIENTS' && <Clients clients={clients} onUpdateClients={setClients} onLog={logAction} />}
                
                {view === 'EXPENSES' && canSeeExpenses && <Expenses expenses={expenses} onUpdateExpenses={setExpenses} onLog={logAction} />}
                
                {view === 'SETTINGS' && canSeeSettings && (
                    <Settings 
                        shopName={shopName}
                        onUpdateShopName={setShopName}
                        categories={categories} 
                        onUpdateCategories={setCategories}
                        onExportData={handleExportData}
                        onImportData={handleImportData}
                        paymentMethods={paymentMethods}
                        onUpdatePaymentMethods={setPaymentMethods}
                        onLog={logAction}
                        users={users}
                        onUpdateUsers={setUsers}
                        currentUser={currentUser}
                    />
                )}
            </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] animate-fade-in">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">{editingProduct ? 'Modifier le produit' : 'Nouveau produit'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="overflow-y-auto p-6">
                    <form id="productForm" onSubmit={handleSaveProduct} className="space-y-5">
                        {/* Form Content kept same as before */}
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                                {formData.image ? (
                                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Photo</label>
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                                    <Upload className="w-4 h-4" />
                                    Choisir une image
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du produit</label>
                            <div className="flex gap-2">
                                <input 
                                    required
                                    type="text" 
                                    className="flex-1 px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all placeholder-slate-400"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Ex: Crème de jour"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAiDescription}
                                    disabled={generatingDesc || !formData.name}
                                    className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                                >
                                    {generatingDesc ? '...' : 'IA ✨'}
                                </button>
                            </div>
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                            <select 
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                value={formData.categoryId || ''}
                                onChange={e => {
                                    setFormData({...formData, categoryId: e.target.value, customAttributes: {}});
                                }}
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Price & Cost */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Prix Vente (FCFA)</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none font-bold"
                                    value={formData.price || ''}
                                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                                />
                            </div>
                            
                            {/* Hide Cost Price for CASHIER */}
                            {role !== 'CASHIER' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Prix Achat (FCFA)</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                        value={formData.purchasePrice || ''}
                                        onChange={e => setFormData({...formData, purchasePrice: parseFloat(e.target.value)})}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Margin Indicator (Hidden for Cashier) */}
                        {estimatedProfit > 0 && role !== 'CASHIER' && (
                            <div className="text-xs flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded border border-green-100">
                                <TrendingUp className="w-3 h-3" />
                                Marge estimée : <strong>{estimatedProfit.toLocaleString()} F</strong> par unité
                            </div>
                        )}

                        <div className="grid grid-cols-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                                <ScanLine className="w-4 h-4"/> 
                                Code-barres (Optionnel)
                            </label>
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                value={formData.barcode || ''}
                                onChange={e => setFormData({...formData, barcode: e.target.value})}
                                placeholder="Scanner ou taper le code EAN"
                            />
                        </div>

                        {/* Dynamic Attributes Based on Category */}
                        {currentCategory && currentCategory.attributes.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                    Détails {currentCategory.name}
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {currentCategory.attributes.map(attr => (
                                        <div key={attr.id} className={attr.type === 'text' ? 'col-span-2' : 'col-span-1'}>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">{attr.name}</label>
                                            {attr.type === 'select' ? (
                                                <select
                                                    value={(formData.customAttributes?.[attr.id] as string) || ''}
                                                    onChange={e => handleAttributeChange(attr.id, e.target.value)}
                                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                >
                                                    <option value="">Sélectionner...</option>
                                                    {attr.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            ) : attr.type === 'checkbox' ? (
                                                <div className="flex items-center h-10">
                                                    <input 
                                                        type="checkbox"
                                                        checked={(formData.customAttributes?.[attr.id] as boolean) || false}
                                                        onChange={e => handleAttributeChange(attr.id, e.target.checked)}
                                                        className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500 border-gray-300"
                                                    />
                                                </div>
                                            ) : (
                                                <input 
                                                    type={attr.type === 'number' ? 'number' : 'text'}
                                                    value={(formData.customAttributes?.[attr.id] as string) || ''}
                                                    onChange={e => handleAttributeChange(attr.id, e.target.value)}
                                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                                    placeholder={attr.name}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantité</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                    value={formData.quantity || ''}
                                    onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Seuil Alerte</label>
                                <input 
                                    type="number" 
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                    value={formData.minThreshold || ''}
                                    onChange={e => setFormData({...formData, minThreshold: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date Expiration</label>
                                <input 
                                    type="date" 
                                    style={{ colorScheme: 'light' }}
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none"
                                    value={formData.expirationDate || ''}
                                    onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Taille (Legacy)</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none placeholder-slate-400"
                                    value={formData.size || ''}
                                    onChange={e => setFormData({...formData, size: e.target.value})}
                                    placeholder="S, M, L..."
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                    <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit"
                        form="productForm"
                        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium shadow-md shadow-rose-200 transition-all flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Sauvegarder
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
