import React, { useState } from 'react';
import { Database, Search, AlertTriangle, Eye, EyeOff, Mail } from 'lucide-react';
import { Card, Input, Button, StatusBadge, Separator } from '../components';

const BreachChecker = () => {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);

  const checkBreaches = async () => {
    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Mock results
    const mockResults = {
      email: email,
      breachCount: 3,
      breaches: [
        {
          name: 'LinkedIn',
          date: '2021-06-22',
          compromisedData: ['Email', 'Password', 'Name', 'Phone'],
          severity: 'HIGH',
          description: 'Data scraped from LinkedIn profiles'
        },
        {
          name: 'Adobe',
          date: '2013-10-04',
          compromisedData: ['Email', 'Password', 'Username'],
          severity: 'MEDIUM',
          description: 'Adobe breach affecting 153 million accounts'
        },
        {
          name: 'Dropbox',
          date: '2012-07-01',
          compromisedData: ['Email', 'Password'],
          severity: 'LOW',
          description: 'Old breach, affected passwords were hashed'
        },
      ],
      recommendations: [
        'Change passwords on all affected services immediately',
        'Enable 2FA on all affected accounts',
        'Use unique passwords for each service',
        'Monitor credit reports for suspicious activity',
        'Consider using a password manager',
      ]
    };

    setResults(mockResults);
    setIsSearching(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shadow-terminal mb-2">
          $ BREACH_CHECKER --SCAN=EMAIL
        </h1>
        <p className="text-terminal-muted">
          Check if your email has been exposed in known data breaches
        </p>
      </div>

      <Separator variant="equals" />

      {/* Search Section */}
      <Card title="▸ EMAIL EXPOSURE SCANNER">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 border border-terminal-amber text-terminal-amber">
            <Eye className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              Your email is never stored. Searches are encrypted and anonymous.
            </div>
          </div>

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            prompt="email>"
            className="text-lg"
          />

          <Button 
            onClick={checkBreaches}
            disabled={!email || isSearching}
            className="w-full"
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              {isSearching ? 'SCANNING DATABASES...' : 'CHECK FOR BREACHES'}
            </div>
          </Button>
        </div>
      </Card>

      {/* Scanning Progress */}
      {isSearching && (
        <Card className="border-terminal-amber text-terminal-amber">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 animate-pulse" />
              <span>QUERYING BREACH DATABASES...</span>
            </div>
            <div className="text-xs space-y-1 text-terminal-muted">
              <div>[████████████████████] CHECKING 15B+ RECORDS</div>
              <div>[█████████████████░░░] ANALYZING DARK WEB DATA</div>
              <div>[███████████████████░] CROSS-REFERENCING LEAKS</div>
            </div>
            <div className="text-xs">
              Searching through {(Math.random() * 5000 + 10000).toFixed(0)} known data breaches...
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {results && !isSearching && (
        <>
          <Separator variant="dash" />

          {/* Summary */}
          <Card 
            title="▸ BREACH REPORT"
            className={results.breachCount > 0 ? 'border-terminal-red' : 'border-terminal-green'}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {results.breachCount > 0 ? (
                  <AlertTriangle className="w-12 h-12 text-terminal-red" />
                ) : (
                  <Database className="w-12 h-12 text-terminal-green" />
                )}
                <div>
                  <div className={`text-3xl font-bold ${results.breachCount > 0 ? 'text-terminal-red' : 'text-terminal-green'}`}>
                    {results.breachCount > 0 ? `${results.breachCount} BREACHES FOUND` : 'NO BREACHES FOUND'}
                  </div>
                  <div className="text-terminal-muted">
                    for {results.email}
                  </div>
                </div>
              </div>

              {results.breachCount > 0 && (
                <div className="p-3 border border-terminal-red text-terminal-red">
                  <StatusBadge status="error">IMMEDIATE ACTION REQUIRED</StatusBadge>
                  <div className="mt-2 text-sm">
                    Your email has been exposed in {results.breachCount} data breach{results.breachCount > 1 ? 'es' : ''}. 
                    Follow the recommendations below to secure your accounts.
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Breach Details */}
          {results.breachCount > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">BREACH DETAILS:</h2>
              
              {results.breaches.map((breach, idx) => (
                <Card key={idx} className="border-terminal-red">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xl font-bold text-terminal-red">{breach.name}</div>
                        <div className="text-sm text-terminal-muted">
                          Breach Date: {breach.date}
                        </div>
                      </div>
                      <span className={`px-3 py-1 border text-xs ${
                        breach.severity === 'HIGH' ? 'border-terminal-red text-terminal-red' :
                        breach.severity === 'MEDIUM' ? 'border-terminal-amber text-terminal-amber' :
                        'border-terminal-green text-terminal-green'
                      }`}>
                        {breach.severity} RISK
                      </span>
                    </div>

                    <Separator variant="dots" />

                    <div>
                      <div className="text-sm font-bold mb-2">COMPROMISED DATA:</div>
                      <div className="flex flex-wrap gap-2">
                        {breach.compromisedData.map((data, i) => (
                          <span key={i} className="px-2 py-1 border border-terminal-red text-terminal-red text-xs">
                            {data}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-sm text-terminal-muted">
                      {breach.description}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {results.breachCount > 0 && (
            <Card title="▸ RECOMMENDED ACTIONS" className="border-terminal-amber text-terminal-amber">
              <div className="space-y-3">
                {results.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="text-terminal-green font-bold">{idx + 1}.</span>
                    <span className="text-terminal-green">{rec}</span>
                  </div>
                ))}

                <Separator variant="dots" />

                <div className="flex gap-2">
                  <Button className="flex-1">SECURE MY ACCOUNTS</Button>
                  <Button variant="warning">DOWNLOAD REPORT</Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Info Section */}
      <Card title="▸ HOW IT WORKS">
        <div className="space-y-4 text-sm">
          <div>
            <div className="font-bold mb-1">$ COMPREHENSIVE DATABASE</div>
            <div className="text-terminal-muted">
              We scan 15+ billion records from known data breaches, including dark web dumps and leaked databases.
            </div>
          </div>
          <Separator variant="dots" />
          <div>
            <div className="font-bold mb-1">$ PRIVACY FIRST</div>
            <div className="text-terminal-muted">
              Your email is hashed before searching. We never store or log your searches.
            </div>
          </div>
          <Separator variant="dots" />
          <div>
            <div className="font-bold mb-1">$ CONTINUOUS MONITORING</div>
            <div className="text-terminal-muted">
              Enable alerts to be notified immediately when your email appears in new breaches.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BreachChecker;
