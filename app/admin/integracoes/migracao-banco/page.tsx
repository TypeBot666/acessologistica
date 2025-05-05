"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { Loader2, Database, Check, AlertTriangle, RefreshCw, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function MigracaoBancoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [tableExists, setTableExists] = useState(false)
  const [hasSettings, setHasSettings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sqlScript, setSqlScript] = useState<string>("")

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
      return
    }

    checkTableStatus()
  }, [router])

  const checkTableStatus = async () => {
    try {
      setLoading(true)
      setError(null)

      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/database-migration?t=${timestamp}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao verificar status da tabela")
      }

      console.log("Resposta da API:", data)

      setTableExists(data.exists)
      setHasSettings(data.hasSettings)
      setSqlScript(data.sqlScript || "")

      if (data.exists) {
        toast({
          title: "Tabela encontrada",
          description: "A tabela system_settings foi encontrada no banco de dados",
        })
      }
    } catch (error) {
      console.error("Erro ao verificar status da tabela:", error)
      setError(error instanceof Error ? error.message : "Erro ao verificar status da tabela")
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao verificar status da tabela",
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

  const executeMigration = async () => {
    try {
      setExecuting(true)
      setError(null)

      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/database-migration?t=${timestamp}`, {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: data.message,
        })
      } else {
        toast({
          title: "Atenção",
          description: data.message || "É necessário criar a tabela manualmente",
          variant: "warning",
        })
      }

      // Atualizar o status após a migração
      checkTableStatus()
    } catch (error) {
      console.error("Erro ao executar migração:", error)
      setError(error instanceof Error ? error.message : "Erro ao executar migração")
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao executar migração",
        variant: "destructive",
      })
    } finally {
      setExecuting(false)
    }
  }

  const forceReload = () => {
    // Limpar o cache do navegador e recarregar a página
    window.location.reload(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "SQL copiado para a área de transferência",
    })
  }

  const navigateToAutomationTest = () => {
    router.push("/admin/integracoes/teste-automacao")
  }

  const openSupabasePanel = () => {
    window.open("https://supabase.com/dashboard", "_blank")
  }

  const createCheckFunction = async () => {
    try {
      setExecuting(true)
      setError(null)

      const response = await fetch("/api/create-check-function", {
        method: "POST",
      })
      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Função de verificação criada com sucesso",
        })
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao criar função de verificação",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar função:", error)
      setError(error instanceof Error ? error.message : "Erro ao criar função")
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar função",
        variant: "destructive",
      })
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} onLogout={handleLogout} />

      <div className="flex">
        <AdminSidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Migração do Banco de Dados</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Status da Tabela System Settings</CardTitle>
              <CardDescription>
                Esta página verifica se a tabela necessária para as configurações de automação existe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                  <span className="ml-2">Verificando status da tabela...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Status da Tabela</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {tableExists ? (
                            <Check className="h-6 w-6 text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                          )}
                          <span>
                            {tableExists ? "A tabela system_settings existe" : "A tabela system_settings não existe"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Configurações de Automação</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {hasSettings ? (
                            <Check className="h-6 w-6 text-green-500 mr-2" />
                          ) : (
                            <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
                          )}
                          <span>
                            {hasSettings
                              ? "Configurações de automação encontradas"
                              : "Configurações de automação não encontradas"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Erro</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Alert variant={tableExists ? "default" : "warning"}>
                    <Database className="h-4 w-4" />
                    <AlertTitle>Informação</AlertTitle>
                    <AlertDescription>
                      {tableExists && hasSettings
                        ? "O sistema está configurado corretamente. Você pode testar a automação agora."
                        : tableExists
                          ? "A tabela existe, mas as configurações de automação não foram encontradas. Clique em 'Verificar Configurações' para tentar criar as configurações padrão."
                          : "A tabela system_settings não existe. É necessário criá-la manualmente no painel do Supabase usando o SQL fornecido abaixo."}
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-4 sm:justify-between">
              <div className="flex gap-2">
                <Button variant="outline" onClick={checkTableStatus} disabled={loading || executing}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Verificar Novamente
                </Button>

                <Button variant="secondary" onClick={forceReload}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Forçar Recarga
                </Button>
              </div>

              <div className="flex gap-2">
                {tableExists && hasSettings ? (
                  <Button onClick={navigateToAutomationTest}>Testar Automação</Button>
                ) : tableExists ? (
                  <Button onClick={executeMigration} disabled={executing || loading}>
                    {executing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verificando Configurações...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Verificar Configurações
                      </>
                    )}
                  </Button>
                ) : (
                  <Button onClick={openSupabasePanel} variant="secondary">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Painel do Supabase
                  </Button>
                )}
                <Button variant="outline" onClick={createCheckFunction} disabled={executing || loading}>
                  <Database className="mr-2 h-4 w-4" />
                  Criar Função de Verificação
                </Button>
              </div>
            </CardFooter>
          </Card>

          {!tableExists && (
            <Card>
              <CardHeader>
                <CardTitle>Instruções para Criação Manual da Tabela</CardTitle>
                <CardDescription>
                  Siga estas instruções para criar a tabela system_settings no painel do Supabase
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="relative">
                    <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">{sqlScript}</pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(sqlScript)}
                    >
                      <Copy className="h-4 w-4" />
                      <span className="sr-only">Copiar SQL</span>
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Como criar a tabela manualmente:</h3>
                    <ol className="list-decimal pl-5 space-y-2">
                      <li>Acesse o painel do Supabase</li>
                      <li>Vá para a seção "SQL Editor" ou "Table Editor"</li>
                      <li>Clique em "New Query" para criar uma nova consulta</li>
                      <li>Cole o SQL acima no editor</li>
                      <li>Clique em "Run" para executar o SQL</li>
                      <li>
                        Volte para esta página e clique em "Verificar Novamente" para confirmar que a tabela foi criada
                      </li>
                    </ol>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      Após criar a tabela, você precisará voltar a esta página e clicar em "Verificar Novamente" para
                      confirmar que a tabela foi criada corretamente. Em seguida, você poderá configurar a automação.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button onClick={openSupabasePanel} variant="secondary">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir Painel do Supabase
                  </Button>
                  <Button variant="outline" onClick={checkTableStatus}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Verificar Novamente
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
