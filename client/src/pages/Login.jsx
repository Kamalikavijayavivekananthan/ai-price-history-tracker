import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else if (res.needsVerification) {
      // Unverified user — send them to OTP page
      navigate('/verify-otp', { state: { email: res.email || email } });
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb-1" style={{ width: 400, height: 400 }} />
        <div className="hero-orb-2" style={{ width: 300, height: 300 }} />
      </div>

      <div className="max-w-md w-full space-y-6 glass-panel p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 relative z-10 animate-scale-in shadow-2xl">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center">
          <span className="inline-flex p-3.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl text-white shadow-lg shadow-rose-500/25">
            <Sparkles className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Sign in to track prices and receive drop alerts
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 px-4 py-3 rounded-xl text-xs font-semibold text-center animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} id="login-form">
          {/* Email */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                id="login-email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-4 py-3.5 bg-slate-100/60 border border-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 rounded-xl focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-sm transition-all"
                placeholder="name@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="login-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3.5 bg-slate-100/60 border border-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 rounded-xl focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-sm transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            id="login-submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 mt-2"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </span>
          </button>
        </form>

        {/* Demo Hint */}
        <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 text-center">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
            💡 First registered user gets admin access automatically.
          </p>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-bold text-rose-500 hover:text-rose-600 transition-colors">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
