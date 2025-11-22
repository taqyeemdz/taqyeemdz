"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminReports() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50 mb-2">Reports</h1>
        <p className="text-slate-400">Generate and view system reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-slate-900 border-slate-800">
          <h3 className="text-lg font-semibold text-slate-50 mb-2">Revenue Report</h3>
          <p className="text-slate-400 text-sm mb-4">Monthly and yearly revenue breakdown</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Generate Report</Button>
        </Card>

        <Card className="p-6 bg-slate-900 border-slate-800">
          <h3 className="text-lg font-semibold text-slate-50 mb-2">User Activity Report</h3>
          <p className="text-slate-400 text-sm mb-4">User registration and activity trends</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Generate Report</Button>
        </Card>

        <Card className="p-6 bg-slate-900 border-slate-800">
          <h3 className="text-lg font-semibold text-slate-50 mb-2">Feedback Report</h3>
          <p className="text-slate-400 text-sm mb-4">Comprehensive feedback analysis and trends</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Generate Report</Button>
        </Card>

        <Card className="p-6 bg-slate-900 border-slate-800">
          <h3 className="text-lg font-semibold text-slate-50 mb-2">System Health Report</h3>
          <p className="text-slate-400 text-sm mb-4">Platform performance and uptime metrics</p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">Generate Report</Button>
        </Card>
      </div>
    </div>
  )
}
