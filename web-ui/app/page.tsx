import Image from "next/image";

export default function Overview() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Project Ignite – Overview</h1>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">GCP POC Terraform State</p>
        <p className="text-lg font-semibold text-green-600">✅ Applied</p>
      </div>
      <div className="bg-white rounded shadow p-4">
        <p className="text-sm text-gray-600">Contractor Lifecycle Workflows</p>
        <p className="text-lg font-semibold text-green-600">All Healthy</p>
      </div>
    </section>
  )
}
