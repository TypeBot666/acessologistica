"use client"

import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminHeaderProps {
  onMenuToggle: () => void
  onLogout: () => void
}

const AdminHeader = ({ onMenuToggle, onLogout }: AdminHeaderProps) => {
  return (
    <header className="bg-white border-b shadow-sm z-10 relative">
      <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuToggle}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Menu</span>
          </Button>

          <Link href="/admin/dashboard" className="flex items-center">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo_home%20%281%29-k4dNWea9Xt8N85gYxkxe0vxCGH4uG9.webp"
              alt="Logística"
              className="h-8 w-auto"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900 hidden sm:inline-block">Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onLogout} className="text-red-600 border-red-200 hover:bg-red-50">
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}

// Exportar como exportação nomeada
export { AdminHeader }
// Também exportar como padrão para compatibilidade
export default AdminHeader
