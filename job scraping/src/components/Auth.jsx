import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';

const Auth = ({ onAuthenticated }) => {
  // 'login', 'signup', 'verify'
  const [mode, setMode] = useState('signup'); 
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    
    // Simulate API delay for dramatic effect
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    if (mode === 'login') {
      onAuthenticated();
    } else if (mode === 'signup') {
      setMode('verify');
    } else if (mode === 'verify') {
      onAuthenticated();
    }
  };

  return (
    <motion.div 
      className="profile-card"
      style={{ width: '100%', maxWidth: '420px', margin: '0 auto', overflow: 'hidden', padding: '2.5rem' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
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
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)', marginBottom: '1rem' }}>
                <Sparkles size={28} color="#a78bfa" />
              </div>
              <h2 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="description" style={{ fontSize: '0.9rem' }}>
                {mode === 'login' ? 'Sign in to access your AI Dashboard' : 'Join the next generation of job searching'}
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ position: 'relative' }}>
                      <User size={18} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '16px' }} />
                      <input 
                        type="text" 
                        required
                        className="glass-input" 
                        placeholder="Full Name" 
                        style={{ width: '100%', paddingLeft: '2.75rem' }}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '16px' }} />
                <input 
                  type="email" 
                  required
                  className="glass-input" 
                  placeholder="Email Address" 
                  style={{ width: '100%', paddingLeft: '2.75rem' }}
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>


              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#a1a1aa" style={{ position: 'absolute', top: '14px', left: '16px' }} />
                <input 
                  type="password" 
                  required
                  className="glass-input" 
                  placeholder="Password" 
                  style={{ width: '100%', paddingLeft: '2.75rem' }}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <motion.button 
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '0.5rem', display: 'flex', justifyContent: 'center' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
              </motion.button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  style={{ background: 'none', border: 'none', color: '#a78bfa', fontWeight: 'bold', cursor: 'pointer', padding: 0 }}
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
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem' }}>
                <ShieldCheck size={28} color="#10b981" />
              </div>
              <h2 className="title" style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Verify Account</h2>
              <p className="description" style={{ fontSize: '0.9rem' }}>
                We sent a 4-digit code to {formData.email || "your email"}.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
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
                    className="glass-input"
                    required
                    style={{ 
                      width: '54px', height: '64px', fontSize: '1.5rem', 
                      textAlign: 'center', padding: '0',
                      border: digit ? '1px solid rgba(167, 139, 250, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: digit ? '0 0 10px rgba(167, 139, 250, 0.2)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </div>

              <motion.button 
                type="submit"
                className="btn-primary"
                style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#10b981' }}
                whileHover={{ scale: 1.02, backgroundColor: '#059669' }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading || otp.join('').length < 4}
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <><ShieldCheck size={20} style={{ marginRight: '8px' }}/> Verify & Continue</>}
              </motion.button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button 
                onClick={() => setMode('signup')}
                style={{ background: 'none', border: 'none', color: '#a1a1aa', fontSize: '0.875rem', cursor: 'pointer', padding: 0 }}
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
