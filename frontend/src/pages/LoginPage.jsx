import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FolderKanban, Sparkles, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      console.error('Login error', err);
      setError('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userType) => {
    if (userType === 'manager') {
      setUsername('manager');
      setPassword('password123');
    } else if (userType === 'admin') {
      setUsername('admin');
      setPassword('password123');
    } else if (userType === 'dev') {
      setUsername('dev1');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#090d16] relative overflow-hidden">
      {/* Background glow ambient circles */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl bg-slate-900/80 backdrop-blur-2xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-4 border border-indigo-400/30">
            <FolderKanban className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-['Outfit']">
            PMS Core Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Next-generation project management with automated RAG assistant & tool execution
          </p>
        </div>

        {/* Demo Quick Logins */}
        <div className="mb-6 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>One-Click Demo Roles:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              id="demo-manager-btn"
              onClick={() => setDemoUser('manager')}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                username === 'manager'
                  ? 'bg-indigo-600 text-white border-indigo-400/50 shadow'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Manager
            </button>
            <button
              type="button"
              id="demo-admin-btn"
              onClick={() => setDemoUser('admin')}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                username === 'admin'
                  ? 'bg-indigo-600 text-white border-indigo-400/50 shadow'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              id="demo-dev-btn"
              onClick={() => setDemoUser('dev')}
              className={`px-2 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                username === 'dev1'
                  ? 'bg-indigo-600 text-white border-indigo-400/50 shadow'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              Dev 1
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
