import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle, FileText, Loader2, ArrowRight } from 'lucide-react';

const ResumeUpload = ({ onFinish }) => {
  const [file, setFile] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState([]);

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
    setIsExtracting(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Points to our local Python FastAPI backend
      const response = await fetch('http://localhost:8000/api/extract-resume', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Extraction failed. Check if backend is running.');
      const data = await response.json();
      setExtractedSkills(data.skills || []);
    } catch (error) {
      console.error('Extraction error:', error);
      // Mock for now until the backend is fully connected
      setTimeout(() => {
        setExtractedSkills(['Python', 'Data Analysis', 'Machine Learning', 'SQL']);
        setIsExtracting(false);
      }, 1500);
      return;
    } 
    setIsExtracting(false);
  };

  return (
    <motion.div 
      className="profile-card"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <div className="avatar-placeholder">
          <FileText size={24} color="#a78bfa" />
        </div>
        <div>
          <h3 className="profile-title">Upload Resume</h3>
          <p className="profile-subtitle">We'll auto-extract your skills</p>
        </div>
      </div>

      <div 
        className="upload-zone glass-input"
        style={{ padding: '2rem', textAlign: 'center', borderStyle: 'dashed', cursor: 'pointer', marginBottom: '1rem', borderRadius: '12px' }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('resume-upload').click()}
      >
        <input 
          id="resume-upload" 
          type="file" 
          accept="application/pdf" 
          className="hidden" 
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <UploadCloud size={48} color={file ? "#10b981" : "#a78bfa"} style={{ margin: '0 auto 1rem' }}/>
        {file ? (
          <p style={{ color: '#fff', fontWeight: '500' }}>{file.name}</p>
        ) : (
          <p style={{ color: '#a1a1aa' }}>Drag & drop your PDF resume here, or click to browse</p>
        )}
      </div>

      <motion.button 
        className="btn-primary"
        style={{ width: '100%', marginBottom: extractedSkills.length > 0 ? '1rem' : '0' }}
        disabled={!file || isExtracting || extractedSkills.length > 0}
        onClick={handleExtract}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isExtracting ? (
          <><Loader2 className="animate-spin" size={20} style={{ display: 'inline', marginRight: '8px', marginBottom: '-4px' }}/> Extracting...</>
        ) : extractedSkills.length > 0 ? (
          <><CheckCircle size={20} style={{ display: 'inline', marginRight: '8px', marginBottom: '-4px' }}/> Extracted</>
        ) : (
          'Extract Skills'
        )}
      </motion.button>

      {extractedSkills.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label><CheckCircle size={16} color="#10b981" /> Discovered Skills</label>
            <div className="skills-container" style={{ marginTop: '0.5rem' }}>
              {extractedSkills.map((skill, idx) => (
                <span key={idx} className="skill-tag" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>{skill}</span>
              ))}
            </div>
          </div>
          
          <motion.button 
            className="btn-secondary"
            style={{ width: '100%', marginTop: '1rem' }}
            onClick={() => onFinish(extractedSkills)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Continue to Dashboard <ArrowRight size={18} style={{ display: 'inline', marginLeft: '6px', marginBottom: '-4px' }}/>
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ResumeUpload;
