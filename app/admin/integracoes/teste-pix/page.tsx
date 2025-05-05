"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function TestePixPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [valor, setValor] = useState("100.00")
  const [cliente, setCliente] = useState("Cliente Teste")
  const [email, setEmail] = useState("cliente@teste.com")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(
        `/api/teste-pix?valor=${valor}&cliente=${encodeURIComponent(cliente)}&email=${encodeURIComponent(email)}`,
      )
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Erro:", error)
      setResult({ error: "Falha ao processar a requisição" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Teste de Integração PIX</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Simular Pagamento PIX</h2>
          <p className="mb-4 text-gray-600">
            Use este formulário para simular um pagamento PIX e testar a integração com o sistema de logística.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="valor">Valor do PIX</Label>
              <Input
                id="valor"
                type="text"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="100.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cliente">Nome do Cliente</Label>
              <Input
                id="cliente"
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Cliente Teste"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email do Cliente</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@teste.com"
                className="mt-1"
              />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Simular Pagamento PIX"
              )}
            </Button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Resultado</h2>

          {result ? (
            <div>
              {result.success ? (
                <div className="bg-green-100 p-4 rounded mb-4">
                  <p className="text-green-800 font-semibold">{result.message}</p>
                  <p className="mt-2">
                    Código de Rastreio: <span className="font-mono font-bold">{result.tracking_code}</span>
                  </p>
                </div>
              ) : (
                <div className="bg-red-100 p-4 rounded mb-4">
                  <p className="text-red-800 font-semibold">Erro: {result.error}</p>
                </div>
              )}

              <div className="mt-4">
                <p className="font-semibold mb-2">Detalhes da resposta:</p>
                <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">{JSON.stringify(result, null, 2)}</pre>
              </div>

              {result.tracking_code && (
                <div className="mt-4">
                  <Link
                    href={`/rastreio?codigo=${result.tracking_code}`}
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
              <p className="text-gray-500">Os resultados aparecerão aqui após simular um pagamento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
