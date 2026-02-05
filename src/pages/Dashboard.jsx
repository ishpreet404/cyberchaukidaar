import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, Activity, Zap } from 'lucide-react';
import { Card, ProgressBar, Button, Separator, TypingText, ASCIIArt, StatusBadge } from '../components';

const Dashboard = () => {
  const [hygieneScore, setHygieneScore] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);

  useEffect(() => {
    // Animate score on load
    const timer = setTimeout(() => {
      setHygieneScore(87);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const recentThreats = [
    { id: 1, type: 'PHISHING', url: 'secure-login-verify.fake', status: 'blocked', time: '2m ago' },
    { id: 2, type: 'MALWARE', url: 'download-free-software.sus', status: 'blocked', time: '15m ago' },
    { id: 3, type: 'TRACKER', url: 'analytics-evil.net', status: 'blocked', time: '1h ago' },
    { id: 4, type: 'SCAM', url: 'amazon-prize-winner.fake', status: 'blocked', time: '2h ago' },
  ];

  const systemStats = [
    { label: 'THREATS_BLOCKED', value: '1,337', icon: Shield },
    { label: 'SCANS_RUN', value: '42,069', icon: Activity },
    { label: 'UPTIME', value: '99.9%', icon: TrendingUp },
    { label: 'RESPONSE_TIME', value: '<1ms', icon: Zap },
  ];

  return (
    <div className="space-y-6">
      {/* ASCII Art Header */}
      <div className="flex justify-center">
        <ASCIIArt variant="logo" />
      </div>

      {/* Welcome Message */}
      {showWelcome && (
        <Card className="bg-terminal-bg">
          <div className="space-y-2">
            <div className="text-terminal-green">
              <span className="text-terminal-green">root@CyberChaukidaar:~$ </span>
              <TypingText 
                text="INITIALIZING SECURITY PROTOCOL..."
                speed={30}
                onComplete={() => setTimeout(() => setShowWelcome(false), 2000)}
              />
            </div>
          </div>
        </Card>
      )}

      <Separator variant="equals" />

      {/* Cyber Hygiene Score */}
      <Card title="▸ CYBER HYGIENE SCORE">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-4xl font-bold text-shadow-terminal">
                {hygieneScore}/100
              </div>
              <StatusBadge status={hygieneScore > 80 ? 'ok' : 'warning'}>
                {hygieneScore > 80 ? 'EXCELLENT' : 'NEEDS IMPROVEMENT'}
              </StatusBadge>
            </div>
            <ASCIIArt variant="shield" />
          </div>
          
          <ProgressBar 
            value={hygieneScore} 
            max={100}
            variant={hygieneScore > 80 ? 'default' : 'warning'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="border border-terminal-green p-3">
              <div className="text-xs text-terminal-muted mb-2">PASSWORD_STRENGTH</div>
              <ProgressBar value={95} max={100} showPercentage={false} />
            </div>
            <div className="border border-terminal-green p-3">
              <div className="text-xs text-terminal-muted mb-2">2FA_ENABLED</div>
              <ProgressBar value={100} max={100} showPercentage={false} />
            </div>
            <div className="border border-terminal-green p-3">
              <div className="text-xs text-terminal-muted mb-2">BREACH_EXPOSURE</div>
              <ProgressBar value={20} max={100} showPercentage={false} variant="warning" />
            </div>
            <div className="border border-terminal-green p-3">
              <div className="text-xs text-terminal-muted mb-2">SAFE_BROWSING</div>
              <ProgressBar value={88} max={100} showPercentage={false} />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button>VIEW DETAILED REPORT</Button>
            <Button variant="warning">IMPROVE SCORE</Button>
          </div>
        </div>
      </Card>

      {/* System Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systemStats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="text-center">
            <div className="space-y-3">
              <Icon className="w-8 h-8 mx-auto text-terminal-green" />
              <div className="text-2xl font-bold text-shadow-terminal">{value}</div>
              <div className="text-xs text-terminal-muted">{label}</div>
            </div>
          </Card>
        ))}
      </div>

      <Separator variant="dash" />

      {/* Recent Threats */}
      <Card title="▸ REAL-TIME THREAT LOG">
        <div className="space-y-2 font-mono text-sm">
          {recentThreats.map((threat) => (
            <div 
              key={threat.id}
              className="flex items-center justify-between p-2 border-l-2 border-terminal-red hover:bg-terminal-bg hover:border-terminal-green transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <span className="text-terminal-red font-bold w-20">[{threat.type}]</span>
                <span className="text-terminal-muted flex-1 truncate">{threat.url}</span>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status="ok">{threat.status.toUpperCase()}</StatusBadge>
                <span className="text-terminal-muted text-xs w-16 text-right">{threat.time}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-terminal-green">
          <Button className="w-full">VIEW ALL THREATS</Button>
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="▸ QUICK ACTIONS">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="py-4">
            <div className="flex flex-col gap-2">
              <span>SCAN URL</span>
              <span className="text-xs text-terminal-muted">Check link safety</span>
            </div>
          </Button>
          <Button className="py-4">
            <div className="flex flex-col gap-2">
              <span>BREACH CHECK</span>
              <span className="text-xs text-terminal-muted">Search exposures</span>
            </div>
          </Button>
          <Button className="py-4">
            <div className="flex flex-col gap-2">
              <span>AI COACH</span>
              <span className="text-xs text-terminal-muted">Get guidance</span>
            </div>
          </Button>
        </div>
      </Card>

      {/* Terminal Tip */}
      <Card className="bg-terminal-bg border-terminal-amber text-terminal-amber">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
          <div className="space-y-2">
            <div className="font-bold">$ SECURITY TIP</div>
            <div className="text-sm">
              Enable 2FA on all critical accounts. It's the single most effective way to prevent account takeover.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
