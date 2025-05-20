#!/usr/bin/env python3
import os
import json
import time
import logging
import requests
import threading
from datetime import datetime
from queue import Queue
import re
import ipaddress
import socket
import subprocess
from typing import Dict, List, Optional, Set

# Configure logging
logging.basicConfig(
    filename=os.path.expanduser("~/edge-mcp/security.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class SecurityAgent:
    def __init__(self):
        self.dns_log_path = os.path.expanduser("~/edge-mcp/dns.log")
        self.known_threats: Set[str] = set()
        self.blocked_ips: Set[str] = set()
        self.suspicious_domains: Dict[str, int] = {}
        self.alert_threshold = 5
        self.worker_endpoint = os.getenv(
            "CLOUDFLARE_WORKER_URL", "https://dns-agent.your-subdomain.workers.dev"
        )
        self.api_token = os.getenv("CLOUDFLARE_API_TOKEN")
        self.event_queue = Queue()
        self.load_threat_intelligence()

    def load_threat_intelligence(self):
        """Load known threats and blocked IPs from Cloudflare."""
        try:
            response = requests.get(
                f"{self.worker_endpoint}/threats",
                headers={"Authorization": f"Bearer {self.api_token}"},
            )
            if response.status_code == 200:
                data = response.json()
                self.known_threats.update(data.get("threats", []))
                self.blocked_ips.update(data.get("blocked_ips", []))
                logging.info(
                    f"Loaded {len(self.known_threats)} threats and {len(self.blocked_ips)} blocked IPs"
                )
        except Exception as e:
            logging.error(f"Error loading threat intelligence: {e}")

    def analyze_dns_query(self, query: Dict) -> Optional[Dict]:
        """Analyze a DNS query for potential threats."""
        threats = []

        # Check domain against known threats
        if query["domain"] in self.known_threats:
            threats.append(
                {
                    "type": "known_threat",
                    "severity": "high",
                    "details": f"Domain {query['domain']} is a known threat",
                }
            )

        # Check for suspicious patterns
        if self._is_suspicious_domain(query["domain"]):
            threats.append(
                {
                    "type": "suspicious_pattern",
                    "severity": "medium",
                    "details": f"Domain {query['domain']} matches suspicious patterns",
                }
            )

        # Check client IP
        if query["client_ip"] in self.blocked_ips:
            threats.append(
                {
                    "type": "blocked_ip",
                    "severity": "high",
                    "details": f"Query from blocked IP {query['client_ip']}",
                }
            )

        # Check for DNS tunneling attempts
        if self._detect_dns_tunneling(query):
            threats.append(
                {
                    "type": "dns_tunneling",
                    "severity": "critical",
                    "details": "Potential DNS tunneling attempt detected",
                }
            )

        if threats:
            return {
                "timestamp": query["timestamp"],
                "domain": query["domain"],
                "client_ip": query["client_ip"],
                "threats": threats,
                "action_taken": self._take_action(threats, query),
            }
        return None

    def _is_suspicious_domain(self, domain: str) -> bool:
        """Check if a domain matches suspicious patterns."""
        suspicious_patterns = [
            r"\.(xyz|top|loan|work|click|bid|win|review|download|stream)$",
            r"[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}",
            r"[a-f0-9]{32}\.",
            r"\.(onion|bit|bazar|emc)$",
        ]

        return any(re.search(pattern, domain) for pattern in suspicious_patterns)

    def _detect_dns_tunneling(self, query: Dict) -> bool:
        """Detect potential DNS tunneling attempts."""
        domain = query["domain"]

        # Check for unusually long subdomains
        if len(domain) > 100:
            return True

        # Check for base64-like patterns
        if re.search(r"[A-Za-z0-9+/]{20,}", domain):
            return True

        # Check for high entropy
        if self._calculate_entropy(domain) > 4.5:
            return True

        return False

    def _calculate_entropy(self, text: str) -> float:
        """Calculate the entropy of a string."""
        if not text:
            return 0
        entropy = 0
        for x in range(256):
            p_x = text.count(chr(x)) / len(text)
            if p_x > 0:
                entropy += -p_x * math.log2(p_x)
        return entropy

    def _take_action(self, threats: List[Dict], query: Dict) -> Dict:
        """Take appropriate action based on threat severity."""
        actions = []

        for threat in threats:
            if threat["severity"] in ["high", "critical"]:
                # Block IP at firewall level
                if self._block_ip(query["client_ip"]):
                    actions.append(
                        {
                            "type": "block_ip",
                            "target": query["client_ip"],
                            "reason": threat["details"],
                        }
                    )

                # Update Cloudflare rules
                self._update_cloudflare_rules(query["domain"], query["client_ip"])
                actions.append(
                    {
                        "type": "update_cloudflare",
                        "target": query["domain"],
                        "reason": threat["details"],
                    }
                )

        return {"actions_taken": actions, "timestamp": datetime.utcnow().isoformat()}

    def _block_ip(self, ip: str) -> bool:
        """Block an IP address at the firewall level."""
        try:
            # Add to local firewall
            subprocess.run(["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"])
            self.blocked_ips.add(ip)
            return True
        except Exception as e:
            logging.error(f"Error blocking IP {ip}: {e}")
            return False

    def _update_cloudflare_rules(self, domain: str, ip: str):
        """Update Cloudflare security rules."""
        try:
            response = requests.post(
                f"{self.worker_endpoint}/rules",
                json={"domain": domain, "ip": ip, "action": "block"},
                headers={"Authorization": f"Bearer {self.api_token}"},
            )
            response.raise_for_status()
        except Exception as e:
            logging.error(f"Error updating Cloudflare rules: {e}")

    def process_log_line(self, line: str) -> Optional[Dict]:
        """Process a single log line and analyze for threats."""
        try:
            match = re.search(r"\[INFO\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)", line)
            if match:
                timestamp, client_ip, query_type, domain = match.groups()
                query = {
                    "timestamp": timestamp,
                    "query_type": query_type,
                    "domain": domain,
                    "client_ip": client_ip,
                }
                return self.analyze_dns_query(query)
        except Exception as e:
            logging.error(f"Error processing log line: {e}")
        return None

    def forward_to_cloudflare(self, events: List[Dict]):
        """Forward security events to Cloudflare Worker."""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_token}",
            }

            response = requests.post(
                f"{self.worker_endpoint}/security-events",
                json={"events": events},
                headers=headers,
            )
            response.raise_for_status()

            # Handle any immediate actions from Cloudflare
            if response.json().get("actions"):
                self.handle_cloudflare_actions(response.json()["actions"])

        except Exception as e:
            logging.error(f"Error forwarding to Cloudflare: {e}")

    def handle_cloudflare_actions(self, actions: List[Dict]):
        """Handle immediate actions from Cloudflare Worker."""
        for action in actions:
            logging.info(f"Executing Cloudflare action: {action['type']}")
            if action["type"] == "block_ip":
                self._block_ip(action["target"])
            elif action["type"] == "update_rules":
                self._update_cloudflare_rules(action["domain"], action["ip"])

    def tail_log(self):
        """Tail the DNS log file and process new entries."""
        try:
            with open(self.dns_log_path, "r") as f:
                f.seek(0, 2)
                while True:
                    line = f.readline()
                    if line:
                        event = self.process_log_line(line)
                        if event:
                            self.event_queue.put(event)
                    else:
                        time.sleep(0.1)
        except Exception as e:
            logging.error(f"Error tailing log file: {e}")
            time.sleep(1)
            self.tail_log()

    def start(self):
        """Start the security agent."""
        logging.info("Starting Security Agent")

        # Start log tailing in a separate thread
        tail_thread = threading.Thread(target=self.tail_log, daemon=True)
        tail_thread.start()

        # Process events
        while True:
            try:
                event = self.event_queue.get(timeout=1)
                if event:
                    self.forward_to_cloudflare([event])
            except Exception as e:
                logging.error(f"Error processing event: {e}")
                time.sleep(1)


if __name__ == "__main__":
    agent = SecurityAgent()
    agent.start()
