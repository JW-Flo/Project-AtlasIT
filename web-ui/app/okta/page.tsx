export default function Okta() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Okta Workflows</h1>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Latest workflow run</p>
        <p className="text-lg font-semibold text-green-600">✅ 09:05 UTC</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">90-day deactivation rule</p>
        <p className="text-lg font-semibold">Enabled</p>
      </div>
    </section>
  )
} 