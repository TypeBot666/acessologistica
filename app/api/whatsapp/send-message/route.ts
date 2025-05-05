import { NextResponse } from "next/server"

// URL do servidor Node.js que executa o whatsapp-web.js
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || "http://localhost:3001"

export async function POST(request) {
  try {
    const body = await request.json()
    const { sessionId, phone, message } = body

    // Validação básica
    if (!sessionId || !phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Parâmetros inválidos. Forneça sessionId, phone e message.",
        },
        { status: 400 },
      )
    }

    // Enviar mensagem através do servidor WhatsApp
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/send-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY || "chave-secreta"}`,
      },
      body: JSON.stringify({ sessionId, phone, message }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Erro ao enviar mensagem: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro ao enviar mensagem",
      },
      { status: 500 },
    )
  }
}
