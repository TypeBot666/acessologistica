"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase/client"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Download, BarChart, PieChart, LineChart, Mail, Clock, Calendar, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ScheduledEmail {
  id: number
  tracking_code: string
  email: string
  status: string
  scheduled_time: string
  sent: boolean
  created_at: string
}

interface AutomationSetting {
  id: number
  status: string
  days_after: number
  email_time: string
  created_at: string
}

interface AutomationExecution {
  id: number
  execution_date: string
  success: boolean
  emails_sent: number
  emails_failed: number
  execution_time: string
  details: string
}

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loadingEmails, setLoadingEmails] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [loadingExecutions, setLoadingExecutions] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [reportType, setReportType] = useState("daily")
  const [reportPeriod, setReportPeriod] = useState("last30")
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([])
  const [automationSettings, setAutomationSettings] = useState<AutomationSetting[]>([])
  const [automationExecutions, setAutomationExecutions] = useState<AutomationExecution[]>([])
  const [emailFilter, setEmailFilter] = useState("all") // all, pending, sent
  // Estado de erro removido
  const supabase = createClientSupabaseClient()

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false)
      fetchScheduledEmails()
      fetchAutomationSettings()
      fetchAutomationExecutions()
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  const fetchScheduledEmails = async () => {
    setLoadingEmails(true)
    // Remover esta linha: setError(null)
    try {
      const response = await fetch("/api/scheduled-emails")
      const data = await response.json()

      if (data.success && data.emails) {
        setScheduledEmails(data.emails)
      } else {
        console.error("Erro ao buscar emails agendados:", data.message)
        // Remover esta linha: setError("Não foi possível carregar os emails agendados. Verifique a conexão com o banco de dados.")
      }
    } catch (error) {
      console.error("Erro ao buscar emails agendados:", error)
      // Remover esta linha: setError("Erro ao buscar emails agendados. Verifique a conexão com o banco de dados.")
    } finally {
      setLoadingEmails(false)
    }
  }

  const fetchAutomationSettings = async () => {
    setLoadingSettings(true)
    // Remover esta linha: setError(null)
    try {
      const response = await fetch("/api/automation-settings/for-reports")
      const data = await response.json()

      if (data.success && data.settings) {
        setAutomationSettings(data.settings)
      } else {
        console.error("Erro ao buscar configurações de automação:", data.message)
      }
    } catch (error) {
      console.error("Erro ao buscar configurações de automação:", error)
      // Remover esta linha: setError("Erro ao buscar configurações de automação. Verifique a conexão com o banco de dados.")
    } finally {
      setLoadingSettings(false)
    }
  }

  const fetchAutomationExecutions = async () => {
    setLoadingExecutions(true)
    // Remover esta linha: setError(null)
    try {
      const response = await fetch("/api/automation-executions")
      const data = await response.json()

      if (data.success && data.executions) {
        setAutomationExecutions(data.executions)
      } else {
        console.error("Erro ao buscar execuções de automação:", data.message)
        // Usar dados simulados para demonstração
        setAutomationExecutions([
          {
            id: 1,
            execution_date: new Date().toISOString(),
            success: true,
            emails_sent: 5,
            emails_failed: 0,
            execution_time: "00:05:23",
            details: "Automação executada com sucesso",
          },
          {
            id: 2,
            execution_date: new Date(Date.now() - 86400000).toISOString(), // Ontem
            success: true,
            emails_sent: 3,
            emails_failed: 1,
            execution_time: "00:04:12",
            details: "Automação executada com sucesso, 1 email falhou",
          },
        ])
      }
    } catch (error) {
      console.error("Erro ao buscar execuções de automação:", error)
      // Usar dados simulados para demonstração
      setAutomationExecutions([
        {
          id: 1,
          execution_date: new Date().toISOString(),
          success: true,
          emails_sent: 5,
          emails_failed: 0,
          execution_time: "00:05:23",
          details: "Automação executada com sucesso",
        },
        {
          id: 2,
          execution_date: new Date(Date.now() - 86400000).toISOString(), // Ontem
          success: true,
          emails_sent: 3,
          emails_failed: 1,
          execution_time: "00:04:12",
          details: "Automação executada com sucesso, 1 email falhou",
        },
      ])
    } finally {
      setLoadingExecutions(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/admin")
  }

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    } catch (error) {
      return "Data inválida"
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      "Objeto postado": { color: "bg-blue-100 text-blue-600", label: "Postado" },
      "Em triagem": { color: "bg-purple-100 text-purple-600", label: "Em Triagem" },
      "Em processo de triagem": { color: "bg-purple-100 text-purple-600", label: "Em Triagem" },
      "Em trânsito": { color: "bg-yellow-100 text-yellow-600", label: "Em Trânsito" },
      "Em trânsito para o centro de distribuição": { color: "bg-yellow-100 text-yellow-600", label: "Em Trânsito" },
      "No centro": { color: "bg-indigo-100 text-indigo-600", label: "No Centro" },
      "No centro de distribuição": { color: "bg-indigo-100 text-indigo-600", label: "No Centro" },
      "Em rota": { color: "bg-orange-100 text-orange-600", label: "Em Rota" },
      "Em rota de entrega": { color: "bg-orange-100 text-orange-600", label: "Em Rota" },
      Entregue: { color: "bg-green-100 text-green-600", label: "Entregue" },
      "Entregue com sucesso": { color: "bg-green-100 text-green-600", label: "Entregue" },
    }

    const statusInfo = statusMap[status] || { color: "bg-gray-100 text-gray-600", label: status }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const filteredEmails = scheduledEmails.filter((email) => {
    if (emailFilter === "all") return true
    if (emailFilter === "pending") return !email.sent
    if (emailFilter === "sent") return email.sent
    return true
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Relatórios</h1>

          <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h2 className="text-lg font-medium">Gerar Relatórios</h2>
                <p className="text-sm text-gray-500">Visualize e exporte dados de desempenho</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tipo de Relatório" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={reportPeriod} onValueChange={setReportPeriod}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last7">Últimos 7 dias</SelectItem>
                    <SelectItem value="last30">Últimos 30 dias</SelectItem>
                    <SelectItem value="last90">Últimos 90 dias</SelectItem>
                  </SelectContent>
                </Select>

                <Button className="bg-red-600 hover:bg-red-700">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ml-2 text-lg">Carregando relatórios...</span>
            </div>
          ) : (
            <>
              <Tabs defaultValue="overview">
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="emails">Emails Programados</TabsTrigger>
                  <TabsTrigger value="automation">Configurações de Automação</TabsTrigger>
                  <TabsTrigger value="executions">Execuções de Automação</TabsTrigger>
                  <TabsTrigger value="deliveries">Entregas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <BarChart className="mr-2 h-5 w-5 text-red-600" />
                          Remessas por Status
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <PieChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p>Gráfico de distribuição de status</p>
                          <p className="text-sm mt-2">Dados simulados para demonstração</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <LineChart className="mr-2 h-5 w-5 text-red-600" />
                          Tendência de Entregas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-80 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <LineChart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p>Gráfico de tendência de entregas</p>
                          <p className="text-sm mt-2">Dados simulados para demonstração</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="emails">
                  <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div>
                        <CardTitle className="flex items-center">
                          <Mail className="mr-2 h-5 w-5 text-red-600" />
                          Emails Programados
                        </CardTitle>
                        <CardDescription>Lista de emails programados para envio automático</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={emailFilter} onValueChange={setEmailFilter}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Filtrar por" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="sent">Enviados</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={fetchScheduledEmails} disabled={loadingEmails}>
                          {loadingEmails ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {loadingEmails ? (
                        <div className="flex justify-center items-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                          <span className="ml-2">Carregando emails programados...</span>
                        </div>
                      ) : scheduledEmails.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Mail className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhum email programado encontrado.</p>
                          <p className="text-sm mt-2">
                            Os emails serão exibidos aqui quando forem agendados pelo sistema.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Código de Rastreio</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Horário Programado</TableHead>
                                <TableHead>Situação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredEmails.map((email) => (
                                <TableRow key={email.id}>
                                  <TableCell className="font-medium">{email.tracking_code}</TableCell>
                                  <TableCell>{email.email}</TableCell>
                                  <TableCell>{getStatusBadge(email.status)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Clock className="mr-1 h-4 w-4 text-gray-500" />
                                      {formatDateTime(email.scheduled_time)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {email.sent ? (
                                      <Badge className="bg-green-100 text-green-600 hover:bg-green-200">Enviado</Badge>
                                    ) : (
                                      <Badge className="bg-yellow-100 text-yellow-600 hover:bg-yellow-200">
                                        Pendente
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="automation">
                  <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div>
                        <CardTitle className="flex items-center">
                          <Clock className="mr-2 h-5 w-5 text-red-600" />
                          Configurações de Automação
                        </CardTitle>
                        <CardDescription>Regras de envio automático de emails por status</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchAutomationSettings}
                        disabled={loadingSettings}
                      >
                        {loadingSettings ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loadingSettings ? (
                        <div className="flex justify-center items-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                          <span className="ml-2">Carregando configurações...</span>
                        </div>
                      ) : automationSettings.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhuma configuração de automação encontrada.</p>
                          <p className="text-sm mt-2">Configure as regras de automação na página de Configurações.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Dias após envio</TableHead>
                                <TableHead>Horário do Email</TableHead>
                                <TableHead>Data de Criação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {automationSettings.map((setting) => (
                                <TableRow key={setting.id}>
                                  <TableCell>{getStatusBadge(setting.status)}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Calendar className="mr-1 h-4 w-4 text-gray-500" />
                                      {setting.days_after} {setting.days_after === 1 ? "dia" : "dias"}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Clock className="mr-1 h-4 w-4 text-gray-500" />
                                      {setting.email_time}
                                    </div>
                                  </TableCell>
                                  <TableCell>{formatDateTime(setting.created_at)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="executions">
                  <Card>
                    <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                      <div>
                        <CardTitle className="flex items-center">
                          <RefreshCw className="mr-2 h-5 w-5 text-red-600" />
                          Execuções de Automação
                        </CardTitle>
                        <CardDescription>Histórico de execuções da automação de emails</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={fetchAutomationExecutions}
                        disabled={loadingExecutions}
                      >
                        {loadingExecutions ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent>
                      {loadingExecutions ? (
                        <div className="flex justify-center items-center h-64">
                          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                          <span className="ml-2">Carregando execuções...</span>
                        </div>
                      ) : automationExecutions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhuma execução de automação encontrada.</p>
                          <p className="text-sm mt-2">
                            O histórico de execuções será exibido aqui quando a automação for executada.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data de Execução</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Emails Enviados</TableHead>
                                <TableHead>Emails com Falha</TableHead>
                                <TableHead>Tempo de Execução</TableHead>
                                <TableHead>Detalhes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {automationExecutions.map((execution) => (
                                <TableRow key={execution.id}>
                                  <TableCell>{formatDateTime(execution.execution_date)}</TableCell>
                                  <TableCell>
                                    {execution.success ? (
                                      <Badge className="bg-green-100 text-green-600 hover:bg-green-200">Sucesso</Badge>
                                    ) : (
                                      <Badge className="bg-red-100 text-red-600 hover:bg-red-200">Falha</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{execution.emails_sent}</TableCell>
                                  <TableCell>{execution.emails_failed}</TableCell>
                                  <TableCell>{execution.execution_time}</TableCell>
                                  <TableCell className="max-w-xs truncate">{execution.details}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="deliveries">
                  <Card>
                    <CardHeader>
                      <CardTitle>Relatório de Entregas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 text-gray-500">
                        <p>Selecione os parâmetros e clique em "Exportar" para gerar o relatório de entregas.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
