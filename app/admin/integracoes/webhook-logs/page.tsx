"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientSupabaseClient } from "@/lib/supabase/client"

export default function WebhookLogsPage() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientSupabaseClient()

  useEffect(() => {
    async function fetchLogs() {
      try {
        setLoading(true)
        // Buscar logs de webhook (últimos 20)
        const { data, error } = await supabase
          .from("webhook_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)

        if (error) {
          console.error("Erro ao buscar logs:", error)
          setError(error)
        } else {
          setLogs(data || [])
        }
      } catch (err) {
        console.error("Erro ao buscar logs:", err)
        setError(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  function formatJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString)
      return JSON.stringify(parsed, null, 2)
    } catch (e) {
      return jsonString
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Logs de Webhook</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Últimos Webhooks Recebidos</h2>
          <div className="space-x-2">
            <Link
              href="/admin/integracoes/simular-webhook"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Simular Webhook
            </Link>
            <Link
              href="/admin/integracoes/webhook-remessas"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Ver Remessas
            </Link>
          </div>
        </div>

        {loading && (
          <div className="bg-gray-100 p-4 rounded mb-4">
            <p>Carregando logs...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 p-4 rounded mb-4">
            <p className="text-red-700">Erro ao buscar logs: {error.message}</p>
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="bg-yellow-100 p-4 rounded mb-4">
            <p>Nenhum log de webhook encontrado. Faça um teste enviando dados para o webhook.</p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <div className="space-y-6">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-sm text-gray-500">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : "N/A"}
                    </span>
                    {log.source_ip && (
                      <span className="ml-2 text-xs bg-gray-200 px-2 py-1 rounded">IP: {log.source_ip}</span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <h3 className="font-semibold mb-1">Payload:</h3>
                  <pre className="bg-gray-100 p-3 rounded overflow-x-auto text-sm max-h-60">
                    {formatJSON(log.payload)}
                  </pre>
                </div>

                {log.headers && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-1 flex items-center">
                      <span>Headers:</span>
                      <button
                        className="ml-2 text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                        onClick={() => {
                          const elem = document.getElementById(`headers-${log.id}`)
                          if (elem) {
                            elem.style.display = elem.style.display === "none" ? "block" : "none"
                          }
                        }}
                      >
                        Mostrar/Ocultar
                      </button>
                    </h3>
                    <pre
                      id={`headers-${log.id}`}
                      className="bg-gray-100 p-3 rounded overflow-x-auto text-sm max-h-40 hidden"
                    >
                      {formatJSON(log.headers)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
