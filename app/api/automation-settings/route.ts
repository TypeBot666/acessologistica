import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Tipo para as configurações de automação
type AutomationSettings = {
  enabled: boolean
  steps: Array<{
    status: string
    days: number
    emailTime?: string
  }>
  finalStatus: string
  emailNotifications: boolean
  executionTime: string
  lastExecution?: string | null
  lastExecutionSuccess?: boolean
  lastExecutionCount?: number
}

// Configurações padrão
const defaultSettings: AutomationSettings = {
  enabled: true,
  steps: [
    { status: "Objeto postado", days: 0, emailTime: "08:00" },
    { status: "Em processo de triagem", days: 1, emailTime: "09:00" },
    { status: "Em trânsito para o centro de distribuição", days: 3, emailTime: "10:00" },
    { status: "No centro de distribuição", days: 5, emailTime: "11:00" },
    { status: "Em rota de entrega", days: 7, emailTime: "12:00" },
    { status: "Entregue com sucesso", days: 8, emailTime: "13:00" },
  ],
  finalStatus: "Entregue com sucesso",
  emailNotifications: true,
  executionTime: "08:00",
  lastExecution: null,
}

export async function GET() {
  try {
    const supabase = createClient()

    // Verificar se a tabela existe diretamente tentando acessá-la
    console.log("Verificando se a tabela system_settings existe...")

    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "automation_settings")
        .single()

      if (error) {
        console.error("Erro ao buscar configurações:", error)
        return NextResponse.json(defaultSettings)
      }

      console.log("Configurações encontradas:", data)
      return NextResponse.json(data?.value || defaultSettings)
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
      return NextResponse.json(defaultSettings)
    }
  } catch (error) {
    console.error("Erro ao buscar configurações:", error)
    return NextResponse.json(defaultSettings)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const settings: AutomationSettings = await request.json()

    console.log("Salvando configurações:", settings)

    // Tentar salvar diretamente na tabela
    try {
      const { data, error } = await supabase.from("system_settings").upsert(
        {
          key: "automation_settings",
          value: settings,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      )

      if (error) {
        console.error("Erro ao salvar configurações:", error)
        return NextResponse.json(
          {
            success: false,
            message: `Erro ao salvar configurações: ${error.message}`,
          },
          { status: 500 },
        )
      }

      // Atualizar a tabela de configurações para relatórios
      try {
        await updateAutomationSettingsForReports(supabase, settings.steps)
      } catch (error) {
        console.error("Erro ao atualizar configurações para relatórios:", error)
      }

      return NextResponse.json({
        success: true,
        message: "Configurações salvas com sucesso",
      })
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      return NextResponse.json(
        {
          success: false,
          message: `Erro ao salvar configurações: ${error instanceof Error ? error.message : String(error)}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao salvar configurações:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao salvar configurações: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}

// Função para atualizar as configurações de automação para relatórios
async function updateAutomationSettingsForReports(supabase: any, steps: any[]) {
  try {
    // Verificar se a tabela automation_settings existe
    try {
      // Limpar a tabela
      await supabase.from("automation_settings").delete().gt("id", 0)

      // Inserir as novas configurações
      for (const step of steps) {
        await supabase.from("automation_settings").insert({
          status: step.status,
          days_after: step.days,
          email_time: step.emailTime || "08:00",
        })
      }

      return true
    } catch (error) {
      console.error("Erro ao atualizar configurações para relatórios:", error)
      return false
    }
  } catch (error) {
    console.error("Erro ao atualizar configurações para relatórios:", error)
    return false
  }
}
