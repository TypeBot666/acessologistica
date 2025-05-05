import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const trackingCode = url.searchParams.get("trackingCode")

    if (!trackingCode) {
      return NextResponse.json({ success: false, error: "Código de rastreio é obrigatório" }, { status: 400 })
    }

    // Criar cliente Supabase
    const supabase = createServerSupabaseClient()

    // Buscar histórico de status
    const { data, error } = await supabase
      .from("status_history")
      .select("*")
      .eq("tracking_code", trackingCode)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar histórico:", error)
      return NextResponse.json({ success: false, error: "Erro ao buscar histórico" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Erro ao processar requisição:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 },
    )
  }
}
