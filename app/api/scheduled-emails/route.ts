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

// Função para criar a tabela scheduled_emails
async function createScheduledEmailsTable(supabase: any) {
  try {
    // Verificar se a tabela já existe
    const tableExists = await checkTableExists(supabase, "scheduled_emails")
    if (tableExists) {
      return true
    }

    // Tentar criar a tabela usando SQL direto
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS scheduled_emails (
        id SERIAL PRIMARY KEY,
        tracking_code TEXT NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL,
        scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
        sent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `

    const { error } = await supabase.rpc("exec_sql", { sql: createTableQuery }).catch(() => {
      // Se falhar, retornar erro
      return { error: new Error("Não foi possível criar a tabela scheduled_emails") }
    })

    if (error) {
      console.error("Erro ao criar tabela scheduled_emails:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Erro ao criar tabela scheduled_emails:", error)
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
        emails: [],
      })
    }

    // Verificar se a tabela scheduled_emails existe
    const tableExists = await checkTableExists(supabase, "scheduled_emails")

    // Se a tabela não existir, criar
    if (!tableExists) {
      console.log("Tabela scheduled_emails não encontrada, tentando criar...")

      const tableCreated = await createScheduledEmailsTable(supabase)
      if (!tableCreated) {
        return NextResponse.json({
          success: false,
          message: "Erro ao criar tabela scheduled_emails",
          emails: [],
        })
      }
    }

    // Buscar emails agendados
    const { data, error } = await supabase
      .from("scheduled_emails")
      .select("*")
      .order("scheduled_time", { ascending: true })

    if (error) {
      console.error("Erro ao buscar emails agendados:", error)
      return NextResponse.json({
        success: false,
        message: "Erro ao buscar emails agendados",
        error: error.message,
        emails: [],
      })
    }

    return NextResponse.json({
      success: true,
      emails: data || [],
    })
  } catch (error) {
    console.error("Erro ao buscar emails agendados:", error)
    return NextResponse.json({
      success: false,
      message: "Erro ao buscar emails agendados",
      error: error instanceof Error ? error.message : String(error),
      emails: [],
    })
  }
}
