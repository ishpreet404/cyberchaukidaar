import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScamAnalyzer from './pages/ScamAnalyzer';
import BreachChecker from './pages/BreachChecker';
import AICoach from './pages/AICoach';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="scam-analyzer" element={<ScamAnalyzer />} />
          <Route path="breach-checker" element={<BreachChecker />} />
          <Route path="ai-coach" element={<AICoach />} />
          <Route path="vault" element={<ComingSoon title="VAULT" />} />
          <Route path="activity" element={<ComingSoon title="ACTIVITY" />} />
        </Route>
      </Routes>
    </Router>
  );
}

const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="text-center space-y-4">
      <div className="text-4xl font-bold text-shadow-terminal">
        $ {title}
      </div>
      <div className="text-terminal-muted">
        [FEATURE IN DEVELOPMENT]
      </div>
      <div className="animate-pulse text-terminal-green">
        <span className="cursor"></span>
      </div>
    </div>
  </div>
);

export default App;
