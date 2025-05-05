import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient()

    console.log("Verificando conexão com o banco de dados...")

    // Testar a conexão com o banco de dados usando uma consulta simples
    try {
      const { data: connectionTest, error: connectionError } = await supabase.sql("SELECT 1 as connection_test")

      if (connectionError) {
        console.error("Erro na conexão com o banco de dados:", connectionError)
        return NextResponse.json({
          connected: false,
          message: "Erro na conexão com o banco de dados",
          error: connectionError.message,
        })
      }

      console.log("Conexão com o banco de dados estabelecida com sucesso")
    } catch (e) {
      console.error("Erro ao testar conexão:", e)
      return NextResponse.json({
        connected: false,
        message: "Erro na conexão com o banco de dados",
        error: e instanceof Error ? e.message : String(e),
      })
    }

    // Verificar se as tabelas necessárias existem
    const tables = {
      system_settings: false,
      automation_settings: false,
      scheduled_emails: false,
    }

    try {
      // Verificar tabela system_settings
      const { data: systemSettings, error: systemError } = await supabase.from("system_settings").select("id").limit(1)

      tables.system_settings = !systemError

      // Verificar tabela automation_settings
      const { data: automationSettings, error: automationError } = await supabase
        .from("automation_settings")
        .select("id")
        .limit(1)

      tables.automation_settings = !automationError

      // Verificar tabela scheduled_emails
      const { data: scheduledEmails, error: emailsError } = await supabase
        .from("scheduled_emails")
        .select("id")
        .limit(1)

      tables.scheduled_emails = !emailsError

      // Verificar se todas as tabelas existem
      const allTablesExist = tables.system_settings && tables.automation_settings && tables.scheduled_emails

      return NextResponse.json({
        connected: true,
        tableExists: allTablesExist,
        tables,
        message: allTablesExist
          ? "Conexão com o banco de dados estabelecida com sucesso e todas as tabelas necessárias encontradas"
          : "Conexão com o banco de dados estabelecida, mas algumas tabelas necessárias não foram encontradas",
      })
    } catch (e) {
      console.error("Erro ao verificar tabelas:", e)
      return NextResponse.json({
        connected: true,
        tableExists: false,
        tables,
        message: "Banco de dados conectado, mas erro ao verificar tabelas",
        error: e instanceof Error ? e.message : String(e),
      })
    }
  } catch (error) {
    console.error("Erro ao verificar conexão com o banco de dados:", error)
    return NextResponse.json({
      connected: false,
      message: "Erro ao verificar conexão com o banco de dados",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
