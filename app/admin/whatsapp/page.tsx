"use client"

import { useState, useEffect } from "react"
import AdminHeader from "@/components/admin/admin-header"
import AdminSidebar from "@/components/admin/admin-sidebar"
import { Zap, Users, MessageSquare, Clock, BarChart2, RefreshCw, XCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

// Tipos
interface Session {
  id: string
  status: string
  qrCode?: string
  lastActivity: string
}

interface QueueStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
}

export default function WhatsAppAdminPage() {
  // Estados
  const [sessions, setSessions] = useState<Session[]>([])
  const [queueStats, setQueueStats] = useState<QueueStats>({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
  })
  const [newSessionId, setNewSessionId] = useState("")
  const [showQrModal, setShowQrModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("")
  const [testSessionId, setTestSessionId] = useState("")
  const [showTestModal, setShowTestModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Efeito para carregar dados iniciais
  useEffect(() => {
    fetchSessions()
    fetchQueueStats()

    // Configurar atualização automática a cada 10 segundos
    const interval = setInterval(() => {
      fetchSessions()
      fetchQueueStats()
    }, 10000)

    setRefreshInterval(interval)

    // Limpar intervalo ao desmontar
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [])

  // Buscar sessões
  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/whatsapp/sessions")
      const data = await response.json()

      if (data.success) {
        setSessions(data.sessions)
      } else {
        console.error("Erro ao buscar sessões:", data.error)
      }
    } catch (error) {
      console.error("Erro ao buscar sessões:", error)
    }
  }

  // Buscar estatísticas da fila
  const fetchQueueStats = async () => {
    try {
      const response = await fetch("/api/whatsapp/queue/stats")
      const data = await response.json()

      if (data.success) {
        setQueueStats(data.stats)
      } else {
        console.error("Erro ao buscar estatísticas:", data.error)
      }
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error)
    }
  }

  // Criar nova sessão
  const handleCreateSession = async () => {
    if (!newSessionId.trim()) {
      toast({
        title: "Erro",
        description: "ID da sessão é obrigatório",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/whatsapp/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId: newSessionId }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Sessão criada com sucesso",
        })

        // Atualizar lista de sessões
        fetchSessions()

        // Verificar se há QR code disponível
        if (data.session?.qrCode) {
          setSelectedSession(data.session)
        }
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar sessão",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar sessão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar a sessão",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setShowQrModal(false)
    }
  }

  // Excluir sessão
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm(`Tem certeza que deseja excluir a sessão ${sessionId}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: `Sessão ${sessionId} excluída com sucesso`,
        })

        // Atualizar lista de sessões
        fetchSessions()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao excluir sessão",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir sessão:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir a sessão",
        variant: "destructive",
      })
    }
  }

  // Enviar mensagem de teste
  const handleSendTestMessage = async () => {
    if (!testSessionId || !testPhone || !testMessage) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: testSessionId,
          phone: testPhone,
          message: testMessage,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Mensagem enviada com sucesso",
        })

        // Limpar campos
        setTestPhone("")
        setTestMessage("")
        setShowTestModal(false)

        // Atualizar estatísticas
        fetchQueueStats()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao enviar mensagem",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Verificar QR code
  const handleCheckQrCode = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/whatsapp/sessions/${sessionId}`)
      const data = await response.json()

      if (data.success && data.session?.qrCode) {
        setSelectedSession(data.session)
      } else {
        toast({
          title: "Informação",
          description: "QR code não disponível ou sessão já autenticada",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar QR code:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar o QR code",
        variant: "destructive",
      })
    }
  }

  // Calcular taxa de sucesso
  const getSuccessRate = () => {
    const total = queueStats.completed + queueStats.failed
    if (total === 0) return "100%"

    const rate = (queueStats.completed / total) * 100
    return `${rate.toFixed(1)}%`
  }

  // Obter texto para status
  const getStatusText = (status: string) => {
    switch (status) {
      case "ready":
        return "Online"
      case "qr_ready":
        return "QR Code Pronto"
      case "initializing":
        return "Inicializando"
      case "authenticated":
        return "Autenticado"
      case "disconnected":
        return "Desconectado"
      default:
        return status
    }
  }

  // Obter classe para status
  const getStatusClass = (status: string) => {
    switch (status) {
      case "ready":
        return "bg-green-100 text-green-800"
      case "qr_ready":
        return "bg-yellow-100 text-yellow-800"
      case "initializing":
      case "authenticated":
        return "bg-blue-100 text-blue-800"
      case "disconnected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar />
      <div className="flex-1">
        <AdminHeader />
        <main className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Sistema de WhatsApp</h1>
            <div className="flex gap-2">
              <button
                onClick={fetchSessions}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md flex items-center"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Atualizar
              </button>
              <button
                onClick={() => setShowQrModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Zap className="mr-2 h-5 w-5" />
                Nova Sessão
              </button>
              <button
                onClick={() => setShowTestModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Enviar Teste
              </button>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Sessões Ativas</p>
                  <p className="text-2xl font-semibold">{sessions.filter((s) => s.status === "ready").length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Mensagens Enviadas</p>
                  <p className="text-2xl font-semibold">{queueStats.completed}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Na Fila</p>
                  <p className="text-2xl font-semibold">{queueStats.waiting}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <BarChart2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Taxa de Entrega</p>
                  <p className="text-2xl font-semibold">{getSuccessRate()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Sessões de WhatsApp</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Atividade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Nenhuma sessão encontrada. Clique em "Nova Sessão" para começar.
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Zap className="h-5 w-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{session.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(
                              session.status,
                            )}`}
                          >
                            {getStatusText(session.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(session.lastActivity).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {session.status === "qr_ready" && (
                            <button
                              onClick={() => handleCheckQrCode(session.id)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Ver QR Code
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <XCircle className="h-4 w-4 inline mr-1" />
                            Excluir
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* API Usage Section */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Uso da API</h2>
            <div className="bg-gray-100 p-4 rounded-md">
              <p className="text-sm font-medium mb-2">Endpoint para envio de mensagens:</p>
              <code className="block bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
                POST /api/whatsapp/send-message
              </code>
              <p className="text-sm font-medium mt-4 mb-2">Exemplo de payload:</p>
              <code className="block bg-gray-800 text-white p-3 rounded text-sm overflow-x-auto">
                {`{
  "sessionId": "session1",
  "phone": "5511999999999",
  "message": "Sua encomenda foi postada com sucesso!"
}`}
              </code>
            </div>
          </div>
        </main>
      </div>

      {/* QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Criar Nova Sessão</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">ID da Sessão</label>
              <input
                type="text"
                value={newSessionId}
                onChange={(e) => setNewSessionId(e.target.value)}
                placeholder="Ex: atendimento, marketing, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use um identificador único sem espaços ou caracteres especiais
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSession}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? "Criando..." : "Criar Sessão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Display Modal */}
      {selectedSession && selectedSession.qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Escanear QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Abra o WhatsApp no seu celular e escaneie o QR Code abaixo para conectar a sessão {selectedSession.id}
            </p>

            <div className="flex justify-center mb-4">
              <img src={selectedSession.qrCode || "/placeholder.svg"} alt="QR Code" className="w-64 h-64" />
            </div>

            <p className="text-xs text-gray-500 mb-4 text-center">
              Este QR Code expira em 60 segundos. Se expirar, atualize a página para gerar um novo.
            </p>

            <div className="flex justify-center">
              <button
                onClick={() => setSelectedSession(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm font-medium hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Message Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Enviar Mensagem de Teste</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sessão</label>
              <select
                value={testSessionId}
                onChange={(e) => setTestSessionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione uma sessão</option>
                {sessions
                  .filter((s) => s.status === "ready")
                  .map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.id}
                    </option>
                  ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Número de Telefone</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Inclua o código do país (55 para Brasil) e DDD, sem espaços ou caracteres especiais
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendTestMessage}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Enviando..." : "Enviar Mensagem"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
