import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // SQL para criar a tabela
    const sql = `
    -- Criar a tabela system_settings se não existir
    CREATE TABLE IF NOT EXISTS public.system_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Verificar se já existem configurações de automação
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'automation_settings') THEN
        -- Inserir configurações padrão
        INSERT INTO public.system_settings (key, value)
        VALUES (
          'automation_settings',
          '{"enabled":true,"steps":[{"status":"Objeto postado","days":0},{"status":"Em processo de triagem","days":1},{"status":"Em trânsito para o centro de distribuição","days":3},{"status":"No centro de distribuição","days":5},{"status":"Em rota de entrega","days":7},{"status":"Entregue com sucesso","days":8}],"finalStatus":"Entregue com sucesso"}'::jsonb
        );
      END IF;
    END $$;
    `

    // Tentar executar o SQL usando a função rpc
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Erro ao executar SQL via RPC:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          message:
            "Não foi possível criar a tabela via RPC. Por favor, execute o SQL manualmente no painel do Supabase.",
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "SQL executado com sucesso. Verifique no painel do Supabase se a tabela foi criada.",
    })
  } catch (error) {
    console.error("Erro ao criar tabela:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message:
          "Ocorreu um erro ao tentar criar a tabela. Por favor, execute o SQL manualmente no painel do Supabase.",
      },
      { status: 500 },
    )
  }
}
