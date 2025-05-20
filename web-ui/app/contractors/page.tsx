export default function Contractors() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Contractor Lifecycle</h1>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Active contractors</p>
        <p className="text-lg font-semibold">15</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Upcoming off-boards</p>
        <p className="text-lg font-semibold text-green-600">0</p>
      </div>
    </section>
  )
} 