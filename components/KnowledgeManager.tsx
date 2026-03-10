
import React, { useState } from 'react';
import { KnowledgeItem } from '../types';

interface Props {
  items: KnowledgeItem[];
  onAdd: (title: string, content: string) => void;
  onRemove: (id: string) => void;
  isVisible: boolean;
}

export const KnowledgeManager: React.FC<Props> = ({ items, onAdd, onRemove, isVisible }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!isVisible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAdd(title, content);
    setTitle('');
    setContent('');
  };

  return (
    <div className="bg-slate-50 border-b border-slate-200 p-6 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Panel de Administración RAG (Oculto)
          </h2>
        </div>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nombre del documento..."
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Información para la base de datos..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 resize-none transition-all"
            />
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.98]"
            >
              Guardar en Base de Datos
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {items.map((item) => (
              <div key={item.id} className="group relative bg-white border border-slate-100 p-4 rounded-xl hover:shadow-md transition-all">
                <h3 className="text-[11px] font-bold text-slate-900 truncate pr-8 uppercase tracking-tight">{item.title}</h3>
                <p className="text-[10px] text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">{item.content}</p>
                <button
                  onClick={() => onRemove(item.id)}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
