"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Play, Settings, List, Clock, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function TesteAutomacaoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [configValid, setConfigValid] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [affectedShipments, setAffectedShipments] = useState<any[]>([])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    checkAutomationConfig()
  }, [router])

  const checkAutomationConfig = async () => {
    try {
      setLoading(true)
      setConfigError(null)

      // Verificar se a tabela system_settings existe
      const tableResponse = await fetch("/api/database-migration")
      const tableData = await tableResponse.json()

      if (!tableResponse.ok) {
        throw new Error(tableData.error || "Erro ao verificar tabela")
      }

      if (!tableData.exists) {
        setConfigError("A tabela system_settings não existe. Por favor, execute a migração do banco de dados primeiro.")
        setConfigValid(false)
        return
      }

      if (!tableData.hasSettings) {
        setConfigError("Configurações de automação não encontradas. Por favor, execute a migração do banco de dados.")
        setConfigValid(false)
        return
      }

      // Buscar configurações de automação
      const response = await fetch("/api/automation-settings")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar configurações de automação")
      }

      setSettings(data.settings)
      setConfigValid(true)

      // Buscar remessas que seriam afetadas pela automação
      const affectedResponse = await fetch("/api/run-automation?dryRun=true")
      const affectedData = await affectedResponse.json()

      if (!affectedResponse.ok) {
        console.error("Erro ao buscar remessas afetadas:", affectedData.error)
      } else {
        setAffectedShipments(affectedData.shipments || [])
      }
    } catch (error) {
      console.error("Erro ao verificar configuração de automação:", error)
      setConfigError(error instanceof Error ? error.message : "Erro ao verificar configuração de automação")
      setConfigValid(false)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao verificar configuração de automação",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/admin")
  }

  const executeAutomation = async () => {
    try {
      setExecuting(true)
      setLogs([])

      // Adicionar log inicial
      setLogs((prev) => [...prev, "Iniciando execução da automação..."])

      const response = await fetch("/api/run-automation", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao executar automação")
      }

      // Adicionar logs da resposta
      if (data.logs && Array.isArray(data.logs)) {
        setLogs((prev) => [...prev, ...data.logs])
      }

      setLogs((prev) => [...prev, `Automação concluída. ${data.updated || 0} remessas atualizadas.`])

      toast({
        title: "Sucesso",
        description: `Automação executada com sucesso. ${data.updated || 0} remessas atualizadas.`,
      })

      // Atualizar lista de remessas afetadas
      const affectedResponse = await fetch("/api/run-automation?dryRun=true")
      const affectedData = await affectedResponse.json()

      if (!affectedResponse.ok) {
        console.error("Erro ao buscar remessas afetadas:", affectedData.error)
      } else {
        setAffectedShipments(affectedData.shipments || [])
      }
    } catch (error) {
      console.error("Erro ao executar automação:", error)
      setLogs((prev) => [...prev, `ERRO: ${error instanceof Error ? error.message : String(error)}`])
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao executar automação",
        variant: "destructive",
      })
    } finally {
      setExecuting(false)
    }
  }

  const navigateToMigration = () => {
    router.push("/admin/integracoes/migracao-banco")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Teste de Automação</h1>

          {loading ? (
            <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-red-600 mr-2" />
              <span>Verificando configurações...</span>
            </div>
          ) : !configValid ? (
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Configuração Inválida</CardTitle>
                <CardDescription>É necessário configurar a automação antes de testá-la</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <Alert variant="destructive" className="text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Erro</AlertTitle>
                  <AlertDescription>{configError}</AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button onClick={navigateToMigration} size="sm">
                  Ir para Migração do Banco
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Tabs defaultValue="config" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 h-9">
                <TabsTrigger value="config" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Configurações
                </TabsTrigger>
                <TabsTrigger value="execution" className="text-xs">
                  <Play className="h-3 w-3 mr-1" />
                  Execução
                </TabsTrigger>
                <TabsTrigger value="logs" className="text-xs">
                  <List className="h-3 w-3 mr-1" />
                  Logs
                </TabsTrigger>
              </TabsList>

              <TabsContent value="config" className="mt-0">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Configurações de Automação</CardTitle>
                    <CardDescription className="text-xs">
                      Configurações atuais da automação de atualização de status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status:</span>
                        <Badge variant={settings?.enabled ? "success" : "destructive"} className="text-xs">
                          {settings?.enabled ? "Ativada" : "Desativada"}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="font-medium mb-1 text-sm">Etapas de Atualização:</h3>
                        <div className="space-y-1">
                          {settings?.steps?.map((step: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-xs"
                            >
                              <div className="flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-500" />
                                <span>{step.status}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {step.days} dias
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status Final:</span>
                        <Badge variant="outline" className="bg-green-50 text-xs">
                          {settings?.finalStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button variant="outline" onClick={checkAutomationConfig} size="sm" className="text-xs">
                      Atualizar
                    </Button>
                    <Button onClick={() => router.push("/admin/configuracoes/automacao")} size="sm" className="text-xs">
                      Editar Configurações
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="execution" className="mt-0">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Executar Automação</CardTitle>
                    <CardDescription className="text-xs">
                      Execute a automação manualmente para atualizar o status das remessas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-3">
                      <Alert className="text-xs py-2">
                        <AlertTriangle className="h-3 w-3" />
                        <AlertTitle className="text-xs">Atenção</AlertTitle>
                        <AlertDescription className="text-xs">
                          A execução manual irá atualizar o status de todas as remessas elegíveis.
                        </AlertDescription>
                      </Alert>

                      <div>
                        <h3 className="font-medium mb-1 text-sm">Remessas afetadas:</h3>
                        {affectedShipments.length === 0 ? (
                          <div className="bg-gray-50 p-2 rounded-md text-center text-gray-500 text-xs">
                            Nenhuma remessa será afetada pela automação
                          </div>
                        ) : (
                          <div className="max-h-40 overflow-y-auto border rounded-md">
                            <table className="min-w-full divide-y divide-gray-200 text-xs">
                              <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Código
                                  </th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status Atual
                                  </th>
                                  <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Novo Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {affectedShipments.map((shipment) => (
                                  <tr key={shipment.tracking_code}>
                                    <td className="px-2 py-1 whitespace-nowrap">{shipment.tracking_code}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{shipment.current_status}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">
                                      <Badge variant="outline" className="bg-blue-50 text-xs">
                                        {shipment.next_status}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button
                      onClick={executeAutomation}
                      disabled={executing || affectedShipments.length === 0}
                      className="w-full text-xs h-8"
                      size="sm"
                    >
                      {executing ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Executando...
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Executar Automação
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="mt-0">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Logs de Execução</CardTitle>
                    <CardDescription className="text-xs">Logs da última execução da automação</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="bg-black text-green-400 p-2 rounded-md font-mono text-xs h-40 overflow-y-auto">
                      {logs.length === 0 ? (
                        <div className="text-gray-500 italic text-xs">
                          Nenhum log disponível. Execute a automação para gerar logs.
                        </div>
                      ) : (
                        logs.map((log, index) => (
                          <div key={index} className="mb-1 text-xs">
                            {log.startsWith("ERRO:") ? (
                              <span className="text-red-400">{log}</span>
                            ) : log.includes("sucesso") || log.includes("concluída") ? (
                              <span className="text-green-500">{log}</span>
                            ) : (
                              <span>{log}</span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button variant="outline" onClick={() => setLogs([])} size="sm" className="text-xs h-8">
                      Limpar Logs
                    </Button>
                    <Button onClick={executeAutomation} disabled={executing} size="sm" className="text-xs h-8">
                      {executing ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Executando...
                        </>
                      ) : (
                        <>
                          <Play className="mr-1 h-3 w-3" />
                          Executar
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  )
}
