import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // Verificar se o cliente Supabase foi inicializado corretamente
    if (!supabase) {
      return NextResponse.json(
        {
          configValid: false,
          issues: ["Cliente Supabase não inicializado corretamente"],
          details: {
            supabaseUrl: process.env.SUPABASE_URL ? "Definido" : "Não definido",
            supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? "Definido" : "Não definido",
          },
        },
        { status: 500 },
      )
    }

    // Buscar configurações de automação
    const { data: settingsData, error: settingsError } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "automation_settings")
      .single()

    if (settingsError) {
      return NextResponse.json(
        {
          configValid: false,
          issues: [`Erro ao buscar configurações: ${settingsError.message}`],
          details: {
            error: settingsError,
            supabaseUrl: process.env.SUPABASE_URL ? "Definido" : "Não definido",
            supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? "Definido" : "Não definido",
          },
        },
        { status: 500 },
      )
    }

    if (!settingsData) {
      return NextResponse.json(
        {
          configValid: false,
          issues: ["Configurações de automação não encontradas"],
          details: {
            settingsData,
          },
        },
        { status: 404 },
      )
    }

    const settings = settingsData.value
    const issues: string[] = []

    // Validar configurações
    if (typeof settings.enabled !== "boolean") {
      issues.push("O campo 'enabled' deve ser um booleano")
    }

    if (!Array.isArray(settings.steps)) {
      issues.push("O campo 'steps' deve ser um array")
    } else {
      settings.steps.forEach((step: any, index: number) => {
        if (!step.status) {
          issues.push(`Etapa ${index + 1}: Status não definido`)
        }
        if (typeof step.days !== "number") {
          issues.push(`Etapa ${index + 1}: O campo 'days' deve ser um número`)
        }
      })
    }

    if (!settings.finalStatus) {
      issues.push("Status final não definido")
    }

    // Testar acesso à tabela de remessas
    const { error: shipmentsError } = await supabase.from("shipments").select("count").limit(1)

    if (shipmentsError) {
      issues.push(`Erro ao acessar tabela de remessas: ${shipmentsError.message}`)
    }

    // Testar acesso à tabela de histórico de status
    const { error: historyError } = await supabase.from("status_history").select("count").limit(1)

    if (historyError) {
      issues.push(`Erro ao acessar tabela de histórico de status: ${historyError.message}`)
    }

    return NextResponse.json({
      configValid: issues.length === 0,
      issues: issues.length > 0 ? issues : [],
      details: {
        settings,
        environmentVariables: {
          NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ? "Definido" : "Não definido",
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ? "Definido" : "Não definido",
          SMTP_HOST: process.env.SMTP_HOST ? "Definido" : "Não definido",
          SMTP_PORT: process.env.SMTP_PORT ? "Definido" : "Não definido",
          SMTP_USER: process.env.SMTP_USER ? "Definido" : "Não definido",
          SMTP_PASSWORD: process.env.SMTP_PASSWORD ? "Definido" : "Não definido",
        },
      },
    })
  } catch (error) {
    console.error("Erro ao testar configuração de automação:", error)
    return NextResponse.json(
      {
        configValid: false,
        issues: [`Erro ao testar configuração: ${error instanceof Error ? error.message : String(error)}`],
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 },
    )
  }
}
