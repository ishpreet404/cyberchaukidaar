import React from 'react';
import { 
  Button, 
  Card, 
  Input, 
  ProgressBar, 
  StatusBadge, 
  TypingText, 
  Separator, 
  ASCIIArt 
} from '../components';

/**
 * Design System Showcase
 * 
 * This page demonstrates all UI components and design patterns
 * used throughout the CyberGuard application.
 */

const DesignSystem = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-shadow-terminal mb-2">
          $ DESIGN_SYSTEM --SHOWCASE
        </h1>
        <p className="text-terminal-muted">
          Terminal CLI aesthetic component library
        </p>
      </div>

      <Separator variant="equals" />

      {/* Colors */}
      <Card title="▸ COLOR PALETTE">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="w-full h-20 bg-terminal-bg border border-terminal-green mb-2"></div>
            <div className="text-xs">terminal-bg</div>
            <div className="text-xs text-terminal-muted">#0a0a0a</div>
          </div>
          <div className="text-center">
            <div className="w-full h-20 bg-terminal-green mb-2"></div>
            <div className="text-xs">terminal-green</div>
            <div className="text-xs text-terminal-muted">#33ff00</div>
          </div>
          <div className="text-center">
            <div className="w-full h-20 bg-terminal-amber mb-2"></div>
            <div className="text-xs">terminal-amber</div>
            <div className="text-xs text-terminal-muted">#ffb000</div>
          </div>
          <div className="text-center">
            <div className="w-full h-20 bg-terminal-red border border-terminal-green mb-2"></div>
            <div className="text-xs">terminal-red</div>
            <div className="text-xs text-terminal-muted">#ff3333</div>
          </div>
          <div className="text-center">
            <div className="w-full h-20 bg-terminal-muted mb-2"></div>
            <div className="text-xs">terminal-muted</div>
            <div className="text-xs text-terminal-muted">#3A9B3A</div>
          </div>
        </div>
      </Card>

      {/* Typography */}
      <Card title="▸ TYPOGRAPHY">
        <div className="space-y-4">
          <div>
            <div className="text-4xl font-bold text-shadow-terminal mb-2">
              HEADING LEVEL 1
            </div>
            <code className="text-xs text-terminal-muted">text-4xl font-bold text-shadow-terminal</code>
          </div>
          <div>
            <div className="text-2xl font-bold text-shadow-terminal mb-2">
              HEADING LEVEL 2
            </div>
            <code className="text-xs text-terminal-muted">text-2xl font-bold text-shadow-terminal</code>
          </div>
          <div>
            <div className="text-lg mb-2">
              Body text - Regular weight
            </div>
            <code className="text-xs text-terminal-muted">text-lg</code>
          </div>
          <div>
            <div className="text-sm text-terminal-muted mb-2">
              Muted text for secondary information
            </div>
            <code className="text-xs text-terminal-muted">text-sm text-terminal-muted</code>
          </div>
        </div>
      </Card>

      {/* Buttons */}
      <Card title="▸ BUTTONS">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button>Default Button</Button>
            <Button variant="warning">Warning Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button disabled>Disabled Button</Button>
          </div>
          <code className="text-xs text-terminal-muted block">
            {'<Button variant="default|warning|danger" disabled={boolean}>'}
          </code>
        </div>
      </Card>

      {/* Cards */}
      <Card title="▸ CARDS / WINDOWS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Card with Header">
            <p>This is a card with a header bar.</p>
          </Card>
          <Card>
            <p>This is a card without a header.</p>
          </Card>
        </div>
        <code className="text-xs text-terminal-muted block mt-4">
          {'<Card title="Optional Title">Content</Card>'}
        </code>
      </Card>

      {/* Inputs */}
      <Card title="▸ INPUTS">
        <div className="space-y-4">
          <Input placeholder="Enter text..." prompt="$" />
          <Input placeholder="Custom prompt..." prompt="user@host:~$" />
          <code className="text-xs text-terminal-muted block">
            {'<Input placeholder="..." prompt="$" />'}
          </code>
        </div>
      </Card>

      {/* Progress Bars */}
      <Card title="▸ PROGRESS BARS">
        <div className="space-y-4">
          <div>
            <div className="text-sm mb-2">Default (75%)</div>
            <ProgressBar value={75} max={100} />
          </div>
          <div>
            <div className="text-sm mb-2">Warning (50%)</div>
            <ProgressBar value={50} max={100} variant="warning" />
          </div>
          <div>
            <div className="text-sm mb-2">Danger (25%)</div>
            <ProgressBar value={25} max={100} variant="danger" />
          </div>
          <code className="text-xs text-terminal-muted">
            {'<ProgressBar value={75} max={100} variant="default|warning|danger" />'}
          </code>
        </div>
      </Card>

      {/* Status Badges */}
      <Card title="▸ STATUS BADGES">
        <div className="space-y-2">
          <StatusBadge status="ok">System operational</StatusBadge>
          <StatusBadge status="warning">High CPU usage</StatusBadge>
          <StatusBadge status="error">Connection failed</StatusBadge>
          <code className="text-xs text-terminal-muted block mt-4">
            {'<StatusBadge status="ok|warning|error">Message</StatusBadge>'}
          </code>
        </div>
      </Card>

      {/* Separators */}
      <Card title="▸ SEPARATORS">
        <div className="space-y-4">
          <div>
            <div className="text-xs mb-2">Dash</div>
            <Separator variant="dash" />
          </div>
          <div>
            <div className="text-xs mb-2">Equals</div>
            <Separator variant="equals" />
          </div>
          <div>
            <div className="text-xs mb-2">Dots</div>
            <Separator variant="dots" />
          </div>
          <div>
            <div className="text-xs mb-2">Slash</div>
            <Separator variant="slash" />
          </div>
          <code className="text-xs text-terminal-muted">
            {'<Separator variant="dash|equals|dots|slash" />'}
          </code>
        </div>
      </Card>

      {/* Animations */}
      <Card title="▸ ANIMATIONS">
        <div className="space-y-4">
          <div>
            <div className="text-sm mb-2">Typing Text:</div>
            <TypingText text="Initializing security protocol..." speed={50} />
          </div>
          <div className="mt-4">
            <div className="text-sm mb-2">Blinking Cursor:</div>
            <span>Loading<span className="cursor"></span></span>
          </div>
          <code className="text-xs text-terminal-muted block mt-4">
            {'<TypingText text="..." speed={50} />'}
          </code>
        </div>
      </Card>

      {/* ASCII Art */}
      <Card title="▸ ASCII ART">
        <div className="space-y-4">
          <div className="text-xs mb-2">Logo</div>
          <ASCIIArt variant="logo" />
          <div className="text-xs mb-2 mt-6">Shield</div>
          <ASCIIArt variant="shield" />
          <code className="text-xs text-terminal-muted block mt-4">
            {'<ASCIIArt variant="logo|shield|warning" />'}
          </code>
        </div>
      </Card>

      {/* Effects */}
      <Card title="▸ TEXT EFFECTS">
        <div className="space-y-4">
          <div className="text-2xl text-shadow-terminal">Text with terminal glow</div>
          <div className="text-2xl text-shadow-amber text-terminal-amber">Text with amber glow</div>
          <code className="text-xs text-terminal-muted block mt-4">
            text-shadow-terminal | text-shadow-amber
          </code>
        </div>
      </Card>

      {/* Layout Patterns */}
      <Card title="▸ LAYOUT PATTERNS">
        <div className="space-y-6">
          <div>
            <div className="text-sm mb-3">Two Column Grid</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-terminal-green p-4 text-center">Column 1</div>
              <div className="border border-terminal-green p-4 text-center">Column 2</div>
            </div>
          </div>
          <div>
            <div className="text-sm mb-3">Four Column Grid</div>
            <div className="grid grid-cols-4 gap-4">
              <div className="border border-terminal-green p-4 text-center">1</div>
              <div className="border border-terminal-green p-4 text-center">2</div>
              <div className="border border-terminal-green p-4 text-center">3</div>
              <div className="border border-terminal-green p-4 text-center">4</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DesignSystem;
