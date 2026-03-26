import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Briefcase, GraduationCap, Code2, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';

const UserProfile = ({ onProfileSaved }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState('Machine Learning Engineer');
  const [experience, setExperience] = useState('Intermediate');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(['Python', 'PyTorch', 'React', 'TensorFlow']);

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim() !== '') {
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  return (
    <motion.div 
      className="profile-card"
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.6, type: "spring", bounce: 0.4 }}
    >
      <div className="profile-header">
        <div className="avatar-placeholder">
          <Sparkles size={24} color="#a78bfa" />
        </div>
        <div>
          <h3 className="profile-title">Setup Profile</h3>
          <p className="profile-subtitle">Tailor your AI job search</p>
        </div>
      </div>

      <div className="form-group">
        <label><Briefcase size={16} /> Target Role</label>
        <div className="select-wrapper">
          <select value={role} onChange={(e) => setRole(e.target.value)} className="glass-input">
            <option value="Machine Learning Engineer">Machine Learning Engineer</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Data Scientist">Data Scientist</option>
            <option value="Full Stack Engineer">Full Stack Engineer</option>
          </select>
        </div>
      </div>

      <div className="form-group">
        <label><GraduationCap size={16} /> Experience Level</label>
        <div className="radio-group">
          {['Entry', 'Intermediate', 'Senior'].map(level => (
            <div 
              key={level} 
              className={`radio-badge ${experience === level ? 'active' : ''}`}
              onClick={() => setExperience(level)}
            >
              {level}
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label><Code2 size={16} /> Core Skills</label>
        <div className="skills-container">
          <AnimatePresence>
            {skills.map(skill => (
              <motion.div 
                key={skill} 
                className="skill-tag"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                layout
              >
                {skill}
                <button onClick={() => removeSkill(skill)}><X size={12} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <input 
            type="text" 
            placeholder="Add skill + Enter..." 
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={addSkill}
            className="glass-input skill-input"
          />
        </div>
      </div>

      <motion.button 
        className="btn-secondary"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={async () => {
          setIsLoading(true);
          try {
            const { error } = await supabase.from('users_profile').insert([{ target_role: role, experience: experience, skills: skills }]);
            if (error) throw error;
            if (onProfileSaved) onProfileSaved();
          } catch (err) {
            console.error("Supabase Error:", err);
            // Fallback for demo without real credentials
            if (onProfileSaved) onProfileSaved();
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </motion.button>
    </motion.div>
  );
};

export default UserProfile;
