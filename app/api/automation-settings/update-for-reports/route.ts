import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { steps } = await request.json()
    const supabase = createClient()

    // Verificar se a tabela automation_settings existe
    const { data: tableExists, error: tableCheckError } = await supabase.rpc("check_table_exists", {
      table_name: "automation_settings",
    })

    // Se a tabela não existir, criar
    if (!tableExists || tableCheckError) {
      try {
        const { error: createError } = await supabase.rpc("exec_sql", {
          sql: `
          CREATE TABLE IF NOT EXISTS automation_settings (
            id SERIAL PRIMARY KEY,
            status TEXT NOT NULL,
            days_after INTEGER NOT NULL,
            email_time TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Habilitar RLS e criar políticas
          ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
          
          -- Criar políticas de acesso
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens'
            ) THEN
              CREATE POLICY "Rubens" ON "public"."automation_settings" 
              AS PERMISSIVE FOR SELECT TO public 
              USING (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_insert'
            ) THEN
              CREATE POLICY "Rubens_insert" ON "public"."automation_settings" 
              AS PERMISSIVE FOR INSERT TO public 
              WITH CHECK (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_update'
            ) THEN
              CREATE POLICY "Rubens_update" ON "public"."automation_settings" 
              AS PERMISSIVE FOR UPDATE TO public 
              USING (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_delete'
            ) THEN
              CREATE POLICY "Rubens_delete" ON "public"."automation_settings" 
              AS PERMISSIVE FOR DELETE TO public 
              USING (true);
            END IF;
          END
          $$;
          `,
        })

        if (createError) {
          console.error("Erro ao criar tabela automation_settings:", createError)
          return NextResponse.json(
            {
              success: false,
              message: "Erro ao criar tabela automation_settings",
              error: createError,
            },
            { status: 500 },
          )
        }
      } catch (error) {
        console.error("Erro ao criar tabela automation_settings:", error)
        return NextResponse.json(
          {
            success: false,
            message: "Erro ao criar tabela automation_settings",
            error: error instanceof Error ? error.message : String(error),
          },
          { status: 500 },
        )
      }
    }

    // Limpar tabela existente
    const { error: deleteError } = await supabase.from("automation_settings").delete().neq("id", 0)

    if (deleteError) {
      console.error("Erro ao limpar tabela automation_settings:", deleteError)
    }

    // Inserir novas configurações
    if (steps && steps.length > 0) {
      const settingsToInsert = steps.map((step: any) => ({
        status: step.status,
        days_after: step.days,
        email_time: step.emailTime || "08:00",
      }))

      const { error: insertError } = await supabase.from("automation_settings").insert(settingsToInsert)

      if (insertError) {
        console.error("Erro ao inserir configurações de automação:", insertError)
        return NextResponse.json(
          {
            success: false,
            message: "Erro ao inserir configurações de automação",
            error: insertError,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Configurações de automação atualizadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar configurações de automação:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao atualizar configurações de automação",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
