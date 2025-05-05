"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, Globe, Database, MailCheck, Zap, AlertTriangle, RefreshCw, Clock, Truck } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { checkDatabaseStatus } from "@/lib/database-check"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [checkingDb, setCheckingDb] = useState(true)

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    // Verificar status do banco de dados
    checkDbStatus()
  }, [router])

  const checkDbStatus = async () => {
    setCheckingDb(true)
    try {
      const status = await checkDatabaseStatus()
      setDbStatus(status)
    } catch (error) {
      console.error("Erro ao verificar banco de dados:", error)
    } finally {
      setCheckingDb(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/admin")
  }

  const handleSaveSettings = () => {
    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      })
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Configurações do Sistema</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5 text-red-600" />
                  Configurações Gerais
                </CardTitle>
                <CardDescription>Configure as opções gerais do sistema de logística</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="site-name">Nome do Site</Label>
                  <Input id="site-name" defaultValue="Sistema de Logística RBS" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL da API</Label>
                  <Input id="api-url" defaultValue={process.env.NEXT_PUBLIC_API_URL || "https://api.exemplo.com"} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Modo de Manutenção</p>
                    <p className="text-sm text-gray-500">Ativar modo de manutenção no site</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveSettings} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5 text-red-600" />
                  Banco de Dados
                </CardTitle>
                <CardDescription>Gerenciamento e status do banco de dados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {checkingDb ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Verificando banco de dados...</span>
                  </div>
                ) : dbStatus ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Status da Conexão:</p>
                        <span
                          className={`px-2 py-1 rounded text-xs ${dbStatus.connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {dbStatus.connected ? "Conectado" : "Desconectado"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="font-medium">Tabelas do Sistema:</p>
                        <span
                          className={`px-2 py-1 rounded text-xs ${dbStatus.tableExists ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                        >
                          {dbStatus.tableExists ? "Configuradas" : "Não Configuradas"}
                        </span>
                      </div>
                    </div>

                    {!dbStatus.connected || !dbStatus.tableExists ? (
                      <Alert variant="warning" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Atenção</AlertTitle>
                        <AlertDescription>
                          {!dbStatus.connected
                            ? "Não foi possível conectar ao banco de dados. Verifique as configurações de conexão."
                            : "As tabelas do sistema não estão configuradas. É necessário inicializar o banco de dados."}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="success" className="mt-2 bg-green-50 text-green-800 border-green-200">
                        <AlertTitle>Banco de dados configurado</AlertTitle>
                        <AlertDescription>
                          O banco de dados está conectado e todas as tabelas necessárias estão configuradas.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>Não foi possível verificar o status do banco de dados.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={checkDbStatus}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar Novamente
                </Button>

                {dbStatus && (!dbStatus.connected || !dbStatus.tableExists) && (
                  <Link href="/admin/integracoes/inicializar-banco">
                    <Button>
                      <Database className="mr-2 h-4 w-4" />
                      Inicializar Banco de Dados
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          </div>

          <h2 className="text-xl font-bold mb-4">Ferramentas de Teste</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <MailCheck className="mr-2 h-5 w-5 text-red-600" />
                  Teste de Email
                </CardTitle>
                <CardDescription>Verificação de envio de emails</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">
                  Teste a configuração de envio de emails para garantir que as notificações estão funcionando
                  corretamente.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/integracoes/teste-email" className="w-full">
                  <Button variant="outline" className="w-full">
                    Testar Email
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Zap className="mr-2 h-5 w-5 text-red-600" />
                  Simulação de Webhook
                </CardTitle>
                <CardDescription>Teste de recebimento de webhooks</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">
                  Simule o recebimento de webhooks para testar a integração com plataformas externas.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/integracoes/simular-webhook" className="w-full">
                  <Button variant="outline" className="w-full">
                    Simular Webhook
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="mr-2 h-5 w-5 text-red-600" />
                  Teste de Automação
                </CardTitle>
                <CardDescription>Teste da automação de status</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">
                  Teste a automação de atualização de status para verificar se está funcionando corretamente.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/integracoes/teste-automacao" className="w-full">
                  <Button variant="outline" className="w-full">
                    Testar Automação
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Truck className="mr-2 h-5 w-5 text-red-600" />
                  Remessas
                </CardTitle>
                <CardDescription>Gerenciamento de remessas</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">
                  Acesse as ferramentas de gerenciamento de remessas e webhooks para rastreamento de pedidos.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/integracoes/webhook-remessas" className="w-full">
                  <Button variant="outline" className="w-full">
                    Gerenciar Remessas
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Database className="mr-2 h-5 w-5 text-red-600" />
                  Inicializar Banco
                </CardTitle>
                <CardDescription>Configuração do banco de dados</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">
                  Inicialize e configure o banco de dados do sistema para garantir o funcionamento correto.
                </p>
              </CardContent>
              <CardFooter>
                <Link href="/admin/integracoes/inicializar-banco" className="w-full">
                  <Button variant="outline" className="w-full">
                    Inicializar Banco
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
