
import React, { useState, useRef } from 'react';
import { Upload, FileDown, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Product } from '../types';

interface ImportToolsProps {
  onImport: (products: Product[]) => void;
}

export const ImportTools: React.FC<ImportToolsProps> = ({ onImport }) => {
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    // CSV Header + Example Data
    // Updated structure: Name, Category, SalePrice, PurchasePrice, Quantity, AlertThreshold, Expiration, Size, Barcode, ImageURL
    const csvContent = 
`Nom,Categorie,PrixVente,PrixAchat,Quantite,SeuilAlerte,DateExpiration,Taille,CodeBarres,ImageURL
"Crème Hydratante Bio","Cosmétique",5000,2500,50,10,2025-12-31,,1234567890123,
"Robe Été Fleurie","Vêtement",12000,6000,12,3,,M,,
"Rouge à Lèvres Mat","Cosmétique",2500,1000,30,5,2026-06-15,,9876543210987,
"Sérum Nuit","Cosmétique",8500,4000,8,2,2024-05-20,,,`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_stock_complet.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const newProducts: Product[] = [];
    
    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Regex to handle CSV lines with quoted values (e.g. "Product, Name")
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      // Fallback split if regex fails or simple split is enough
      let cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
      
      if(matches && matches.length >= 3) {
          // Use regex match if available and looks consistent
          // This is a naive implementation, specific libraries like PapaParse are better for production
      }

      // Ensure we have enough columns relative to our new template
      // 0:Nom, 1:Cat, 2:PrixVente, 3:PrixAchat, 4:Qté, 5:Seuil, 6:Exp, 7:Taille, 8:Barres, 9:Image
      
      if (cols.length < 3) continue; 

      const product: Product = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: cols[0] || 'Produit Inconnu',
        categoryName: cols[1] || 'Autre',
        categoryId: 'pending_import', // Will be resolved by parent component
        price: parseFloat(cols[2]) || 0,
        purchasePrice: parseFloat(cols[3]) || 0,
        quantity: parseInt(cols[4]) || 0,
        minThreshold: parseInt(cols[5]) || 5,
        expirationDate: cols[6] ? cols[6] : undefined,
        size: cols[7] ? cols[7] : undefined,
        barcode: cols[8] ? cols[8] : undefined,
        image: cols[9] ? cols[9] : undefined,
      };

      newProducts.push(product);
    }
    return newProducts;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      setError("Le fichier doit être au format CSV.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedProducts = parseCSV(text);
        if (importedProducts.length === 0) {
          setError("Aucun produit valide trouvé dans le fichier.");
        } else {
          onImport(importedProducts);
          setSuccessMsg(`${importedProducts.length} produits importés avec succès !`);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      } catch (err) {
        setError("Erreur lors de la lecture du fichier. Vérifiez le format.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
        <Upload className="w-6 h-6 text-rose-600" />
        Importer des produits en masse
      </h2>
      
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3 items-start">
         <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
         <p className="text-sm text-blue-800">
            Utilisez cette fonction pour migrer vos données depuis Excel ou Google Sheets. 
            Le fichier doit être enregistré au format <strong>CSV (UTF-8)</strong>.
         </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Step 1: Download Template */}
        <div className="flex-1 w-full bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
            Obtenir le modèle
          </h3>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Téléchargez le fichier modèle mis à jour. Il contient les colonnes pour : 
            <br/><span className="font-mono text-xs bg-slate-200 px-1 rounded">Prix Vente</span>
            <span className="font-mono text-xs bg-slate-200 px-1 rounded ml-1">Prix Achat</span>
            <span className="font-mono text-xs bg-slate-200 px-1 rounded ml-1">Code Barres</span>
          </p>
          <button 
            onClick={downloadTemplate}
            className="w-full py-2 flex items-center justify-center gap-2 text-rose-600 font-bold bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <FileDown className="w-5 h-5" />
            Télécharger le modèle .csv
          </button>
        </div>

        {/* Step 2: Upload */}
        <div className="flex-1 w-full bg-slate-50 p-6 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors">
          <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="bg-slate-200 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            Importer le fichier
          </h3>
          <p className="text-sm text-slate-500 mb-4 leading-relaxed">
            Sélectionnez votre fichier .csv complété. Les produits seront ajoutés à votre inventaire actuel.
          </p>
          <label className="block w-full cursor-pointer">
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
            />
            <div className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200">
                <Upload className="w-5 h-5" />
                Choisir le fichier
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 flex items-center gap-3 text-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}
    </div>
  );
};
