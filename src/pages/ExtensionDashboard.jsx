import React, { useEffect, useState } from 'react';
import { Blocks, Shield, Eye, Activity, Plug } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const ExtensionDashboard = () => {
  const [extensionStats, setExtensionStats] = useState({
    adsBlocked: 0,
    trackersBlocked: 0,
    sitesScanned: 0,
    passwordsSaved: 0,
    lastSync: null
  });
  const [extensionConnected, setExtensionConnected] = useState(false);

  useEffect(() => {
    const handleExtensionStats = (event) => {
      setExtensionStats(event.detail);
      setExtensionConnected(true);
    };

    window.addEventListener('extensionStatsUpdate', handleExtensionStats);

    return () => {
      window.removeEventListener('extensionStatsUpdate', handleExtensionStats);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Blocks className="w-8 h-8 text-terminal-green" />
        <div>
          <h1 className="text-2xl font-bold text-terminal-green mb-1">EXTENSION DASHBOARD</h1>
          <p className="text-terminal-muted text-sm">Live telemetry from the browser extension</p>
        </div>
      </div>

      <Card title="▸ EXTENSION CONTROL CENTER">
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-terminal-muted">
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-terminal-green" />
              <span>STATUS:</span>
              <span className={extensionConnected ? 'text-terminal-green' : 'text-terminal-amber'}>
                {extensionConnected ? 'CONNECTED' : 'NOT DETECTED'}
              </span>
            </div>
            {extensionStats.lastSync && (
              <div>
                LAST SYNC: {new Date(extensionStats.lastSync).toLocaleString()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-terminal-green p-4 text-center">
              <Blocks className="w-6 h-6 mx-auto mb-2 text-terminal-green" />
              <div className="text-2xl font-bold text-terminal-green text-shadow-terminal">
                {extensionStats.adsBlocked.toLocaleString()}
              </div>
              <div className="text-xs text-terminal-muted mt-1">ADS BLOCKED</div>
            </div>

            <div className="border border-terminal-green p-4 text-center">
              <Eye className="w-6 h-6 mx-auto mb-2 text-terminal-green" />
              <div className="text-2xl font-bold text-terminal-green text-shadow-terminal">
                {extensionStats.trackersBlocked.toLocaleString()}
              </div>
              <div className="text-xs text-terminal-muted mt-1">TRACKERS BLOCKED</div>
            </div>

            <div className="border border-terminal-green p-4 text-center">
              <Shield className="w-6 h-6 mx-auto mb-2 text-terminal-green" />
              <div className="text-2xl font-bold text-terminal-green text-shadow-terminal">
                {extensionStats.sitesScanned.toLocaleString()}
              </div>
              <div className="text-xs text-terminal-muted mt-1">SITES SCANNED</div>
            </div>

            <div className="border border-terminal-green p-4 text-center">
              <Activity className="w-6 h-6 mx-auto mb-2 text-terminal-green" />
              <div className="text-2xl font-bold text-terminal-green text-shadow-terminal">
                {extensionStats.passwordsSaved.toLocaleString()}
              </div>
              <div className="text-xs text-terminal-muted mt-1">PASSWORDS SAVED</div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <Button className="w-full md:w-auto">OPEN EXTENSION</Button>
            <Button className="w-full md:w-auto" variant="warning">SYNC WITH USB</Button>
          </div>
        </div>
      </Card>

      <Card title="▸ INSIGHTS">
        <div className="space-y-3 text-sm text-terminal-muted">
          <p>Use this dashboard to verify real-time protection and extension sync health.</p>
          <div className="border-l-2 border-terminal-green pl-3 space-y-1">
            <p className="text-terminal-green">• Live ad/tracker counters</p>
            <p className="text-terminal-green">• Password manager activity</p>
            <p className="text-terminal-green">• Sync timestamp status</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ExtensionDashboard;
