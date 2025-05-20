import { useState, useEffect } from 'react'

const tabs = [
  { name: 'Status', key: 'status' },
  { name: 'Workflows', key: 'workflows' },
  { name: 'Tasks', key: 'tasks' },
  { name: 'Logs', key: 'logs' },
  { name: 'Settings', key: 'settings' },
]

function TabButton({ active, children, ...props }) {
  return (
    <button
      className={`px-4 py-2 rounded-t-md font-medium focus:outline-none transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100'}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Mock task data generator
function getMockTasks() {
  const statuses = ['pending', 'running', 'success', 'failed']
  return [
    {
      id: 'task-1',
      name: 'Sync Okta Users',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      owner: 'agent-1',
      startedAt: '2025-05-19T18:00:00Z',
    },
    {
      id: 'task-2',
      name: 'License Audit',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      owner: 'agent-2',
      startedAt: '2025-05-19T18:05:00Z',
    },
    {
      id: 'task-3',
      name: 'Ramp ETL',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      owner: 'agent-3',
      startedAt: '2025-05-19T18:10:00Z',
    },
  ]
}

export default function App() {
  const [activeTab, setActiveTab] = useState('status')
  const [tasks, setTasks] = useState([])
  // Qwen onboarding agent state
  const [onboardForm, setOnboardForm] = useState({ name: '', email: '', role: 'Contractor', manager: '' })
  const [onboardResult, setOnboardResult] = useState('')
  const [onboardLoading, setOnboardLoading] = useState(false)
  const [onboardError, setOnboardError] = useState('')

  // Poll for tasks every 3 seconds (live updates)
  useEffect(() => {
    if (activeTab !== 'tasks') return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/tasks')
        const data = await res.json()
        setTasks(data)
      } catch (err) {
        setTasks([])
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [activeTab])

  async function handleOnboardSubmit(e) {
    e.preventDefault()
    setOnboardLoading(true)
    setOnboardError('')
    setOnboardResult('')
    try {
      const res = await fetch('http://127.0.0.1:8000/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardForm),
      })
      if (!res.ok) throw new Error('Onboarding agent error: ' + res.status)
      const data = await res.json()
      setOnboardResult(data.result)
    } catch (err) {
      setOnboardError(err.message)
    } finally {
      setOnboardLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-700">Ignite WebUI</h1>
        <span className="text-sm text-gray-500">MCP & Orchestration Dashboard</span>
      </header>
      <nav className="flex space-x-2 border-b bg-white px-4 pt-4">
        {tabs.map(tab => (
          <TabButton
            key={tab.key}
            active={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.name}
          </TabButton>
        ))}
      </nav>
      <main className="p-6 max-w-4xl mx-auto">
        {activeTab === 'status' && (
          <section>
            <h2 className="text-xl font-semibold mb-2">System Status</h2>
            <div className="bg-white rounded shadow p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                <span className="font-medium">MCP Server:</span>
                <span className="text-green-700">Healthy</span>
              </div>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Refresh Status</button>
            </div>
          </section>
        )}
        {activeTab === 'workflows' && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Workflows</h2>
            <div className="bg-white rounded shadow p-4 flex flex-col gap-4">
              <form className="flex flex-col gap-2" onSubmit={handleOnboardSubmit}>
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Name"
                    value={onboardForm.name}
                    onChange={e => setOnboardForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Email"
                    type="email"
                    value={onboardForm.email}
                    onChange={e => setOnboardForm(f => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Role"
                    value={onboardForm.role}
                    onChange={e => setOnboardForm(f => ({ ...f, role: e.target.value }))}
                  />
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    placeholder="Manager"
                    value={onboardForm.manager}
                    onChange={e => setOnboardForm(f => ({ ...f, manager: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  disabled={onboardLoading}
                >
                  {onboardLoading ? 'Running Qwen Onboarding...' : 'Run Qwen Onboarding Agent'}
                </button>
              </form>
              {onboardError && <div className="text-red-600">{onboardError}</div>}
              {onboardResult && (
                <div className="bg-gray-100 rounded p-4 whitespace-pre-wrap text-sm">
                  <strong>Qwen Onboarding Steps:</strong>
                  <div>{onboardResult}</div>
                </div>
              )}
              <div className="text-gray-500">(Workflow list and controls coming soon)</div>
            </div>
          </section>
        )}
        {activeTab === 'tasks' && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Tasks (Live)</h2>
            <div className="bg-white rounded shadow p-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Task</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Owner</th>
                    <th className="py-2">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 font-medium">{task.name}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          task.status === 'success' ? 'bg-green-100 text-green-700' :
                          task.status === 'failed' ? 'bg-red-100 text-red-700' :
                          task.status === 'running' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-2">{task.owner}</td>
                      <td className="py-2 text-xs text-gray-500">{task.startedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
        {activeTab === 'logs' && (
          <section>
            <h2 className="text-xl font-semibold mb-2">System Logs</h2>
            <div className="bg-white rounded shadow p-4 text-sm text-gray-700 h-40 overflow-y-auto">(Live logs will appear here)</div>
          </section>
        )}
        {activeTab === 'settings' && (
          <section>
            <h2 className="text-xl font-semibold mb-2">Settings</h2>
            <div className="bg-white rounded shadow p-4 flex flex-col gap-2">
              <label className="block">
                <span className="text-gray-700">MCP Endpoint</span>
                <input type="text" className="mt-1 block w-full border rounded px-2 py-1" placeholder="http://localhost:8080/" defaultValue="http://localhost:8080/" />
              </label>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Save Settings</button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
