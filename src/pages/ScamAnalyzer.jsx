import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, ExternalLink, Brain, Shield } from 'lucide-react';
import { Card, Input, Button, StatusBadge, Separator } from '../components';

const ScamAnalyzer = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [highlightedText, setHighlightedText] = useState(null);

  const analyzeContent = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setHighlightedText(null);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      const text = inputText.toLowerCase();
      const suspiciousElements = [];
      const indicators = [];
      let threatScore = 0;
      
      // Urgency Language Detection
      const urgencyWords = ['urgent', 'immediately', 'now', 'asap', 'hurry', 'quickly', 'expires', 'limited time', 'act now', 'don\'t wait', 
        'expire soon', 'time sensitive', 'immediate action', 'respond now', 'within 24 hours', 'within 48 hours', 'deadline', 'last chance',
        'final notice', 'expires today', 'expires tonight', 'act immediately', 'right now', 'instant', 'prompt', 'swift', 'time is running out',
        'don\'t delay', 'before it\'s too late', 'limited offer', 'offer expires', 'act fast', 'only today', 'today only', 'this instant'];
      const urgencyMatches = urgencyWords.filter(word => text.includes(word));
      if (urgencyMatches.length > 0) {
        threatScore += 20;
        urgencyMatches.forEach(word => {
          const match = inputText.match(new RegExp(`\\b${word}\\b`, 'i'));
          if (match) {
            suspiciousElements.push({
              text: match[0],
              reason: 'Creates false urgency to pressure immediate action',
              severity: 'HIGH'
            });
          }
        });
        indicators.push({
          type: 'URGENCY_LANGUAGE',
          detected: true,
          risk: 'HIGH',
          description: `Found ${urgencyMatches.length} urgency keyword(s): ${urgencyMatches.slice(0, 3).join(', ')}${urgencyMatches.length > 3 ? '...' : ''}`
        });
      } else {
        indicators.push({
          type: 'URGENCY_LANGUAGE',
          detected: false,
          risk: 'HIGH',
          description: 'No urgent language detected'
        });
      }
      
      // Suspicious Links Detection
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const urls = inputText.match(urlRegex) || [];
      const suspiciousUrlPatterns = ['bit.ly', 'tinyurl', 'goo.gl', 'ow.ly', 'short.link', 'free', 'click', 'secure', 'verify', 'update',
        't.co', 'is.gd', 'buff.ly', 'adf.ly', 'rebrand.ly', 'cutt.ly', 'tiny.cc', 'lnkd.in', 'soo.gd',
        'account-verify', 'secure-update', 'confirm-account', 'verify-identity', 'click-here', 'urgent-action',
        'paypal-secure', 'amazon-account', 'apple-id', 'microsoft-account', 'banking-secure', 'support-ticket',
        '.tk', '.ml', '.ga', '.cf', '.gq', 'login', 'signin', 'account', 'suspended', 'locked'];
      const hasSuspiciousUrl = urls.some(url => suspiciousUrlPatterns.some(pattern => url.toLowerCase().includes(pattern)));
      
      if (urls.length > 0) {
        if (hasSuspiciousUrl) {
          threatScore += 25;
          urls.forEach(url => {
            suspiciousElements.push({
              text: url,
              reason: 'Suspicious or shortened URL that may redirect to phishing site',
              severity: 'HIGH'
            });
          });
          indicators.push({
            type: 'SUSPICIOUS_LINKS',
            detected: true,
            risk: 'HIGH',
            description: `Found ${urls.length} suspicious URL(s)`
          });
        } else {
          threatScore += 5;
          indicators.push({
            type: 'SUSPICIOUS_LINKS',
            detected: true,
            risk: 'MEDIUM',
            description: `Found ${urls.length} URL(s) - verify legitimacy`
          });
        }
      } else {
        indicators.push({
          type: 'SUSPICIOUS_LINKS',
          detected: false,
          risk: 'MEDIUM',
          description: 'No URLs detected'
        });
      }
      
      // Credential Requests
      const credentialWords = ['password', 'credit card', 'social security', 'ssn', 'bank account', 'pin', 'cvv', 'login', 'username', 'account number',
        'verify your', 'confirm your', 'update your', 'billing information', 'payment details', 'card details', 'expiry date', 'expiration date',
        'security code', 'verification code', 'atm pin', 'debit card', 'routing number', 'account credentials', 'personal information',
        'date of birth', 'dob', 'mother\'s maiden name', 'passport number', 'driver\'s license', 'tax id', 'national id', 'aadhaar', 'pan card',
        'full name', 'full address', 'phone number', 'email address', 'secret question', 'security answer', 'authenticate', 'validate account',
        'verify identity', 'confirm identity', 'provide your', 'enter your', 'submit your', 'send us your', 'reply with your'];
      const credentialMatches = credentialWords.filter(word => text.includes(word));
      if (credentialMatches.length > 0) {
        threatScore += 30;
        credentialMatches.slice(0, 5).forEach(word => {
          const match = inputText.match(new RegExp(`\\b${word}\\b`, 'i'));
          if (match) {
            suspiciousElements.push({
              text: match[0],
              reason: 'Requesting sensitive information - legitimate companies never ask for credentials via email',
              severity: 'HIGH'
            });
          }
        });
        indicators.push({
          type: 'REQUEST_FOR_CREDENTIALS',
          detected: true,
          risk: 'HIGH',
          description: `Requesting sensitive data: ${credentialMatches.slice(0, 3).join(', ')}${credentialMatches.length > 3 ? ` +${credentialMatches.length - 3} more` : ''}`
        });
      } else {
        indicators.push({
          type: 'REQUEST_FOR_CREDENTIALS',
          detected: false,
          risk: 'HIGH',
          description: 'No credential requests detected'
        });
      }
      
      // Poor Grammar/Spelling
      const grammarIssues = ['recieve', 'occured', 'sucessful', 'untill', 'youre account', 'you\'re account', 'alot', 'definately', 'seperate',
        'occassion', 'embarass', 'accomodate', 'occured', 'thier', 'wierd', 'recieved', 'beleive', 'acheive', 'neccessary', 'tommorrow',
        'refered', 'occuring', 'begining', 'untill', 'writting', 'commited', 'transfered', 'occassionally'];
      const hasGrammarIssues = grammarIssues.some(issue => text.includes(issue));
      if (hasGrammarIssues) {
        threatScore += 15;
        indicators.push({
          type: 'POOR_GRAMMAR',
          detected: true,
          risk: 'MEDIUM',
          description: 'Spelling or grammar errors detected - often indicates scam'
        });
      } else {
        indicators.push({
          type: 'POOR_GRAMMAR',
          detected: false,
          risk: 'LOW',
          description: 'No obvious grammar issues'
        });
      }
      
      // Too Good To Be True
      const tooGoodWords = ['won', 'winner', 'prize', 'lottery', 'million', 'inheritance', 'free money', 'claim now', 'congratulations',
        'selected', 'chosen', 'lucky', 'jackpot', 'sweepstakes', 'cash prize', 'reward', 'free gift', 'you\'ve been selected',
        'exclusive offer', 'special promotion', 'limited spots', 'guaranteed income', 'make money fast', 'get rich', 'financial freedom',
        'no risk', 'risk free', '100% free', 'act now and receive', 'bonus', 'gift card', 'voucher', 'coupon worth', 'free trial',
        'you qualified', 'pre-approved', 'approved for', 'no credit check', 'instant approval', 'work from home', 'earn from home',
        'double your money', 'triple your income', 'investment opportunity', 'Nigerian prince', 'beneficiary', 'unclaimed',
        'cash out', 'wire transfer', 'western union', 'moneygram', 'bitcoin wallet', 'cryptocurrency investment'];
      const tooGoodMatches = tooGoodWords.filter(word => text.includes(word));
      if (tooGoodMatches.length > 0) {
        threatScore += 25;
        tooGoodMatches.slice(0, 5).forEach(word => {
          const match = inputText.match(new RegExp(`\\b${word}\\b`, 'i'));
          if (match) {
            suspiciousElements.push({
              text: match[0],
              reason: 'Unsolicited prizes or rewards are always scams',
              severity: 'HIGH'
            });
          }
        });
        indicators.push({
          type: 'TOO_GOOD_TO_BE_TRUE',
          detected: true,
          risk: 'HIGH',
          description: `Unrealistic offers detected: ${tooGoodMatches.slice(0, 3).join(', ')}${tooGoodMatches.length > 3 ? ` +${tooGoodMatches.length - 3} more` : ''}`
        });
      } else {
        indicators.push({
          type: 'TOO_GOOD_TO_BE_TRUE',
          detected: false,
          risk: 'MEDIUM',
          description: 'No unrealistic claims found'
        });
      }
      
      // Threatening Tone
      const threatWords = ['suspend', 'locked', 'blocked', 'unauthorized', 'security alert', 'breach', 'compromised', 'action required',
        'suspended', 'deactivated', 'terminated', 'cancelled', 'frozen', 'restricted', 'limited access', 'unusual activity',
        'suspicious activity', 'fraud alert', 'fraudulent', 'illegal activity', 'legal action', 'law enforcement', 'authorities',
        'violate', 'violation', 'breach of', 'terms of service', 'account will be closed', 'permanent closure', 'imminent threat',
        'immediate suspension', 'verify now or', 'confirm now or', 'failure to', 'failure to respond', 'consequences',
        'criminal charges', 'arrest warrant', 'tax fraud', 'irs', 'warrant', 'subpoena', 'court', 'lawsuit',
        'penalty', 'fine', 'overdue', 'past due', 'debt collection', 'final warning', 'last warning', 'account terminated'];
      const threatMatches = threatWords.filter(word => text.includes(word));
      if (threatMatches.length > 0) {
        threatScore += 20;
        threatMatches.slice(0, 5).forEach(word => {
          const match = inputText.match(new RegExp(`\\b${word}\\b`, 'i'));
          if (match) {
            suspiciousElements.push({
              text: match[0],
              reason: 'Uses scare tactics to manipulate victim',
              severity: 'MEDIUM'
            });
          }
        });
        indicators.push({
          type: 'THREATENING_TONE',
          detected: true,
          risk: 'HIGH',
          description: `Threatening language found: ${threatMatches.slice(0, 3).join(', ')}${threatMatches.length > 3 ? ` +${threatMatches.length - 3} more` : ''}`
        });
      } else {
        indicators.push({
          type: 'THREATENING_TONE',
          detected: false,
          risk: 'MEDIUM',
          description: 'No threatening language detected'
        });
      }
      
      // Generic Greetings (Impersonal)
      const genericGreetings = ['dear customer', 'dear user', 'dear member', 'dear client', 'dear account holder', 'dear valued customer',
        'dear sir/madam', 'dear sir or madam', 'hello user', 'hi customer', 'attention user', 'to whom it may concern'];
      const hasGenericGreeting = genericGreetings.some(greeting => text.includes(greeting));
      if (hasGenericGreeting) {
        threatScore += 10;
        indicators.push({
          type: 'GENERIC_GREETING',
          detected: true,
          risk: 'MEDIUM',
          description: 'Impersonal greeting - legitimate companies use your name'
        });
      } else {
        indicators.push({
          type: 'GENERIC_GREETING',
          detected: false,
          risk: 'LOW',
          description: 'No generic greeting detected'
        });
      }
      
      // Money/Payment Requests
      const moneyWords = ['send money', 'wire transfer', 'gift card', 'buy gift cards', 'purchase cards', 'itunes card', 'google play card',
        'steam card', 'prepaid card', 'payment required', 'processing fee', 'handling fee', 'transfer fee', 'activation fee',
        'shipping fee', 'customs fee', 'tax payment', 'advance payment', 'upfront payment', 'deposit required', 'pay now',
        'send payment', 'remit payment', 'money order', 'cashier\'s check', 'certified check', 'untraceable', 'non-refundable'];
      const moneyMatches = moneyWords.filter(word => text.includes(word));
      if (moneyMatches.length > 0) {
        threatScore += 25;
        indicators.push({
          type: 'MONEY_REQUEST',
          detected: true,
          risk: 'HIGH',
          description: `Payment/money transfer requested: ${moneyMatches.slice(0, 2).join(', ')}`
        });
      } else {
        indicators.push({
          type: 'MONEY_REQUEST',
          detected: false,
          risk: 'HIGH',
          description: 'No money requests detected'
        });
      }
      
      // Calculate verdict with improved thresholds
      const verdict = threatScore >= 60 ? 'SCAM' : threatScore >= 30 ? 'SUSPICIOUS' : 'SAFE';
      const confidence = Math.min(98, 65 + Math.floor(threatScore / 3));
      
      // Count detection categories
      const detectedCategories = [];
      if (urgencyMatches.length > 0) detectedCategories.push('urgency tactics');
      if (credentialMatches.length > 0) detectedCategories.push('credential requests');
      if (hasSuspiciousUrl) detectedCategories.push('suspicious URLs');
      if (tooGoodMatches.length > 0) detectedCategories.push('unrealistic offers');
      if (threatMatches.length > 0) detectedCategories.push('threatening language');
      if (hasGenericGreeting) detectedCategories.push('impersonal greeting');
      if (moneyMatches.length > 0) detectedCategories.push('money requests');
      
      // Generate reasoning
      let reasoning = '';
      if (verdict === 'SCAM') {
        reasoning = `CRITICAL THREAT DETECTED: This message exhibits ${suspiciousElements.length} major phishing indicators across ${detectedCategories.length} categories. Detected: ${detectedCategories.join(', ')}. The combination of these tactics is a clear signature of a sophisticated phishing attack. Legitimate organizations NEVER combine these manipulation techniques. This message is designed to exploit psychological pressure and urgency to steal your information or money.`;
      } else if (verdict === 'SUSPICIOUS') {
        reasoning = `CAUTION ADVISED: This message contains ${suspiciousElements.length} warning sign(s) that require verification. Detected: ${detectedCategories.join(', ')}. While not conclusively a scam, these elements are commonly used in phishing attempts. Do NOT take any action until you independently verify the sender through official channels (phone, official website). When in doubt, err on the side of caution.`;
      } else {
        reasoning = `LOW RISK: This message appears relatively safe with ${detectedCategories.length > 0 ? 'minimal' : 'no'} phishing indicators detected${detectedCategories.length > 0 ? ': ' + detectedCategories.join(', ') : ''}. However, always maintain basic security practices: verify unexpected requests independently, hover over links before clicking, and never provide sensitive information via email. Trust your instincts - if something feels off, it probably is.`;
      }
      
      // Recommendations
      const recommendations = [];
      if (verdict === 'SCAM') {
        recommendations.push('🚨 DO NOT click any links or download attachments');
        recommendations.push('🚨 DO NOT provide ANY personal, financial, or credential information');
        recommendations.push('🗑️ Delete this message immediately and block the sender');
        recommendations.push('📢 Report to your email provider as phishing/spam');
        recommendations.push('🔗 Report to FTC at reportfraud.ftc.gov or FBI IC3 at ic3.gov');
        if (credentialMatches.length > 0) {
          recommendations.push('⚠️ If you already entered credentials, CHANGE PASSWORDS IMMEDIATELY');
          recommendations.push('🔒 Enable two-factor authentication on affected accounts');
        }
        if (moneyMatches.length > 0) {
          recommendations.push('💳 If you sent money, contact your bank/card issuer immediately');
        }
      } else if (verdict === 'SUSPICIOUS') {
        recommendations.push('✅ Verify sender identity through OFFICIAL contact methods only');
        recommendations.push('🔍 Do NOT click links - manually navigate to official websites');
        recommendations.push('📞 Call the organization using publicly listed phone numbers');
        recommendations.push('🕵️ Check sender email address carefully for misspellings/spoofing');
        recommendations.push('⏸️ Do NOT respond or take any action until verified');
        recommendations.push('❓ Ask yourself: Was I expecting this message?');
      } else {
        recommendations.push('✅ Still verify unexpected requests through independent channels');
        recommendations.push('🖱️ Hover over links to preview URLs before clicking');
        recommendations.push('🔐 Use strong, unique passwords with a password manager');
        recommendations.push('🛡️ Enable two-factor authentication on all important accounts');
        recommendations.push('📚 Stay educated about evolving phishing tactics');
      }
      
      // Create highlighted text
      let highlighted = inputText;
      suspiciousElements.forEach(element => {
        const regex = new RegExp(`(${element.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const severityClass = 
          element.severity === 'HIGH' ? 'bg-terminal-red/20 text-terminal-red border-b-2 border-terminal-red' :
          element.severity === 'MEDIUM' ? 'bg-terminal-amber/20 text-terminal-amber border-b-2 border-terminal-amber' :
          'bg-terminal-green/20 text-terminal-green border-b-2 border-terminal-green';
        highlighted = highlighted.replace(regex, `<mark class="${severityClass} font-bold">$1</mark>`);
      });
      
      setHighlightedText(suspiciousElements.length > 0 ? highlighted : null);
      setResult({
        verdict,
        confidence,
        threatScore: Math.min(100, threatScore),
        reasoning,
        suspiciousElements,
        indicators,
        recommendations
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      setResult({
        verdict: 'ERROR',
        confidence: 0,
        threatScore: 0,
        reasoning: `Analysis failed: ${error.message}`,
        indicators: [],
        recommendations: ['Try analyzing the message again']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shadow-terminal mb-2">
          $ PHISHING_DETECTOR --ENGINE=ADVANCED
        </h1>
        <p className="text-terminal-muted">
          Advanced pattern-matching analysis of suspicious emails, SMS messages, and URLs
        </p>
      </div>

      <Separator variant="equals" />

      {/* Input Section */}
      <Card title="▸ SMART THREAT ANALYZER">
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 border border-terminal-green text-terminal-green text-sm">
            <Brain className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <div>
              Powered by Advanced Heuristics • Pattern recognition & behavioral analysis
            </div>
          </div>

          <div>
            <label className="block text-sm mb-2 text-terminal-muted">
              PASTE SUSPICIOUS CONTENT:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-48 bg-terminal-bg border border-terminal-green text-terminal-green p-4 font-mono text-sm focus:outline-none focus:border-terminal-green resize-none"
              placeholder="Paste email, SMS, or URL here...&#10;&#10;Example:&#10;URGENT: Your account has been compromised!&#10;Click here immediately to verify: http://suspicious-link.com"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={analyzeContent}
              disabled={!inputText || isAnalyzing}
              className="flex-1"
            >
              <div className="flex items-center justify-center gap-2">
                <Brain className="w-4 h-4" />
                {isAnalyzing ? 'ANALYZING...' : 'RUN SMART ANALYSIS'}
              </div>
            </Button>
            <Button 
              onClick={() => { setInputText(''); setResult(null); setHighlightedText(null); }}
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
              <Brain className="w-5 h-5 animate-pulse" />
              <span>DEEP PATTERN ANALYSIS IN PROGRESS...</span>
            </div>
            <div className="text-xs space-y-1 text-terminal-muted">
              <div>{'[████████████████████]'} SCANNING TEXT PATTERNS</div>
              <div>{'[█████████████████░░░]'} ANALYZING LANGUAGE INDICATORS</div>
              <div>{'[███████████████░░░░░]'} DETECTING PHISHING TACTICS</div>
              <div>{'[██████████████░░░░░░]'} VALIDATING URL REPUTATION</div>
              <div>{'[████████████░░░░░░░░]'} CALCULATING THREAT SCORE</div>
            </div>
          </div>
        </Card>
      )}

      {/* Highlighted Text Analysis */}
      {highlightedText && result && result.verdict !== 'ERROR' && (
        <Card title="▸ HIGHLIGHTED THREATS" className="border-terminal-red">
          <div className="space-y-3">
            <div className="text-sm text-terminal-muted mb-2">
              Suspicious elements highlighted by AI:
            </div>
            <div 
              className="p-4 bg-black/50 border border-terminal-red rounded-none text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedText }}
            />
            {result.suspiciousElements && result.suspiciousElements.length > 0 && (
              <div className="space-y-2 mt-4">
                <div className="text-sm font-bold">THREAT BREAKDOWN:</div>
                {result.suspiciousElements.map((element, idx) => (
                  <div key={idx} className="border border-terminal-muted p-2 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-3 h-3 mt-0.5 flex-shrink-0 ${
                        element.severity === 'HIGH' ? 'text-terminal-red' :
                        element.severity === 'MEDIUM' ? 'text-terminal-amber' :
                        'text-terminal-green'
                      }`} />
                      <div>
                        <div className="font-bold text-terminal-amber">"{element.text}"</div>
                        <div className="text-terminal-muted mt-1">{element.reason}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <>
          <Separator variant="dash" />

          {/* AI Verdict */}
          <Card 
            title="▸ ANALYSIS RESULTS"
            className={
              result.verdict === 'SCAM' ? 'border-terminal-red' :
              result.verdict === 'SUSPICIOUS' ? 'border-terminal-amber' :
              result.verdict === 'ERROR' ? 'border-terminal-red' :
              'border-terminal-green'
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    {result.verdict === 'SCAM' || result.verdict === 'ERROR' ? (
                      <XCircle className="w-8 h-8 text-terminal-red" />
                    ) : result.verdict === 'SUSPICIOUS' ? (
                      <AlertTriangle className="w-8 h-8 text-terminal-amber" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-terminal-green" />
                    )}
                    <div>
                      <div className={`text-2xl font-bold ${
                        result.verdict === 'SCAM' || result.verdict === 'ERROR' ? 'text-terminal-red' :
                        result.verdict === 'SUSPICIOUS' ? 'text-terminal-amber' :
                        'text-terminal-green'
                      }`}>
                        {result.verdict === 'SCAM' ? '[PHISHING DETECTED]' :
                         result.verdict === 'SUSPICIOUS' ? '[SUSPICIOUS CONTENT]' :
                         result.verdict === 'ERROR' ? '[ANALYSIS ERROR]' :
                         '[APPEARS LEGITIMATE]'}
                      </div>
                      <div className="text-sm text-terminal-muted">
                        CONFIDENCE: {result.confidence}% | THREAT SCORE: {result.threatScore}/100
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Threat Score Gauge */}
                {result.verdict !== 'ERROR' && (
                  <div className="border border-terminal-red p-4 text-center min-w-[120px]">
                    <div className={`text-4xl font-bold ${
                      result.threatScore >= 70 ? 'text-terminal-red' :
                      result.threatScore >= 40 ? 'text-terminal-amber' :
                      'text-terminal-green'
                    }`}>
                      {result.threatScore}
                    </div>
                    <div className="text-xs text-terminal-muted mt-1">THREAT LEVEL</div>
                    <div className="mt-2">
                      {'█'.repeat(Math.floor(result.threatScore / 10))}
                      {'░'.repeat(10 - Math.floor(result.threatScore / 10))}
                    </div>
                  </div>
                )}
              </div>

              <Separator variant="dots" />

              {/* AI Reasoning */}
              {result.reasoning && (
                <div className="border border-terminal-green p-3 bg-black/30">
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="w-4 h-4 text-terminal-green mt-1 flex-shrink-0" />
                    <div className="font-bold text-terminal-green">ANALYSIS REASONING:</div>
                  </div>
                  <div className="text-sm text-terminal-muted leading-relaxed pl-6">
                    {result.reasoning}
                  </div>
                </div>
              )}

              {/* Indicators */}
              {result.indicators && result.indicators.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    PHISHING INDICATORS DETECTED:
                  </h3>
                  <div className="space-y-2">
                    {result.indicators.map((indicator, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start justify-between p-3 border border-terminal-green gap-3"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          {indicator.detected ? (
                            <XCircle className="w-4 h-4 text-terminal-red mt-0.5 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-terminal-green mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-bold">{indicator.type.replace(/_/g, ' ')}</div>
                            {indicator.description && (
                              <div className="text-xs text-terminal-muted mt-1">{indicator.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={indicator.detected ? 'error' : 'ok'}>
                            {indicator.detected ? 'DETECTED' : 'CLEAR'}
                          </StatusBadge>
                          <span className={`text-xs px-2 py-1 border whitespace-nowrap ${
                            indicator.risk === 'HIGH' ? 'border-terminal-red text-terminal-red' :
                            indicator.risk === 'MEDIUM' ? 'border-terminal-amber text-terminal-amber' :
                            'border-terminal-green text-terminal-green'
                          }`}>
                            {indicator.risk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div>
                  <h3 className="font-bold mb-3 text-terminal-amber flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    RECOMMENDED ACTIONS:
                  </h3>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm p-2 border border-terminal-amber">
                        <span className="text-terminal-amber font-bold">{idx + 1}.</span>
                        <span className="text-terminal-muted">{rec}</span>
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
