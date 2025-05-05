import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Função para verificar se a tabela existe
async function checkTableExists(supabase: any, tableName: string) {
  try {
    // Usar a função table_exists se existir
    const { data, error } = await supabase
      .rpc("table_exists", {
        table_name: tableName,
      })
      .catch(() => {
        // Se a função não existir, usar uma consulta SQL direta
        return supabase
          .from("pg_tables")
          .select("tablename")
          .eq("schemaname", "public")
          .eq("tablename", tableName)
          .maybeSingle()
      })

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

// Função para criar a tabela automation_settings
async function createAutomationSettingsTable(supabase: any) {
  try {
    // Verificar se a tabela já existe
    const tableExists = await checkTableExists(supabase, "automation_settings")
    if (tableExists) {
      return true
    }

    // Tentar criar a tabela usando SQL direto
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS automation_settings (
        id SERIAL PRIMARY KEY,
        status TEXT NOT NULL,
        days_after INTEGER NOT NULL,
        email_time TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error } = await supabase.rpc("exec_sql", { sql: createTableQuery }).catch(() => {
      // Se falhar, retornar erro
      return { error: new Error("Não foi possível criar a tabela automation_settings") }
    })

    if (error) {
      console.error("Erro ao criar tabela automation_settings:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao criar tabela automation_settings:", error)
    return false
  }
}

export async function GET() {
  try {
    const supabase = createClient()

    // Verificar conexão básica com o banco de dados
    const { data: connectionTest, error: connectionError } = await supabase
      .from("pg_tables")
      .select("tablename")
      .limit(1)
      .catch(() => {
        // Se falhar, tentar outra abordagem
        return supabase.from("system_settings").select("*").limit(1)
      })
      .catch(() => {
        // Se ambas falharem, retornar erro
        return { data: null, error: { message: "Erro na conexão com o banco de dados" } }
      })

    if (connectionError) {
      console.error("Erro na conexão com o banco de dados:", connectionError)
      return NextResponse.json({
        success: false,
        message: `Erro na conexão com o banco de dados: ${connectionError.message}`,
        settings: [],
      })
    }

    // Verificar se a tabela automation_settings existe
    const tableExists = await checkTableExists(supabase, "automation_settings")

    // Se a tabela não existir, buscar as configurações da tabela system_settings e criar a tabela
    if (!tableExists) {
      console.log("Tabela automation_settings não encontrada, buscando da system_settings...")

      // Buscar configurações da tabela system_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "automation_settings")
        .single()

      if (settingsError) {
        console.error("Erro ao buscar configurações de automação:", settingsError)
        return NextResponse.json({
          success: false,
          message: "Erro ao buscar configurações de automação",
          settings: [],
        })
      }

      // Verificar se temos dados de configuração
      if (!settingsData || !settingsData.value || !settingsData.value.steps) {
        return NextResponse.json({
          success: true,
          settings: [],
        })
      }

      // Criar a tabela automation_settings
      const tableCreated = await createAutomationSettingsTable(supabase)
      if (!tableCreated) {
        console.error("Não foi possível criar a tabela automation_settings")

        // Transformar os dados para o formato esperado pelos relatórios
        const settings = settingsData.value.steps.map((step: any, index: number) => ({
          id: index + 1,
          status: step.status,
          days_after: step.days,
          email_time: step.emailTime || "08:00",
          created_at: new Date().toISOString(),
        }))

        return NextResponse.json({
          success: true,
          settings,
        })
      }

      // Inserir os dados da system_settings na automation_settings
      for (const step of settingsData.value.steps) {
        await supabase.from("automation_settings").insert({
          status: step.status,
          days_after: step.days,
          email_time: step.emailTime || "08:00",
        })
      }

      // Buscar os dados inseridos
      const { data: insertedData, error: insertedError } = await supabase
        .from("automation_settings")
        .select("*")
        .order("days_after", { ascending: true })

      if (insertedError) {
        console.error("Erro ao buscar dados inseridos:", insertedError)

        // Transformar os dados para o formato esperado pelos relatórios
        const settings = settingsData.value.steps.map((step: any, index: number) => ({
          id: index + 1,
          status: step.status,
          days_after: step.days,
          email_time: step.emailTime || "08:00",
          created_at: new Date().toISOString(),
        }))

        return NextResponse.json({
          success: true,
          settings,
        })
      }

      return NextResponse.json({
        success: true,
        settings: insertedData || [],
      })
    }

    // Se a tabela existir, buscar os dados
    const { data, error } = await supabase
      .from("automation_settings")
      .select("*")
      .order("days_after", { ascending: true })

    if (error) {
      console.error("Erro ao buscar configurações de automação:", error)
      return NextResponse.json({
        success: false,
        message: "Erro ao buscar configurações de automação",
        error: error.message,
        settings: [],
      })
    }

    return NextResponse.json({
      success: true,
      settings: data || [],
    })
  } catch (error) {
    console.error("Erro ao buscar configurações de automação:", error)
    return NextResponse.json({
      success: false,
      message: "Erro ao buscar configurações de automação",
      error: error instanceof Error ? error.message : String(error),
      settings: [],
    })
  }
}
