
export type AttributeType = 'text' | 'number' | 'select' | 'checkbox';

export interface AttributeDefinition {
  id: string;
  name: string; // Ex: "Couleur", "Matière"
  type: AttributeType;
  options?: string[]; // Pour les types 'select', ex: ["Rouge", "Bleu"]
}

export interface Category {
  id: string;
  name: string;
  attributes: AttributeDefinition[];
}

export interface Product {
  id: string;
  name: string;
  categoryId: string; // Link to Category ID
  categoryName: string; // Redundant but useful for display/export without lookup
  price: number; // Prix de vente
  purchasePrice?: number; // Prix d'achat
  quantity: number;
  minThreshold: number; 
  expirationDate?: string; 
  size?: string; // Gardé pour compatibilité
  notes?: string;
  image?: string;
  barcode?: string;
  customAttributes?: Record<string, string | number | boolean>;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

// Flexible payment method type
export type PaymentMethodType = string; 

export interface PaymentMethodDef {
  id: string;
  name: string;
  color: 'blue' | 'green' | 'orange' | 'slate' | 'red' | 'indigo';
}

export interface Sale {
  id: string;
  items: SaleItem[];
  subTotal: number; // Prix avant remise
  discount: number; // Montant de la remise
  totalPrice: number; // Prix final payé
  date: string; 
  paymentMethod: PaymentMethodType;
  clientId?: string;
  clientName?: string;
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  expiredCount: number;
  expiringSoonCount: number; 
  totalSales: number; 
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category?: string; // 'Transport', 'Repas', 'Facture'...
}

// LOGGING SYSTEM
export type LogCategory = 'VENTE' | 'STOCK' | 'CLIENT' | 'FINANCE' | 'SYSTEM' | 'AUTH';

export interface LogEntry {
    id: string;
    timestamp: string;
    category: LogCategory;
    message: string;
    user?: string; // Pour usage futur si multi-compte
}

// AUTH & USERS
export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface User {
    id: string;
    username: string;
    pin: string; // Simple PIN or Password
    role: UserRole;
    name: string;
}

export type ViewState = 'DASHBOARD' | 'INVENTORY' | 'IMPORT' | 'SALES' | 'SETTINGS' | 'POS' | 'CLIENTS' | 'EXPENSES' | 'REPORTS' | 'LOGS';
