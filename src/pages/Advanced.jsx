import React from 'react';
import { Blocks, Plug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

const Advanced = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Blocks className="w-8 h-8 text-terminal-green" />
        <div>
          <h1 className="text-2xl font-bold text-terminal-green mb-1">ADVANCED FEATURES</h1>
          <p className="text-terminal-muted text-sm">Coming soon: Premium security tools</p>
        </div>
      </div>

      {/* Extension Dashboard */}
      <Card title="▸ EXTENSION CONTROL CENTER">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-terminal-muted text-sm">
            <Plug className="w-4 h-4 text-terminal-green" />
            <span>Open the dedicated Extension Dashboard for live telemetry and controls.</span>
          </div>
          <Button className="w-full md:w-auto" onClick={() => navigate('/extension-dashboard')}>
            OPEN EXTENSION DASHBOARD
          </Button>
        </div>
      </Card>

      <Card title="▸ AI THEFT DETECTION">
        <div className="space-y-4">
          <div className="text-terminal-muted text-sm">
            Connect a Raspberry Pi camera stream and monitor theft alerts.
          </div>
          <Button className="w-full md:w-auto" variant="warning" onClick={() => navigate('/ai-theft')}>
            OPEN AI THEFT DETECTION
          </Button>
        </div>
      </Card>

      {/* Info Box */}
      <Card title="▸ ABOUT ADVANCED FEATURES">
        <div className="space-y-3 text-sm text-terminal-muted">
          <p>
            Advanced features provide deeper visibility into extension activity,
            security posture, and secure device sync.
          </p>
          <div className="border-l-2 border-terminal-green pl-3 space-y-1">
            <p className="text-terminal-green">• Extension telemetry</p>
            <p className="text-terminal-green">• USB Vault controls</p>
            <p className="text-terminal-green">• Custom security policies</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Advanced;
