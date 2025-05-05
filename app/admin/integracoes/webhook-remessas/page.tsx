"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export default function WebhookRemessasPage() {
  const [remessas, setRemessas] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    async function fetchRemessas() {
      try {
        setLoading(true)
        // Buscar remessas criadas via webhook (últimas 20)
        const { data, error } = await supabase
          .from("shipments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) {
          console.error("Erro ao buscar remessas:", error)
          setError(error)
        } else {
          setRemessas(data || [])
        }
      } catch (err) {
        console.error("Erro ao buscar remessas:", err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRemessas()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Remessas Criadas via Webhook</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Últimas Remessas</h2>
          <Link href="/api/docs" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
            Ver Documentação da API
          </Link>
        </div>

        {loading && (
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p>Carregando remessas...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 p-4 rounded mb-4">
            <p className="text-red-700">Erro ao buscar remessas: {error.message}</p>
          </div>
        )}

        {!loading && remessas.length === 0 && (
          <div className="bg-yellow-100 p-4 rounded mb-4">
            <p>Nenhuma remessa encontrada. Faça um teste enviando dados para o webhook.</p>
          </div>
        )}

        {!loading && remessas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Código</th>
                  <th className="py-3 px-6 text-left">Pedido</th>
                  <th className="py-3 px-6 text-left">Destinatário</th>
                  <th className="py-3 px-6 text-left">Status</th>
                  <th className="py-3 px-6 text-left">Data</th>
                  <th className="py-3 px-6 text-left">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {remessas.map((remessa) => (
                  <tr key={remessa.tracking_code} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-6 text-left whitespace-nowrap">
                      <span className="font-medium">{remessa.tracking_code}</span>
                    </td>
                    <td className="py-3 px-6 text-left">{remessa.order_id}</td>
                    <td className="py-3 px-6 text-left">
                      {remessa.recipient_name}
                      {remessa.customer_email && <div className="text-xs text-gray-500">{remessa.customer_email}</div>}
                    </td>
                    <td className="py-3 px-6 text-left">
                      <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs">
                        {remessa.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-left">
                      {remessa.created_at ? new Date(remessa.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3 px-6 text-left">
                      <Link
                        href={`/rastreio?codigo=${remessa.tracking_code}`}
                        className="text-blue-600 hover:text-blue-800"
                        target="_blank"
                      >
                        Ver Rastreio
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Como Testar o Webhook</h2>

        <div className="bg-gray-100 p-4 rounded mb-4">
          <p className="font-mono mb-2">URL do Webhook:</p>
          <p className="font-mono text-blue-600">
            {process.env.NEXT_PUBLIC_API_URL || "https://seu-dominio.com"}/api/webhook/whitelabel
          </p>
        </div>

        <p className="mb-4">Para testar o webhook, você pode:</p>

        <ol className="list-decimal pl-6 mb-4 space-y-2">
          <li>Configurar sua plataforma whitelabel para enviar dados para o URL acima</li>
          <li>Gerar um PIX na plataforma e completar o pagamento</li>
          <li>Verificar nesta página se a remessa foi criada</li>
        </ol>

        <div className="bg-yellow-100 p-4 rounded">
          <p className="font-semibold">Importante:</p>
          <p>
            O webhook aceita diferentes formatos de dados para compatibilidade com várias plataformas. Consulte a
            documentação para mais detalhes.
          </p>
        </div>
      </div>
    </div>
  )
}
