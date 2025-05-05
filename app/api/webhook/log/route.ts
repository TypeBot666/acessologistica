import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    // Obter o corpo da requisição como texto
    const rawBody = await req.text()

    // Obter os headers da requisição
    const headers: Record<string, string> = {}
    req.headers.forEach((value, key) => {
      headers[key] = value
    })

    // Obter o IP de origem
    const sourceIp = headers["x-forwarded-for"] || "unknown"

    // Salvar o log no banco de dados
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from("webhook_logs").insert([
      {
        payload: rawBody,
        headers: JSON.stringify(headers),
        source_ip: sourceIp,
        timestamp: new Date().toISOString(),
      },
    ])

    if (error) {
      console.error("Erro ao salvar log de webhook:", error)
      return NextResponse.json({ error: "Erro ao salvar log" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no endpoint de log:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
