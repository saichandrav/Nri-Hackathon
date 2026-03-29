import React, { useState } from 'react';
import Navbar from './components/NavigationBar';
import HeroPage from './pages/HeroPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ResumePage from './pages/ResumePage';
import DashboardPage from './pages/DashboardPage';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';

const App = () => {
  const navigate = useNavigate();
  const [profileSkills, setProfileSkills] = useState([]);
  const [resumeSkills, setResumeSkills] = useState([]);
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const allSkills = Array.from(new Set([...profileSkills, ...resumeSkills]));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans antialiased overflow-x-hidden">
      <Navbar />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col items-center justify-center min-h-[calc(100vh-80px)]">
        <Routes>
          <Route
            path="/"
            element={<HeroPage onGetStarted={() => navigate('/auth')} />}
          />

          <Route
            path="/auth"
            element={
              <AuthPage
                onAuthenticated={(token) => {
                  if (token) localStorage.setItem('token', token);
                  navigate('/profile');
                }}
              />
            }
          />

          <Route
            path="/login"
            element={<AuthPage onAuthenticated={() => navigate('/profile')} />}
          />

          <Route
            path="/signup"
            element={<AuthPage onAuthenticated={() => navigate('/profile')} />}
          />

          <Route
            path="/profile"
            element={
              isAuthenticated ? (
                <ProfilePage
                  onProfileSaved={(skills) => {
                    if (skills) setProfileSkills(skills);
                    navigate('/resume');
                  }}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/resume"
            element={
              isAuthenticated ? (
                <ResumePage
                  onFinish={(skills) => {
                    if (skills) setResumeSkills(skills);
                    navigate('/dashboard');
                  }}
                />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <DashboardPage userSkills={allSkills} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
