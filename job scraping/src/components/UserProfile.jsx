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
      className="max-w-xl mx-auto mt-10 p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
          <Sparkles size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Setup Profile</h3>
          <p className="text-sm text-slate-400">Tailor your AI job search</p>
        </div>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2"><Briefcase size={16} /> Target Role</label>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)} 
          className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500"
        >
          <option value="Machine Learning Engineer">Machine Learning Engineer</option>
          <option value="Frontend Developer">Frontend Developer</option>
          <option value="Backend Developer">Backend Developer</option>
          <option value="Data Scientist">Data Scientist</option>
          <option value="Full Stack Engineer">Full Stack Engineer</option>
        </select>
      </div>

      <div className="mb-6">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2"><GraduationCap size={16} /> Experience Level</label>
        <div className="flex gap-2">
          {['Entry', 'Intermediate', 'Senior'].map(level => (
            <div 
              key={level} 
              className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${experience === level ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
              onClick={() => setExperience(level)}
            >
              {level}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2"><Code2 size={16} /> Core Skills</label>
        <div className="flex flex-wrap gap-2 p-3 bg-slate-950/50 border border-slate-700 rounded-lg min-h-[100px] content-start">
          <AnimatePresence>
            {skills.map(skill => (
              <motion.div 
                key={skill} 
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-200 text-sm rounded-md border border-slate-700"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                layout
              >
                {skill}
                <button onClick={() => removeSkill(skill)} className="text-slate-400 hover:text-white"><X size={14} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
          <input 
            type="text" 
            placeholder="Add skill + Enter..." 
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={addSkill}
            className="flex-1 min-w-[120px] bg-transparent text-slate-200 text-sm focus:outline-none px-2 py-1"
          />
        </div>
      </div>

      <button 
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-6 py-3.5 text-base font-semibold text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
        onClick={async () => {
          setIsLoading(true);
          try {
            const { error } = await supabase.from('users_profile').insert([{ target_role: role, experience: experience, skills: skills }]);
            if (error) throw error;
            if (onProfileSaved) onProfileSaved(skills);
          } catch (err) {
            console.error("Supabase Error:", err);
            // Fallback for demo without real credentials
            if (onProfileSaved) onProfileSaved(skills);
          } finally {
            setIsLoading(false);
          }
        }}
        disabled={isLoading}
      >
        {isLoading ? 'Saving...' : 'Save Profile'}
      </button>
    </motion.div>
  );
};

export default UserProfile;
