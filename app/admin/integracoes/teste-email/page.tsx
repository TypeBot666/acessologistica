"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail, CheckCircle, AlertTriangle } from "lucide-react"

export default function TesteEmailPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [emailResult, setEmailResult] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: "",
    trackingCode: "",
    recipientName: "",
    status: "Objeto postado",
  })

  const statusOptions = [
    "Objeto postado",
    "Em processo de triagem",
    "Em trânsito para o centro de distribuição",
    "No centro de distribuição",
    "Em rota de entrega",
    "Entregue com sucesso",
    "Entrega não realizada – destinatário ausente",
    "Objeto devolvido ao remetente",
    "Aguardando retirada em unidade",
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setEmailResult(null)

    try {
      // Validar dados
      if (!formData.email || !formData.trackingCode || !formData.recipientName || !formData.status) {
        throw new Error("Todos os campos são obrigatórios")
      }

      // Enviar email de teste
      const response = await fetch("/api/send-status-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          trackingCode: formData.trackingCode,
          recipientName: formData.recipientName,
          newStatus: formData.status,
          updateDate: new Date().toLocaleString("pt-BR"),
        }),
      })

      const data = await response.json()
      setEmailResult(data)

      if (response.ok) {
        toast({
          title: "Email enviado com sucesso",
          description: "O email de teste foi enviado para o destinatário.",
        })
      } else {
        throw new Error(data.error || "Erro ao enviar email")
      }
    } catch (error) {
      console.error("Erro ao enviar email de teste:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar email de teste",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCheckConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/check-env")
      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Configuração verificada",
          description: "As configurações de email estão corretas.",
        })
      } else {
        throw new Error(data.error || "Configurações de email incompletas")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao verificar configurações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Teste de Email</h1>

      <Tabs defaultValue="status">
        <TabsList className="mb-4">
          <TabsTrigger value="status">Email de Status</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Email de Atualização de Status</CardTitle>
              <CardDescription>
                Teste o envio de emails de atualização de status para verificar se estão funcionando corretamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email do Destinatário</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trackingCode">Código de Rastreio</Label>
                    <Input
                      id="trackingCode"
                      name="trackingCode"
                      placeholder="LOG-12345678-9012"
                      value={formData.trackingCode}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipientName">Nome do Destinatário</Label>
                    <Input
                      id="recipientName"
                      name="recipientName"
                      placeholder="Nome do Cliente"
                      value={formData.recipientName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={handleStatusChange}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Enviar Email de Teste
                    </>
                  )}
                </Button>
              </form>

              {emailResult && (
                <div className={`mt-6 p-4 rounded-md ${emailResult.success ? "bg-green-50" : "bg-red-50"}`}>
                  <div className="flex items-start">
                    {emailResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    )}
                    <div>
                      <h3 className={`font-medium ${emailResult.success ? "text-green-700" : "text-red-700"}`}>
                        {emailResult.success ? "Email enviado com sucesso" : "Erro ao enviar email"}
                      </h3>
                      <p className="text-sm mt-1">
                        {emailResult.message || emailResult.error || "Nenhuma mensagem adicional"}
                      </p>
                      {emailResult.details && (
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(emailResult.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Email</CardTitle>
              <CardDescription>Verifique e teste as configurações de email do sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-md">
                  <h3 className="font-medium text-yellow-800">Configurações atuais</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    As configurações de email são definidas através de variáveis de ambiente. Verifique se todas estão
                    configuradas corretamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Variáveis necessárias:</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>SMTP_HOST (ex: smtp.gmail.com)</li>
                      <li>SMTP_PORT (ex: 587)</li>
                      <li>SMTP_SECURE (true/false)</li>
                      <li>SMTP_USER (seu email)</li>
                      <li>SMTP_PASSWORD (senha ou chave de app)</li>
                    </ul>
                  </div>

                  <div>
                    <Button onClick={handleCheckConfig} disabled={loading} className="w-full">
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verificando...
                        </>
                      ) : (
                        "Verificar Configuração"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
