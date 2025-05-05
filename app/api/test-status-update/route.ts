import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const trackingCode = searchParams.get("trackingCode")
    const newStatus = searchParams.get("status") || "Em processo de triagem"

    if (!trackingCode) {
      return NextResponse.json({ success: false, error: "Código de rastreio é obrigatório" }, { status: 400 })
    }

    // Criar cliente Supabase
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar se o pedido existe
    const { data: pedido, error: pedidoError } = await supabase
      .from("shipments")
      .select("*")
      .eq("tracking_code", trackingCode)
      .single()

    if (pedidoError || !pedido) {
      return NextResponse.json({ success: false, error: "Pedido não encontrado" }, { status: 404 })
    }

    // Atualizar o status no banco de dados
    const { error: updateError } = await supabase
      .from("shipments")
      .update({ status: newStatus })
      .eq("tracking_code", trackingCode)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: `Erro ao atualizar status: ${updateError.message}` },
        { status: 500 },
      )
    }

    // Adicionar ao histórico de status
    const { error: historyError } = await supabase.from("status_history").insert([
      {
        tracking_code: trackingCode,
        status: newStatus,
        notes: `Status atualizado para ${newStatus} via API de teste`,
      },
    ])

    if (historyError) {
      return NextResponse.json(
        {
          success: true,
          warning: `Status atualizado, mas houve erro ao adicionar ao histórico: ${historyError.message}`,
          pedido,
        },
        { status: 200 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Status do pedido ${trackingCode} atualizado para ${newStatus}`,
      pedido,
    })
  } catch (error) {
    console.error("Erro ao testar atualização de status:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro interno: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
