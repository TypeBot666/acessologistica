"use client"

import { Package, Truck, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DashboardStatsProps {
  stats: {
    total: number
    inTransit: number
    delivered: number
    pending: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      name: "Total de Remessas",
      value: stats.total,
      icon: Package,
      color: "bg-blue-100 text-blue-600",
    },
    {
      name: "Em Trânsito",
      value: stats.inTransit,
      icon: Truck,
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      name: "Entregues",
      value: stats.delivered,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
    },
    {
      name: "Aguardando",
      value: stats.pending,
      icon: Clock,
      color: "bg-purple-100 text-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statItems.map((item) => (
        <Card key={item.name} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center">
              <div className={`${item.color} p-4 flex items-center justify-center`}>
                <item.icon className="h-8 w-8" />
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-gray-500">{item.name}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
