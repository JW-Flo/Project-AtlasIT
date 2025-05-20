#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print status
print_status() {
    echo -e "${YELLOW}[*] $1${NC}"
}

print_success() {
    echo -e "${GREEN}[+] $1${NC}"
}

print_error() {
    echo -e "${RED}[-] $1${NC}"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root"
    exit 1
fi

# Create directory structure
print_status "Creating directory structure..."
mkdir -p ~/edge-mcp/{logs,config,scripts}

# Install dependencies
print_status "Installing dependencies..."
apt-get update
apt-get install -y python3-pip python3-venv iptables-persistent

# Create Python virtual environment
print_status "Setting up Python environment..."
python3 -m venv ~/edge-mcp/venv
source ~/edge-mcp/venv/bin/activate
pip install -r requirements.txt

# Install CoreDNS
print_status "Installing CoreDNS..."
if ! command -v coredns &> /dev/null; then
    curl -L https://github.com/coredns/coredns/releases/download/v1.10.1/coredns_1.10.1_linux_amd64.tgz | tar xz
    mv coredns /usr/local/bin/
fi

# Set up CoreDNS configuration
print_status "Configuring CoreDNS..."
cat > ~/edge-mcp/config/Corefile << EOF
. {
    forward . tls://1.1.1.1 tls://1.0.0.1 {
        tls_servername cloudflare-dns.com
    }
    log
    errors
    cache 30
    reload
}
EOF

# Set up systemd service for CoreDNS
print_status "Setting up CoreDNS service..."
cat > /etc/systemd/system/coredns.service << EOF
[Unit]
Description=CoreDNS DNS server
Documentation=https://coredns.io
After=network.target

[Service]
PermissionsStartOnly=true
LimitNOFILE=1048576
LimitNPROC=512
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true
User=root
WorkingDirectory=~/edge-mcp
ExecStart=/usr/local/bin/coredns -conf ~/edge-mcp/config/Corefile
ExecReload=/bin/kill -SIGUSR1 \$MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

# Set up systemd service for security agent
print_status "Setting up security agent service..."
cat > /etc/systemd/system/security-agent.service << EOF
[Unit]
Description=Edge MCP Security Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=~/edge-mcp
Environment=PYTHONPATH=~/edge-mcp
Environment=CLOUDFLARE_WORKER_URL=https://dns-agent.your-subdomain.workers.dev
Environment=CLOUDFLARE_API_TOKEN=your-api-token
ExecStart=~/edge-mcp/venv/bin/python3 ~/edge-mcp/security_agent.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set up systemd service for SOC coordinator
print_status "Setting up SOC coordinator service..."
cat > /etc/systemd/system/soc-coordinator.service << EOF
[Unit]
Description=Edge MCP SOC Coordinator
After=network.target security-agent.service

[Service]
Type=simple
User=root
WorkingDirectory=~/edge-mcp
Environment=PYTHONPATH=~/edge-mcp
Environment=CLOUDFLARE_WORKER_URL=https://dns-agent.your-subdomain.workers.dev
Environment=CLOUDFLARE_API_TOKEN=your-api-token
ExecStart=~/edge-mcp/venv/bin/python3 ~/edge-mcp/soc_coordinator.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/edge-mcp << EOF
~/edge-mcp/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

# Set up firewall rules
print_status "Setting up firewall rules..."
iptables -N EDGE-MCP
iptables -A INPUT -j EDGE-MCP
iptables-save > /etc/iptables/rules.v4

# Start services
print_status "Starting services..."
systemctl daemon-reload
systemctl enable coredns
systemctl enable security-agent
systemctl enable soc-coordinator
systemctl start coredns
systemctl start security-agent
systemctl start soc-coordinator

# Verify services
print_status "Verifying services..."
if systemctl is-active --quiet coredns; then
    print_success "CoreDNS is running"
else
    print_error "CoreDNS failed to start"
fi

if systemctl is-active --quiet security-agent; then
    print_success "Security agent is running"
else
    print_error "Security agent failed to start"
fi

if systemctl is-active --quiet soc-coordinator; then
    print_success "SOC coordinator is running"
else
    print_error "SOC coordinator failed to start"
fi

print_success "Deployment complete!"
print_status "Please update the following in the service files:"
print_status "1. CLOUDFLARE_WORKER_URL"
print_status "2. CLOUDFLARE_API_TOKEN"
print_status "Then run: systemctl daemon-reload && systemctl restart coredns security-agent soc-coordinator" 