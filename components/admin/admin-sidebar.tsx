"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, BarChart3, Settings, Mail, Webhook, X, Cog, Calendar, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  return (
    <>
      {/* Overlay para dispositivos móveis */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={onClose} aria-hidden="true"></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-red-600">Painel Admin</h2>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 lg:hidden" aria-label="Fechar menu">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <Link
              href="/admin/dashboard"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/dashboard") ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Home className="h-4 w-4 mr-3" />
              Dashboard
            </Link>

            <Link
              href="/admin/pedidos"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/pedidos") ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Package className="h-4 w-4 mr-3" />
              Pedidos
            </Link>

            <Link
              href="/admin/relatorios"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/relatorios") ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <BarChart3 className="h-4 w-4 mr-3" />
              Relatórios
            </Link>

            <Link
              href="/admin/configuracoes/automacao"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/configuracoes/automacao")
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Calendar className="h-4 w-4 mr-3" />
              Automação
            </Link>

            <Link
              href="/admin/configuracoes/emails"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/configuracoes/emails") ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Mail className="h-4 w-4 mr-3" />
              Templates de Email
            </Link>

            <Link
              href="/admin/whatsapp"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/whatsapp") ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Zap className="h-4 w-4 mr-3" />
              WhatsApp
            </Link>

            <div className="pt-4 pb-2">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Integrações</div>
            </div>

            <Link
              href="/admin/integracoes"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/integracoes") ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Webhook className="h-4 w-4 mr-3" />
              Webhooks
            </Link>

            <div className="pt-4 pb-2">
              <div className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Configurações</div>
            </div>

            <Link
              href="/admin/configuracoes"
              className={cn(
                "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/admin/configuracoes") &&
                  !isActive("/admin/configuracoes/emails") &&
                  !isActive("/admin/configuracoes/automacao")
                  ? "bg-red-50 text-red-600"
                  : "text-gray-700 hover:bg-gray-100",
              )}
            >
              <Settings className="h-4 w-4 mr-3" />
              Geral
            </Link>
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Cog className="h-4 w-4 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">Admin</p>
                <p className="text-xs text-gray-500">Logística v1.0</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

// Exportar como exportação nomeada
export { AdminSidebar }
// Também exportar como padrão para compatibilidade
export default AdminSidebar
