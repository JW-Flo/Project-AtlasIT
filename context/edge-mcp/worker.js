export default {
  async fetch(request, env, ctx) {
    // Handle CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Verify API token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (token !== env.API_TOKEN) {
      return new Response('Invalid token', { status: 401 });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Route handling
    if (request.method === 'POST' && path.endsWith('/security-events')) {
      return handleSecurityEvents(request, env);
    } else if (request.method === 'GET' && path.endsWith('/threats')) {
      return handleThreatIntelligence(request, env);
    } else if (request.method === 'POST' && path.endsWith('/rules')) {
      return handleRuleUpdates(request, env);
    } else if (request.method === 'POST' && path.endsWith('/firewall/rules')) {
      return handleFirewallRules(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleSecurityEvents(request, env) {
  const { event, incident_id, security_score } = await request.json();
  
  // Store event in KV
  await env.DNS_EVENTS.put(
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    JSON.stringify(event),
    { expirationTtl: 86400 }
  );

  // Store incident if new
  if (incident_id) {
    const incidentKey = `incident-${incident_id}`;
    const existingIncident = await env.DNS_EVENTS.get(incidentKey);
    
    if (!existingIncident) {
      await env.DNS_EVENTS.put(
        incidentKey,
        JSON.stringify({
          id: incident_id,
          created_at: Date.now(),
          events: [event],
          security_score
        }),
        { expirationTtl: 604800 } // 7 days
      );
    } else {
      const incident = JSON.parse(existingIncident);
      incident.events.push(event);
      incident.security_score = security_score;
      await env.DNS_EVENTS.put(incidentKey, JSON.stringify(incident));
    }
  }

  // Analyze event
  const analysis = await analyzeEvent(event, env);
  
  // Take action if needed
  const actions = await determineActions(analysis, event, env);

  return new Response(JSON.stringify({ analysis, actions }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleThreatIntelligence(request, env) {
  // Get threat data from KV
  const threats = await env.DNS_EVENTS.get('threats');
  const blocked_ips = await env.DNS_EVENTS.get('blocked_ips');
  const malicious_domains = await env.DNS_EVENTS.get('malicious_domains');

  return new Response(JSON.stringify({
    threats: JSON.parse(threats || '[]'),
    blocked_ips: JSON.parse(blocked_ips || '[]'),
    malicious_domains: JSON.parse(malicious_domains || '[]')
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleRuleUpdates(request, env) {
  const { domain, ip, action, reason } = await request.json();
  
  // Update Cloudflare rules
  await updateCloudflareRules(domain, ip, action, env);
  
  // Store rule update
  await env.DNS_EVENTS.put(
    `rule-${Date.now()}`,
    JSON.stringify({ domain, ip, action, reason, timestamp: Date.now() }),
    { expirationTtl: 2592000 } // 30 days
  );

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleFirewallRules(request, env) {
  const { ip, action } = await request.json();
  
  // Update Cloudflare firewall rules
  await updateCloudflareFirewall(ip, action, env);
  
  // Store firewall rule
  await env.DNS_EVENTS.put(
    `firewall-${Date.now()}`,
    JSON.stringify({ ip, action, timestamp: Date.now() }),
    { expirationTtl: 2592000 } // 30 days
  );

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function analyzeEvent(event, env) {
  const analysis = {
    threats: [],
    risk_score: 0,
    recommendations: []
  };

  // Check for known threats
  const threats = await env.DNS_EVENTS.get('threats');
  const knownThreats = JSON.parse(threats || '[]');
  
  if (knownThreats.includes(event.domain)) {
    analysis.threats.push({
      type: 'known_threat',
      severity: 'high',
      details: 'Domain is a known threat'
    });
    analysis.risk_score += 8;
  }

  // Check for suspicious patterns
  const suspiciousPatterns = detectSuspiciousPatterns(event);
  analysis.threats.push(...suspiciousPatterns);
  analysis.risk_score += suspiciousPatterns.length * 3;

  // Check for data exfiltration
  if (detectDataExfiltration(event)) {
    analysis.threats.push({
      type: 'data_exfiltration',
      severity: 'critical',
      details: 'Potential data exfiltration attempt'
    });
    analysis.risk_score += 10;
  }

  // Generate recommendations
  analysis.recommendations = generateRecommendations(analysis);

  return analysis;
}

function detectSuspiciousPatterns(event) {
  const threats = [];
  const domain = event.domain;

  // Check for DNS tunneling
  if (domain.length > 100 || /[A-Za-z0-9+/]{20,}/.test(domain)) {
    threats.push({
      type: 'dns_tunneling',
      severity: 'high',
      details: 'Potential DNS tunneling attempt'
    });
  }

  // Check for suspicious TLDs
  if (/\.(xyz|top|loan|work|click|bid|win|review|download|stream)$/.test(domain)) {
    threats.push({
      type: 'suspicious_tld',
      severity: 'medium',
      details: 'Suspicious TLD detected'
    });
  }

  // Check for IP addresses in domain
  if (/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(domain)) {
    threats.push({
      type: 'ip_in_domain',
      severity: 'medium',
      details: 'IP address found in domain'
    });
  }

  return threats;
}

function detectDataExfiltration(event) {
  const domain = event.domain;
  
  // Check for known exfiltration patterns
  const exfiltrationPatterns = [
    /\.(pastebin|githubusercontent|dropboxusercontent)\.com$/,
    /\.(transfer|send|upload)\.sh$/,
    /\.(telegram|discord)\.org$/
  ];
  
  return exfiltrationPatterns.some(pattern => pattern.test(domain));
}

function generateRecommendations(analysis) {
  const recommendations = [];

  if (analysis.risk_score >= 15) {
    recommendations.push({
      action: 'block_ip',
      priority: 'high',
      reason: 'High risk score indicates potential threat'
    });
  }

  if (analysis.threats.some(t => t.type === 'data_exfiltration')) {
    recommendations.push({
      action: 'alert',
      priority: 'critical',
      reason: 'Data exfiltration attempt detected'
    });
  }

  if (analysis.threats.some(t => t.type === 'dns_tunneling')) {
    recommendations.push({
      action: 'block_domain',
      priority: 'high',
      reason: 'DNS tunneling attempt detected'
    });
  }

  return recommendations;
}

async function determineActions(analysis, event, env) {
  const actions = [];

  // Process recommendations
  for (const rec of analysis.recommendations) {
    if (rec.action === 'block_ip' && event.client_ip) {
      actions.push({
        type: 'block_ip',
        target: event.client_ip,
        reason: rec.reason
      });
    } else if (rec.action === 'block_domain' && event.domain) {
      actions.push({
        type: 'update_cloudflare',
        target: event.domain,
        reason: rec.reason
      });
    } else if (rec.action === 'alert') {
      actions.push({
        type: 'alert',
        severity: rec.priority,
        message: rec.reason
      });
    }
  }

  return actions;
}

async function updateCloudflareRules(domain, ip, action, env) {
  // Implement Cloudflare API calls to update rules
  // This would typically use the Cloudflare API
  // For now, we'll just log the action
  console.log(`Updating Cloudflare rules: ${action} for ${domain} from ${ip}`);
}

async function updateCloudflareFirewall(ip, action, env) {
  // Implement Cloudflare API calls to update firewall rules
  // This would typically use the Cloudflare API
  // For now, we'll just log the action
  console.log(`Updating Cloudflare firewall: ${action} for ${ip}`);
} 