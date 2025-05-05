import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Função para verificar se a tabela existe
async function checkTableExists(supabase: any, tableName: string) {
  try {
    const { data, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", tableName)
      .maybeSingle()

    if (error) {
      console.error(`Erro ao verificar se a tabela ${tableName} existe:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Erro ao verificar se a tabela ${tableName} existe:`, error)
    return false
  }
}

// Função para criar a tabela automation_executions
async function createAutomationExecutionsTable(supabase: any) {
  try {
    // Verificar se a tabela já existe
    const tableExists = await checkTableExists(supabase, "automation_executions")
    if (tableExists) {
      return true
    }

    // Tentar criar a tabela usando o cliente Supabase
    try {
      await supabase.schema.createTable("automation_executions", {
        id: {
          type: "serial",
          primaryKey: true,
        },
        execution_date: {
          type: "timestamp with time zone",
          notNull: true,
        },
        success: {
          type: "boolean",
          notNull: true,
        },
        shipments_processed: {
          type: "integer",
          notNull: true,
        },
        error_message: {
          type: "text",
        },
        created_at: {
          type: "timestamp with time zone",
          default: "now()",
        },
      })

      return true
    } catch (error) {
      console.error("Erro ao criar tabela automation_executions:", error)
      return false
    }
  } catch (error) {
    console.error("Erro ao criar tabela automation_executions:", error)
    return false
  }
}

export async function GET() {
  try {
    const supabase = createClient()

    // Verificar se a tabela automation_executions existe
    const tableExists = await checkTableExists(supabase, "automation_executions")
    if (!tableExists) {
      const tableCreated = await createAutomationExecutionsTable(supabase)
      if (!tableCreated) {
        return NextResponse.json({
          success: false,
          message: "A tabela automation_executions não existe e não foi possível criá-la",
          data: [],
        })
      }
    }

    // Buscar execuções de automação
    const { data, error } = await supabase
      .from("automation_executions")
      .select("*")
      .order("execution_date", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Erro ao buscar execuções de automação:", error)
      return NextResponse.json({
        success: false,
        message: `Erro ao buscar execuções de automação: ${error.message}`,
        data: [],
      })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    })
  } catch (error) {
    console.error("Erro ao buscar execuções de automação:", error)
    return NextResponse.json({
      success: false,
      message: `Erro ao buscar execuções de automação: ${error instanceof Error ? error.message : String(error)}`,
      data: [],
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const executionData = await request.json()

    // Verificar se a tabela automation_executions existe
    const tableExists = await checkTableExists(supabase, "automation_executions")
    if (!tableExists) {
      const tableCreated = await createAutomationExecutionsTable(supabase)
      if (!tableCreated) {
        return NextResponse.json({
          success: false,
          message: "A tabela automation_executions não existe e não foi possível criá-la",
        })
      }
    }

    // Inserir nova execução
    const { data, error } = await supabase.from("automation_executions").insert({
      execution_date: executionData.execution_date || new Date().toISOString(),
      success: executionData.success || false,
      shipments_processed: executionData.shipments_processed || 0,
      error_message: executionData.error_message || null,
    })

    if (error) {
      console.error("Erro ao inserir execução de automação:", error)
      return NextResponse.json({
        success: false,
        message: `Erro ao inserir execução de automação: ${error.message}`,
      })
    }

    // Atualizar as configurações de automação com o status da última execução
    try {
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "automation_settings")
        .single()

      if (!settingsError && settingsData) {
        const settings = settingsData.value
        settings.lastExecution = executionData.execution_date || new Date().toISOString()
        settings.lastExecutionSuccess = executionData.success || false
        settings.lastExecutionCount = executionData.shipments_processed || 0

        await supabase.from("system_settings").upsert(
          {
            key: "automation_settings",
            value: settings,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" },
        )
      }
    } catch (error) {
      console.error("Erro ao atualizar configurações de automação:", error)
      // Não falhar a operação principal se esta atualização falhar
    }

    return NextResponse.json({
      success: true,
      message: "Execução de automação registrada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao registrar execução de automação:", error)
    return NextResponse.json({
      success: false,
      message: `Erro ao registrar execução de automação: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}
