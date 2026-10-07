import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, User, Sparkles, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import * as api from '../services/api';

const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = () => {
    if (password.length === 0) return null;
    if (password.length < 6) return { level: 'Weak', color: 'bg-rose-500', width: '33%' };
    if (password.length < 10) return { level: 'Good', color: 'bg-amber-500', width: '66%' };
    return { level: 'Strong', color: 'bg-emerald-500', width: '100%' };
  };
  const strength = passwordStrength();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.register({ name, email, password });
      if (res.data.success) {
        // Redirect to OTP page, pass email & name as state
        navigate('/verify-otp', { state: { email, name } });
      } else {
        setError(res.data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb-1" style={{ width: 400, height: 400 }} />
        <div className="hero-orb-2" style={{ width: 300, height: 300 }} />
      </div>

      <div className="max-w-md w-full space-y-5 glass-panel p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 relative z-10 animate-scale-in shadow-2xl">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center">
          <span className="inline-flex p-3.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl text-white shadow-lg shadow-rose-500/25">
            <Sparkles className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Create account
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Sign up to track prices and get real-time drop alerts
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2">
          {['🔔 Price Alerts', '📊 AI Predictions', '❤️ Wishlist'].map((f) => (
            <span key={f} className="px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full">
              {f}
            </span>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 px-4 py-3 rounded-xl text-xs font-semibold text-center animate-fade-in">
            ⚠️ {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit} id="register-form">
          {/* Name */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                id="register-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-4 py-3.5 bg-slate-100/60 border border-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 rounded-xl focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-sm transition-all"
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>
          </div>

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
                id="register-email"
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
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="register-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-3.5 bg-slate-100/60 border border-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 rounded-xl focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-sm transition-all"
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Meter */}
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${strength.color}`}
                    style={{ width: strength.width }}
                  />
                </div>
                <p className={`text-[10px] font-bold mt-1 ${
                  strength.level === 'Weak' ? 'text-rose-500' :
                  strength.level === 'Good' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  Password strength: {strength.level}
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            id="register-submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 mt-2"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Create Free Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </span>
          </button>
        </form>

        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-rose-500 hover:text-rose-600 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
