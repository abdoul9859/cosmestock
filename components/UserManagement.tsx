
import React, { useState } from 'react';
import { User, UserRole, LogCategory } from '../types';
import { Shield, Plus, Trash2, User as UserIcon, Edit2, X, Save } from 'lucide-react';

interface UserManagementProps {
    users: User[];
    onUpdateUsers: (users: User[]) => void;
    onLog: (category: LogCategory, message: string) => void;
    currentUser: User;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUsers, onLog, currentUser }) => {
    // Add State
    const [newName, setNewName] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPin, setNewPin] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('CASHIER');

    // Edit State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editName, setEditName] = useState('');
    const [editUsername, setEditUsername] = useState('');
    const [editPin, setEditPin] = useState('');
    const [editRole, setEditRole] = useState<UserRole>('CASHIER');

    const handleAddUser = () => {
        if (!newName || !newUsername || !newPin) return;
        
        // Check uniqueness
        if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
            alert("Cet identifiant existe déjà.");
            return;
        }

        const newUser: User = {
            id: Date.now().toString(),
            name: newName,
            username: newUsername,
            pin: newPin,
            role: newRole
        };

        onUpdateUsers([...users, newUser]);
        onLog('AUTH', `Nouvel utilisateur créé : ${newUsername} (${newRole})`);
        
        setNewName('');
        setNewUsername('');
        setNewPin('');
    };

    const handleDeleteUser = (id: string) => {
        if (id === currentUser.id) {
            alert("Vous ne pouvez pas supprimer votre propre compte.");
            return;
        }
        if (users.length <= 1) {
            alert("Il doit rester au moins un utilisateur.");
            return;
        }
        if (window.confirm("Supprimer cet utilisateur ?")) {
            onUpdateUsers(users.filter(u => u.id !== id));
            onLog('AUTH', `Utilisateur supprimé (ID: ${id})`);
        }
    };

    const startEditing = (user: User) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditUsername(user.username);
        setEditPin(user.pin);
        setEditRole(user.role);
    };

    const handleSaveEdit = () => {
        if (!editingUser || !editName || !editUsername || !editPin) return;

        // Check uniqueness (exclude current user)
        const otherUsers = users.filter(u => u.id !== editingUser.id);
        if (otherUsers.some(u => u.username.toLowerCase() === editUsername.toLowerCase())) {
            alert("Cet identifiant est déjà utilisé par un autre compte.");
            return;
        }

        const updatedUsers = users.map(u => {
            if (u.id === editingUser.id) {
                return {
                    ...u,
                    name: editName,
                    username: editUsername,
                    pin: editPin,
                    role: editRole
                };
            }
            return u;
        });

        onUpdateUsers(updatedUsers);
        onLog('AUTH', `Utilisateur modifié : ${editUsername} (ID: ${editingUser.id})`);
        setEditingUser(null);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                Gestion des Utilisateurs
            </h3>
            <p className="text-slate-500 mb-6">
                Gérez les comptes employés (Ajout, Modification, Suppression).
            </p>

            {/* Add User Form */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                <h4 className="font-bold text-slate-700 text-sm mb-3">Nouvel Utilisateur</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                    <div className="md:col-span-1">
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Nom Complet</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Fatou Ndiaye"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Identifiant</label>
                        <input 
                            type="text" 
                            placeholder="Ex: fatou"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Mot de passe</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 1234"
                            value={newPin}
                            onChange={e => setNewPin(e.target.value)}
                            className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm"
                        />
                    </div>
                    <div className="md:col-span-1">
                        <label className="text-xs text-slate-500 font-bold uppercase block mb-1">Rôle</label>
                        <select 
                            value={newRole}
                            onChange={e => setNewRole(e.target.value as UserRole)}
                            className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg text-sm"
                        >
                            <option value="CASHIER">Caissier(e)</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Administrateur</option>
                        </select>
                    </div>
                    <div className="md:col-span-1">
                        <button 
                            onClick={handleAddUser}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Ajouter
                        </button>
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="space-y-3">
                {users.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                user.role === 'ADMIN' ? 'bg-slate-800' : 
                                user.role === 'MANAGER' ? 'bg-indigo-500' : 'bg-rose-500'
                            }`}>
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="font-bold text-slate-800">{user.name} <span className="text-slate-400 font-normal">(@{user.username})</span></div>
                                <div className="text-xs font-bold uppercase tracking-wide mt-0.5">
                                    <span className={`px-2 py-0.5 rounded ${
                                        user.role === 'ADMIN' ? 'bg-slate-100 text-slate-600' : 
                                        user.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
                                    }`}>
                                        {user.role === 'CASHIER' ? 'Caissier(e)' : user.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => startEditing(user)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Modifier"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                            {user.id !== currentUser.id && (
                                <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Supprimer"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* EDIT MODAL */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fade-in p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">Modifier l'utilisateur</h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Complet</label>
                                <input 
                                    type="text" 
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Identifiant</label>
                                <input 
                                    type="text" 
                                    value={editUsername}
                                    onChange={e => setEditUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mot de passe / PIN</label>
                                <input 
                                    type="text" 
                                    value={editPin}
                                    onChange={e => setEditPin(e.target.value)}
                                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rôle</label>
                                <select 
                                    value={editRole}
                                    onChange={e => setEditRole(e.target.value as UserRole)}
                                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-200"
                                >
                                    <option value="CASHIER">Caissier(e)</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Administrateur</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button 
                                onClick={() => setEditingUser(null)}
                                className="flex-1 py-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSaveEdit}
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
