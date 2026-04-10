import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, TrendingUp, Activity, Zap, Blocks, Eye, RadioTower } from 'lucide-react';
import { Card, ProgressBar, Button, Separator, TypingText, ASCIIArt, StatusBadge } from '../components';

const Dashboard = () => {
  const navigate = useNavigate();
  const [hygieneScore, setHygieneScore] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [extensionStats, setExtensionStats] = useState({
    adsBlocked: 0,
    trackersBlocked: 0,
    sitesScanned: 0,
    passwordsSaved: 0,
    lastSync: null
  });
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deauthSummary, setDeauthSummary] = useState({
    online: false,
    monitorStatus: 'idle',
    alertCount: 0,
    lastEvent: null,
    profile: null,
    configuredThresholdDeauth: null,
    configuredThresholdDisassoc: null,
    adaptiveThresholds: null,
  });

  useEffect(() => {
    // Listen for extension stats updates
    const handleExtensionStats = (event) => {
      console.log('Extension stats received:', event.detail);
      setExtensionStats(event.detail);
      setExtensionConnected(true);
    };
    
    window.addEventListener('extensionStatsUpdate', handleExtensionStats);
    
    return () => {
      window.removeEventListener('extensionStatsUpdate', handleExtensionStats);
    };
  }, []);

  useEffect(() => {
    // Compute hygiene score from extension stats
    if (!extensionConnected) {
      setHygieneScore(0);
      return;
    }

    const { adsBlocked, trackersBlocked, sitesScanned, passwordsSaved } = extensionStats;

    const adsScore = Math.min(20, Math.floor(adsBlocked / 10));
    const trackersScore = Math.min(20, Math.floor(trackersBlocked / 10));
    const sitesScore = Math.min(30, Math.floor(sitesScanned / 5));
    const passwordsScore = Math.min(30, passwordsSaved * 6);

    const base = adsScore + trackersScore + sitesScore + passwordsScore;
    const total = Math.max(0, Math.min(100, base + 50));
    setHygieneScore(total);
  }, [extensionConnected, extensionStats]);

  useEffect(() => {
    const fetchDeauth = async () => {
      try {
        const response = await fetch('http://localhost:8787/api/deauth/events', { cache: 'no-store' });
        if (!response.ok) throw new Error('Failed to load deauth events');
        const data = await response.json();
        const list = Array.isArray(data.events) ? data.events : [];
        setDeauthSummary({
          online: true,
          monitorStatus: data.monitorStatus || (list.length > 0 ? 'active' : 'idle'),
          alertCount: list.length,
          lastEvent: list[0] || null,
          profile: data.profile || null,
          configuredThresholdDeauth: data.configuredThresholdDeauth ?? null,
          configuredThresholdDisassoc: data.configuredThresholdDisassoc ?? null,
          adaptiveThresholds: data.adaptiveThresholds ?? null,
        });
      } catch {
        setDeauthSummary((prev) => ({
          ...prev,
          online: false,
        }));
      }
    };

    fetchDeauth();
    const interval = setInterval(fetchDeauth, 10000);
    return () => clearInterval(interval);
  }, []);

  const passwordStrengthScore = Math.min(100, extensionStats.passwordsSaved * 20);
  const safeBrowsingScore = Math.min(100, Math.floor(extensionStats.sitesScanned / 2));
  const breachExposureScore = 100 - Math.min(100, Math.floor(extensionStats.trackersBlocked / 2));

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

      {/* Extension Stats Card */}
      {extensionConnected && (
        <Card title="▸ BROWSER EXTENSION PROTECTION">
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
          
          <div className="mt-4 pt-4 border-t border-terminal-green flex items-center justify-between">
            <div className="text-xs text-terminal-muted">
              Extension Status: <span className="text-terminal-green">● ACTIVE</span>
            </div>
            {extensionStats.lastSync && (
              <div className="text-xs text-terminal-muted">
                Last Sync: {new Date(extensionStats.lastSync).toLocaleString()}
              </div>
            )}
          </div>
        </Card>
      )}

      {!extensionConnected && (
        <Card title="▸ BROWSER EXTENSION" className="border-terminal-amber">
          <div className="flex items-center gap-3 text-terminal-amber">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <div className="font-bold mb-1">Extension Not Detected</div>
              <div className="text-sm text-terminal-muted">
                Install the Cyber Chaukidaar extension to enable real-time site protection, 
                ad blocking, tracker blocking, and password management across all websites.
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card title="▸ WIFI DEAUTH GUARD">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <RadioTower className="w-5 h-5 text-terminal-green" />
              <span className="text-terminal-muted">SENSOR STATUS:</span>
              <span className={deauthSummary.online ? 'text-terminal-green' : 'text-terminal-amber'}>
                {deauthSummary.online ? deauthSummary.monitorStatus.toUpperCase() : 'OFFLINE'}
              </span>
            </div>
            <StatusBadge status={deauthSummary.alertCount > 0 ? 'warning' : 'ok'}>
              {deauthSummary.alertCount} ALERTS
            </StatusBadge>
          </div>

          <div className="text-sm text-terminal-muted border border-terminal-green p-3">
            {deauthSummary.lastEvent ? (
              <>
                <div className="text-terminal-green font-bold mb-1">Latest Incident</div>
                <div>{deauthSummary.lastEvent.message}</div>
                <div className="mt-2 text-xs">
                  BSSID: {deauthSummary.lastEvent.bssidMasked || 'unknown'} | deauth={deauthSummary.lastEvent.deauthCount || 0} | disassoc={deauthSummary.lastEvent.disassocCount || 0}
                </div>
                <div className="mt-1 text-xs">
                  profile={String(deauthSummary.profile || 'unknown').toUpperCase()} | cfg={deauthSummary.configuredThresholdDeauth ?? 'n/a'}/{deauthSummary.configuredThresholdDisassoc ?? 'n/a'} | adaptive={deauthSummary.adaptiveThresholds === null ? 'n/a' : deauthSummary.adaptiveThresholds ? 'ON' : 'OFF'}
                </div>
              </>
            ) : (
              <div>No deauth incidents reported yet.</div>
            )}
          </div>

          <Button onClick={() => navigate('/deauth-guard')}>OPEN DEAUTH GUARD</Button>
        </div>
      </Card>

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
              <ProgressBar value={passwordStrengthScore} max={100} showPercentage={false} />
            </div>
            <div className="border border-terminal-green p-3">
              <div className="text-xs text-terminal-muted mb-2">2FA_ENABLED</div>
              <ProgressBar value={100} max={100} showPercentage={false} />
            </div>
            <div className="border border-terminal-green p-3">
              <div className="text-xs text-terminal-muted mb-2">BREACH_EXPOSURE</div>
              <ProgressBar value={breachExposureScore} max={100} showPercentage={false} variant="warning" />
            </div>
            <div className="border border-terminal-green p-3">
              <div className="text-xs text-terminal-muted mb-2">SAFE_BROWSING</div>
              <ProgressBar value={safeBrowsingScore} max={100} showPercentage={false} />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={() => navigate('/breach-checker')}>VIEW DETAILED REPORT</Button>
            <Button
              variant="warning"
              onClick={() => {
                if (!extensionConnected) setShowInstallPrompt(true);
              }}
            >
              IMPROVE SCORE
            </Button>
          </div>
        </div>
      </Card>

      {showInstallPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="border border-terminal-green bg-terminal-bg p-6 max-w-md w-full">
            <div className="text-terminal-green font-bold mb-2">INSTALL EXTENSION</div>
            <div className="text-terminal-muted text-sm mb-4">
              Install the Cyber Chaukidaar browser extension to boost your hygiene score by 50 and enable real-time protection.
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/setup')}>INSTALL NOW</Button>
              <Button variant="warning" onClick={() => setShowInstallPrompt(false)}>CLOSE</Button>
            </div>
          </div>
        </div>
      )}

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
          <Button className="py-4" onClick={() => navigate('/vault')}>
            <div className="flex flex-col gap-2">
              <span>VAULT</span>
              <span className="text-xs text-terminal-muted">Open USB Vault</span>
            </div>
          </Button>
          <Button className="py-4" onClick={() => navigate('/breach-checker')}>
            <div className="flex flex-col gap-2">
              <span>BREACH CHECK</span>
              <span className="text-xs text-terminal-muted">Search exposures</span>
            </div>
          </Button>
          <Button className="py-4" onClick={() => navigate('/ai-coach')}>
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
