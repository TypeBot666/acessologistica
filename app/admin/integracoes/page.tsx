"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clipboard, Check } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function IntegracoesPage() {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // URL do webhook para integração
  const webhookUrl = `${window.location.origin}/api/webhook/checkout`

  // Verificar autenticação
  useEffect(() => {
    const auth = localStorage.getItem("admin-auth")
    if (auth !== "true") {
      window.location.href = "/admin"
    } else {
      setIsAuthenticated(true)
    }
  }, [])

  // Copiar URL para a área de transferência
  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast({
      title: "URL copiada!",
      description: "URL do webhook copiada para a área de transferência.",
    })

    setTimeout(() => setCopied(false), 3000)
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto py-8">
        <h1 className="mb-6 text-2xl font-bold">Integrações</h1>

        <Tabs defaultValue="checkout">
          <TabsList className="mb-4">
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          <TabsContent value="checkout">
            <Card>
              <CardHeader>
                <CardTitle>Integração com Checkout</CardTitle>
                <CardDescription>
                  Configure seu checkout para enviar dados de pedidos automaticamente para o sistema de logística.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL do Webhook</Label>
                  <div className="flex items-center space-x-2">
                    <Input id="webhook-url" value={webhookUrl} readOnly className="font-mono text-sm" />
                    <Button variant="outline" size="icon" onClick={copyToClipboard}>
                      {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Configure seu checkout para enviar dados do pedido para esta URL após a confirmação do pagamento.
                  </p>
                </div>

                <div className="rounded-md bg-amber-50 p-4">
                  <h3 className="font-medium text-amber-800">Instruções para Adoorei Checkout</h3>
                  <ol className="mt-2 list-decimal pl-5 text-sm text-amber-700">
                    <li>Acesse o painel administrativo da Adoorei</li>
                    <li>Vá para Configurações &gt; Integrações &gt; Webhooks</li>
                    <li>Adicione um novo webhook com a URL acima</li>
                    <li>Selecione os eventos: "Pedido Criado" e "Pagamento Confirmado"</li>
                    <li>Salve as configurações</li>
                  </ol>
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open("https://app.adoorei.com/", "_blank")}
                >
                  Ir para o Painel da Adoorei
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>Documentação da API</CardTitle>
                <CardDescription>Integre diretamente com nossa API para criar e gerenciar remessas.</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-md bg-gray-50 p-4">
                  <h3 className="font-mono text-sm font-bold">POST /api/webhook/checkout</h3>
                  <p className="mt-2 text-sm">Cria uma nova remessa a partir dos dados do pedido.</p>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Corpo da Requisição (JSON)</h4>
                    <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                      {`{
  "order_id": "12345",
  "customer": {
    "name": "Nome do Cliente",
    "email": "cliente@email.com",
    "phone": "11999998888",
    "document": "123.456.789-00"
  },
  "shipping_address": {
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 45",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "postal_code": "01234-567"
  },
  "items": [
    {
      "name": "Produto Exemplo",
      "quantity": 2,
      "weight": 0.5
    }
  ],
  "payment_status": "approved",
  "created_at": "2023-05-01T10:30:00Z"
}`}
                    </pre>
                  </div>

                  <div className="mt-4">
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Resposta (JSON)</h4>
                    <pre className="mt-1 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                      {`{
  "success": true,
  "tracking_code": "LOG-20230501-1234",
  "message": "Remessa criada com sucesso"
}`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
