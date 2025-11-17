import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { serveStatic } from "hono/cloudflare-workers";
import { jwt } from "hono/jwt";

const app = new Hono();

// Security middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: ["https://mcp.project-ignite.kd8jc7v8cd.workers.dev"],
    allowMethods: ["GET", "POST"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  }),
);

// JWT authentication
app.use(
  "/api/*",
  jwt({
    secret: process.env.JWT_SECRET,
    cookie: "auth",
  }),
);

// Minimal server-side stubs to make the worker self-contained and safe.
async function getActiveDeployments() {
  // Return a safe empty list until real backend is wired.
  return [];
}

async function getPendingTasks() {
  return [];
}

async function getSystemHealth() {
  return "healthy";
}

async function executeQuickAction(action, context) {
  // Stub: log and return a safe response
  console.log("executeQuickAction stub:", action, context);
  return { success: true, message: `Stubbed action: ${action}` };
}

// Internal token endpoint (server-side) - returns a stub token.
app.get("/internal/token", async (c) => {
  // In production implement real token exchange using secure worker env secrets.
  return c.json({ access_token: "stubbed-access-token", expires_in: 3600 });
});

// Security headers
app.use("*", async (c, next) => {
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  c.header(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' cdn.jsdelivr.net;",
  );
  await next();
});

// Serve static files
app.use("/*", serveStatic({ root: "./" }));

// MCP Status Endpoint
app.get("/api/status", async (c) => {
  try {
    const status = {
      activeDeployments: await getActiveDeployments(),
      pendingTasks: await getPendingTasks(),
      systemHealth: await getSystemHealth(),
      lastUpdate: new Date().toISOString(),
    };
    return c.json(status);
  } catch (error) {
    console.error("Status check failed:", error);
    return c.json({ error: "Failed to fetch status" }, 500);
  }
});

// Quick Actions Endpoint
app.post("/api/quick-action", async (c) => {
  const { action, context } = await c.req.json();

  // Validate action
  const validActions = [
    "deploy",
    "rollback",
    "status",
    "logs",
    "approve",
    "reject",
  ];
  if (!validActions.includes(action)) {
    return c.json({ error: "Invalid action" }, 400);
  }

  try {
    // Execute action
    const result = await executeQuickAction(action, context);
    return c.json(result);
  } catch (error) {
    console.error("Action execution failed:", error);
    return c.json({ error: "Failed to execute action" }, 500);
  }
});

// iOS Shortcuts Integration
app.get("/api/shortcuts", async (c) => {
  const shortcuts = {
    version: "1.0",
    shortcuts: [
      {
        name: "MCP Status",
        description: "Get current MCP status",
        url: "/api/status",
        method: "GET",
      },
      {
        name: "Approve Deployment",
        description: "Approve pending deployment",
        url: "/api/quick-action",
        method: "POST",
        body: { action: "approve", context: "deployment" },
      },
      {
        name: "View Logs",
        description: "View recent system logs",
        url: "/api/quick-action",
        method: "POST",
        body: { action: "logs", context: "recent" },
      },
      {
        name: "System Health",
        description: "Check system health",
        url: "/api/quick-action",
        method: "POST",
        body: { action: "status", context: "health" },
      },
    ],
  };
  return c.json(shortcuts);
});

