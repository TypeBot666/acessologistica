"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function SimularWebhookPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [payloadType, setPayloadType] = useState("mercadopago")
  const [customPayload, setCustomPayload] = useState("")

  // Exemplos de payloads para diferentes plataformas
  const payloads = {
    mercadopago: {
      action: "payment.created",
      data: {
        id: "MP-" + Date.now(),
        status: "approved",
        payer: {
          first_name: "João",
          last_name: "Silva",
          email: "joao.silva@exemplo.com",
          phone: {
            number: "11999998888",
          },
          identification: {
            number: "123.456.789-00",
          },
        },
        shipping_address: {
          street_name: "Rua Exemplo",
          street_number: "123",
          neighborhood: "Centro",
          city: "São Paulo",
          state: "SP",
          zip_code: "01234-567",
        },
        additional_info: {
          items: [
            {
              title: "Produto Teste MercadoPago",
              quantity: 2,
              unit_price: 50,
            },
          ],
        },
      },
    },
    pagseguro: {
      transaction: {
        code: "PS-" + Date.now(),
        status: "3", // 3 = pago
        sender: {
          name: "Maria Souza",
          email: "maria.souza@exemplo.com",
          phone: {
            areaCode: "11",
            number: "999998888",
          },
          documents: [
            {
              type: "CPF",
              value: "987.654.321-00",
            },
          ],
        },
        shipping: {
          address: {
            street: "Avenida Teste",
            number: "456",
            complement: "Apto 789",
            district: "Jardim",
            city: "Rio de Janeiro",
            state: "RJ",
            postalCode: "98765-432",
          },
        },
        items: {
          item: [
            {
              description: "Produto Teste PagSeguro",
              quantity: "1",
              weight: "0.8",
            },
          ],
        },
      },
    },
    stripe: {
      event: "payment_intent.succeeded",
      data: {
        object: {
          id: "ST-" + Date.now(),
          status: "succeeded",
          customer_details: {
            name: "Carlos Pereira",
            email: "carlos.pereira@exemplo.com",
            phone: "11999997777",
            address: {
              line1: "Rua das Flores, 789",
              city: "Belo Horizonte",
              state: "MG",
              postal_code: "30123-456",
            },
          },
        },
      },
    },
    generico: {
      order_id: "GEN-" + Date.now(),
      payment_status: "approved",
      customer: {
        name: "Ana Oliveira",
        email: "ana.oliveira@exemplo.com",
        phone: "11999996666",
        document: "111.222.333-44",
      },
      shipping_address: {
        street: "Rua dos Exemplos",
        number: "321",
        complement: "Bloco B",
        neighborhood: "Vila Exemplo",
        city: "Curitiba",
        state: "PR",
        postal_code: "80123-456",
      },
      items: [
        {
          name: "Produto Teste Genérico",
          quantity: 3,
          weight: 0.3,
        },
      ],
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      // Determinar qual payload usar
      let payload
      if (payloadType === "custom") {
        try {
          payload = JSON.parse(customPayload)
        } catch (error) {
          setResult({
            error: "JSON inválido. Verifique o formato do seu payload personalizado.",
          })
          setLoading(false)
          return
        }
      } else {
        payload = payloads[payloadType as keyof typeof payloads]
      }

      // Enviar para o endpoint de webhook
      const response = await fetch("/api/webhook/whitelabel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResult({
        status: response.status,
        data,
      })
    } catch (error) {
      console.error("Erro:", error)
      setResult({
        error: "Falha ao processar a requisição: " + (error instanceof Error ? error.message : String(error)),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Simular Webhook</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Enviar Payload de Teste</h2>
          <p className="mb-4 text-gray-600">
            Use este formulário para simular o recebimento de um webhook de diferentes plataformas de pagamento.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="payloadType">Tipo de Payload</Label>
              <select
                id="payloadType"
                value={payloadType}
                onChange={(e) => setPayloadType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded mt-1"
              >
                <option value="mercadopago">MercadoPago</option>
                <option value="pagseguro">PagSeguro</option>
                <option value="stripe">Stripe</option>
                <option value="generico">Formato Genérico</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            {payloadType === "custom" && (
              <div>
                <Label htmlFor="customPayload">Payload Personalizado (JSON)</Label>
                <Textarea
                  id="customPayload"
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder='{"order_id": "123", "payment_status": "approved", ...}'
                  className="mt-1 h-64 font-mono"
                />
              </div>
            )}

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Simular Webhook"
              )}
            </Button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Resultado</h2>

          {result ? (
            <div>
              <div
                className={`p-4 rounded mb-4 ${
                  result.error || (result.status && result.status >= 400)
                    ? "bg-red-100 text-red-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {result.error ? (
                  <p className="font-semibold">{result.error}</p>
                ) : (
                  <>
                    <p className="font-semibold">
                      Status: {result.status} {result.status < 400 ? "✓" : "✗"}
                    </p>
                    {result.data && result.data.tracking_code && (
                      <p className="mt-2">
                        Código de Rastreio: <span className="font-mono font-bold">{result.data.tracking_code}</span>
                      </p>
                    )}
                    {result.data && result.data.message && <p className="mt-2">{result.data.message}</p>}
                  </>
                )}
              </div>

              <div className="mt-4">
                <p className="font-semibold mb-2">Detalhes da resposta:</p>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
                  {JSON.stringify(result.data || result, null, 2)}
                </pre>
              </div>

              {result.data && result.data.tracking_code && (
                <div className="mt-4">
                  <Link
                    href={`/rastreio?codigo=${result.data.tracking_code}`}
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    target="_blank"
                  >
                    Ver Rastreio
                  </Link>{" "}
                  <Link
                    href="/admin/integracoes/webhook-remessas"
                    className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
                  >
                    Ver Todas as Remessas
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded text-center">
              <p className="text-gray-500">Os resultados aparecerão aqui após simular um webhook.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mt-8">
        <h2 className="text-2xl font-semibold mb-4">Como Implementar em Produção</h2>

        <p className="mb-4">Para implementar esta integração em um ambiente de produção, você precisará:</p>

        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>Hospedar o sistema em um servidor acessível publicamente (como Vercel, Netlify, AWS, etc.)</li>
          <li>Configurar o webhook na sua plataforma de pagamento com a URL pública do seu servidor</li>
          <li>Adicionar autenticação ao endpoint de webhook para maior segurança (como tokens ou assinaturas)</li>
        </ol>

        <div className="bg-yellow-100 p-4 rounded">
          <p className="font-semibold">Importante:</p>
          <p>
            O ambiente v0.dev é apenas para desenvolvimento e não pode receber requisições externas. Para testar com
            webhooks reais, você precisará implantar o código em um servidor público.
          </p>
        </div>
      </div>
    </div>
  )
}
