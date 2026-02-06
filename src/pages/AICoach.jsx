import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, User } from 'lucide-react';
import { Card, Input, Button, Separator } from '../components';

// OpenRouter API Configuration
const OPENROUTER_API_KEY = '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'; // Free tier key
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'arcee-ai/trinity-mini:free';

const AICoach = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'CYBER CHAUKIDAAR AI COACH INITIALIZED.\n\nI can help you with:\n- Security best practices\n- Threat assessment\n- Password management\n- Phishing identification\n- Account recovery\n\nType your question below...'
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
    const newMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Prepare conversation history for API
      const apiMessages = newMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }));

      // Add system prompt
      const systemPrompt = {
        role: 'system',
        content: `You are Cyber Chaukidaar, the AI-powered cybersecurity assistant for Cyber Chaukidaar platform - a comprehensive security platform. You provide expert advice on cybersecurity topics while also promoting Cyber Chaukidaar's features when relevant.

ABOUT Cyber Chaukidaar PLATFORM:
Cyber Chaukidaar is a cutting-edge cybersecurity platform with a unique Terminal CLI aesthetic (hacker-style green-on-black interface). It provides real-time threat detection and protection.

Cyber Chaukidaar FEATURES:

1. BREACH CHECKER (Powered by LeakOSINT API)
   - Searches 15+ BILLION breach records from dark web and leaked databases
   - Check emails, phone numbers, or any personal data for exposure
   - Shows detailed breach information: passwords, credit cards, personal data
   - Real-time search with threat scoring and database statistics
   - NO censorship - shows all exposed data in full for user awareness
   - Provides immediate action recommendations for compromised data

2. SCAM ANALYZER (Smart Phishing Detector)
   - Advanced pattern-matching engine with 200+ phishing indicators
   - Detects urgency language, credential requests, suspicious URLs, threatening tone
   - Analyzes emails, SMS, and messages for scam patterns
   - Highlights suspicious phrases with color-coded severity (RED/AMBER/GREEN)
   - Real-time threat scoring (0-100 scale)
   - Provides detailed reasoning and actionable recommendations
   - Categories: Urgency tactics, money requests, generic greetings, too-good-to-be-true offers

3. AI COACH (Cyber Chaukidaar - that's you!)
   - Real-time AI cybersecurity guidance powered by OrderOfPhoenix
   - Expert advice on phishing, passwords, 2FA, breach response
   - Interactive chat with conversation context
   - Quick topic buttons for common security questions
   - Session tracking and message history

4. BROWSER EXTENSION (Chrome/Edge)
   - Real-time page scanning for threats
   - Automatic phishing detection while browsing
   - Threat alerts and warnings
   - Seamless protection without slowing down browsing
   - Terminal-style popup interface

5. TERMINAL CLI AESTHETIC
   - Unique hacker-style green (#33ff00) on black design
   - JetBrains Mono monospace font throughout
   - Zero rounded corners, sharp borders
   - CRT scanline effects and animations
   - ASCII art and terminal-style progress bars
   - Typing effects and blinking cursors

WHEN TO RECOMMEND FEATURES:
- User asks about checking breaches → Promote Breach Checker
- User mentions phishing emails/scams → Promote Scam Analyzer
- User wants ongoing protection → Suggest Browser Extension
- User asks about the site → Explain all features enthusiastically

YOUR RESPONSE STYLE:
- Format responses in terminal-style with clear sections
- Be concise but thorough with technical terminology
- Use uppercase for emphasis (IMPORTANT, WARNING, TIP)
- Include relevant Cyber Chaukidaar features naturally in responses
- Be enthusiastic about the platform's capabilities
- Use bullet points and numbered lists for clarity

Remember: You're not just an AI assistant - you're part of the Cyber Chaukidaar security ecosystem!`
      };

      // Call OpenRouter API
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Cyber Chaukidaar AI Coach'
        },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [systemPrompt, ...apiMessages],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      let aiResponse = data.choices[0]?.message?.content || 'Sorry, I could not generate a response. Please try again.';
      
      // Strip markdown formatting
      aiResponse = aiResponse
        .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold **text**
        .replace(/\*(.+?)\*/g, '$1')      // Remove italic *text*
        .replace(/\[(.+?)\]\(.+?\)/g, '$1')  // Remove links [text](url)
        .replace(/`(.+?)`/g, '$1')        // Remove inline code `text`
        .replace(/^#+\s+(.+)$/gm, '$1')   // Remove headers ### text
        .replace(/^[-*+]\s+/gm, '• ')     // Convert bullet lists to •
        .replace(/^\d+\.\s+/gm, (match) => match); // Keep numbered lists

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('AI Coach Error:', error);
      
      // Fallback response on error
      const errorResponse = `[ERROR: API CONNECTION FAILED]\n\n${error.message}\n\nFalling back to offline mode. Here are some general cybersecurity tips:\n\n1. Always verify sender identity before clicking links\n2. Use strong, unique passwords for each account\n3. Enable two-factor authentication everywhere\n4. Keep software and systems updated\n5. Be cautious with unsolicited messages\n\nPlease check your connection and try again, or ask a specific security question for offline guidance.`;
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorResponse }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-shadow-terminal mb-2">
          $ CYBER_CHAUKIDAAR --STATUS=ACTIVE
        </h1>
        <p className="text-terminal-muted">
          Real-time AI cybersecurity guidance powered by OrderOfPhoenix
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
                  <Bot className="w-6 h-6 text-terminal-green animate-pulse" />
                  <div className="p-3 border border-terminal-green">
                    <span className="animate-pulse">AI THINKING</span>
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
                <span className="text-terminal-green text-xs">Cyber Chaukidaar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-terminal-muted">PROVIDER:</span>
                <span className="text-terminal-green text-xs">OrderOfPhoenix</span>
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
