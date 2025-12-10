
import React, { useState } from 'react';
import { User } from '../types';
import { Lock, ArrowRight, User as UserIcon } from 'lucide-react';

interface LoginProps {
    users: User[];
    onLogin: (user: User) => void;
    shopName: string;
}

export const Login: React.FC<LoginProps> = ({ users, onLogin, shopName }) => {
    const [username, setUsername] = useState('');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin);
        
        if (user) {
            onLogin(user);
        } else {
            setError('Identifiant ou mot de passe incorrect.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row animate-fade-in">
                
                {/* Visual Side (Hidden on Mobile) */}
                <div className="hidden md:flex w-1/3 bg-gradient-to-br from-rose-500 to-rose-700 items-center justify-center p-6">
                    <div className="text-white text-center">
                        <Lock className="w-12 h-12 mx-auto mb-4 opacity-80" />
                        <h2 className="font-bold text-xl">{shopName}</h2>
                        <p className="text-xs mt-2 opacity-70">Gestion Sécurisée</p>
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-10">
                    <div className="text-center mb-8 md:text-left">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">Connexion</h1>
                        <p className="text-slate-500 text-sm">Entrez vos identifiants pour accéder à la caisse.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Identifiant</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                    placeholder="Ex: admin"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe / PIN</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-200 focus:border-rose-400 outline-none transition-all"
                                    placeholder="••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded text-center">
                                {error}
                            </div>
                        )}

                        <button 
                            type="submit"
                            className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            Se connecter <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-400">
                            Par défaut : admin / 1234
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
