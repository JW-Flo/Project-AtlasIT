import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// In-memory user store for demo purposes
const users = [
  { id: 'user1', username: 'alice', password: 'password123', tenantId: 'tenant1', roles: ['admin'] },
  { id: 'user2', username: 'bob', password: 'password456', tenantId: 'tenant2', roles: ['user'] }
];

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password, tenantId } = req.body;
  if (!username || !password || !tenantId) {
    return res.status(400).json({ error: 'username, password and tenantId are required' });
  }

  const user = users.find(u => u.username === username && u.password === password && u.tenantId === tenantId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ sub: user.id, tenantId: user.tenantId, roles: user.roles }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Token validation middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Userinfo endpoint
app.get('/api/auth/userinfo', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout endpoint (dummy for stateless JWT)
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logged out' });
});

// Config endpoint
app.get('/api/auth/config', (req, res) => {
  res.json({
    oidc: true,
    saml: true,
    rbac: true
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});

export default app;
