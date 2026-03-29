import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

const Auth = ({ onAuthenticated }) => {
  // 'login', 'signup', 'verify'
  const [mode, setMode] = useState('signup'); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [otp, setOtp] = useState(['', '', '', '']);
  
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        onAuthenticated(data.token);
        return;
      }

      if (mode === 'signup') {
        const res = await fetch('http://localhost:8000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Signup failed');

        setOtp(['', '', '', '']);
        setMode('verify');
        return;
      }

      if (mode === 'verify') {
        const res = await fetch('http://localhost:8000/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, otp: otp.join('') }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Verification failed');

        onAuthenticated(data.token);
        return;
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="w-full max-w-md mx-auto mt-10 p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        
        {/* ======== LOGIN & SIGNUP VIEW ======== */}
        {mode !== 'verify' && (
          <motion.div
            key="auth-forms"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
                <Sparkles size={28} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-400 text-sm">
                {mode === 'login' ? 'Sign in to access your AI Dashboard' : 'Join the next generation of job searching'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-3.5 text-slate-500" />
                      <input 
                        type="text" 
                        required
                        className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" 
                        placeholder="Full Name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail size={18} className="absolute left-4 top-3.5 text-slate-500" />
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" 
                  placeholder="Email Address" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-4 top-3.5 text-slate-500" />
                <input 
                  type="password" 
                  required
                  className="w-full bg-slate-950/50 border border-slate-700 rounded-lg py-3 pl-11 pr-4 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors" 
                  placeholder="Password" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors mt-2 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="mt-6 text-center">
              {error && (
                <p className="text-red-400 text-sm mb-4">
                  {error}
                </p>
              )}
              <p className="text-slate-400 text-sm">
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-blue-400 font-semibold hover:text-blue-300 focus:outline-none"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {/* ======== VERIFICATION VIEW ======== */}
        {mode === 'verify' && (
          <motion.div
            key="verify-form"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <ShieldCheck size={28} className="text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verify Account</h2>
              <p className="text-slate-400 text-sm">
                We sent a 4-digit code to <span className="font-medium text-slate-300">{formData.email || "your email"}</span>.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              
              <div className="flex justify-center gap-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-14 h-16 text-center text-2xl font-bold rounded-xl bg-slate-950/50 focus:outline-none transition-colors ${digit ? 'border-2 border-emerald-500 text-emerald-400' : 'border border-slate-700 text-white'}`}
                    required
                  />
                ))}
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                disabled={isLoading || otp.join('').length < 4}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} /> Verify & Continue</>}
              </button>
            </form>

            {error && (
              <p className="text-red-400 text-sm text-center mt-4">
                {error}
              </p>
            )}

            <div className="mt-8 text-center">
              <button 
                onClick={() => { setError(''); setOtp(['', '', '', '']); setMode('signup'); }}
                className="text-slate-400 text-sm hover:text-white transition-colors focus:outline-none"
              >
                Change details or resend code
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
};

export default Auth;
