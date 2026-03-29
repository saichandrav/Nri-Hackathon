import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Search, FileText, Send } from 'lucide-react';

const HeroPage = ({ onGetStarted }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl flex flex-col items-center justify-center"
      >
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400">
          <Sparkles size={16} />
          Next-Gen Intelligence
        </div>

        <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white md:text-7xl">
          Automate Your Career with <br className="hidden md:block" />
          <span className="text-blue-500">AI-Powered</span> Job Scouting
        </h1>

        <p className="mb-10 text-lg text-slate-400 max-w-2xl">
          Harness the power of artificial intelligence to effortlessly scour the web, analyze active job listings, and find your perfect matching role faster than ever before.
        </p>

        <button
          onClick={onGetStarted}
          className="group inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-blue-700"
        >
          Get Started <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
        </button>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-300 w-full max-w-3xl">
          <div className="flex flex-col items-center p-6 border border-slate-800 rounded-xl bg-slate-900/50">
            <Search className="mb-4 text-blue-500" size={32} />
            <h3 className="text-xl font-bold text-white mb-2">Smart Scrape</h3>
            <p className="text-sm text-slate-400 text-center">We aggregate high quality, real-time jobs from everywhere on the web.</p>
          </div>
          <div className="flex flex-col items-center p-6 border border-slate-800 rounded-xl bg-slate-900/50">
            <FileText className="mb-4 text-blue-500" size={32} />
            <h3 className="text-xl font-bold text-white mb-2">Auto Tailor</h3>
            <p className="text-sm text-slate-400 text-center">Our AI rewrites and perfectly targets your resume for individual jobs.</p>
          </div>
          <div className="flex flex-col items-center p-6 border border-slate-800 rounded-xl bg-slate-900/50">
            <Send className="mb-4 text-blue-500" size={32} />
            <h3 className="text-xl font-bold text-white mb-2">One Click Apply</h3>
            <p className="text-sm text-slate-400 text-center">Export ready-to-send PDF files formatted for flawless ATS extraction.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroPage;
