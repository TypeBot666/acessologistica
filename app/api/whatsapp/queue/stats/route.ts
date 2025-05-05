import { NextResponse } from "next/server"

// URL do servidor Node.js que executa o whatsapp-web.js
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || "http://localhost:3001"

export async function GET() {
  try {
    // Buscar estatísticas da fila do servidor WhatsApp
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/queue/stats`, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY || "chave-secreta"}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar estatísticas: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar estatísticas da fila:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar estatísticas da fila",
        stats: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        },
      },
      { status: 500 },
    )
  }
}
