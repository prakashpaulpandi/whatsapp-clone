import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Lock, Mail, ArrowRight, Eye, EyeOff, FlaskConical } from 'lucide-react';

export const Login = () => {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [blockedFor,  setBlockedFor]  = useState(null); // minutes

  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  // ── Normal login ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBlockedFor(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const data = err.response?.data;

      // 429 Too Many Requests from rate limiter
      if (err.response?.status === 429) {
        setBlockedFor(data?.blockedFor || 15);
        setError(`Too many failed attempts. Your IP is blocked for ${data?.blockedFor || 15} minute(s).`);
      } else {
        setError(data?.error || data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Secure demo login (no passwords in frontend) ─────────────────────────
  const handleDemoLogin = async (account) => {
    setError('');
    setBlockedFor(null);
    setDemoLoading(account); // set which button is loading
    try {
      await demoLogin(account);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait a moment before trying again.');
      } else if (err.response?.status === 404) {
        setError('Demo accounts are still being set up. Please wait a moment and retry.');
      } else {
        setError('Could not access demo. Please try normal login or create an account.');
      }
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl mb-4 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Welcome to ChatSphere</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time modern messaging platform</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={`mb-5 text-xs px-4 py-3 rounded-xl flex items-start gap-2 border ${
            blockedFor
              ? 'bg-amber-500/10 border-amber-500/25 text-amber-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}>
            <span className="mt-0.5 shrink-0">{blockedFor ? '🔒' : '⚠️'}</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
                className="w-full bg-slate-800/80 text-slate-100 text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Password with visibility toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-slate-800/80 text-slate-100 text-sm pl-10 pr-11 py-2.5 rounded-xl border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition p-0.5"
                title={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading || !!blockedFor}
            className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* ── Secure Demo Section ──────────────────────────────────────────── */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            Try a Demo Account
          </p>

          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Instantly explore ChatSphere without signing up.
            Demo sessions last <span className="text-slate-300 font-medium">2 hours</span> and require no password.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'alice',   label: 'Alice',   emoji: '👩' },
              { key: 'bob',     label: 'Bob',     emoji: '👨' },
              { key: 'charlie', label: 'Charlie', emoji: '🧑' },
            ].map(({ key, label, emoji }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleDemoLogin(key)}
                disabled={!!demoLoading || loading}
                className="flex flex-col items-center gap-1.5 py-3 px-2 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/50 rounded-xl text-xs font-medium text-slate-300 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading === key ? (
                  <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="text-xl leading-none">{emoji}</span>
                )}
                <span className="font-semibold text-slate-200 text-[12px]">{label}</span>
                <span className="text-[10px] text-slate-500">Demo</span>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-slate-600 mt-2.5 text-center">
            🔒 Credentials are handled server-side — nothing is stored in this page
          </p>
        </div>

        {/* Signup Redirect */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
