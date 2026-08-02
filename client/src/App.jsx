/* ============================================
   LUMINA - Frontend React Complet
   Avec mode Guest FONCTIONNEL
   ============================================ */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// ============ LUMINA ICON (SVG) ============
const LuminaIcon = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="luminaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#f97316" />
      </linearGradient>
      <filter id="luminaGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <circle cx="20" cy="20" r="18" fill="url(#luminaGradient)" opacity="0.3"/>
    <circle cx="20" cy="20" r="12" fill="url(#luminaGradient)" filter="url(#luminaGlow)"/>
    <path d="M20 8v24M8 20h24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// ============ LOGIN PAGE ============
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestCode = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/request-code`, { email });
      setStep('code');
      setError('');
    } catch (err) {
      setError('Erreur: ' + err.response?.data?.error || err.message);
    }
    setLoading(false);
  };

  const verifyCode = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-code`, { email, code });
      localStorage.setItem('token', res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      setError('Code invalide');
    }
    setLoading(false);
  };

  const continueAsGuest = () => {
    onLogin({
      email: 'guest@lumina.local',
      tier: 'free',
      questionLimit: 50,
      questionsUsed: 0,
      isGuest: true
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Lumière décorative */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <LuminaIcon />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Lumina</h1>
          <p className="text-amber-200 text-sm tracking-wide">Your Personal AI Assistant</p>
        </div>

        {/* Form */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {step === 'email' ? (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
              <button
                onClick={requestCode}
                disabled={loading || !email}
                className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition disabled:opacity-50"
              >
                {loading ? 'Envoi...' : 'Recevoir un code'}
              </button>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-600"></div>
                <span className="text-slate-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-slate-600"></div>
              </div>

              <button
                onClick={continueAsGuest}
                className="w-full mt-4 py-3 bg-slate-700/50 text-slate-300 font-semibold rounded-lg hover:bg-slate-700 transition border border-slate-600"
              >
                Continuer sans compte
              </button>
            </div>
          ) : (
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-3">Code (6 chiffres)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.slice(0, 6))}
                placeholder="000000"
                maxLength="6"
                className="w-full px-4 py-3 text-center text-2xl bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition tracking-widest"
              />
              <button
                onClick={verifyCode}
                disabled={loading || code.length !== 6}
                className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition disabled:opacity-50"
              >
                {loading ? 'Vérification...' : 'Se connecter'}
              </button>
              <button
                onClick={() => { setStep('email'); setCode(''); }}
                className="w-full mt-3 py-2 text-slate-400 hover:text-slate-300 transition text-sm"
              >
                Autre email
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-8">
          Authentification sécurisée • Code valide 10 minutes
        </p>
      </div>
    </div>
  );
};

// ============ CHAT INTERFACE ============
const ChatInterface = ({ user, onLogout }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [loading, setLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [questionsRemaining, setQuestionsRemaining] = useState(user?.questionLimit || 50);

  const modeLabels = {
    chat: { name: 'Chat', icon: '💬', desc: 'Conversation libre' },
    english: { name: 'English', icon: '🇬🇧', desc: 'Apprentissage' },
    recipes: { name: 'Recipes', icon: '🍳', desc: 'Recettes' }
  };

  const token = localStorage.getItem('token');
  const isGuest = user?.isGuest;

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading || questionsRemaining <= 0) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    try {
      if (isGuest) {
        // Mode guest: appel direct à /api/chat-guest (pas de sauvegarde)
        const res = await axios.post(`${API_URL}/chat-guest`, {
          message: userMessage,
          mode
        });

        setMessages([
          ...messages,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: res.data.response }
        ]);
      } else {
        // Mode connecté: avec sauvegarde et limites
        const res = await axios.post(
          `${API_URL}/chat`,
          { message: userMessage, mode, conversationId: currentConversation },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newMessages = [
          ...messages,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: res.data.response }
        ];

        setMessages(newMessages);
        setCurrentConversation(res.data.conversationId);
        setQuestionsRemaining(user.questionLimit - (user.questionsUsed || 0) - 1);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        alert('Limite atteinte! Mettez à jour votre abonnement.');
      } else {
        alert('Erreur: ' + err.response?.data?.error);
      }
    }
    setLoading(false);
  };

  const startNewChat = () => {
    setCurrentConversation(null);
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-950 to-slate-900">
      {/* SIDEBAR */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} bg-slate-800/50 backdrop-blur border-r border-slate-700/50 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Header Sidebar */}
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LuminaIcon />
              <div>
                <h1 className="text-white font-bold">Lumina</h1>
                <p className="text-amber-300 text-xs">{isGuest ? 'GUEST' : user.tier.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {!isGuest && (
            <div className="bg-slate-700/50 rounded-lg p-3">
              <p className="text-slate-300 text-xs mb-2">Questions restantes</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-amber-400">{questionsRemaining}</span>
                <span className="text-slate-400 text-xs">{user.questionLimit}</span>
              </div>
              <div className="mt-2 w-full bg-slate-600 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                  style={{width: `${(questionsRemaining / user.questionLimit) * 100}%`}}
                ></div>
              </div>
            </div>
          )}

          {isGuest && (
            <div className="bg-amber-500/20 rounded-lg p-3 text-amber-300 text-xs border border-amber-500/50">
              ⚡ Mode test illimité - Connecte-toi pour sauvegarder
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <button
          onClick={startNewChat}
          className="m-4 py-2 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-amber-500/50 transition text-sm"
        >
          + Nouvelle conversation
        </button>

        {/* Conversations List (seulement si connecté) */}
        {!isGuest && (
          <div className="flex-1 overflow-y-auto px-3 space-y-2">
            {conversations.map(conv => (
              <button
                key={conv._id}
                onClick={() => setCurrentConversation(conv._id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm truncate ${
                  currentConversation === conv._id
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <span className="mr-2">{modeLabels[conv.mode]?.icon}</span>
                {conv.title}
              </button>
            ))}
          </div>
        )}

        {/* User Menu */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={onLogout}
            className="w-full py-2 text-slate-400 hover:text-red-400 transition text-sm font-medium"
          >
            {isGuest ? 'Se connecter' : 'Déconnexion'}
          </button>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-slate-800/30 backdrop-blur border-b border-slate-700/50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="text-slate-400 hover:text-white transition p-2"
            >
              ☰
            </button>

            {/* Mode Selector */}
            <div className="flex gap-2">
              {Object.entries(modeLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => { setMode(key); startNewChat(); }}
                  className={`px-4 py-2 rounded-lg transition font-medium text-sm ${
                    mode === key
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/50'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {label.icon} {label.name}
                </button>
              ))}
            </div>
          </div>

          {!isGuest && questionsRemaining < 10 && (
            <button className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition text-sm font-medium border border-red-500/50">
              Mettez à jour
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <LuminaIcon />
              <h2 className="text-2xl font-bold text-white mt-4">Salut! 👋</h2>
              <p className="text-slate-400 mt-2">Je suis Lumina, ton assistant IA personnel</p>
              <p className="text-slate-500 text-sm mt-6 max-w-sm">
                {isGuest ? '⚡ Mode test - Teste sans limites' : `${modeLabels[mode].desc} • Mode ${modeLabels[mode].name}`}
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-amber-500/30 text-white rounded-br-none'
                    : 'bg-slate-700/50 text-slate-100 rounded-bl-none border border-slate-600/50'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-600/50">
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-800/30 backdrop-blur border-t border-slate-700/50">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message en mode ${modeLabels[mode].name}...`}
              disabled={loading || (!isGuest && questionsRemaining <= 0)}
              className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || (!isGuest && questionsRemaining <= 0)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/50 transition disabled:opacity-50"
            >
              ✓
            </button>
          </form>
          <p className="text-slate-500 text-xs mt-3 text-center">
            Lumina • Authentification sécurisée • Données chiffrées
          </p>
        </div>
      </div>
    </div>
  );
};

// ============ MAIN APP ============
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ email: 'user@example.com', tier: 'free', questionLimit: 50, questionsUsed: 0 });
    }
    setLoading(false);
  }, []);

  if (loading) return <div className="bg-slate-900 h-screen"></div>;

  return user ? (
    <ChatInterface
      user={user}
      onLogout={() => {
        localStorage.removeItem('token');
        setUser(null);
      }}
    />
  ) : (
    <LoginPage onLogin={setUser} />
  );
}
