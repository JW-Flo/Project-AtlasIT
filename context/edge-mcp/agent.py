#!/usr/bin/env python3
import os
import json
import time
import logging
import requests
from datetime import datetime
import threading
from queue import Queue
import re

# Configure logging
logging.basicConfig(
    filename=os.path.expanduser("~/edge-mcp/agent.log"),
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)


class CloudflareDNSAgent:
    def __init__(self):
        self.dns_log_path = os.path.expanduser("~/edge-mcp/dns.log")
        self.batch_size = 50  # Increased for cloud processing
        self.batch_timeout = 60  # Increased for cloud processing
        self.event_queue = Queue()
        # Cloudflare Worker endpoint
        self.worker_endpoint = os.getenv(
            "CLOUDFLARE_WORKER_URL", "https://dns-agent.your-subdomain.workers.dev"
        )
        self.api_token = os.getenv("CLOUDFLARE_API_TOKEN")

    def process_log_line(self, line):
        """Process a single log line and extract relevant information."""
        try:
            match = re.search(r"\[INFO\]\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)", line)
            if match:
                timestamp, client_ip, query_type, domain = match.groups()
                return {
                    "timestamp": timestamp,
                    "query_type": query_type,
                    "domain": domain,
                    "client_ip": client_ip,
                    "source": "edge-mcp",
                }
        except Exception as e:
            logging.error(f"Error processing log line: {e}")
        return None

    def forward_to_cloudflare(self, events):
        """Forward batched events to Cloudflare Worker."""
        try:
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_token}",
            }

            response = requests.post(
                f"{self.worker_endpoint}/events",
                json={"events": events},
                headers=headers,
            )
            response.raise_for_status()

            # Handle any immediate actions from Cloudflare
            if response.json().get("actions"):
                self.handle_cloudflare_actions(response.json()["actions"])

        except Exception as e:
            logging.error(f"Error forwarding to Cloudflare: {e}")

    def handle_cloudflare_actions(self, actions):
        """Handle immediate actions from Cloudflare Worker."""
        for action in actions:
            logging.info(f"Executing Cloudflare action: {action['type']}")
            if action["type"] == "update_dns":
                # Handle DNS updates if needed
                pass
            elif action["type"] == "alert":
                # Handle alerts
                logging.warning(f"Cloudflare Alert: {action['message']}")

    def batch_processor(self):
        """Process and forward batched events to Cloudflare."""
        batch = []
        last_send = time.time()

        while True:
            try:
                event = self.event_queue.get(timeout=1)
                if event:
                    batch.append(event)

                current_time = time.time()
                if len(batch) >= self.batch_size or (
                    batch and current_time - last_send >= self.batch_timeout
                ):
                    self.forward_to_cloudflare(batch)
                    batch = []
                    last_send = current_time

            except Exception as e:
                logging.error(f"Error in batch processor: {e}")
                time.sleep(1)

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
        """Start the agent."""
        logging.info("Starting Cloudflare DNS Agent")

        processor_thread = threading.Thread(target=self.batch_processor, daemon=True)
        processor_thread.start()

        self.tail_log()


if __name__ == "__main__":
    agent = CloudflareDNSAgent()
    agent.start()
