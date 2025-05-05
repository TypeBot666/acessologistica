import { NextResponse } from "next/server"

// Normalmente, você salvaria isso em um banco de dados
// Por enquanto, vamos usar variáveis globais para simular
let trackingTemplate = ""
let statusUpdateTemplate = ""

export async function POST(req: Request) {
  try {
    const { tracking, statusUpdate } = await req.json()

    if (!tracking || !statusUpdate) {
      return NextResponse.json({ success: false, error: "Ambos os templates são obrigatórios" }, { status: 400 })
    }

    // Salvar os templates (em um cenário real, isso iria para o banco de dados)
    trackingTemplate = tracking
    statusUpdateTemplate = statusUpdate

    return NextResponse.json({
      success: true,
      message: "Templates de email atualizados com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao atualizar templates de email:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao atualizar templates: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

export function GET() {
  return NextResponse.json({
    tracking: trackingTemplate,
    statusUpdate: statusUpdateTemplate,
  })
}
