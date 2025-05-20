# Edge MCP DNS Monitor

A hybrid DNS monitoring system that combines local CoreDNS with Cloudflare Workers for analysis and storage.

## Components

1. **Local Components**:
   - CoreDNS: Local DNS resolver
   - Python Agent: Lightweight log forwarder

2. **Cloud Components**:
   - Cloudflare Worker: Event processing and analysis
   - Cloudflare KV: Event storage
   - Cloudflare Analytics: Monitoring and visualization

## Setup Instructions

### Local Setup

1. Install CoreDNS:
   ```bash
   brew install coredns
   ```

2. Install Python dependencies:
   ```bash
   pip install requests
   ```

3. Configure CoreDNS:
   - Edit `Corefile` to set your preferred upstream DNS servers
   - Start CoreDNS:
     ```bash
     coredns -conf Corefile -port 1053
     ```

4. Configure the Python agent:
   - Edit `agent.py` to set your Cloudflare Worker URL and API token
   - Start the agent:
     ```bash
     python3 agent.py
     ```

### Cloudflare Setup

1. Create a new Cloudflare Worker:
   - Go to the Cloudflare Dashboard
   - Navigate to Workers & Pages
   - Create a new Worker
   - Copy the contents of `worker.js`

2. Create a KV namespace:
   - In the Cloudflare Dashboard, create a new KV namespace named "DNS_EVENTS"
   - Note the namespace ID and preview ID
   - Update `wrangler.toml` with these IDs

3. Set up environment variables:
   - In the Worker settings, add an environment variable:
     - Name: `API_TOKEN`
     - Value: Generate a secure random token

4. Deploy the Worker:
   ```bash
   wrangler deploy
   ```

## Configuration

### CoreDNS (Corefile)
- Forward DNS queries to Cloudflare's DNS over TLS
- Enable logging to `dns.log`
- Configure caching and error handling

### Python Agent (agent.py)
- Set `CLOUDFLARE_WORKER_URL` to your deployed Worker URL
- Set `API_TOKEN` to match your Worker's environment variable
- Adjust batch size and timeout as needed

### Cloudflare Worker (worker.js)
- Configure pattern detection thresholds
- Add custom analysis rules
- Set up alerts and notifications

## Monitoring

1. Local Logs:
   - DNS queries: `dns.log`
   - Agent operations: `agent.log`

2. Cloudflare Dashboard:
   - Worker metrics
   - KV storage usage
   - Analytics and insights

## Security Considerations

1. API Token:
   - Keep your API token secure
   - Rotate tokens periodically
   - Use environment variables

2. DNS Privacy:
   - All DNS queries are encrypted using DNS over TLS
   - Local queries are anonymized before forwarding
   - Events are stored with 24-hour expiration

3. Access Control:
   - Worker endpoints are protected by API token
   - CORS is configured for specific origins
   - Rate limiting is implemented

## Maintenance

1. Regular Tasks:
   - Monitor log files for errors
   - Check Worker metrics
   - Review and update detection patterns

2. Updates:
   - Keep CoreDNS updated
   - Update Python dependencies
   - Deploy Worker updates as needed

## Troubleshooting

1. DNS Resolution Issues:
   - Check CoreDNS logs
   - Verify upstream DNS servers
   - Test local resolution

2. Agent Problems:
   - Check agent.log for errors
   - Verify API token
   - Test connectivity to Worker

3. Worker Issues:
   - Check Worker logs in dashboard
   - Verify KV namespace access
   - Test API endpoints

## Support

For issues and support:
1. Check the logs
2. Review Cloudflare status
3. Contact support with relevant logs and details 