
import React, { useState } from 'react';
import { hashPassword } from '../services/cryptoService';
import { AdminUser } from '../types';

interface Props {
  admins: AdminUser[];
  onLogin: (username: string) => void;
  onClose: () => void;
}

export const AdminLogin: React.FC<Props> = ({ admins, onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const typedHash = await hashPassword(password);
    const user = admins.find(a => a.username === username && a.passwordHash === typedHash);
    
    if (user) {
      onLogin(username);
    } else {
      setError('Credenciales incorrectas');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Acceso Restringido</h2>
          <p className="text-slate-400 text-sm mt-2">Introduce tus credenciales de administrador.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              placeholder="admin"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
              placeholder="••••••••"
            />
          </div>
          
          {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-bold hover:bg-black transition-all active:scale-[0.98]"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
