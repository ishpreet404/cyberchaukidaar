import React from 'react';
import { Blocks } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const Advanced = () => {
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

      {/* Feature Buttons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Feature 1 */}
        <Card title="▸ FEATURE 1">
          <div className="space-y-4">
            <div className="text-terminal-muted text-sm mb-4">
              New advanced feature coming soon...
            </div>
            <Button 
              variant="primary" 
              className="w-full"
              disabled
            >
              COMING SOON
            </Button>
          </div>
        </Card>

        {/* Feature 2 */}
        <Card title="▸ FEATURE 2">
          <div className="space-y-4">
            <div className="text-terminal-muted text-sm mb-4">
              New advanced feature coming soon...
            </div>
            <Button 
              variant="primary" 
              className="w-full"
              disabled
            >
              COMING SOON
            </Button>
          </div>
        </Card>

        {/* Feature 3 */}
        <Card title="▸ FEATURE 3">
          <div className="space-y-4">
            <div className="text-terminal-muted text-sm mb-4">
              New advanced feature coming soon...
            </div>
            <Button 
              variant="primary" 
              className="w-full"
              disabled
            >
              COMING SOON
            </Button>
          </div>
        </Card>
      </div>

      {/* Info Box */}
      <Card title="▸ ABOUT ADVANCED FEATURES">
        <div className="space-y-3 text-sm text-terminal-muted">
          <p>
            Advanced features are currently under development. These tools will provide 
            enhanced security capabilities for power users.
          </p>
          <div className="border-l-2 border-terminal-green pl-3 space-y-1">
            <p className="text-terminal-green">• Premium threat detection</p>
            <p className="text-terminal-green">• Advanced analytics</p>
            <p className="text-terminal-green">• Custom security rules</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Advanced;
