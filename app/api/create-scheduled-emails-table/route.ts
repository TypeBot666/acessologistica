import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createClient()

    // Verificar se a tabela já existe
    const { data: tableExists, error: checkError } = await supabase.rpc("check_table_exists", {
      table_name: "scheduled_emails",
    })

    if (checkError) {
      console.error("Erro ao verificar tabela:", checkError)
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao verificar tabela",
          error: checkError,
        },
        { status: 500 },
      )
    }

    if (tableExists) {
      return NextResponse.json({
        success: true,
        message: "Tabela scheduled_emails já existe",
      })
    }

    // Criar a tabela scheduled_emails
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS scheduled_emails (
        id SERIAL PRIMARY KEY,
        shipment_id INTEGER NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        sent BOOLEAN DEFAULT FALSE,
        sent_at TIMESTAMP WITH TIME ZONE,
        error TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_scheduled_emails_sent ON scheduled_emails(sent);
      CREATE INDEX IF NOT EXISTS idx_scheduled_emails_scheduled_time ON scheduled_emails(scheduled_time);
    `

    const { error: createError } = await supabase.rpc("exec_sql", { sql: createTableSQL })

    if (createError) {
      console.error("Erro ao criar tabela:", createError)
      return NextResponse.json(
        {
          success: false,
          message: "Erro ao criar tabela",
          error: createError,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Tabela scheduled_emails criada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar tabela scheduled_emails:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar tabela scheduled_emails",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
