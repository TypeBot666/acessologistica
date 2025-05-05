"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { ParticleCloud } from "@/components/admin/particle-cloud"

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    // Implementar lógica de logout aqui
    router.push("/")
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />

        <main className="flex-1 overflow-y-auto p-4 relative">
          {/* ParticleCloud como background */}
          <ParticleCloud />

          {/* Conteúdo principal com z-index para ficar acima do ParticleCloud */}
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col items-center justify-center h-full">
              <h1 className="mt-8 text-2xl font-bold text-gray-900">Bem-vindo ao Painel Administrativo</h1>
              <p className="mt-2 text-gray-600">Selecione uma opção no menu lateral para começar.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
