import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Criar tabela message_history
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS message_history (
        id SERIAL PRIMARY KEY,
        tracking_code TEXT REFERENCES shipments(tracking_code),
        recipient TEXT NOT NULL,
        message TEXT NOT NULL,
        channel TEXT NOT NULL,
        status TEXT NOT NULL,
        external_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Adicionar índice para melhorar performance
      CREATE INDEX IF NOT EXISTS idx_message_history_tracking_code ON message_history(tracking_code);
      CREATE INDEX IF NOT EXISTS idx_message_history_channel ON message_history(channel);
    `

    const { error } = await supabase.rpc("exec_sql", { sql: createTableQuery })

    if (error) {
      console.error("Erro ao criar tabela message_history:", error)
      return NextResponse.json({
        success: false,
        message: `Erro ao criar tabela: ${error.message}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Tabela message_history criada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar tabela message_history:", error)
    return NextResponse.json({
      success: false,
      message: `Erro ao criar tabela: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}
