"use client"
import Link from "next/link"
import { Webhook, Database, RefreshCw, Send, Mail, Clock, FileText, Zap, Layers } from "lucide-react"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"

export default function IntegracoesPage() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 md:p-6">
          <h1 className="text-2xl font-bold mb-6">Integrações e Ferramentas</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Webhooks */}
            <Link
              href="/admin/integracoes/webhooks"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Webhook className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold">Webhooks</h2>
              </div>
              <p className="text-gray-600">Gere códigos para integrar com plataformas externas via webhooks.</p>
            </Link>

            {/* Simulador de Webhook */}
            <Link
              href="/admin/integracoes/simular-webhook"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 p-3 rounded-full mr-4">
                  <Send className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold">Simulador de Webhook</h2>
              </div>
              <p className="text-gray-600">Simule o recebimento de webhooks para testar integrações.</p>
            </Link>

            {/* Teste de PIX */}
            <Link
              href="/admin/integracoes/teste-pix"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <RefreshCw className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold">Teste de PIX</h2>
              </div>
              <p className="text-gray-600">Simule pagamentos PIX para testar o fluxo de pedidos.</p>
            </Link>

            {/* Remessas via Webhook */}
            <Link
              href="/admin/integracoes/webhook-remessas"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <Layers className="h-6 w-6 text-yellow-600" />
                </div>
                <h2 className="text-lg font-semibold">Remessas via Webhook</h2>
              </div>
              <p className="text-gray-600">Visualize remessas criadas através de webhooks.</p>
            </Link>

            {/* Logs de Webhook */}
            <Link
              href="/admin/integracoes/webhook-logs"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-gray-100 p-3 rounded-full mr-4">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold">Logs de Webhook</h2>
              </div>
              <p className="text-gray-600">Visualize logs de requisições de webhook recebidas.</p>
            </Link>

            {/* Teste de Email */}
            <Link
              href="/admin/integracoes/teste-email"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-lg font-semibold">Teste de Email</h2>
              </div>
              <p className="text-gray-600">Teste o envio de emails de rastreamento e notificações.</p>
            </Link>

            {/* Teste de Automação */}
            <Link
              href="/admin/integracoes/teste-automacao"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold">Teste de Automação</h2>
              </div>
              <p className="text-gray-600">Teste as automações de envio de emails e notificações.</p>
            </Link>

            {/* Migração de Banco */}
            <Link
              href="/admin/integracoes/migracao-banco"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-orange-100 p-3 rounded-full mr-4">
                  <Database className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-lg font-semibold">Migração de Banco</h2>
              </div>
              <p className="text-gray-600">Ferramentas para migração e manutenção do banco de dados.</p>
            </Link>

            {/* Sistema de WhatsApp */}
            <Link
              href="/admin/whatsapp"
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold">Sistema de WhatsApp</h2>
              </div>
              <p className="text-gray-600">
                Sistema avançado de disparo de mensagens WhatsApp com múltiplas sessões e enfileiramento.
              </p>
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}
