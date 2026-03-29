import React from 'react';
import { motion } from 'framer-motion';
import Dashboard from '../components/Dashboard';

const DashboardPage = ({ userSkills }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <Dashboard userSkills={userSkills} />
    </motion.div>
  );
};

export default DashboardPage;
