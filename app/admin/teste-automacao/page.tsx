"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function TesteAutomacaoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    fetchSettings()
  }, [router])

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true)
      const response = await fetch("/api/automation-settings")
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/admin")
  }

  const runAutomation = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/cron/daily-automation")
      const data = await response.json()

      setResult({
        success: response.ok,
        data,
      })

      toast({
        title: response.ok ? "Sucesso" : "Erro",
        description: response.ok
          ? `Automação executada com sucesso. ${data.updated || 0} remessas atualizadas.`
          : `Erro ao executar automação: ${data.error || "Erro desconhecido"}`,
        variant: response.ok ? "default" : "destructive",
      })

      // Atualizar configurações após o teste
      fetchSettings()
    } catch (error) {
      console.error("Erro ao testar automação:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      })
      toast({
        title: "Erro",
        description: `Erro ao testar automação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Teste de Automação</h1>

          <div className="space-y-6">
            {/* Status da automação */}
            <Card>
              <CardHeader>
                <CardTitle>Status da Automação</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSettings ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Carregando configurações...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Status da automação:</span>
                      <Badge variant={settings?.enabled ? "success" : "destructive"}>
                        {settings?.enabled ? "ATIVADA" : "DESATIVADA"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Notificações por email:</span>
                      <Badge variant={settings?.emailNotifications ? "success" : "outline"}>
                        {settings?.emailNotifications ? "ATIVADAS" : "DESATIVADAS"}
                      </Badge>
                    </div>

                    {!settings?.enabled && (
                      <Alert variant="warning">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                          A automação está desativada. Ative-a nas configurações para que funcione diariamente.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.push("/admin/configuracoes/automacao")}>
                  Configurações
                </Button>
                <Button onClick={runAutomation} disabled={loading || !settings?.enabled}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    "Executar Automação Agora"
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Resultado do teste */}
            {result && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {result.success ? (
                      <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
                    ) : (
                      <AlertTriangle className="mr-2 h-5 w-5 text-red-500" />
                    )}
                    Resultado da Execução
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.success ? (
                    <div className="space-y-4">
                      <Alert variant={result.data.updated > 0 ? "success" : "default"}>
                        <AlertTitle>
                          {result.data.updated > 0
                            ? `${result.data.updated} remessas atualizadas com sucesso`
                            : "Nenhuma remessa precisou ser atualizada"}
                        </AlertTitle>
                        <AlertDescription>
                          {result.data.updated > 0
                            ? "As remessas foram atualizadas e os emails foram enviados (se configurado)."
                            : "Não havia remessas que precisassem de atualização neste momento."}
                        </AlertDescription>
                      </Alert>

                      {result.data.updated > 0 && result.data.shipments && (
                        <div>
                          <h3 className="font-medium mb-2">Remessas atualizadas:</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Código de Rastreio</TableHead>
                                <TableHead>Status Anterior</TableHead>
                                <TableHead>Novo Status</TableHead>
                                <TableHead>Email</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.data.shipments.map((shipment: any) => (
                                <TableRow key={shipment.tracking_code}>
                                  <TableCell className="font-medium">{shipment.tracking_code}</TableCell>
                                  <TableCell>{shipment.old_status}</TableCell>
                                  <TableCell className="flex items-center">
                                    <ArrowRight className="h-4 w-4 text-green-500 mx-1" />
                                    {shipment.new_status}
                                  </TableCell>
                                  <TableCell>
                                    {shipment.customer_email ? (
                                      <span className="text-xs">{shipment.customer_email}</span>
                                    ) : (
                                      <span className="text-xs text-gray-400">Sem email</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{result.data?.error || result.error || "Erro desconhecido"}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
