import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { Card, Input, Button, Separator } from '../components';

const AICoach = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'CYBERGUARD AI COACH INITIALIZED.\n\nI can help you with:\n- Security best practices\n- Threat assessment\n- Password management\n- Phishing identification\n- Account recovery\n\nType your question below...'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickQuestions = [
    'How do I spot a phishing email?',
    'What makes a strong password?',
    'Should I use a password manager?',
    'How to enable 2FA?',
  ];

  const sendMessage = async (text) => {
    const userMessage = text || inputMessage;
    if (!userMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI response based on question
    let aiResponse = '';
    const lowerQuestion = userMessage.toLowerCase();

    if (lowerQuestion.includes('phishing')) {
      aiResponse = `ANALYZING QUERY: "phishing detection"\n\n[RESPONSE]\n\nKey indicators of phishing emails:\n\n1. SENDER ADDRESS\n   - Check for subtle misspellings (paypa1.com vs paypal.com)\n   - Verify sender domain matches official company\n\n2. URGENCY & THREATS\n   - "Your account will be closed"\n   - "Unusual activity detected"\n   - Creates false sense of urgency\n\n3. REQUESTS FOR CREDENTIALS\n   - Legitimate companies never ask for passwords via email\n   - Beware of "verify your account" links\n\n4. SUSPICIOUS LINKS\n   - Hover over links to see actual destination\n   - Look for HTTPS and correct domain\n\n[TIP] When in doubt, go directly to the website by typing the URL yourself. Never click links in suspicious emails.`;
    } else if (lowerQuestion.includes('password')) {
      aiResponse = `ANALYZING QUERY: "password security"\n\n[RESPONSE]\n\nStrong password requirements:\n\n✓ MINIMUM 12 CHARACTERS\n✓ MIX OF UPPERCASE & LOWERCASE\n✓ INCLUDE NUMBERS & SYMBOLS\n✓ AVOID DICTIONARY WORDS\n✓ UNIQUE PER ACCOUNT\n\n[BEST PRACTICE]\nUse a password manager to:\n- Generate strong random passwords\n- Store them securely\n- Auto-fill on trusted sites\n- Never reuse passwords\n\nRecommended: Bitwarden, 1Password, KeePass\n\n[SECURITY TIP]\nEnable 2FA everywhere possible. Even if your password is compromised, 2FA provides a second layer of defense.`;
    } else if (lowerQuestion.includes('2fa') || lowerQuestion.includes('two factor')) {
      aiResponse = `ANALYZING QUERY: "two-factor authentication"\n\n[RESPONSE]\n\n2FA adds a second verification step beyond your password:\n\n[TYPES OF 2FA]\n1. AUTHENTICATOR APPS (BEST)\n   - Google Authenticator, Authy, Microsoft Authenticator\n   - Generates time-based codes\n   - Works offline\n\n2. SMS CODES (ACCEPTABLE)\n   - Sent to your phone\n   - Vulnerable to SIM swapping\n\n3. HARDWARE KEYS (MOST SECURE)\n   - YubiKey, Titan Security Key\n   - Physical device required\n\n[HOW TO ENABLE]\n1. Go to account security settings\n2. Find "Two-Factor Authentication" or "2FA"\n3. Choose authenticator app method\n4. Scan QR code with app\n5. Save backup codes in secure location\n\n[CRITICAL] Always save backup codes! Store them in your vault or password manager.`;
    } else {
      aiResponse = `PROCESSING QUERY...\n\n[RESPONSE]\n\n${userMessage}\n\nI can provide detailed guidance on cybersecurity topics. Try asking about:\n\n- Phishing detection\n- Password security\n- Two-factor authentication\n- Safe browsing practices\n- Data breach response\n- Account security\n\nWhat would you like to know more about?`;
    }

    setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    setIsTyping(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shadow-terminal mb-2">
          $ AI_COACH --MODE=INTERACTIVE
        </h1>
        <p className="text-terminal-muted">
          Get personalized cybersecurity guidance from our AI assistant
        </p>
      </div>

      <Separator variant="equals" />

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chat */}
        <Card title="▸ CHAT SESSION" className="lg:col-span-2">
          <div className="space-y-4">
            {/* Messages */}
            <div className="h-[500px] overflow-y-auto space-y-4 p-4 border border-terminal-green bg-black">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <Bot className="w-6 h-6 text-terminal-green flex-shrink-0" />
                  )}
                  <div
                    className={`max-w-[80%] p-3 border whitespace-pre-wrap ${
                      message.role === 'user'
                        ? 'border-terminal-amber bg-terminal-bg text-terminal-amber'
                        : 'border-terminal-green bg-terminal-bg'
                    }`}
                  >
                    <div className="text-sm font-mono">{message.content}</div>
                  </div>
                  {message.role === 'user' && (
                    <User className="w-6 h-6 text-terminal-amber flex-shrink-0" />
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3">
                  <Bot className="w-6 h-6 text-terminal-green" />
                  <div className="p-3 border border-terminal-green">
                    <span className="animate-pulse">PROCESSING</span>
                    <span className="cursor"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your question..."
                className="flex-1 bg-terminal-bg border border-terminal-green text-terminal-green p-3 font-mono focus:outline-none"
                disabled={isTyping}
              />
              <Button 
                onClick={() => sendMessage()}
                disabled={!inputMessage.trim() || isTyping}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Questions */}
          <Card title="▸ QUICK TOPICS">
            <div className="space-y-2">
              {quickQuestions.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(question)}
                  className="w-full text-left p-2 border border-terminal-green text-sm hover:bg-terminal-green hover:text-terminal-bg transition-all"
                  disabled={isTyping}
                >
                  {question}
                </button>
              ))}
            </div>
          </Card>

          {/* Stats */}
          <Card title="▸ SESSION INFO">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-terminal-muted">MESSAGES:</span>
                <span className="text-terminal-green">{messages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">STATUS:</span>
                <span className="text-terminal-green">[ACTIVE]</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">MODEL:</span>
                <span className="text-terminal-green">GPT-4</span>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <Card className="border-terminal-amber text-terminal-amber">
            <div className="space-y-2 text-xs">
              <div className="font-bold">$ USAGE TIPS</div>
              <ul className="space-y-1 text-terminal-green">
                <li>• Be specific with your questions</li>
                <li>• Ask follow-up questions</li>
                <li>• Request examples</li>
                <li>• Save important responses</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
