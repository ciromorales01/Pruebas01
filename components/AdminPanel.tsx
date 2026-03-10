
import React, { useState, useRef } from 'react';
import { KnowledgeItem, AdminUser, AppSettings } from '../types';
import { extractTextFromPDF } from '../services/pdfService';
import { hashPassword } from '../services/cryptoService';

interface Props {
  items: KnowledgeItem[];
  admins: AdminUser[];
  settings: AppSettings;
  onAdd: (item: KnowledgeItem) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, newTitle: string, newContent: string) => void;
  onAddAdmin: (user: AdminUser) => void;
  onRemoveAdmin: (username: string) => void;
  onUpdateSettings: (settings: AppSettings) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const AdminPanel: React.FC<Props> = ({ 
  items, admins, settings, onAdd, onRemove, onUpdate, onAddAdmin, onRemoveAdmin, onUpdateSettings, onClose, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'docs' | 'users' | 'config'>('docs');
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

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
    } catch (error) { alert("Error procesando PDF"); } finally { setIsUploading(false); }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser || !newAdminPass) return;
    const hash = await hashPassword(newAdminPass);
    onAddAdmin({ username: newAdminUser, passwordHash: hash });
    setNewAdminUser('');
    setNewAdminPass('');
  };

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert("Configuración global guardada con éxito.");
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(items, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', 'knowledge.json');
    linkElement.click();
    URL.revokeObjectURL(url);
    
    alert("¡Exportado con éxito! Ahora sube el archivo 'knowledge.json' a la raíz de tu proyecto en Google Cloud para que todos los dispositivos puedan verlo.");
  };

  return (
    <div className="fixed inset-0 z-[110] bg-white flex flex-col p-8 admin-panel-enter">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
              Administración
              <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-md uppercase">Panel RAG</span>
            </h2>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleExportJSON}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black transition-all flex items-center gap-2 shadow-xl shadow-slate-100"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Sincronizar Globalmente (Exportar)
            </button>
            <button onClick={onLogout} className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 transition-all">Cerrar Sesión</button>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all text-slate-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Info Box sobre Persistencia */}
        <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-3xl flex gap-6 items-center">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0">
             <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="text-[11px] leading-relaxed text-slate-600">
            <p className="font-bold text-slate-900 mb-1">¿Cómo hacer que la información aparezca en todos los dispositivos?</p>
            1. Sube tus PDFs aquí. | 2. Haz clic en <span className="font-bold">Sincronizar Globalmente</span>. | 3. Descarga el archivo <span className="bg-slate-200 px-1 rounded">knowledge.json</span>. | 4. Súbelo a tu servidor de Google Cloud (en la misma carpeta que index.html). Esto hará que la base de datos sea global y accesible para todos.
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-8 mb-8 border-b border-slate-100">
          <button onClick={() => setActiveTab('docs')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'docs' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-300'}`}>Base de Conocimiento ({items.length})</button>
          <button onClick={() => setActiveTab('users')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'users' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-300'}`}>Usuarios Administradores</button>
          <button onClick={() => setActiveTab('config')} className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'config' ? 'border-b-2 border-slate-900 text-slate-900' : 'text-slate-300'}`}>Configuración Global</button>
        </div>

        <div className="flex-grow overflow-hidden">
          {activeTab === 'docs' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              <div className="lg:col-span-1 overflow-y-auto pr-4 space-y-4">
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-100 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-all hover:border-slate-900">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf" className="hidden" />
                  {isUploading ? <div className="animate-spin w-6 h-6 border-2 border-slate-900 border-t-transparent rounded-full mx-auto" /> : 
                  <><p className="text-xs font-bold">Añadir Documento PDF</p><p className="text-[10px] text-slate-400 mt-1">Arrastra o selecciona un archivo</p></>}
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
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="flex-grow bg-white rounded-2xl p-6 text-sm resize-none focus:outline-none shadow-inner border border-slate-100 leading-relaxed" />
                    <button onClick={() => { onUpdate(editingId!, editTitle, editContent); setEditingId(null); }} className="bg-slate-900 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-slate-200">Guardar Cambios Localmente</button>
                  </div>
                ) : <div className="h-full flex items-center justify-center text-slate-300 text-sm">Selecciona un documento para editar su contenido</div>}
              </div>
            </div>
          ) : activeTab === 'users' ? (
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
                {admins.map(admin => (
                  <div key={admin.username} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold">{admin.username[0].toUpperCase()}</div>
                      <span className="text-sm font-bold">{admin.username}</span>
                    </div>
                    <button onClick={() => onRemoveAdmin(admin.username)} disabled={admins.length <= 1} className="text-slate-300 hover:text-red-500 disabled:opacity-0 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-8 overflow-y-auto h-full pr-4 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Mensaje de Bienvenida (ES)</label>
                    <textarea 
                      value={localSettings.welcomeMessageEs} 
                      onChange={(e) => setLocalSettings({...localSettings, welcomeMessageEs: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Mensaje de Bienvenida (EN)</label>
                    <textarea 
                      value={localSettings.welcomeMessageEn} 
                      onChange={(e) => setLocalSettings({...localSettings, welcomeMessageEn: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none h-24 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Pre-Prompting / Instrucciones del Sistema</label>
                    <textarea 
                      value={localSettings.systemInstruction} 
                      onChange={(e) => setLocalSettings({...localSettings, systemInstruction: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none h-40 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Creatividad (Temperature: {localSettings.temperature})</label>
                    <input 
                      type="range" min="0" max="1" step="0.1"
                      value={localSettings.temperature} 
                      onChange={(e) => setLocalSettings({...localSettings, temperature: parseFloat(e.target.value)})}
                      className="w-full accent-slate-900"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Preciso</span>
                      <span>Creativo</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Historial de Mensajes ({localSettings.historyLimit})</label>
                    <input 
                      type="range" min="1" max="20" step="1"
                      value={localSettings.historyLimit} 
                      onChange={(e) => setLocalSettings({...localSettings, historyLimit: parseInt(e.target.value)})}
                      className="w-full accent-slate-900"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Cantidad de mensajes anteriores que Gemini recordará.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Resultados RAG ({localSettings.ragLimit})</label>
                    <input 
                      type="range" min="1" max="10" step="1"
                      value={localSettings.ragLimit} 
                      onChange={(e) => setLocalSettings({...localSettings, ragLimit: parseInt(e.target.value)})}
                      className="w-full accent-slate-900"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Cantidad de documentos que se leerán antes de responder.</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Modelo de IA</label>
                    <select 
                      value={localSettings.model} 
                      onChange={(e) => setLocalSettings({...localSettings, model: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:outline-none"
                    >
                      <option value="gemini-2.5-flash-latest">Gemini 2.5 Flash (Recomendado)</option>
                      <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                      <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleSaveSettings}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all"
                  >
                    Guardar Configuración Global
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
