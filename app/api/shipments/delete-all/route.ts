import { createServerSupabaseClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE() {
  try {
    const supabase = createServerSupabaseClient()

    // Primeiro, excluir todos os registros da tabela de histórico de status
    const { error: historyError } = await supabase.from("status_history").delete().neq("id", 0) // Condição para excluir todos os registros

    if (historyError) {
      console.error("Erro ao excluir histórico de status:", historyError)
      return NextResponse.json({ error: "Falha ao excluir histórico de status" }, { status: 500 })
    }

    // Em seguida, excluir todos os registros da tabela de remessas
    const { error: shipmentsError } = await supabase.from("shipments").delete().neq("id", 0) // Condição para excluir todos os registros

    if (shipmentsError) {
      console.error("Erro ao excluir remessas:", shipmentsError)
      return NextResponse.json({ error: "Falha ao excluir remessas" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir todos os pedidos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
