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
    if (token) {
      fetchExistingJobs();
    } else {
      setError('Please login first. Resume upload and tailoring require authentication.');
    }
    if (!localStorage.getItem('resumeText')) setShowResumeInput(true);
  }, []);

  const handleResumeUpload = async (e) => {
    if (!token) {
      setError('Please login first. Resume upload requires authentication.');
      return;
    }

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
    if (!token) return setError('Please login first. Job scouting requires authentication.');
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
    if (!token) {
      return setError('Please login first. Resume tailoring requires authentication.');
    }

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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Download failed');
      }
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
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">

      {/* ---- Resume Paste Panel ---- */}
      <motion.div
        className={`mb-6 p-6 rounded-2xl bg-slate-900 border ${localStorage.getItem('resumeText') ? 'border-emerald-500/30' : 'border-blue-500/30'}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => setShowResumeInput(!showResumeInput)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className={localStorage.getItem('resumeText') ? 'text-emerald-500' : 'text-blue-500'} />
            <span className="text-white font-semibold flex items-center gap-3">
              Your Resume
              {localStorage.getItem('resumeText') && (
                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  ✓ Saved
                </span>
              )}
            </span>
          </div>
          {showResumeInput ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </button>

        <AnimatePresence>
          {showResumeInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4"
            >
              <p className="text-slate-400 text-sm mb-4">
                Upload your PDF resume below. The AI will extract your skills and automatically suggest the best roles.
              </p>
              
              <div 
                className={`p-8 text-center border-2 border-dashed rounded-xl cursor-pointer mb-4 transition-colors ${isExtracting ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500 hover:bg-slate-800/50'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleResumeUpload}
                onClick={() => document.getElementById('dashboard-resume-upload').click()}
              >
                <input 
                  id="dashboard-resume-upload" 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden"
                  onChange={handleResumeUpload}
                />
                
                {isExtracting ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="animate-spin text-blue-500 mb-3" size={32} />
                    <p className="text-blue-400 font-medium">AI is analyzing your resume...</p>
                  </div>
                ) : resumeSaved ? (
                  <div className="flex flex-col items-center">
                    <CheckCircle size={32} className="text-emerald-500 mb-3" />
                    <p className="text-emerald-400 font-medium">Resume Saved & Analyzed successfully!</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud size={40} className="text-slate-400 mb-3" />
                    <p className="text-slate-300 font-medium mb-1">Click to upload or drag and drop</p>
                    <p className="text-slate-500 text-sm">PDF (Max 5MB)</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800">
                <p className="text-slate-400 text-xs mb-2">
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
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ---- Scout Search Bar ---- */}
      <motion.div
        className="mb-8 p-6 rounded-2xl bg-slate-900 border border-slate-800"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={22} className="text-blue-500" />
          <h2 className="text-2xl font-bold text-white">AI Job Scout</h2>
        </div>
        <p className="text-slate-400 mb-6 text-sm">
          Our AI agent scans the web for the best jobs matching your profile.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Briefcase size={14} /> Target Role
            </label>
            <input
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Full Stack Developer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScout()}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <MapPin size={14} /> Location
            </label>
            <input
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="e.g., Remote, Bangalore"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScout()}
            />
          </div>
        </div>

        <button
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleScout}
          disabled={scouting}
        >
          {scouting ? (
            <><Loader2 className="animate-spin" size={20} /> AI is scanning jobs (20-40s)...</>
          ) : (
            <><Search size={20} /> Scout for Jobs</>
          )}
        </button>
      </motion.div>

      {/* ---- Error Banner ---- */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400"
          >
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span className="flex-1 text-sm">{error}</span>
            <X size={16} className="cursor-pointer shrink-0" onClick={() => setError('')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---- Loader ---- */}
      {loading && (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
      )}

      {/* ---- Job Cards ---- */}
      {scoutDone && jobs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-slate-400 text-sm mb-4">
            Found <strong className="text-blue-400 px-1">{jobs.length}</strong> jobs — click "Tailor Resume" to generate a customized resume for any role.
          </p>
          <div className="flex flex-col gap-5">
            {jobs.map((job, index) => (
              <motion.div
                key={job._id || index}
                className="p-6 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <h3 className="text-lg font-bold text-white mb-2">{job.title}</h3>
                <div className="flex flex-wrap gap-4 text-slate-400 text-sm mb-4">
                  <span className="flex items-center gap-1.5"><Building2 size={14} /> {job.company || 'Unknown'}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} /> {job.location || 'N/A'}</span>
                  <span className="flex items-center gap-1.5"><Globe size={14} /> {job.scrapedFrom || 'Web'}</span>
                </div>

                <button
                  onClick={() => setExpandedJob(expandedJob === job._id ? null : job._id)}
                  className="flex items-center gap-1.5 text-blue-400 text-sm font-semibold mb-4 focus:outline-none hover:text-blue-300"
                >
                  {expandedJob === job._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {expandedJob === job._id ? 'Hide Description' : 'Show Description'}
                </button>

                <AnimatePresence>
                  {expandedJob === job._id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="text-slate-300 text-sm leading-relaxed mb-4 p-4 rounded-lg bg-slate-950/50 border border-slate-800/50">
                        {job.description || 'No description available.'}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-wrap gap-3">
                  <button
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    onClick={() => handleTailor(job._id)}
                    disabled={tailoring === job._id}
                  >
                    {tailoring === job._id
                      ? <><Loader2 className="animate-spin" size={16} /> Tailoring (~60s)...</>
                      : <><FileText size={16} /> Tailor Resume</>
                    }
                  </button>

                  {job.url && (
                    <a
                      href={job.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
                    >
                      Apply Now <ExternalLink size={14} />
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
        <div className="text-center p-12 rounded-2xl border border-slate-800 bg-slate-900 border-dashed">
          <AlertCircle size={32} className="text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">No jobs found. Try adjusting your role or location.</p>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <CheckCircle size={20} className="text-emerald-500" /> 
                  Targeted for: {previewJobTitle}
                </h3>
                <button onClick={() => { setPreviewResume(null); setPreviewResumeId(null); }} className="text-slate-400 hover:text-white p-1">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
                  {previewResume}
                </div>
              </div>

              <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                {previewResumeId ? (
                  <button
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white hover:bg-emerald-700 transition-colors"
                    onClick={() => handleDownload(previewResumeId)}
                  >
                    <Download size={18} /> Download Print-Ready PDF
                  </button>
                ) : (
                  <p className="text-slate-400 text-sm text-center">
                    PDF download is available after creating an account.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
