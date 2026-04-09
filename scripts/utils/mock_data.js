export function generateMockContractors(count = 5) {
  const contractors = [];
  for (let i = 1; i <= count; i++) {
    contractors.push({
      id: `MOCK${i.toString().padStart(3, '0')}`,
      name: `Mock Contractor ${i}`,
      email: `mock${i}@example.com`,
      department: 'Mock Dept',
      project: 'Demo',
      start_date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      access_level: 'Standard',
      status: 'Active',
      days_remaining: 30
    });
  }
  return contractors;
}

export function generateMockAlerts(count = 3) {
  const severities = ['low', 'medium', 'high', 'critical'];
  const alerts = [];
  for (let i = 1; i <= count; i++) {
    alerts.push({
      id: `MOCK-ALERT-${i}`,
      timestamp: new Date().toISOString(),
      severity: severities[Math.floor(Math.random() * severities.length)],
      source: 'Mock EDR',
      title: `Mock Alert ${i}`,
      description: 'This is a mock alert generated for demo purposes',
      affected_device: `MOCK-DEVICE-${i}`,
      status: 'open'
    });
  }
  return alerts;
} 