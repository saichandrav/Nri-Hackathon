<<<<<<< Updated upstream
import { Navigate, Route, Routes } from 'react-router-dom'
import Login from './pages/Login'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}
=======
import React, { useState } from 'react';
import Scene from './components/Scene';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import ResumeUpload from './components/ResumeUpload';
import Dashboard from './components/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

const App = () => {
  const [step, setStep] = useState('hero'); // 'hero', 'auth', 'profile', 'resume', 'dashboard'
  const [profileSkills, setProfileSkills] = useState([]);
  const [resumeSkills, setResumeSkills] = useState([]);
  
  const allSkills = Array.from(new Set([...profileSkills, ...resumeSkills]));
>>>>>>> Stashed changes

  return (
    <>
      <Scene />
      
      <main className="ui-layer">
        <AnimatePresence mode="wait">
          {step === 'hero' && (
            <motion.div 
              key="hero"
              className="ui-content"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
            >
              <div className="badge">
                <Sparkles size={16} style={{ display: 'inline', marginRight: '8px', marginBottom: '-3px' }}/>
                Next-Gen Intelligence
              </div>
              
              <h1 className="title">
                Automate Your Career with <span>AI-Powered</span> Job Scraping
              </h1>
              
              <p className="description">
                Harness the power of artificial intelligence to effortlessly scour the web, analyze job listings, and find your perfect role faster than ever before.
              </p>
              
              <motion.button 
                className="btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep('auth')}
              >
                Get Started <ArrowRight size={20} />
              </motion.button>

              <div className="glass-stats">
                <div className="stat">
                  <span className="stat-value">100k+</span>
                  <span className="stat-label">Jobs Scanned</span>
                </div>
                <div className="stat">
                  <span className="stat-value">24/7</span>
                  <span className="stat-label">AI Processing</span>
                </div>
                <div className="stat">
                  <span className="stat-value">98%</span>
                  <span className="stat-label">Match Rate</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'auth' && (
            <motion.div 
              key="auth"
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Auth onAuthenticated={() => setStep('profile')} />
            </motion.div>
          )}

          {step === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <UserProfile onProfileSaved={(skills) => {
                if (skills) setProfileSkills(skills);
                setStep('resume');
              }} />
            </motion.div>
          )}

          {step === 'resume' && (
            <motion.div 
              key="resume"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5, type: "spring" }}
            >
              <ResumeUpload onFinish={(skills) => {
                 if (skills) setResumeSkills(skills);
                 setStep('dashboard');
              }} />
            </motion.div>
          )}

          {step === 'dashboard' && (
             <motion.div 
               key="dashboard"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="ui-content"
             >
               <Dashboard userSkills={allSkills} />
             </motion.div>
          )}
        </AnimatePresence>
      </main>
    </>
  );
};

export default App;