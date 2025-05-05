"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, AlertTriangle, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { checkDatabaseStatus } from "@/lib/database-check"

export default function InitializeDatabasePage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [checkingDb, setCheckingDb] = useState(true)

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

      // Se o banco já estiver configurado, mostrar mensagem
      if (status.connected && status.tableExists) {
        setResult({
          success: true,
          message: "O banco de dados já está configurado corretamente.",
          tables: {
            system_settings: true,
            automation_settings: true,
            scheduled_emails: true,
          },
        })
      }
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

  const initializeDatabase = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch("/api/initialize-database")
      const data = await response.json()

      setResult(data)

      if (data.success) {
        // Se a inicialização foi bem-sucedida, atualizar o localStorage
        localStorage.setItem("ignore-table-check", "false")
      }
    } catch (error) {
      console.error("Erro ao inicializar banco de dados:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido ao inicializar banco de dados")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold">Inicialização do Banco de Dados</h1>
          </div>

          <Card className="shadow-sm border-t-4 border-t-blue-600 mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5 text-blue-600" />
                Inicializar Banco de Dados
              </CardTitle>
              <CardDescription>
                Esta ferramenta irá criar todas as tabelas necessárias para o funcionamento do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkingDb ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span>Verificando banco de dados...</span>
                </div>
              ) : dbStatus && dbStatus.connected && dbStatus.tableExists ? (
                <Alert className="mb-4">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Banco de dados já configurado</AlertTitle>
                  <AlertDescription>
                    O banco de dados já está conectado e todas as tabelas necessárias estão configuradas. Não é
                    necessário inicializar novamente.
                  </AlertDescription>
                </Alert>
              ) : null}
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Atenção</AlertTitle>
                <AlertDescription>
                  Esta operação irá criar ou recriar as tabelas do sistema. As tabelas existentes não serão afetadas,
                  mas é recomendado fazer um backup antes de prosseguir.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-4">
                <p>Ao clicar no botão abaixo, o sistema irá criar as seguintes tabelas:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>system_settings - Configurações do sistema</li>
                  <li>automation_settings - Configurações de automação para relatórios</li>
                  <li>scheduled_emails - Emails agendados</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              <Button onClick={initializeDatabase} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inicializando...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Inicializar Banco de Dados
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {result && (
            <Card className={`shadow-sm border-t-4 ${result.success ? "border-t-green-600" : "border-t-red-600"}`}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {result.success ? (
                    <>
                      <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                      Inicialização Concluída
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-5 w-5 text-red-600" />
                      Erro na Inicialização
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{result.message}</p>

                {result.tables && (
                  <div className="space-y-2">
                    <p className="font-medium">Status das tabelas:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>system_settings</span>
                        <Badge variant={result.tables.system_settings ? "success" : "destructive"}>
                          {result.tables.system_settings ? "Criada" : "Erro"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>automation_settings</span>
                        <Badge variant={result.tables.automation_settings ? "success" : "destructive"}>
                          {result.tables.automation_settings ? "Criada" : "Erro"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span>scheduled_emails</span>
                        <Badge variant={result.tables.scheduled_emails ? "success" : "destructive"}>
                          {result.tables.scheduled_emails ? "Criada" : "Erro"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {result.error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{result.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Button variant="outline" onClick={() => router.push("/admin/configuracoes/automacao")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Configurações
                </Button>

                <Button onClick={initializeDatabase} disabled={loading} variant="outline">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inicializando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Tentar Novamente
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}

          {error && !result && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    </div>
  )
}
