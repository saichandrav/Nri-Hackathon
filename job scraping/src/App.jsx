import React, { useState } from 'react';
import Scene from './components/Scene';
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
  
  const allSkills = Array.from(new Set([...profileSkills, ...resumeSkills]));

  return (
    <>
      <Navbar />
      <Scene />
      
      <main className="ui-layer">
        <Routes>
          <Route
            path="/"
            element={<HeroPage onGetStarted={() => navigate('/auth')} />}
          />

          <Route
            path="/auth"
            element={<AuthPage onAuthenticated={() => navigate('/profile')} />}
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
              <ProfilePage
                onProfileSaved={(skills) => {
                  if (skills) setProfileSkills(skills);
                  navigate('/resume');
                }}
              />
            }
          />

          <Route
            path="/resume"
            element={
              <ResumePage
                onFinish={(skills) => {
                  if (skills) setResumeSkills(skills);
                  navigate('/dashboard');
                }}
              />
            }
          />

          <Route
            path="/dashboard"
            element={<DashboardPage userSkills={allSkills} />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

export default App;
