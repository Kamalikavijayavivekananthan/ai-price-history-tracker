import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';
import * as api from '../services/api';

const VerifyOtp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Email passed from Register page via navigate state
  const email = location.state?.email || '';
  const name = location.state?.name || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Redirect to register if no email
  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    // Allow only digits
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last digit
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp({ email, otp: otpValue });
      if (res.data.success) {
        // Store token & login
        localStorage.setItem('token', res.data.token);
        setSuccess('Email verified! Redirecting...');
        setTimeout(() => navigate('/'), 1200);
      } else {
        setError(res.data.message || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    setError('');
    try {
      const res = await api.resendOtp(email);
      if (res.data.success) {
        setSuccess('A new OTP has been sent to your inbox!');
        setOtp(['', '', '', '', '', '']);
        setCountdown(60);
        setCanResend(false);
        setTimeout(() => setSuccess(''), 3000);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.data.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(b.length) + c);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb-1" style={{ width: 400, height: 400 }} />
        <div className="hero-orb-2" style={{ width: 300, height: 300 }} />
      </div>

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 relative z-10 animate-scale-in shadow-2xl">
        {/* Glows */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-flex p-3.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl text-white shadow-lg shadow-rose-500/25">
            <ShieldCheck className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            We sent a 6-digit OTP to
          </p>
          <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
            <Mail className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{maskedEmail}</span>
          </div>
        </div>

        {/* Success */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 px-4 py-3 rounded-xl text-xs font-semibold text-center animate-fade-in mb-4">
            <CheckCircle className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 px-4 py-3 rounded-xl text-xs font-semibold text-center animate-fade-in mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="otp-form">
          {/* OTP Inputs */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-input-${index}`}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all duration-200
                  bg-slate-100/60 dark:bg-slate-900/60
                  ${digit
                    ? 'border-rose-500 text-rose-500 dark:text-rose-400 shadow-sm shadow-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'}
                  focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20`}
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            id="verify-otp-submit"
            disabled={loading || otp.join('').length !== 6}
            className="btn-primary w-full py-3.5"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Verify OTP
                </>
              )}
            </span>
          </button>
        </form>

        {/* Resend */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Didn't receive the email? Check your spam folder.
          </p>
          <button
            id="resend-otp-btn"
            onClick={handleResend}
            disabled={!canResend || resending}
            className={`inline-flex items-center gap-1.5 text-sm font-bold transition-all ${
              canResend
                ? 'text-rose-500 hover:text-rose-600 cursor-pointer'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
            {canResend ? 'Resend OTP' : `Resend in ${countdown}s`}
          </button>
        </div>

        {/* Back to register */}
        <div className="text-center mt-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
