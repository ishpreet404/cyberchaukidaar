import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { Card, Input, Button, StatusBadge, Separator } from '../components';

const ScamAnalyzer = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock result
    const mockResult = {
      verdict: inputText.toLowerCase().includes('urgent') || inputText.toLowerCase().includes('verify') ? 'SCAM' : 'SAFE',
      confidence: Math.floor(Math.random() * 20) + 80,
      indicators: [
        { type: 'URGENCY_LANGUAGE', detected: inputText.toLowerCase().includes('urgent'), risk: 'HIGH' },
        { type: 'SUSPICIOUS_LINKS', detected: inputText.includes('http'), risk: 'MEDIUM' },
        { type: 'REQUEST_FOR_INFO', detected: inputText.toLowerCase().includes('password') || inputText.toLowerCase().includes('verify'), risk: 'HIGH' },
        { type: 'POOR_GRAMMAR', detected: false, risk: 'LOW' },
      ],
      recommendations: [
        'DO NOT click any links in this message',
        'DO NOT provide personal information',
        'Report this to your email provider',
        'Delete the message immediately',
      ]
    };

    setResult(mockResult);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shadow-terminal mb-2">
          $ SCAM_ANALYZER --MODE=ACTIVE
        </h1>
        <p className="text-terminal-muted">
          Paste suspicious emails, SMS messages, or URLs for analysis
        </p>
      </div>

      <Separator variant="equals" />

      {/* Input Section */}
      <Card title="▸ INPUT ANALYZER">
        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2 text-terminal-muted">
              PASTE CONTENT TO ANALYZE:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-48 bg-terminal-bg border border-terminal-green text-terminal-green p-4 font-mono text-sm focus:outline-none focus:border-terminal-green resize-none"
              placeholder="Paste email, SMS, or URL here..."
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={analyzeContent}
              disabled={!inputText || isAnalyzing}
              className="flex-1"
            >
              {isAnalyzing ? 'ANALYZING...' : 'SCAN FOR THREATS'}
            </Button>
            <Button 
              onClick={() => { setInputText(''); setResult(null); }}
              variant="danger"
            >
              CLEAR
            </Button>
          </div>
        </div>
      </Card>

      {/* Analysis in Progress */}
      {isAnalyzing && (
        <Card className="border-terminal-amber text-terminal-amber">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="cursor"></span>
              <span>RUNNING DEEP SCAN...</span>
            </div>
            <div className="text-xs space-y-1 text-terminal-muted">
              <div>[████████████████░░░░] CHECKING URL REPUTATION</div>
              <div>[██████████░░░░░░░░░░] ANALYZING LANGUAGE PATTERNS</div>
              <div>[███████████████░░░░░] SCANNING FOR KNOWN SCAMS</div>
            </div>
          </div>
        </Card>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <>
          <Separator variant="dash" />

          {/* Verdict */}
          <Card 
            title="▸ ANALYSIS RESULTS"
            className={result.verdict === 'SCAM' ? 'border-terminal-red' : 'border-terminal-green'}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {result.verdict === 'SCAM' ? (
                      <XCircle className="w-8 h-8 text-terminal-red" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-terminal-green" />
                    )}
                    <div>
                      <div className={`text-2xl font-bold ${result.verdict === 'SCAM' ? 'text-terminal-red' : 'text-terminal-green'}`}>
                        {result.verdict === 'SCAM' ? '[THREAT DETECTED]' : '[APPEARS SAFE]'}
                      </div>
                      <div className="text-sm text-terminal-muted">
                        CONFIDENCE: {result.confidence}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator variant="dots" />

              {/* Indicators */}
              <div>
                <h3 className="font-bold mb-3">THREAT INDICATORS:</h3>
                <div className="space-y-2">
                  {result.indicators.map((indicator, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-2 border border-terminal-green"
                    >
                      <div className="flex items-center gap-3">
                        {indicator.detected ? (
                          <XCircle className="w-4 h-4 text-terminal-red" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-terminal-green" />
                        )}
                        <span className="text-sm">{indicator.type}</span>
                      </div>
                      <StatusBadge status={indicator.detected ? 'error' : 'ok'}>
                        {indicator.detected ? 'DETECTED' : 'NOT FOUND'}
                      </StatusBadge>
                      <span className={`text-xs px-2 py-1 border ${
                        indicator.risk === 'HIGH' ? 'border-terminal-red text-terminal-red' :
                        indicator.risk === 'MEDIUM' ? 'border-terminal-amber text-terminal-amber' :
                        'border-terminal-green text-terminal-green'
                      }`}>
                        {indicator.risk}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              {result.verdict === 'SCAM' && (
                <div>
                  <h3 className="font-bold mb-3 text-terminal-red">RECOMMENDED ACTIONS:</h3>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-terminal-red mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Example Threats */}
      <Card title="▸ COMMON SCAM PATTERNS">
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            <div className="font-bold text-terminal-red">[URGENT] Account Verification Required</div>
            <div className="text-terminal-muted">Creates false urgency to make you act without thinking</div>
          </div>
          <Separator variant="dots" />
          <div className="space-y-1">
            <div className="font-bold text-terminal-red">You've won a prize! Click here to claim</div>
            <div className="text-terminal-muted">Unsolicited prizes are always scams</div>
          </div>
          <Separator variant="dots" />
          <div className="space-y-1">
            <div className="font-bold text-terminal-red">Suspicious login detected - verify your password</div>
            <div className="text-terminal-muted">Legitimate services never ask for passwords via email</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ScamAnalyzer;
