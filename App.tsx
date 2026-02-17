
import React, { useState, useEffect, useRef } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ChatMessage } from './components/ChatMessage';
import { Message, KnowledgeItem, AdminUser } from './types';
import { generateResponse } from './services/geminiService';
import { hashPassword } from './services/cryptoService';

const DB_KEY = 'rag_agent_knowledge_db_v3';
const ADMIN_DB_KEY = 'rag_agent_admins_v3';

type Language = 'es' | 'en';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Inicialización de Datos
  useEffect(() => {
    const savedDocs = localStorage.getItem(DB_KEY);
    const savedAdmins = localStorage.getItem(ADMIN_DB_KEY);
    
    if (savedDocs) setKnowledgeBase(JSON.parse(savedDocs));
    
    if (savedAdmins) {
      setAdmins(JSON.parse(savedAdmins));
    } else {
      const setupDefaultAdmin = async () => {
        const hash = await hashPassword('admin123');
        const defaultAdmin = { username: 'admin', passwordHash: hash };
        setAdmins([defaultAdmin]);
        localStorage.setItem(ADMIN_DB_KEY, JSON.stringify([defaultAdmin]));
      };
      setupDefaultAdmin();
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DB_KEY, JSON.stringify(knowledgeBase));
  }, [knowledgeBase]);

  useEffect(() => {
    localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isThinking || !language) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsThinking(true);
    setError(null);

    try {
      const { text, sources } = await generateResponse(userMsg.text, messages, knowledgeBase, language);
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        timestamp: new Date(),
        sources
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      setError(language === 'es' ? 'Error de conexión' : 'Connection error');
    } finally {
      setIsThinking(false);
    }
  };

  const handleAdminAccess = () => {
    if (loggedInUser) {
      setIsAdminOpen(true);
    } else {
      setShowLogin(true);
    }
  };

  if (!language) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center p-6 animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-slate-200">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight mb-2">Selecciona tu idioma / Select your language</h1>
        <p className="text-slate-400 text-sm mb-8">Personaliza tu experiencia de IA / Customize your AI experience</p>
        <div className="flex gap-4 w-full max-w-xs">
          <button 
            onClick={() => setLanguage('es')}
            className="flex-1 py-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl font-bold transition-all border border-slate-100"
          >
            Español
          </button>
          <button 
            onClick={() => setLanguage('en')}
            className="flex-1 py-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl font-bold transition-all border border-slate-100"
          >
            English
          </button>
        </div>
      </div>
    );
  }

  const translations = {
    es: {
      welcome: "¿Cómo puedo ayudarte hoy?",
      expert: "Modo Especialista",
      placeholder: "Escribe tu consulta o pide ayuda con tu PC...",
      webSources: "Fuentes Web:",
    },
    en: {
      welcome: "How can I help you today?",
      expert: "Expert Mode",
      placeholder: "Write your query or ask for help with your PC...",
      webSources: "Web Sources:",
    }
  };

  const t = translations[language];

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 selection:bg-slate-100">
      {/* Header */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
             <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">AI Knowledge Agent</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{t.expert}</p>
          </div>
        </div>

        <button 
          onClick={handleAdminAccess}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-black hover:bg-slate-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </header>

      {/* Admin Layers */}
      {showLogin && (
        <AdminLogin 
          admins={admins} 
          onLogin={(user) => { setLoggedInUser(user); setShowLogin(false); setIsAdminOpen(true); }}
          onClose={() => setShowLogin(false)}
        />
      )}
      {isAdminOpen && (
        <AdminPanel 
          items={knowledgeBase}
          admins={admins}
          onAdd={(item) => setKnowledgeBase(prev => [...prev, item])}
          onRemove={(id) => setKnowledgeBase(prev => prev.filter(i => i.id !== id))}
          onUpdate={(id, t, c) => setKnowledgeBase(prev => prev.map(i => i.id === id ? {...i, title: t, content: c} : i))}
          onAddAdmin={(u) => setAdmins(prev => [...prev, u])}
          onRemoveAdmin={(u) => setAdmins(prev => prev.filter(a => a.username !== u))}
          onClose={() => setIsAdminOpen(false)}
          onLogout={() => { setLoggedInUser(null); setIsAdminOpen(false); }}
        />
      )}

      {/* Main Chat Area */}
      <main className="flex-grow overflow-y-auto hide-scrollbar">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {messages.length === 0 && (
            <div className="text-center py-20 animate-in fade-in duration-1000">
               <h2 className="text-2xl font-light tracking-tight text-slate-400">{t.welcome}</h2>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessage message={msg} />
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 ml-14 flex flex-wrap gap-2 animate-in slide-in-from-left-2 duration-500">
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest w-full mb-1">{t.webSources}</span>
                    {msg.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-slate-500 hover:border-slate-900 transition-all truncate max-w-[150px]"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {isThinking && (
            <div className="flex justify-start px-4 py-8">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-200 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}

          {error && <div className="text-center text-xs text-red-400 font-bold p-4 bg-red-50 rounded-2xl mx-10">{error}</div>}
          <div ref={chatEndRef} />
        </div>
      </main>

      {/* Footer / Input */}
      <footer className="p-8">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-8 pr-16 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/[0.02] transition-all placeholder:text-slate-300"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isThinking}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all active:scale-90 disabled:opacity-20"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
