import { NextResponse } from "next/server"

// URL do servidor Node.js que executa o whatsapp-web.js
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || "http://localhost:3001"

export async function GET() {
  try {
    // Buscar sessões do servidor WhatsApp
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/sessions`, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY || "chave-secreta"}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar sessões: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar sessões:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar sessões do servidor WhatsApp",
        sessions: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { sessionId } = body

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da sessão é obrigatório",
        },
        { status: 400 },
      )
    }

    // Criar nova sessão no servidor WhatsApp
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY || "chave-secreta"}`,
      },
      body: JSON.stringify({ sessionId }),
    })

    if (!response.ok) {
      throw new Error(`Erro ao criar sessão: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao criar sessão:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar sessão no servidor WhatsApp",
      },
      { status: 500 },
    )
  }
}
