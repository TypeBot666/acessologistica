"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { AdminHeader } from "@/components/admin/admin-header"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { useRouter } from "next/navigation"

export default function TestEmailPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("admin-auth")
    if (isAuthenticated !== "true") {
      router.push("/admin")
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("admin-auth")
    router.push("/admin")
  }

  const handleSendTestEmail = async () => {
    if (!email) {
      toast({
        title: "Email necessário",
        description: "Por favor, informe um endereço de email para o teste.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/test-email?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      setResult(data)

      if (data.success) {
        toast({
          title: "Email enviado",
          description: "O email de teste foi enviado com sucesso. Verifique sua caixa de entrada e pasta de spam.",
        })
      } else {
        toast({
          title: "Falha no envio",
          description: `Erro: ${data.error || "Falha ao enviar email"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro:", error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      })

      toast({
        title: "Erro",
        description: "Ocorreu um erro ao tentar enviar o email de teste.",
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

        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">Teste de Email</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Enviar Email de Teste</h2>
              <p className="mb-4 text-gray-600">
                Use este formulário para testar se o sistema de email está funcionando corretamente.
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email para Teste</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu-email@exemplo.com"
                    className="mt-1"
                  />
                </div>

                <Button onClick={handleSendTestEmail} disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Email de Teste"
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Resultado</h2>

              {result ? (
                <div>
                  {result.success ? (
                    <div className="bg-green-100 p-4 rounded mb-4">
                      <p className="text-green-800 font-semibold">Email enviado com sucesso!</p>
                      <p className="mt-2">
                        ID da mensagem: <span className="font-mono">{result.details?.messageId || "N/A"}</span>
                      </p>
                      <p className="mt-1">
                        Enviado para: <span className="font-medium">{result.details?.to || email}</span>
                      </p>
                    </div>
                  ) : (
                    <div className="bg-red-100 p-4 rounded mb-4">
                      <p className="text-red-800 font-semibold">Falha ao enviar email</p>
                      <p className="mt-2">Erro: {result.error}</p>

                      {result.config && (
                        <div className="mt-4">
                          <p className="font-medium">Configuração SMTP:</p>
                          <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                            <li>Host: {result.config.host || "não configurado"}</li>
                            <li>Porta: {result.config.port || "não configurada"}</li>
                            <li>Seguro: {result.config.secure ? "Sim" : "Não"}</li>
                            <li>Usuário: {result.config.user}</li>
                            <li>Senha: {result.config.pass}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="font-semibold mb-2">Detalhes completos:</p>
                    <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded text-center">
                  <p className="text-gray-500">Os resultados aparecerão aqui após enviar um email de teste.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Solução de Problemas</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">Verificações Comuns:</h3>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Verifique se as variáveis de ambiente estão configuradas corretamente no Vercel</li>
                  <li>
                    Se estiver usando Gmail, verifique se "Apps menos seguros" está ativado ou se está usando uma senha
                    de app
                  </li>
                  <li>Verifique a pasta de spam do seu email</li>
                  <li>Confirme se a porta SMTP (587) não está bloqueada pela sua rede</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-lg">Configuração do Gmail:</h3>
                <ol className="list-decimal pl-5 mt-2 space-y-1">
                  <li>Acesse sua conta Google</li>
                  <li>Vá para "Segurança" e ative a verificação em duas etapas</li>
                  <li>Depois, crie uma "Senha de app" específica para este aplicativo</li>
                  <li>Use essa senha no lugar da sua senha normal do Gmail</li>
                </ol>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