// Mobile UI
app.get("/", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>MCP Mobile Control</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        /* iOS-specific styles */
        @supports (-webkit-touch-callout: none) {
          .ios-safe {
            padding-top: env(safe-area-inset-top);
            padding-bottom: env(safe-area-inset-bottom);
          }
        }
        .status-card {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      </style>
    </head>
    <body class="bg-gray-900 text-white ios-safe">
      <div class="container mx-auto px-4 py-6">
        <header class="mb-8">
          <h1 class="text-2xl font-bold">MCP Control</h1>
          <p class="text-gray-400">Master Control Program</p>
        </header>

        <!-- Status Overview -->
        <div class="grid grid-cols-1 gap-4 mb-8">
          <div class="status-card bg-gray-800 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-2">System Status</h2>
            <div id="systemStatus" class="text-green-400">Loading...</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-2 gap-4 mb-8">
          <button onclick="executeAction('status')" class="bg-blue-600 rounded-lg p-4 text-center">
            Status
          </button>
          <button onclick="executeAction('logs')" class="bg-purple-600 rounded-lg p-4 text-center">
            Logs
          </button>
          <button onclick="executeAction('approve')" class="bg-green-600 rounded-lg p-4 text-center">
            Approve
          </button>
          <button onclick="executeAction('reject')" class="bg-red-600 rounded-lg p-4 text-center">
            Reject
          </button>
        </div>

        <!-- Active Deployments -->
        <div class="mb-8">
          <h2 class="text-lg font-semibold mb-4">Active Deployments</h2>
          <div id="deployments" class="space-y-4">
            Loading...
          </div>
        </div>

        <!-- Recent Logs -->
        <div>
          <h2 class="text-lg font-semibold mb-4">Recent Logs</h2>
          <div id="logs" class="space-y-2 text-sm">
            Loading...
          </div>
        </div>
      </div>

      <script>
        // Token handling moved server-side for security.
        // The client will call /internal/token which the worker will implement using an env-held secret.
        async function getAccessToken() {
          try {
            const response = await fetch('/internal/token', { method: 'GET', credentials: 'include' });
            if (!response.ok) throw new Error('Failed to get access token');
            const data = await response.json();
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('token_expiry', Date.now() + (data.expires_in * 1000));
            return data.access_token;
          } catch (error) {
            console.error('Token error:', error);
            throw error;
          }
        }

        // Check token validity
        async function checkToken() {
          const token = localStorage.getItem('access_token');
          const expiry = localStorage.getItem('token_expiry');

          if (!token || !expiry || Date.now() > expiry) {
            return await getAccessToken();
          }

          return token;
        }

        // Update status every 30 seconds
        setInterval(updateStatus, 30000);
        updateStatus();

        async function updateStatus() {
          try {
            const token = await checkToken();
            const response = await fetch('/api/status', {
              credentials: 'include',
              headers: {
                'Authorization': 'Bearer ' + token
              }
            });

            if (!response.ok) {
              throw new Error('Status check failed');
            }

            const data = await response.json();

            // Update system status
            document.getElementById('systemStatus').textContent =
              data.systemHealth === 'healthy' ? 'Healthy' : 'Needs Attention';

            // Update deployments
            document.getElementById('deployments').innerHTML =
              (data.activeDeployments.length
                ? data.activeDeployments
                    .map(function (d) {
                      return (
                        '<div class="bg-gray-800 rounded-lg p-4">' +
                        '<div class="font-semibold">' + (d.name || '') + '</div>' +
                        '<div class="text-sm text-gray-400">' + (d.status || '') + '</div>' +
                        '</div>'
                      );
                    })
                    .join('')
                : 'No active deployments');
            // Update logs
            document.getElementById('logs').innerHTML =
              (data.recentLogs && data.recentLogs.length
                ? data.recentLogs.map(function (log) { return '<div class="text-gray-400">' + log + '</div>'; }).join('')
                : '');
          } catch (error) {
            console.error('Failed to update status:', error);
            // Handle authentication errors
            if (error.message.includes('401')) {
              localStorage.removeItem('access_token');
              localStorage.removeItem('token_expiry');
              updateStatus();
            }
          }
        }

        async function executeAction(action) {
          try {
            const token = await checkToken();
            const response = await fetch('/api/quick-action', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
              },
              credentials: 'include',
              body: JSON.stringify({ action, context: 'mobile' })
            });

            if (!response.ok) {
              throw new Error('Action execution failed');
            }

            const result = await response.json();

            // Show feedback
            alert(result.message || 'Action executed');

            // Update status
            updateStatus();
          } catch (error) {
            console.error('Failed to execute action:', error);
            alert('Failed to execute action');
          }
        }

        // Add to iOS Home Screen
        if ('standalone' in navigator && !navigator.standalone) {
          const addToHome = document.createElement('div');
          addToHome.className = 'fixed bottom-0 left-0 right-0 bg-blue-600 text-white text-center p-4';
          addToHome.innerHTML = 'Add to Home Screen for quick access';
          document.body.appendChild(addToHome);
        }
      </script>
    </body>
    </html>
  `);
});

export default app;
