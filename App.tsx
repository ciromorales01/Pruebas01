/**
 * =================================================================
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN (App.tsx)
 * =================================================================
 * Este es el componente raíz de la interfaz de usuario. Orquesta el estado,
 * la lógica de la interfaz y la comunicación entre los sub-componentes.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { ChatMessage } from './components/ChatMessage';
import { Message, KnowledgeItem, AdminUser, AppSettings } from './types';
import { generateResponse } from './services/geminiService';
import { hashPassword } from './services/cryptoService';

// Claves para el almacenamiento local (localStorage)
const DB_KEY = 'rag_agent_knowledge_db_v3';
const ADMIN_DB_KEY = 'rag_agent_admins_v3';

type Language = 'es' | 'en';

const App: React.FC = () => {
  // --- GESTIÓN DEL ESTADO ---
  // Almacena el historial de la conversación.
  const [messages, setMessages] = useState<Message[]>([]);
  // Contenido del campo de texto del usuario.
  const [inputValue, setInputValue] = useState('');
  // Base de conocimientos (documentos cargados).
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeItem[]>([]);
  // Lista de administradores.
  const [admins, setAdmins] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem(ADMIN_DB_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  // Configuración global de la aplicación (modelo, temperatura, etc.).
  const [settings, setSettings] = useState<AppSettings>({
    welcomeMessageEs: "Hola, soy un agente especializado de TI y te ayudare con encontrar el mejor equipo para ti.",
    welcomeMessageEn: "Hello, I am a specialized IT agent and I will help you find the best equipment for you.",
    systemInstruction: "Eres un Agente de Conocimiento Avanzado especializado en TI. Responde de forma profesional y concisa.",
    temperature: 0.7,
    historyLimit: 5,
    ragLimit: 3,
    model: "gemini-2.5-flash"
  });

  // --- ESTADO DE LA UI ---
  // Indica si la IA está procesando una respuesta.
  const [isThinking, setIsThinking] = useState(false);
  // Indica si los datos iniciales se están cargando.
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(true);
  // Almacena mensajes de error para mostrarlos al usuario.
  const [error, setError] = useState<string | null>(null);
  // Controla la visibilidad del panel de administración.
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  // Controla la visibilidad del modal de login.
  const [showLogin, setShowLogin] = useState(false);
  // Almacena el usuario que ha iniciado sesión.
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  // Idioma seleccionado por el usuario.
  const [language, setLanguage] = useState<Language | null>(null);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    
    // Mensaje de bienvenida personalizado
    const welcomeText = lang === 'es' 
      ? `¡Hola! Soy tu asistente virtual especializado en tecnología educativa. Estoy aquí para ayudarte a elegir la laptop ideal para un alumno del Tecnológico de Monterrey, asegurando que sea duradera por 4 o 5 años.

Para empezar, por favor, dime:

1. ¿Qué escuela o carrera dentro del Tecnológico estudiará el alumno?

2. ¿Cuál es el presupuesto aproximado que tienen para la laptop?

Con esta información, podré brindarte una recomendación precisa y adaptada.`
      : `Hello! I am your virtual assistant specialized in educational technology. I am here to help you choose the ideal laptop for a Tecnológico de Monterrey student, ensuring it lasts for 4 or 5 years.

To start, please tell me:

1. Which school or major within the Tecnológico will the student be studying?

2. What is the approximate budget you have for the laptop?

With this information, I will be able to provide you with a precise and adapted recommendation.`;

    const welcomeMsg: Message = {
      id: 'welcome-msg',
      role: 'model',
      text: welcomeText,
      timestamp: new Date(),
    };
    
    setMessages([welcomeMsg]);
  };
  
  // Referencia para hacer scroll automático al final del chat.
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- EFECTOS SECUNDARIOS (HOOKS) ---

  // Efecto de inicialización: se ejecuta una sola vez al cargar el componente.
  useEffect(() => {
    const initialize = async () => {
      setIsLoadingKnowledge(true);
      try {
        // 1. Cargar la configuración global desde el servidor.
        const settingsRes = await fetch('/api/settings');
        if (settingsRes.ok) {
          const globalSettings = await settingsRes.json();
          setSettings(globalSettings);
        }

        // 2. Cargar la base de conocimientos global desde el servidor.
        const knowledgeRes = await fetch('/api/knowledge');
        if (knowledgeRes.ok) {
          const globalData = await knowledgeRes.json();
          setKnowledgeBase(globalData);
        }
      } catch (e) {
        console.log("Error cargando datos globales, usando locales como fallback.");
        const savedKnowledge = localStorage.getItem(DB_KEY);
        if (savedKnowledge) setKnowledgeBase(JSON.parse(savedKnowledge));
      } finally {
        setIsLoadingKnowledge(false);
      }

      // 3. Si no hay administradores definidos, crea uno por defecto.
      if (admins.length === 0) {
        const hash = await hashPassword('admin123');
        const defaultAdmin = { username: 'admin', passwordHash: hash };
        setAdmins([defaultAdmin]);
      }
    };

    initialize();
  }, []); // El array vacío asegura que se ejecute solo una vez.

  // --- FUNCIONES DE PERSISTENCIA DE DATOS ---

  // Guarda la base de conocimientos actualizada en el servidor.
  const updateGlobalKnowledge = async (newKnowledge: KnowledgeItem[]) => {
    setKnowledgeBase(newKnowledge);
    localStorage.setItem(DB_KEY, JSON.stringify(newKnowledge)); // Fallback local
    try {
      await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKnowledge)
      });
    } catch (e) { console.error("Error guardando knowledge global"); }
  };

  // Guarda la configuración actualizada en el servidor.
  const updateGlobalSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (e) { console.error("Error guardando settings globales"); }
  };

  // Persiste la lista de administradores en el almacenamiento local.
  useEffect(() => {
    if (admins.length > 0) {
      localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(admins));
    }
  }, [admins]);

  // Efecto para hacer scroll hacia el último mensaje.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // --- LÓGICA PRINCIPAL DEL CHAT ---

  // Gestiona el envío de un mensaje del usuario.
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
      // Llama al servicio de Gemini para obtener una respuesta.
      const { text, sources } = await generateResponse(userMsg.text, messages, knowledgeBase, language, settings);
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text,
        timestamp: new Date(),
        sources
      };
      setMessages(prev => [...prev, modelMsg]);
    } catch (err: any) {
      console.error("Chat Error:", err);
      setError(err.message || (language === 'es' ? 'Error de conexión con Gemini' : 'Gemini connection error'));
    } finally {
      setIsThinking(false);
    }
  };

  // --- GESTIÓN DE LA INTERFAZ DE ADMINISTRADOR ---

  // Decide si mostrar el panel de admin o el login.
  const handleAdminAccess = () => {
    if (loggedInUser) {
      setIsAdminOpen(true);
    } else {
      setShowLogin(true);
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---

  // 1. Pantalla de selección de idioma si aún no se ha elegido.
  if (!language) {
    return (
      <div className="flex flex-col h-screen bg-white items-center justify-center p-8 animate-in fade-in duration-700">
        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-10 shadow-2xl shadow-slate-200">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        
        <div className="max-w-md w-full space-y-8 text-center mb-12">
          <div className="space-y-4">
            <p className="text-slate-900 text-lg font-medium leading-relaxed">
              Bienvenido al agente que te guiara para la compra de tu nuevo dispositivo para tu carrera en el Tec de Monterrey.
            </p>
            <p className="text-slate-400 text-sm">
              A continuación elige tu idioma.
            </p>
          </div>

           <button 
            onClick={() => handleLanguageSelect('es')} 
            className="w-full py-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl font-bold transition-all border border-slate-100 shadow-sm active:scale-95"
          >
            Español
          </button>
          
          <div className="h-px bg-slate-100 w-12 mx-auto"></div>
          
          <div className="space-y-4">
            <p className="text-slate-900 text-lg font-medium leading-relaxed">
              Welcome to the agent that will guide you in purchasing your new device for your career at Tec de Monterrey.
            </p>
            <p className="text-slate-400 text-sm">
              Please choose your language below.
            </p>
          </div>

          <button 
            onClick={() => handleLanguageSelect('en')} 
            className="w-full py-4 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl font-bold transition-all border border-slate-100 shadow-sm active:scale-95"
          >
            English
          </button>
        </div>
      </div>
    );
  }

  // Traducciones para la interfaz según el idioma seleccionado.
  const translations = {
    es: {
      welcome: "¿Cómo puedo ayudarte hoy?",
      expert: "Agente de Conocimiento",
      placeholder: "",
      webSources: "Fuentes Web:",
      loading: "Sincronizando..."
    },
    en: {
      welcome: "How can I help you today?",
      expert: "Knowledge Agent",
      placeholder: "",
      webSources: "Web Sources:",
      loading: "Syncing..."
    }
  };
  const t = translations[language];

  // 2. Renderizado principal de la interfaz de chat.
  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 selection:bg-slate-100">
      {/* Cabecera de la aplicación */}
      <header className="px-8 py-6 flex justify-between items-center border-b border-slate-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
             <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">AI Agent RAG</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              {isLoadingKnowledge ? t.loading : t.expert}
            </p>
          </div>
        </div>
        <button 
          onClick={handleAdminAccess}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-black hover:bg-slate-100 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
      </header>

      {/* Modales condicionales para Login y Panel de Admin */}
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
          settings={settings}
          onAdd={(item) => updateGlobalKnowledge([...knowledgeBase, item])}
          onRemove={(id) => updateGlobalKnowledge(knowledgeBase.filter(i => i.id !== id))}
          onUpdate={(id, title, content) => updateGlobalKnowledge(knowledgeBase.map(i => i.id === id ? { ...i, title, content } : i))}
          onAddAdmin={(admin) => setAdmins([...admins, admin])}
          onRemoveAdmin={(username) => setAdmins(admins.filter(a => a.username !== username))}
          onUpdateSettings={updateGlobalSettings}
          onLogout={() => { setLoggedInUser(null); setIsAdminOpen(false); }}
          onClose={() => setIsAdminOpen(false)}
        />
      )}

      {/* Cuerpo principal del chat */}
      <main className="flex-grow overflow-y-auto hide-scrollbar">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {messages.length === 0 && !isLoadingKnowledge && (
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
                      <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-slate-50 border border-slate-100 px-3 py-1 rounded-full text-slate-500 hover:border-slate-900 transition-all truncate max-w-[150px]">{s.title}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Indicador de "pensando" */}
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

      {/* Pie de página con el campo de entrada */}
      <footer className="p-8">
        <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t.placeholder}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-8 pr-16 text-sm focus:outline-none focus:bg-white focus:ring-4 focus:ring-slate-900/[0.02] transition-all placeholder:text-slate-300 shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isThinking || isLoadingKnowledge}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all active:scale-90 disabled:opacity-20 shadow-lg shadow-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
