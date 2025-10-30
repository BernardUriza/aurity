"use client";

/**
 * PC Simulation Tab Component
 * Card: FI-INFRA-STR-014
 *
 * Installation instructions for PC acting as NAS (simulation mode)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { Callout } from "@/components/ui/callout";
import { PLATFORMS } from "@/lib/nas-config";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function PCSimulationTab() {
  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">PC as NAS (Simulation Mode)</CardTitle>
          <CardDescription className="text-slate-400">
            Run Free Intelligence on your personal computer (Linux, macOS, or Windows) for testing and development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Callout type="info" title="Use Case">
            This mode is ideal for:
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Development and testing</li>
              <li>• Learning the system before NAS deployment</li>
              <li>• Running on a spare laptop/desktop as a pseudo-NAS</li>
              <li>• Demo environments</li>
            </ul>
          </Callout>
        </CardContent>
      </Card>

      {/* Platform Selection */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Choose Your Platform</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {/* Linux */}
            <AccordionItem value="linux" className="border-slate-700">
              <AccordionTrigger className="text-slate-300 hover:text-slate-100">
                🐧 Linux (Ubuntu, Debian, Fedora)
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Prerequisites</h4>
                  <CodeBlock
                    code={`# Update package lists
sudo apt update

# Install Node.js 20 (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install pnpm and PM2
npm install -g pnpm@8.15.0 pm2`}
                    language="bash"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Installation</h4>
                  <CodeBlock
                    code={`# Clone repository
git clone https://github.com/yourusername/free-intelligence.git
cd free-intelligence

# Run setup script
chmod +x scripts/nas-setup.sh
./scripts/nas-setup.sh

# Edit environment file with localhost
nano .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:9001

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable on boot`}
                    language="bash"
                  />
                </div>

                <Callout type="success" title="Access">
                  Application available at: <code>http://localhost:9000</code>
                </Callout>
              </AccordionContent>
            </AccordionItem>

            {/* macOS */}
            <AccordionItem value="macos" className="border-slate-700">
              <AccordionTrigger className="text-slate-300 hover:text-slate-100">
                🍎 macOS (Homebrew)
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Prerequisites</h4>
                  <CodeBlock
                    code={`# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js 20 and Python 3.11
brew install node@20 python@3.11

# Install pnpm and PM2
npm install -g pnpm@8.15.0 pm2`}
                    language="bash"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Installation</h4>
                  <CodeBlock
                    code={`# Clone repository
git clone https://github.com/yourusername/free-intelligence.git
cd free-intelligence

# Run setup script
chmod +x scripts/nas-setup.sh
./scripts/nas-setup.sh

# Edit environment file
nano .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:9001

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup launchd  # Enable on boot (macOS)`}
                    language="bash"
                  />
                </div>

                <Callout type="info" title="macOS Notes">
                  <ul className="space-y-1 text-sm">
                    {PLATFORMS.macos.notes.map((note, idx) => (
                      <li key={idx}>• {note}</li>
                    ))}
                  </ul>
                </Callout>
              </AccordionContent>
            </AccordionItem>

            {/* Windows WSL2 */}
            <AccordionItem value="windows" className="border-slate-700">
              <AccordionTrigger className="text-slate-300 hover:text-slate-100">
                🪟 Windows (WSL2 - Recommended)
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <Callout type="warning" title="Why WSL2?">
                  WSL2 provides a full Linux environment on Windows with better performance and compatibility
                  than native Windows for Node.js/Python development.
                </Callout>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">1. Enable WSL2</h4>
                  <CodeBlock
                    code={`# Open PowerShell as Administrator
wsl --install

# Restart computer

# Install Ubuntu 22.04 from Microsoft Store
# Or via command line:
wsl --install -d Ubuntu-22.04`}
                    language="powershell"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">2. Setup in WSL Ubuntu</h4>
                  <CodeBlock
                    code={`# Open WSL Ubuntu terminal
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3-pip

# Install pnpm and PM2
npm install -g pnpm@8.15.0 pm2

# Clone repository
git clone https://github.com/yourusername/free-intelligence.git
cd free-intelligence

# Run setup
./scripts/nas-setup.sh

# Edit environment
nano .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:9001

# Start services
pm2 start ecosystem.config.js
pm2 save`}
                    language="bash"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">3. Access from Windows</h4>
                  <Callout type="success" title="Cross-Platform Access">
                    WSL2 services are accessible from Windows at: <code>http://localhost:9000</code>
                    <div className="mt-2 text-sm">
                      Open your Windows browser and navigate to localhost:9000 to access the application.
                    </div>
                  </Callout>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Alternative: Native Windows</h4>
                  <CodeBlock
                    code={`# Install Node.js 20 from nodejs.org
# Download: https://nodejs.org/en/download/

# Install Python 3.11 from python.org
# Download: https://www.python.org/downloads/

# Open PowerShell and install pnpm/PM2
npm install -g pnpm@8.15.0 pm2

# Clone and setup
git clone https://github.com/yourusername/free-intelligence.git
cd free-intelligence
pnpm install --frozen-lockfile

# Note: scripts/nas-setup.sh won't work directly on Windows
# Follow manual steps from Real NAS tab instead`}
                    language="powershell"
                  />
                  <Callout type="warning" title="Native Windows Limitations">
                    Native Windows is supported but WSL2 is strongly recommended for better compatibility
                    with bash scripts and Unix-style file permissions.
                  </Callout>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* LAN-Only Configuration */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">LAN-Only Mode</CardTitle>
          <CardDescription className="text-slate-400">
            Enable network access from other devices on your local network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Callout type="info" title="Default: Localhost Only">
            By default, services bind to <code>localhost</code> and are only accessible from the same machine.
            To access from other devices on your network, configure <code>HOST=0.0.0.0</code>.
          </Callout>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Enable LAN Access</h4>
            <CodeBlock
              code={`# Edit .env.local
nano .env.local

# Add these lines:
HOST=0.0.0.0
FI_LAN_BANNER=1  # Shows "LAN-only" banner in UI

# Update API URLs with your PC's local IP
# Find your IP: ip addr (Linux) | ipconfig (Windows) | ifconfig (macOS)
NEXT_PUBLIC_API_URL=http://192.168.1.XXX:9001
TIMELINE_API_URL=http://192.168.1.XXX:9002

# Restart services
pm2 restart all`}
              language="bash"
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-300 mb-2">Firewall Configuration</h4>
            <CodeBlock
              code={`# Linux (ufw)
sudo ufw allow 9000/tcp  # Frontend
sudo ufw allow 9001/tcp  # Backend API
sudo ufw allow 9002/tcp  # Timeline API

# macOS
# System Preferences → Security & Privacy → Firewall → Firewall Options
# Allow incoming connections for Node

# Windows
# Windows Defender Firewall → Advanced Settings → Inbound Rules
# New Rule → Port → TCP → Ports: 9000,9001,9002`}
              language="bash"
            />
          </div>

          <Callout type="success" title="Network Access">
            After configuration, access from any device on your network at:
            <ul className="mt-2 space-y-1 font-mono text-sm">
              <li>http://192.168.1.XXX:9000 (Frontend)</li>
              <li>http://192.168.1.XXX:9001 (Backend API)</li>
            </ul>
          </Callout>
        </CardContent>
      </Card>

      {/* Development vs Production */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-50">Development vs Production Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Development */}
            <div className="p-4 rounded-lg bg-slate-900 border border-slate-700">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Development Mode</h4>
              <CodeBlock
                code={`# Use Turborepo dev mode (hot reload)
pnpm dev

# Services:
# - Frontend: localhost:9000 (auto-reload)
# - Backend: localhost:7001 (auto-reload)
# - Timeline: localhost:9002`}
                language="bash"
              />
              <div className="mt-3 text-xs text-slate-400">
                ✓ Hot module replacement
                <br />
                ✓ Source maps and debugging
                <br />
                ✗ Not suitable for production
              </div>
            </div>

            {/* Production */}
            <div className="p-4 rounded-lg bg-slate-900 border border-emerald-900/30">
              <h4 className="text-sm font-medium text-emerald-400 mb-3">Production Mode (Recommended)</h4>
              <CodeBlock
                code={`# Build and run with PM2
pnpm build
pm2 start ecosystem.config.js

# Services:
# - Frontend: localhost:9000 (optimized)
# - Backend: localhost:9001 (2 workers)
# - Timeline: localhost:9002 (1 worker)`}
                language="bash"
              />
              <div className="mt-3 text-xs text-slate-400">
                ✓ Optimized bundles
                <br />
                ✓ Process management
                <br />
                ✓ Auto-restart on crash
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Callout type="success" title="Ready to Test">
        Your PC is now acting as a NAS! Proceed to the <strong>Verification</strong> tab to validate
        all services are running correctly.
      </Callout>
    </div>
  );
}
