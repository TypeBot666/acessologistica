"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react"

export default function StatusAutomacaoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<any>(null)
  const [testingCron, setTestingCron] = useState(false)

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
      setLoading(true)
      const response = await fetch("/api/automation-settings")
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de automação",
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

  const testCronJob = async () => {
    try {
      setTestingCron(true)

      const response = await fetch("/api/cron/daily-automation")
      const data = await response.json()

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
      toast({
        title: "Erro",
        description: `Erro ao testar automação: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setTestingCron(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca executado"
    return new Date(dateString).toLocaleString("pt-BR")
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Status da Automação</h1>

          {loading ? (
            <div className="flex justify-center items-center h-32 bg-white rounded-lg shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin text-red-600 mr-2" />
              <span>Carregando...</span>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Automação Diária - 8:00 da manhã</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={settings?.enabled ? "success" : "destructive"} className="text-xs">
                    {settings?.enabled ? "ATIVADA" : "DESATIVADA"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Notificações por email:</span>
                  <Badge variant="success" className="text-xs">
                    ATIVADAS
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Horário de execução:</span>
                  <span>08:00 (horário do servidor)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-medium">Última execução:</span>
                  <div className="flex items-center">
                    <span className="mr-2">{formatDate(settings?.lastExecution)}</span>
                    {settings?.lastExecution &&
                      (settings?.lastExecutionSuccess ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ))}
                  </div>
                </div>

                {settings?.lastExecution && settings?.lastExecutionSuccess && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Remessas atualizadas:</span>
                    <span>{settings?.lastExecutionCount || 0}</span>
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={testCronJob} disabled={testingCron} className="w-full">
                    {testingCron ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Executando...
                      </>
                    ) : (
                      "Executar Automação Agora"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
