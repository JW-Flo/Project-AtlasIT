export default function SaasCost() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">SaaS Cost Analytics</h1>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Current month spend</p>
        <p className="text-3xl font-semibold">$ 231.47</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Top vendors</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Okta – $79</li>
          <li>Slack – $55</li>
          <li>AWS – $42</li>
        </ul>
      </div>
    </section>
  )
} 