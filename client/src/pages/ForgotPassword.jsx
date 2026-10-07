import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Mail, Lock, ArrowRight, ArrowLeft, RefreshCw, CheckCircle2, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import * as api from '../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();

  // Step 1: 'EMAIL', Step 2: 'RESET_PASSWORD', Step 3: 'SUCCESS'
  const [step, setStep] = useState('EMAIL');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer for OTP resend in Step 2
  useEffect(() => {
    let timer;
    if (step === 'RESET_PASSWORD' && countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  // Step 1 Submit: Request Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      const res = await api.forgotPassword(email);
      if (res.data.success) {
        setStep('RESET_PASSWORD');
        setCountdown(60);
        setCanResend(false);
        setInfoMessage(res.data.message || `Reset code sent to ${email}`);
      } else {
        setError(res.data.message || 'Failed to send reset code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setResending(true);
    setError('');

    try {
      const res = await api.forgotPassword(email);
      if (res.data.success) {
        setCountdown(60);
        setCanResend(false);
        setInfoMessage('A new reset code has been sent to your email.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.data.message || 'Failed to resend code');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  // Step 2 Submit: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-check.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.resetPassword({
        email,
        otp: otpValue,
        newPassword,
      });

      if (res.data.success) {
        setStep('SUCCESS');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(res.data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Reset password failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="hero-orb-1" style={{ width: 400, height: 400 }} />
        <div className="hero-orb-2" style={{ width: 300, height: 300 }} />
      </div>

      <div className="max-w-md w-full space-y-6 glass-panel p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 relative z-10 animate-scale-in shadow-2xl">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-rose-500/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* STEP 1: ENTER EMAIL */}
        {step === 'EMAIL' && (
          <>
            <div className="text-center">
              <span className="inline-flex p-3.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl text-white shadow-lg shadow-rose-500/25">
                <KeyRound className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Forgot Password?
              </h1>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Enter your registered email address and we&apos;ll send you a 6-digit OTP code to reset your password.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 px-4 py-3 rounded-xl text-xs font-semibold text-center animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleRequestOtp} id="forgot-password-form">
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
                    id="forgot-email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-4 py-3.5 bg-slate-100/60 border border-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 rounded-xl focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-sm transition-all"
                    placeholder="name@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="send-otp-btn"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          </>
        )}

        {/* STEP 2: ENTER OTP & NEW PASSWORD */}
        {step === 'RESET_PASSWORD' && (
          <>
            <div className="text-center">
              <span className="inline-flex p-3.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl text-white shadow-lg shadow-rose-500/25">
                <ShieldCheck className="h-7 w-7" />
              </span>
              <h1 className="mt-5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Reset Your Password
              </h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Enter the 6-digit code sent to <strong className="text-slate-800 dark:text-slate-200">{email}</strong>
              </p>
            </div>

            {infoMessage && !error && (
              <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl text-xs font-medium text-center animate-fade-in">
                ✓ {infoMessage}
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 px-4 py-3 rounded-xl text-xs font-semibold text-center animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleResetPassword} id="reset-password-form">
              {/* 6-Digit OTP */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2 text-center">
                  Verification Code
                </label>
                <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      id={`reset-otp-input-${idx}`}
                      className="w-11 h-13 text-center text-xl font-bold font-mono bg-slate-100/70 dark:bg-slate-900/70 border-2 border-slate-200 dark:border-slate-800 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none text-slate-900 dark:text-white transition-all shadow-inner"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Resend OTP info */}
              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                    {resending ? 'Sending...' : 'Resend Code'}
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">
                    Resend code in <span className="font-bold text-slate-600 dark:text-slate-300 font-mono">{countdown}s</span>
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  New Password (min 6 characters)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-100/60 border border-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 rounded-xl focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-sm transition-all"
                    placeholder="Enter new password"
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
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirm-new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-100/60 border border-slate-200 dark:border-slate-800/60 dark:bg-slate-900/60 rounded-xl focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500 outline-none text-sm transition-all"
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="reset-submit-btn"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setStep('EMAIL')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change Email Address
              </button>
            </div>
          </>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center py-6 space-y-5 animate-scale-in">
            <span className="inline-flex p-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="h-12 w-12" />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Password Reset Successful!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Your password has been securely updated. Redirecting you to login...
              </p>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full py-3.5 mt-4"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Sign In Now
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
