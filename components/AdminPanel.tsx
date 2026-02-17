
import React, { useState, useRef } from 'react';
import { KnowledgeItem, AdminUser } from '../types';
import { extractTextFromPDF } from '../services/pdfService';
import { hashPassword } from '../services/cryptoService';

interface Props {
  items: KnowledgeItem[];
  admins: AdminUser[];
  onAdd: (item: KnowledgeItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newTitle: string, newContent: string) => void;
  onAddAdmin: (user: AdminUser) => void;
  onRemoveAdmin: (username: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<Props> = ({ 
  items, admins, onAdd, onRemove, onUpdate, onAddAdmin, onRemoveAdmin, onClose, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'users'>('docs');
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  // States para nuevo usuario
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') return;
    setIsUploading(true);
    try {
      const text = await extractTextFromPDF(file);
      onAdd({
        id: Math.random().toString(36).substr(2, 9),
        title: file.name.replace('.pdf', ''),
        content: text,
        fileName: file.name,
        fileSize: file.size,
        uploadDate: new Date().toISOString()
      });
    } catch (error) { alert("Error PDF"); } finally { setIsUploading(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser || !newAdminPass) return;
    const hash = await hashPassword(newAdminPass);
    onAddAdmin({ username: newAdminUser, passwordHash: hash });
    setNewAdminUser('');
    setNewAdminPass('');
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 admin-panel-enter">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              Administración
              <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-md uppercase">V3.0</span>
            </h2>
          </div>
          <div className="flex gap-4">
            <button onClick={onLogout} className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all">Cerrar Sesión</button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('docs')}
            className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'docs' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-300'}`}
          >
            Base de Conocimiento
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-300'}`}
          >
            Usuarios Administradores
          </button>
        </div>

        <div className="flex-grow overflow-hidden">
          {activeTab === 'docs' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-1 overflow-y-auto pr-4 space-y-6">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-all">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                  {isUploading ? <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto" /> : 
                  <><p className="text-xs font-bold">Subir PDF</p><p className="text-[10px] text-slate-400 mt-1">Grounding Data</p></>}
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} onClick={() => { setEditingId(item.id); setEditTitle(item.title); setEditContent(item.content); }} className={`p-4 rounded-xl border transition-all cursor-pointer ${editingId === item.id ? 'border-slate-900 bg-slate-50' : 'border-slate-50 hover:border-slate-200'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold truncate pr-4">{item.title}</span>
                        <button onClick={(e) => { e.stopPropagation(); onRemove(item.id); }} className="text-slate-300 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 bg-slate-50 rounded-3xl p-8 flex flex-col h-full border border-slate-100">
                {editingId ? (
                  <div className="flex flex-col h-full space-y-4">
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-transparent text-xl font-bold focus:outline-none" />
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-grow bg-white rounded-2xl p-6 text-sm resize-none focus:outline-none shadow-inner border border-slate-100" />
                    <button onClick={() => { onUpdate(editingId!, editTitle, editContent); setEditingId(null); }} className="bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest">Guardar Cambios</button>
                  </div>
                ) : <div className="h-full flex items-center justify-center text-slate-300 text-sm">Selecciona un archivo para editar</div>}
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-10 py-8">
              <form onSubmit={handleCreateAdmin} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Añadir Administrador</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} placeholder="Usuario" className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                  <input type="password" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} placeholder="Contraseña" className="bg-white border border-slate-100 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest">Crear Usuario</button>
              </form>
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4">Administradores Actuales</h3>
                {admins.map(admin => (
                  <div key={admin.username} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold">{admin.username[0].toUpperCase()}</div>
                      <span className="text-sm font-bold">{admin.username}</span>
                    </div>
                    <button 
                      onClick={() => onRemoveAdmin(admin.username)} 
                      disabled={admins.length <= 1}
                      className="text-slate-300 hover:text-red-500 disabled:opacity-0 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
