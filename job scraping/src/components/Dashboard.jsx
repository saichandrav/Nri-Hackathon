import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Loader2, AlertCircle, CheckCircle, ExternalLink,
  MapPin, Download, FileText, Sparkles, Building2,
  Globe, ChevronDown, ChevronUp, X, Search, ClipboardList, UploadCloud
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/ai';

const Dashboard = ({ userSkills }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scouting, setScouting] = useState(false);
  const [tailoring, setTailoring] = useState(null);
  const [targetRole, setTargetRole] = useState(() => localStorage.getItem('targetRole') || '');
  const [location, setLocation] = useState('');
  const [scoutDone, setScoutDone] = useState(false);
  const [error, setError] = useState('');
  const [expandedJob, setExpandedJob] = useState(null);
  const [previewResume, setPreviewResume] = useState(null);
  const [previewJobTitle, setPreviewJobTitle] = useState('');
  const [previewResumeId, setPreviewResumeId] = useState(null);

  // Resume state
  const [resumeText, setResumeText] = useState(() => localStorage.getItem('resumeText') || '');
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [resumeSaved, setResumeSaved] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  useEffect(() => {
    if (token) fetchExistingJobs();
    if (!localStorage.getItem('resumeText')) setShowResumeInput(true);
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file || file.type !== 'application/pdf') return setError('Please upload a PDF file.');

    e.preventDefault();
    setIsExtracting(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/extract-resume`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to extract resume');

      if (data.fullText) {
        localStorage.setItem('resumeText', data.fullText);
        setResumeText(data.fullText);
      }
      if (data.suggestedRoles && data.suggestedRoles.length > 0) {
        localStorage.setItem('targetRole', data.suggestedRoles[0]);
        setTargetRole(data.suggestedRoles[0]);
      }

      setResumeSaved(true);
      setTimeout(() => {
        setResumeSaved(false);
        setShowResumeInput(false);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const fetchExistingJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/jobs`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.jobs?.length > 0) {
          setJobs(data.jobs);
          setScoutDone(true);
        }
      }
    } catch (e) {
      console.warn('Could not fetch existing jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleScout = async () => {
    if (!targetRole.trim()) return setError('Please enter a target role');
    if (!location.trim()) return setError('Please enter a location');
    setError('');
    setScouting(true);
    setJobs([]);
    setScoutDone(false);

    try {
      const res = await fetch(`${API_BASE}/scout-jobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetRole: targetRole.trim(), location: location.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scout failed');
      setJobs(data.jobs || []);
      setScoutDone(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setScouting(false);
    }
  };

  const handleTailor = async (jobId) => {
    if (jobId.startsWith('demo-')) {
      return setError('These are demo jobs. Add real API keys to python_ai/.env and restart the Python server.');
    }

    const currentResume = localStorage.getItem('resumeText') || resumeText;

    setTailoring(jobId);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/tailor-resume`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ jobId, resumeText: currentResume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tailoring failed');
      setPreviewResume(data.tailoredResume);
      setPreviewJobTitle(data.jobTitle || 'Your Role');
      setPreviewResumeId(data.resumeId);
    } catch (e) {
      setError(e.message);
    } finally {
      setTailoring(null);
    }
  };

  const handleDownload = async (resumeId) => {
    try {
      const res = await fetch(`${API_BASE}/resumes/download/${resumeId}`, { headers });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tailored_resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>

      {/* ---- Resume Paste Panel ---- */}
      <motion.div
        className="profile-card"
        style={{ marginBottom: '1.5rem', padding: '1.5rem', border: localStorage.getItem('resumeText') ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(167,139,250,0.25)' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => setShowResumeInput(!showResumeInput)}
          style={{ background: 'transparent', border: 'none', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={18} color={localStorage.getItem('resumeText') ? '#10b981' : '#a78bfa'} />
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.95rem' }}>
              Your Resume
            </span>
            {localStorage.getItem('resumeText') && (
              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '999px', border: '1px solid rgba(16,185,129,0.3)' }}>
                ✓ Saved
              </span>
            )}
          </div>
          {showResumeInput ? <ChevronUp size={16} color="#9ca3af" /> : <ChevronDown size={16} color="#9ca3af" />}
        </button>

        <AnimatePresence>
          {showResumeInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', margin: '1rem 0 0.75rem' }}>
                Upload your PDF resume below. The AI will extract your skills and automatically suggest the best roles.
              </p>
              
              <div 
                className="upload-zone glass-input"
                style={{
                  padding: '2rem', textAlign: 'center', borderStyle: 'dashed', cursor: 'pointer',
                  marginBottom: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                  borderColor: isExtracting ? '#a78bfa' : 'rgba(255,255,255,0.1)'
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleResumeUpload}
                onClick={() => document.getElementById('dashboard-resume-upload').click()}
              >
                <input 
                  id="dashboard-resume-upload" 
                  type="file" 
                  accept="application/pdf" 
                  style={{ display: 'none' }}
                  onChange={handleResumeUpload}
                />
                
                {isExtracting ? (
                  <div style={{ padding: '1rem' }}>
                    <Loader2 className="animate-spin" size={32} color="#a78bfa" style={{ margin: '0 auto 1rem' }}/>
                    <p style={{ color: '#a78bfa', fontWeight: '500' }}>AI is analyzing your resume...</p>
                  </div>
                ) : resumeSaved ? (
                  <div style={{ padding: '1rem' }}>
                    <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 1rem' }}/>
                    <p style={{ color: '#10b981', fontWeight: '500' }}>Resume Saved & Analyzed successfully!</p>
                  </div>
                ) : (
                  <div style={{ padding: '1rem' }}>
                    <UploadCloud size={40} color="#a78bfa" style={{ margin: '0 auto 1rem', opacity: 0.8 }}/>
                    <p style={{ color: '#e2e8f0', fontWeight: '500', marginBottom: '0.25rem' }}>
                      Click to upload or drag and drop
                    </p>
                    <p style={{ color: '#9ca3af', fontSize: '0.8rem' }}>PDF (Max 5MB)</p>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  Or paste manually (if your PDF is a scanned image, the parser cannot read it):
                </p>
                <textarea
                  value={resumeText}
                  onChange={(e) => {
                    setResumeText(e.target.value);
                    localStorage.setItem('resumeText', e.target.value);
                  }}
                  placeholder="Paste raw resume text here..."
                  rows={4}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px', padding: '0.75rem', color: '#e2e8f0', fontSize: '0.85rem', outline: 'none'
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ---- Scout Search Bar ---- */}
      <motion.div
        className="profile-card"
        style={{ marginBottom: '2rem', padding: '2rem' }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
          <Sparkles size={22} color="#a78bfa" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff' }}>AI Job Scout</h2>
        </div>
        <p style={{ color: '#9ca3af', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Our AI agent scans the web for the best jobs matching your profile.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Briefcase size={14} /> Target Role
            </label>
            <input
              className="glass-input"
              placeholder="e.g., Full Stack Developer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScout()}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <MapPin size={14} /> Location
            </label>
            <input
              className="glass-input"
              placeholder="e.g., Remote, Bangalore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScout()}
            />
          </div>
        </div>

        <motion.button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={handleScout}
          disabled={scouting}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
        >
          {scouting ? (
            <><Loader2 className="animate-spin" size={20} style={{ marginRight: '8px' }} /> AI is scanning the web...</>
          ) : (
            <><Search size={20} style={{ marginRight: '8px' }} /> Scout for Jobs</>
          )}
        </motion.button>
      </motion.div>

      {/* ---- Error Banner ---- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '10px', color: '#fca5a5' }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{error}</span>
            <X size={16} style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => setError('')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Loader ---- */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 className="animate-spin" size={40} color="#a78bfa" />
        </div>
      )}

      {/* ---- Job Cards ---- */}
      {scoutDone && jobs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Found <strong style={{ color: '#a78bfa' }}>{jobs.length}</strong> jobs — click "Tailor Resume" to generate a customized resume for any role.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {jobs.map((job, index) => (
              <motion.div
                key={job._id || index}
                className="profile-card"
                style={{ padding: '1.75rem' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
              >
                <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '0.5rem' }}>{job.title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', color: '#9ca3af', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Building2 size={13} /> {job.company || 'Unknown'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={13} /> {job.location || 'N/A'}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={13} /> {job.scrapedFrom || 'Web'}</span>
                </div>

                {/* Toggle description */}
                <button
                  onClick={() => setExpandedJob(expandedJob === job._id ? null : job._id)}
                  style={{ background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem', fontWeight: '600', padding: 0, marginBottom: '0.75rem' }}
                >
                  {expandedJob === job._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expandedJob === job._id ? 'Hide Description' : 'Show Description'}
                </button>
                <AnimatePresence>
                  {expandedJob === job._id && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: '1.7', overflow: 'hidden', marginBottom: '1rem' }}
                    >
                      {job.description?.substring(0, 600) || 'No description available.'}
                      {job.description?.length > 600 ? '...' : ''}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <motion.button
                    className="btn-primary"
                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem', marginTop: 0 }}
                    onClick={() => handleTailor(job._id)}
                    disabled={tailoring === job._id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {tailoring === job._id
                      ? <><Loader2 className="animate-spin" size={15} style={{ marginRight: '6px' }} /> Tailoring (~60s)...</>
                      : <><FileText size={15} style={{ marginRight: '6px' }} /> Tailor Resume</>
                    }
                  </motion.button>

                  {job.url && (
                    <a
                      href={job.url} target="_blank" rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{ padding: '0.6rem 1.2rem', fontSize: '0.875rem', marginTop: 0, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', width: 'auto' }}
                    >
                      Apply Now <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ---- Empty State ---- */}
      {scoutDone && jobs.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '3rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
          <AlertCircle size={32} color="#f87171" style={{ marginBottom: '1rem' }} />
          <p style={{ color: '#9ca3af' }}>No jobs found. Try a different role or location.</p>
        </div>
      )}

      {/* ---- Tailored Resume Modal ---- */}
      <AnimatePresence>
        {previewResume && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setPreviewResume(null); setPreviewResumeId(null); }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', padding: '2rem', maxWidth: '700px', width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#fff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={20} color="#10b981" /> Tailored for: {previewJobTitle}
                </h3>
                <X size={20} color="#9ca3af" style={{ cursor: 'pointer' }} onClick={() => { setPreviewResume(null); setPreviewResumeId(null); }} />
              </div>

              <pre style={{ color: '#e2e8f0', fontSize: '0.82rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: "'Inter', sans-serif", background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                {previewResume}
              </pre>

              {previewResumeId ? (
                <motion.button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem' }}
                  onClick={() => handleDownload(previewResumeId)}
                  whileHover={{ scale: 1.015 }}
                >
                  <Download size={18} style={{ marginRight: '8px' }} /> Download as PDF
                </motion.button>
              ) : (
                <p style={{ color: '#9ca3af', fontSize: '0.8rem', textAlign: 'center', marginTop: '1rem' }}>
                  PDF download available after logging in.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
