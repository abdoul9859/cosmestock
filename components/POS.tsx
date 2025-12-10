
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Product, Category, Sale, SaleItem, Client, PaymentMethodType, PaymentMethodDef } from '../types';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, CheckCircle, Printer, X, Image as ImageIcon, ScanLine, Camera, User, UserPlus, Tag, Smartphone, MapPin, Phone } from 'lucide-react';

interface POSProps {
  products: Product[];
  categories: Category[];
  clients: Client[];
  onAddClient: (client: Client) => void;
  onProcessSale: (items: SaleItem[], subTotal: number, discount: number, paymentMethod: PaymentMethodType, client?: Client, amountPaid?: number) => void;
  initialProductToAdd?: Product | null;
  shopName: string;
  paymentMethods: PaymentMethodDef[];
}

export const POS: React.FC<POSProps> = ({ 
    products, categories, 
    clients, onAddClient,
    onProcessSale, initialProductToAdd, shopName,
    paymentMethods
}) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Checkout State
  const [discount, setDiscount] = useState<string>('');
  const [amountGiven, setAmountGiven] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  
  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  
  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [lastChangeDue, setLastChangeDue] = useState(0);

  // Scanner logic
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<any>(null);

  // Initialize cart if redirected from inventory
  useEffect(() => {
    if (initialProductToAdd) {
        addToCart(initialProductToAdd);
    }
  }, [initialProductToAdd]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCategory && p.quantity > 0; // Only show available stock
    });
  }, [products, searchTerm, selectedCategory]);

  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = parseFloat(discount) || 0;
  const finalTotal = Math.max(0, subTotal - discountAmount);
  
  const numericAmountGiven = parseFloat(amountGiven);
  // If amount given is present and less than total, it's NOT a change situation, it's a partial payment
  const isPartialPayment = !isNaN(numericAmountGiven) && numericAmountGiven < finalTotal;
  const changeDue = !isNaN(numericAmountGiven) && numericAmountGiven > finalTotal ? numericAmountGiven - finalTotal : 0;

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev; // Max stock reached
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, productName: product.name, price: product.price, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
        return prev.map(item => {
            if (item.productId === productId) {
                const product = products.find(p => p.id === productId);
                const maxStock = product ? product.quantity : 0;
                const newQty = item.quantity + delta;
                
                if (newQty <= 0) return item;
                if (newQty > maxStock) return item;
                
                return { ...item, quantity: newQty };
            }
            return item;
        });
    });
  };

  const handleCheckout = (method: string) => {
    if (cart.length === 0) return;
    
    const client = clients.find(c => c.id === selectedClient);
    const amountPaid = !isNaN(parseFloat(amountGiven)) ? parseFloat(amountGiven) : undefined;

    // Fake last sale for receipt (simplified)
    const saleData: any = {
        items: [...cart],
        subTotal,
        discount: discountAmount,
        totalPrice: finalTotal,
        date: new Date().toISOString(),
        paymentMethod: method,
        clientName: client?.name,
        // Status checks
        status: isPartialPayment ? 'PARTIAL' : 'PAID',
        balance: isPartialPayment && amountPaid ? finalTotal - amountPaid : 0
    };

    onProcessSale(cart, subTotal, discountAmount, method, client, amountPaid);
    
    setLastSale(saleData);
    setLastChangeDue(changeDue);
    
    setCart([]);
    setAmountGiven('');
    setDiscount('');
    setSelectedClient('');
    setShowReceipt(true);
  };

  const handleQuickAddClient = () => {
      if(!newClientName.trim()) return;
      const newClient: Client = {
          id: Date.now().toString(),
          name: newClientName,
          phone: newClientPhone,
          address: newClientAddress
      };
      onAddClient(newClient);
      setSelectedClient(newClient.id);
      setIsClientModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientAddress('');
  }

  // Barcode / Scanner Logic
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;

    const product = products.find(p => p.barcode === barcodeInput);
    if (product) {
        if(product.quantity > 0) {
            addToCart(product);
            setBarcodeInput('');
        } else {
            alert(`Stock épuisé pour ${product.name}`);
        }
    } else {
        alert("Aucun produit trouvé avec ce code-barres.");
    }
  };

  const startCameraScan = async () => {
    setIsScanning(true);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();

            if ('BarcodeDetector' in window) {
                const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'qr_code', 'upc_a', 'upc_e'] });
                
                scanIntervalRef.current = setInterval(async () => {
                    if (videoRef.current) {
                        try {
                            const barcodes = await barcodeDetector.detect(videoRef.current);
                            if (barcodes.length > 0) {
                                const code = barcodes[0].rawValue;
                                const product = products.find(p => p.barcode === code);
                                if (product) {
                                    addToCart(product);
                                    stopCameraScan();
                                }
                            }
                        } catch (err) {}
                    }
                }, 500);
            } else {
                alert("La détection de code-barres n'est pas supportée par ce navigateur.");
                stopCameraScan();
            }
        }
    } catch (err) {
        setIsScanning(false);
        alert("Impossible d'accéder à la caméra.");
    }
  };

  const stopCameraScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
    }
    setIsScanning(false);
  };

  return (
    <div className="flex h-[calc(100vh-100px)] gap-4 pb-4">
      
      {/* LEFT: Product Grid */}
      <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Search, Filters & Scanner Input */}
        <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Chercher un produit..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                </div>
                <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 cursor-pointer max-w-[150px]"
                >
                    <option value="All">Tout</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {/* Scanner Bar */}
            <div className="flex gap-3">
                 <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                    <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                        type="text"
                        placeholder="Scanner ou taper Code-barres..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder-slate-400 font-mono"
                        autoFocus
                    />
                 </form>
                 <button 
                    onClick={startCameraScan}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center gap-2 text-sm font-medium border border-slate-200"
                >
                    <Camera className="w-4 h-4" />
                    Caméra
                 </button>
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            <div className="grid grid-cols-2 gap-6">
                {filteredProducts.map(product => (
                    <div 
                        key={product.id} 
                        onClick={() => addToCart(product)}
                        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm cursor-pointer hover:border-rose-300 hover:shadow-lg transition-all group flex flex-col h-full"
                    >
                        <div className="w-full h-64 bg-slate-100 rounded-xl mb-4 overflow-hidden flex items-center justify-center relative shrink-0">
                            {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <ImageIcon className="w-16 h-16 text-slate-300" />
                            )}
                            <div className="absolute top-3 right-3 bg-slate-900/90 text-white text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm shadow-md">
                                Stock: {product.quantity}
                            </div>
                        </div>
                        
                        <h4 className="font-bold text-slate-800 text-lg leading-snug mb-2">
                            {product.name}
                        </h4>
                        
                        <div className="mt-auto flex justify-between items-end border-t border-slate-50 pt-3">
                            <div>
                                <p className="text-xs text-slate-400 font-medium uppercase">{product.categoryName}</p>
                                <span className="font-bold text-rose-600 text-xl">
                                    {product.price.toLocaleString('fr-FR')} F
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                                <Plus className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* RIGHT: Cart & Checkout */}
      <div className="w-[350px] md:w-[420px] flex flex-col bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden shrink-0">
         <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-rose-400" />
                Panier
            </h3>
            <span className="bg-slate-700 px-2 py-1 rounded text-xs text-slate-300">
                {cart.reduce((acc, item) => acc + item.quantity, 0)} articles
            </span>
         </div>

         {/* Client Selector */}
         <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex gap-2">
             <div className="relative flex-1">
                 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <select 
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm focus:border-rose-400 outline-none appearance-none"
                 >
                     <option value="">Client de passage</option>
                     {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
             </div>
             <button 
                onClick={() => setIsClientModalOpen(true)}
                className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-rose-50 hover:text-rose-600"
             >
                 <UserPlus className="w-4 h-4" />
             </button>
         </div>

         {/* Cart Items */}
         <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <ShoppingCart className="w-12 h-12 opacity-20" />
                    <p className="text-sm">Votre panier est vide</p>
                </div>
            ) : (
                cart.map(item => (
                    <div key={item.productId} className="flex gap-3 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="flex-1">
                            <div className="text-sm font-semibold text-slate-800 truncate w-24">{item.productName}</div>
                            <div className="text-xs text-slate-500">{item.price.toLocaleString('fr-FR')}</div>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-1 py-0.5">
                            <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-slate-100"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-slate-100"><Plus className="w-3 h-3" /></button>
                        </div>
                        <div className="font-bold text-sm text-slate-800 w-16 text-right">
                            {(item.price * item.quantity).toLocaleString('fr-FR')}
                        </div>
                        <button onClick={() => removeFromCart(item.productId)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                ))
            )}
         </div>

         {/* Discount & Totals */}
         <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
             <div className="flex items-center gap-2 mb-2">
                 <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                    <input 
                        type="number"
                        placeholder="Remise (FCFA)"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 text-sm bg-white border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                    />
                 </div>
                 <div className="text-right flex-1 text-sm text-slate-500">
                     Sous-total: {subTotal.toLocaleString('fr-FR')}
                 </div>
             </div>

             <div className="flex justify-between items-center py-2 border-t border-b border-slate-200">
                 <span className="font-bold text-lg text-slate-800">Total Net</span>
                 <span className="font-bold text-2xl text-rose-600">{finalTotal.toLocaleString('fr-FR')} <span className="text-sm">FCFA</span></span>
             </div>

             {/* Money Given (For Change Calculation or Partial Payment) */}
             <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={amountGiven}
                    onChange={(e) => setAmountGiven(e.target.value)}
                    placeholder="Montant reçu (vide = tout)"
                    className="flex-[2] pl-3 pr-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 outline-none"
                />
                <div className={`flex-1 text-right p-2 rounded-lg border ${changeDue >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {isPartialPayment ? (
                         <>
                            <div className="text-[10px] font-bold uppercase opacity-70 text-red-600">Dette</div>
                            <div className="font-bold text-red-600">{(finalTotal - numericAmountGiven).toLocaleString('fr-FR')}</div>
                         </>
                    ) : (
                         <>
                            <div className="text-[10px] font-bold uppercase opacity-70">Rendu</div>
                            <div className="font-bold">{changeDue >= 0 ? changeDue.toLocaleString('fr-FR') : '---'}</div>
                         </>
                    )}
                </div>
             </div>

             {/* Payment Buttons Grid */}
             <div className="grid grid-cols-2 gap-2 mt-2">
                 {paymentMethods.map(pm => {
                     let bgClass = 'bg-slate-700 hover:bg-slate-800';
                     if(pm.color === 'blue') bgClass = 'bg-blue-500 hover:bg-blue-600';
                     if(pm.color === 'green') bgClass = 'bg-green-600 hover:bg-green-700';
                     if(pm.color === 'orange') bgClass = 'bg-orange-500 hover:bg-orange-600';
                     if(pm.color === 'red') bgClass = 'bg-red-500 hover:bg-red-600';
                     if(pm.color === 'indigo') bgClass = 'bg-indigo-500 hover:bg-indigo-600';

                     return (
                         <button 
                            key={pm.id}
                            onClick={() => handleCheckout(pm.name)}
                            disabled={cart.length === 0}
                            className={`py-3 ${bgClass} text-white rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-colors`}
                         >
                             {pm.name}
                         </button>
                     )
                 })}
             </div>
         </div>
      </div>

      {/* QUICK ADD CLIENT MODAL */}
      {isClientModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Nouveau Client Rapide</h3>
                  <div className="space-y-3">
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Nom du client *"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                    />
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Téléphone (Optionnel)"
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                        />
                    </div>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Adresse (Optionnel)"
                            value={newClientAddress}
                            onChange={(e) => setNewClientAddress(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-rose-400"
                        />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                      <button onClick={() => setIsClientModalOpen(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Annuler</button>
                      <button onClick={handleQuickAddClient} className="flex-1 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium">Ajouter</button>
                  </div>
              </div>
          </div>
      )}

      {/* CAMERA SCANNER MODAL */}
      {isScanning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90">
            <div className="w-full max-w-lg bg-black relative rounded-2xl overflow-hidden">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted></video>
                <button 
                    onClick={stopCameraScan}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-xl"
                >
                    Annuler
                </button>
            </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {showReceipt && lastSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
                <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        Vente Validée
                    </h3>
                    <button onClick={() => setShowReceipt(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                {/* Receipt Content */}
                <div className="p-6 bg-slate-50 max-h-[60vh] overflow-y-auto">
                    <div className="bg-white p-4 shadow-sm border border-slate-200 rounded-sm text-center font-mono text-sm">
                        <div className="font-bold text-lg mb-1">{shopName}</div>
                        <div className="text-slate-500 text-xs mb-4">Ticket de caisse</div>
                        
                        <div className="border-b border-slate-200 border-dashed my-2"></div>
                        
                        <div className="space-y-2 text-left mb-4">
                            {lastSale.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                    <span>{item.quantity}x {item.productName}</span>
                                    <span>{(item.price * item.quantity).toLocaleString('fr-FR')}</span>
                                </div>
                            ))}
                        </div>

                        <div className="border-b border-slate-200 border-dashed my-2"></div>

                        <div className="flex justify-between text-slate-600">
                             <span>Sous-total</span>
                             <span>{lastSale.subTotal.toLocaleString('fr-FR')}</span>
                        </div>
                        {lastSale.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Remise</span>
                                <span>-{lastSale.discount.toLocaleString('fr-FR')}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-base mt-2 border-t border-slate-200 pt-2">
                            <span>TOTAL NET</span>
                            <span>{lastSale.totalPrice.toLocaleString('fr-FR')}</span>
                        </div>
                        
                        <div className="mt-4 text-xs text-left space-y-1 text-slate-500 border-t border-slate-200 pt-2">
                            {lastSale.status === 'PARTIAL' ? (
                                <div className="font-bold text-red-600 flex justify-between">
                                    <span>PAIEMENT PARTIEL</span>
                                    <span>Reste: {lastSale.balance.toLocaleString('fr-FR')}</span>
                                </div>
                            ) : (
                                <div><span className="font-bold">PAYÉ</span> ({lastSale.paymentMethod})</div>
                            )}

                            {lastSale.paymentMethod === 'Espèces' && lastSale.status === 'PAID' && lastChangeDue > 0 && (
                                <div>Monnaie rendue: {lastChangeDue.toLocaleString('fr-FR')}</div>
                            )}
                            
                            {lastSale.clientName && (
                                <div>Client: {lastSale.clientName}</div>
                            )}
                        </div>

                        <div className="mt-6 text-xs text-slate-400">
                            {new Date(lastSale.date).toLocaleString()}<br/>
                            Merci de votre visite !
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={() => window.print()} 
                        className="flex-1 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex justify-center items-center gap-2"
                    >
                        <Printer className="w-4 h-4" /> Imprimer
                    </button>
                    <button 
                        onClick={() => setShowReceipt(false)} 
                        className="flex-1 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 flex justify-center items-center gap-2"
                    >
                        Nouvelle vente
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
