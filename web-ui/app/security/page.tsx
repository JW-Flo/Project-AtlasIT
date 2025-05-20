export default function Security() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Security – Datto EDR / RocketCyber</h1>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Last threat scan</p>
        <p className="text-lg font-semibold text-green-600">No threats detected</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Endpoint coverage</p>
        <p className="text-lg font-semibold">48 / 48 devices</p>
      </div>
    </section>
  )
} 