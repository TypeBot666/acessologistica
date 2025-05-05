import { NextResponse } from "next/server"

export async function POST(request, { params }) {
  try {
    const { sessionId } = params

    // Fazer uma requisição para o servidor Node.js
    const apiUrl = process.env.WHATSAPP_API_URL || "http://localhost:3000"
    const response = await fetch(`${apiUrl}/api/sessions/${sessionId}/reconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.API_KEY || "",
      },
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao reconectar sessão:", error)
    return NextResponse.json({ success: false, error: "Erro ao reconectar sessão" }, { status: 500 })
  }
}
