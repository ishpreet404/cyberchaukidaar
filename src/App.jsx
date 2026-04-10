import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScamAnalyzer from './pages/ScamAnalyzer';
import BreachChecker from './pages/BreachChecker';
import AICoach from './pages/AICoach';
import USBVault from './pages/USBVault';
import Advanced from './pages/Advanced';
import ExtensionDashboard from './pages/ExtensionDashboard';
import AICameraTheft from './pages/AICameraTheft';
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
          <Route path="vault" element={<USBVault />} />
          <Route path="extension-dashboard" element={<ExtensionDashboard />} />
          <Route path="ai-theft" element={<AICameraTheft />} />
          <Route path="advanced" element={<Advanced />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
