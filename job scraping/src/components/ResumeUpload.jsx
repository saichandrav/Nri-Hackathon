import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, FileText, Loader2, ArrowRight } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/ai';

const ResumeUpload = ({ onFinish }) => {
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [resumeSaved, setResumeSaved] = useState(false);

  const token = localStorage.getItem('token');

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile?.type === 'application/pdf') {
      setFile(selectedFile);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    if (!token) {
      setExtractedSkills(['Error: Please login first, then upload your resume.']);
      return;
    }

    setIsExtracting(true);
    setExtractedSkills([]);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/extract-resume`, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Extraction failed. Check if backend is running.');
      }
      const data = await response.json();
      setResumeSaved(true);

      // Save the extracted full resume text to localStorage to skip the paste step in Dashboard
      if (data.fullText) {
        localStorage.setItem('resumeText', data.fullText);
      }
      // Save suggested role from AI logic to auto-fill Dashboard
      if (data.suggestedRoles && data.suggestedRoles.length > 0) {
        localStorage.setItem('targetRole', data.suggestedRoles[0]);
      }

      // Extract skills from AI response or fallback against full extracted text
      const skills = data.skills?.length > 0 ? data.skills : extractSkillsFromText(data.fullText || data.textPreview || '');
      setExtractedSkills(skills.length > 0 ? skills : ['Resume uploaded successfully']);
    } catch (error) {
      console.error('Extraction error:', error);
      setExtractedSkills(['Error: ' + error.message]);
    } 
    setIsExtracting(false);
  };

  // Simple skill extraction from resume text
  const extractSkillsFromText = (text) => {
    const commonSkills = [
      'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'Java', 'C++', 'SQL',
      'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Git', 'REST API',
      'Machine Learning', 'Data Analysis', 'HTML', 'CSS', 'Express', 'FastAPI',
      'TensorFlow', 'PyTorch', 'Angular', 'Vue', 'Next.js', 'GraphQL', 'Redis',
      'Linux', 'CI/CD', 'Agile', 'Scrum', 'Flutter', 'React Native', 'Swift',
    ];
    const found = commonSkills.filter(skill => 
      text.toLowerCase().includes(skill.toLowerCase())
    );
    return found.slice(0, 8);
  };

  return (
    <motion.div 
      className="max-w-xl mx-auto mt-10 p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500">
          <FileText size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">Upload Resume</h3>
          <p className="text-sm text-slate-400">We'll save your master resume for AI tailoring</p>
        </div>
      </div>

      <div 
        className={`p-10 text-center border-2 border-dashed rounded-xl cursor-pointer mb-6 transition-colors ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'}`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('resume-upload').click()}
      >
        <input 
          id="resume-upload" 
          type="file" 
          accept="application/pdf" 
          className="hidden"
          onChange={handleFileSelect}
        />
        <UploadCloud size={48} className={`mx-auto mb-4 ${file ? 'text-emerald-500' : 'text-slate-500'}`} />
        {file ? (
          <p className="text-emerald-400 font-medium">{file.name}</p>
        ) : (
          <p className="text-slate-400">Drag & drop your PDF resume here, or click to browse</p>
        )}
      </div>

      <button 
        className={`w-full flex items-center justify-center gap-2 rounded-lg px-6 py-3.5 text-base font-semibold text-white transition-colors disabled:opacity-50 ${resumeSaved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
        disabled={!file || isExtracting || resumeSaved}
        onClick={handleExtract}
      >
        {isExtracting ? (
          <><Loader2 className="animate-spin" size={20} /> Extracting & Saving...</>
        ) : resumeSaved ? (
          <><CheckCircle size={20} /> Resume Saved</>
        ) : (
          'Upload & Extract Skills'
        )}
      </button>

      {extractedSkills.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <div className="mb-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">
              <CheckCircle size={16} className="text-emerald-500" /> Discovered Skills
            </label>
            <div className="flex flex-wrap gap-2">
              {extractedSkills.map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-slate-800 text-emerald-400 text-sm rounded-md border border-emerald-500/20">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          <button 
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-6 py-3.5 text-base font-semibold text-white hover:bg-slate-700 transition-colors"
            onClick={() => onFinish(extractedSkills)}
          >
            Continue to Dashboard <ArrowRight size={18} />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResumeUpload;
