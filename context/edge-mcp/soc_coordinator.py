#!/usr/bin/env python3
import os
import json
import time
import logging
import requests
import threading
from datetime import datetime, timedelta
from queue import Queue, PriorityQueue
import asyncio
import aiohttp
from typing import Dict, List, Optional, Set, Any
import math

# Configure logging
logging.basicConfig(
    filename=os.path.expanduser("~/edge-mcp/soc.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class SOCCoordinator:
    def __init__(self):
        self.worker_endpoint = os.getenv(
            "CLOUDFLARE_WORKER_URL", "https://dns-agent.your-subdomain.workers.dev"
        )
        self.api_token = os.getenv("CLOUDFLARE_API_TOKEN")
        self.event_queue = PriorityQueue()
        self.alert_queue = Queue()
        self.incident_counter = 0
        self.active_incidents: Dict[str, Dict] = {}
        self.threat_intelligence: Dict[str, Any] = {}
        self.security_score = 100
        self.last_score_update = datetime.now()
        self.load_threat_intelligence()

    async def load_threat_intelligence(self):
        """Load and maintain threat intelligence from multiple sources."""
        while True:
            try:
                async with aiohttp.ClientSession() as session:
                    # Load from Cloudflare
                    async with session.get(
                        f"{self.worker_endpoint}/threats",
                        headers={"Authorization": f"Bearer {self.api_token}"},
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            self.threat_intelligence.update(data)

                    # Load from additional sources (example)
                    sources = [
                        "https://api.abuseipdb.com/api/v2/blacklist",
                        "https://api.alienvault.com/v1/indicators/domain/malicious",
                        "https://api.virustotal.com/v3/domains",
                    ]

                    for source in sources:
                        try:
                            async with session.get(source) as resp:
                                if resp.status == 200:
                                    data = await resp.json()
                                    self._merge_threat_data(data)
                        except Exception as e:
                            logging.error(f"Error loading from {source}: {e}")

            except Exception as e:
                logging.error(f"Error in threat intelligence update: {e}")

            await asyncio.sleep(300)  # Update every 5 minutes

    def _merge_threat_data(self, data: Dict):
        """Merge threat data from different sources."""
        if "threats" in data:
            self.threat_intelligence["threats"].update(data["threats"])
        if "ips" in data:
            self.threat_intelligence["blocked_ips"].update(data["ips"])
        if "domains" in data:
            self.threat_intelligence["malicious_domains"].update(data["domains"])

    async def process_security_event(self, event: Dict):
        """Process and analyze security events."""
        severity = self._calculate_event_severity(event)
        event["severity"] = severity

        # Check for incident correlation
        correlated_incidents = self._correlate_incidents(event)

        if correlated_incidents:
            # Update existing incident
            incident_id = correlated_incidents[0]
            self._update_incident(incident_id, event)
        else:
            # Create new incident
            incident_id = self._create_incident(event)

        # Update security score
        self._update_security_score(event)

        # Take immediate action if needed
        if severity in ["high", "critical"]:
            await self._take_immediate_action(event, incident_id)

        # Forward to Cloudflare for additional analysis
        await self._forward_to_cloudflare(event, incident_id)

    def _calculate_event_severity(self, event: Dict) -> str:
        """Calculate event severity based on multiple factors."""
        base_score = 0

        # Check threat type
        threat_weights = {
            "known_threat": 8,
            "suspicious_pattern": 5,
            "blocked_ip": 7,
            "dns_tunneling": 9,
            "data_exfiltration": 10,
            "malware_communication": 9,
        }

        for threat in event.get("threats", []):
            base_score += threat_weights.get(threat["type"], 3)

        # Check frequency
        if self._is_high_frequency(event):
            base_score += 4

        # Check for data exfiltration patterns
        if self._detect_data_exfiltration(event):
            base_score += 6

        # Normalize score
        severity = "low"
        if base_score >= 15:
            severity = "critical"
        elif base_score >= 10:
            severity = "high"
        elif base_score >= 5:
            severity = "medium"

        return severity

    def _is_high_frequency(self, event: Dict) -> bool:
        """Check if event is part of a high-frequency pattern."""
        domain = event.get("domain")
        if not domain:
            return False

        recent_events = [
            e
            for e in self.active_incidents.values()
            if e.get("domain") == domain
            and datetime.fromisoformat(e["timestamp"])
            > datetime.now() - timedelta(minutes=5)
        ]

        return len(recent_events) > 50

    def _detect_data_exfiltration(self, event: Dict) -> bool:
        """Detect potential data exfiltration attempts."""
        domain = event.get("domain", "")

        # Check for base64-like patterns
        if re.search(r"[A-Za-z0-9+/]{50,}", domain):
            return True

        # Check for high entropy
        if self._calculate_entropy(domain) > 5.0:
            return True

        # Check for known exfiltration patterns
        exfiltration_patterns = [
            r"\.(pastebin|githubusercontent|dropboxusercontent)\.com$",
            r"\.(transfer|send|upload)\.sh$",
            r"\.(telegram|discord)\.org$",
        ]

        return any(re.search(pattern, domain) for pattern in exfiltration_patterns)

    def _correlate_incidents(self, event: Dict) -> List[str]:
        """Correlate events into incidents."""
        correlated = []

        for incident_id, incident in self.active_incidents.items():
            # Check for same source
            if event.get("client_ip") == incident.get("client_ip"):
                correlated.append(incident_id)
                continue

            # Check for same domain pattern
            if self._is_similar_domain(
                event.get("domain", ""), incident.get("domain", "")
            ):
                correlated.append(incident_id)
                continue

            # Check for temporal correlation
            if self._is_temporally_correlated(event, incident):
                correlated.append(incident_id)

        return correlated

    def _is_similar_domain(self, domain1: str, domain2: str) -> bool:
        """Check if two domains are similar (e.g., same TLD, similar structure)."""
        if not domain1 or not domain2:
            return False

        # Extract TLDs
        tld1 = domain1.split(".")[-1]
        tld2 = domain2.split(".")[-1]

        if tld1 != tld2:
            return False

        # Check for similar structure
        parts1 = domain1.split(".")[:-1]
        parts2 = domain2.split(".")[:-1]

        if len(parts1) != len(parts2):
            return False

        # Compare domain parts
        return sum(1 for p1, p2 in zip(parts1, parts2) if p1 == p2) >= len(parts1) - 1

    def _is_temporally_correlated(self, event1: Dict, event2: Dict) -> bool:
        """Check if two events are temporally correlated."""
        time1 = datetime.fromisoformat(event1["timestamp"])
        time2 = datetime.fromisoformat(event2["timestamp"])

        return abs((time1 - time2).total_seconds()) < 300  # 5 minutes

    def _create_incident(self, event: Dict) -> str:
        """Create a new security incident."""
        self.incident_counter += 1
        incident_id = f"INC-{self.incident_counter:06d}"

        incident = {
            "id": incident_id,
            "timestamp": event["timestamp"],
            "severity": event["severity"],
            "status": "active",
            "events": [event],
            "client_ip": event.get("client_ip"),
            "domain": event.get("domain"),
            "threats": event.get("threats", []),
            "actions_taken": [],
        }

        self.active_incidents[incident_id] = incident
        logging.info(
            f"Created new incident {incident_id} with severity {event['severity']}"
        )

        return incident_id

    def _update_incident(self, incident_id: str, event: Dict):
        """Update an existing security incident."""
        incident = self.active_incidents[incident_id]
        incident["events"].append(event)

        # Update severity if new event is more severe
        if self._get_severity_weight(event["severity"]) > self._get_severity_weight(
            incident["severity"]
        ):
            incident["severity"] = event["severity"]

        # Update threats
        incident["threats"].extend(event.get("threats", []))

        logging.info(f"Updated incident {incident_id} with new event")

    def _get_severity_weight(self, severity: str) -> int:
        """Get numerical weight for severity levels."""
        weights = {"critical": 4, "high": 3, "medium": 2, "low": 1}
        return weights.get(severity, 0)

    async def _take_immediate_action(self, event: Dict, incident_id: str):
        """Take immediate action for high-severity events."""
        actions = []

        # Block IP at firewall
        if event.get("client_ip"):
            actions.append(
                {
                    "type": "block_ip",
                    "target": event["client_ip"],
                    "reason": f"High severity event in incident {incident_id}",
                }
            )

        # Update Cloudflare rules
        if event.get("domain"):
            actions.append(
                {
                    "type": "update_cloudflare",
                    "target": event["domain"],
                    "reason": f"High severity event in incident {incident_id}",
                }
            )

        # Execute actions
        for action in actions:
            try:
                if action["type"] == "block_ip":
                    await self._block_ip(action["target"])
                elif action["type"] == "update_cloudflare":
                    await self._update_cloudflare_rules(
                        action["target"], event.get("client_ip")
                    )

                # Record action
                self.active_incidents[incident_id]["actions_taken"].append(action)

            except Exception as e:
                logging.error(f"Error executing action {action}: {e}")

    async def _block_ip(self, ip: str):
        """Block an IP address at the firewall level."""
        try:
            # Add to local firewall
            subprocess.run(["sudo", "iptables", "-A", "INPUT", "-s", ip, "-j", "DROP"])

            # Update Cloudflare firewall rules
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{self.worker_endpoint}/firewall/rules",
                    json={"ip": ip, "action": "block"},
                    headers={"Authorization": f"Bearer {self.api_token}"},
                )

            logging.info(f"Successfully blocked IP {ip}")

        except Exception as e:
            logging.error(f"Error blocking IP {ip}: {e}")
            raise

    async def _update_cloudflare_rules(self, domain: str, ip: str):
        """Update Cloudflare security rules."""
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{self.worker_endpoint}/rules",
                    json={
                        "domain": domain,
                        "ip": ip,
                        "action": "block",
                        "reason": "High severity security incident",
                    },
                    headers={"Authorization": f"Bearer {self.api_token}"},
                )

            logging.info(f"Updated Cloudflare rules for domain {domain}")

        except Exception as e:
            logging.error(f"Error updating Cloudflare rules: {e}")
            raise

    def _update_security_score(self, event: Dict):
        """Update the overall security score based on events."""
        current_time = datetime.now()

        # Only update score every 5 minutes
        if (current_time - self.last_score_update).total_seconds() < 300:
            return

        # Calculate score impact
        severity_impact = {"critical": -10, "high": -5, "medium": -2, "low": -1}

        impact = severity_impact.get(event["severity"], 0)

        # Apply impact with decay
        time_factor = math.exp(
            -(current_time - self.last_score_update).total_seconds() / 3600
        )
        self.security_score = max(
            0, min(100, self.security_score + impact * time_factor)
        )

        self.last_score_update = current_time

        logging.info(f"Updated security score: {self.security_score}")

    async def _forward_to_cloudflare(self, event: Dict, incident_id: str):
        """Forward event to Cloudflare for additional analysis."""
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(
                    f"{self.worker_endpoint}/security-events",
                    json={
                        "event": event,
                        "incident_id": incident_id,
                        "security_score": self.security_score,
                    },
                    headers={"Authorization": f"Bearer {self.api_token}"},
                )

        except Exception as e:
            logging.error(f"Error forwarding to Cloudflare: {e}")

    async def start(self):
        """Start the SOC coordinator."""
        logging.info("Starting SOC Coordinator")

        # Start threat intelligence updates
        asyncio.create_task(self.load_threat_intelligence())

        # Process events
        while True:
            try:
                # Get event from queue
                _, event = self.event_queue.get()

                # Process event
                await self.process_security_event(event)

            except Exception as e:
                logging.error(f"Error processing event: {e}")
                await asyncio.sleep(1)


if __name__ == "__main__":
    coordinator = SOCCoordinator()
    asyncio.run(coordinator.start())
