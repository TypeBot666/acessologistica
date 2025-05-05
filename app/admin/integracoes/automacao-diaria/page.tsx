"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function DailyAutomationPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [lastRun, setLastRun] = useState<any>(null)
  const [scheduledEmails, setScheduledEmails] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("status")

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)

        // Carregar configurações de automação
        const settingsResponse = await fetch("/api/automation-settings")
        const settingsData = await settingsResponse.json()

        if (settingsData.success && settingsData.settings) {
          setSettings(settingsData.settings)
        }

        // Carregar informações sobre a última execução
        const testResponse = await fetch("/api/test-automation-config")
        const testData = await testResponse.json()

        if (testData.success) {
          setLastRun(testData.lastRun || null)
        }

        // Carregar emails agendados
        await loadScheduledEmails()
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados de automação.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const loadScheduledEmails = async () => {
    try {
      const response = await fetch("/api/scheduled-emails")
      const data = await response.json()

      if (data.success) {
        setScheduledEmails(data.emails || [])
      } else {
        console.error("Erro ao carregar emails agendados:", data.message)
      }
    } catch (error) {
      console.error("Erro ao carregar emails agendados:", error)
    }
  }

  const runAutomation = async () => {
    try {
      setRunning(true)

      const response = await fetch("/api/run-automation")
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Automação executada com sucesso.",
        })

        // Recarregar dados
        const testResponse = await fetch("/api/test-automation-config")
        const testData = await testResponse.json()

        if (testData.success) {
          setLastRun(testData.lastRun || null)
        }

        // Recarregar emails agendados
        await loadScheduledEmails()
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao executar automação.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao executar automação:", error)
      toast({
        title: "Erro",
        description: "Não foi possível executar a automação.",
        variant: "destructive",
      })
    } finally {
      setRunning(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A"

    const date = new Date(dateString)
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automação Diária</CardTitle>
        <CardDescription>Teste e configure a automação diária de atualização de status</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="scheduled">Emails Agendados</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Status da Automação</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2 mb-4">
                      {settings?.enabled ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-green-600">Ativada</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <span className="font-medium text-amber-600">Desativada</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Etapas configuradas:</span>
                        <span className="font-medium">{settings?.steps?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Última execução:</span>
                        <span className="font-medium">{lastRun ? formatDateTime(lastRun.timestamp) : "Nunca"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Próxima execução:</span>
                        <span className="font-medium">08:00 (diariamente)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Última Execução</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lastRun ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Data/Hora:</span>
                          <span className="font-medium">{formatDateTime(lastRun.timestamp)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <Badge variant={lastRun.success ? "success" : "destructive"}>
                            {lastRun.success ? "Sucesso" : "Falha"}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Remessas atualizadas:</span>
                          <span className="font-medium">{lastRun.updatedCount || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Emails enviados:</span>
                          <span className="font-medium">{lastRun.emailsSent || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Emails agendados:</span>
                          <span className="font-medium">{lastRun.emailsScheduled || 0}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">Nenhuma execução registrada</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Como funciona?</h3>
                <p className="text-sm text-blue-700 mb-2">
                  A automação é executada diariamente às 8:00 da manhã. Ela verifica quais remessas precisam ser
                  atualizadas com base nas etapas configuradas e atualiza o status automaticamente.
                </p>
                <p className="text-sm text-blue-700">
                  Os emails são enviados no horário configurado para cada etapa. Se o horário já passou no dia, o email
                  é enviado imediatamente. Se o horário ainda não chegou, o email é agendado para ser enviado no horário
                  configurado.
                </p>
              </div>

              <Button onClick={runAutomation} disabled={running} className="w-full">
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executando...
                  </>
                ) : (
                  "Executar Automação Agora"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="scheduled">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Emails Agendados</h3>
                <Button variant="outline" size="sm" onClick={loadScheduledEmails}>
                  Atualizar
                </Button>
              </div>

              {scheduledEmails.length > 0 ? (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Remessa</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Agendado para</TableHead>
                        <TableHead>Situação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scheduledEmails.map((email) => (
                        <TableRow key={email.id}>
                          <TableCell>{email.shipment_id}</TableCell>
                          <TableCell>{email.status}</TableCell>
                          <TableCell>{formatDateTime(email.scheduled_time)}</TableCell>
                          <TableCell>
                            {email.sent ? (
                              <Badge variant="success" className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" /> Enviado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" /> Aguardando
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Nenhum email agendado</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="config">
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-amber-800 mb-2">Configuração do Cron Job</h3>
                <p className="text-sm text-amber-700 mb-2">
                  Para que a automação funcione corretamente, é necessário configurar um Cron Job na Vercel. O Cron Job
                  deve ser configurado para executar diariamente às 8:00 da manhã.
                </p>
                <div className="bg-white p-2 rounded border border-amber-200 mb-2">
                  <p className="text-sm font-mono">URL: /api/cron/daily-automation</p>
                  <p className="text-sm font-mono">Expressão Cron: 0 8 * * *</p>
                </div>
                <p className="text-sm text-amber-700">
                  Você pode configurar o Cron Job no painel da Vercel, na seção de Configurações do seu projeto.
                </p>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Etapas Configuradas</CardTitle>
                </CardHeader>
                <CardContent>
                  {settings?.steps?.length > 0 ? (
                    <div className="space-y-3">
                      {settings.steps.map((step: any, index: number) => (
                        <div key={index} className="p-3 border rounded-md">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">Etapa {index + 1}</span>
                            <Badge>{step.daysAfterShipping} dias após envio</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Novo Status:</span>{" "}
                              <span className="font-medium">{step.status}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Status Anterior:</span>{" "}
                              <span className="font-medium">{step.previousStatus || "Qualquer"}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Horário do Email:</span>{" "}
                              <span className="font-medium">{step.emailTime || "08:00"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">Nenhuma etapa configurada</div>
                  )}
                </CardContent>
              </Card>

              <Button onClick={() => (window.location.href = "/admin/configuracoes/automacao")} className="w-full">
                Editar Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => (window.location.href = "/admin/integracoes")} className="w-full">
          Voltar
        </Button>
      </CardFooter>
    </Card>
  )
}
