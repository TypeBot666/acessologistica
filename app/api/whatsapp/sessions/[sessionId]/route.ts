import { NextResponse } from "next/server"

// URL do servidor Node.js que executa o whatsapp-web.js
const WHATSAPP_SERVER_URL = process.env.WHATSAPP_SERVER_URL || "http://localhost:3001"

export async function GET(request, { params }) {
  try {
    const { sessionId } = params

    // Buscar detalhes da sessão do servidor WhatsApp
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/sessions/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY || "chave-secreta"}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar sessão: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Erro ao buscar sessão:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar detalhes da sessão",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { sessionId } = params

    // Excluir sessão no servidor WhatsApp
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_API_KEY || "chave-secreta"}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Erro ao excluir sessão: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error(`Erro ao excluir sessão:`, error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao excluir sessão",
      },
      { status: 500 },
    )
  }
}
