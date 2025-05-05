import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.from("system_settings").select("*").eq("key", "onefunnel_settings").single()

    if (error) {
      console.error("Erro ao buscar configurações da OneFunnel:", error)
      return NextResponse.json({
        apiKey: "",
        sender: "",
        enabled: false,
      })
    }

    return NextResponse.json(
      data?.value || {
        apiKey: "",
        sender: "",
        enabled: false,
      },
    )
  } catch (error) {
    console.error("Erro ao buscar configurações da OneFunnel:", error)
    return NextResponse.json({
      apiKey: "",
      sender: "",
      enabled: false,
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const settings = await request.json()

    const { data, error } = await supabase.from("system_settings").upsert(
      {
        key: "onefunnel_settings",
        value: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )

    if (error) {
      console.error("Erro ao salvar configurações da OneFunnel:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao salvar configurações: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configurações da OneFunnel salvas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao salvar configurações da OneFunnel:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao salvar configurações: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
