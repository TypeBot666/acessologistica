import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
  try {
    const { trackingCodes } = await request.json()

    if (!Array.isArray(trackingCodes) || trackingCodes.length === 0) {
      return NextResponse.json({ error: "Lista de códigos de rastreio inválida" }, { status: 400 })
    }

    const supabase = createClient()

    // Primeiro, excluir o histórico de status
    const { error: historyError } = await supabase.from("status_history").delete().in("shipment_id", trackingCodes)

    if (historyError) {
      console.error("Erro ao excluir histórico de status:", historyError)
      return NextResponse.json(
        { error: 'Erro ao excluir histórico de status" }, { status: 500 })órico de status' },
        { status: 500 },
      )
    }

    // Em seguida, excluir as remessas
    const { error: shipmentsError } = await supabase.from("shipments").delete().in("tracking_code", trackingCodes)

    if (shipmentsError) {
      console.error("Erro ao excluir remessas:", shipmentsError)
      return NextResponse.json({ error: "Erro ao excluir remessas" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${trackingCodes.length} pedidos excluídos com sucesso`,
    })
  } catch (error) {
    console.error("Erro ao processar a solicitação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
