import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createClient()

    console.log("Verificando e corrigindo permissões...")

    // Verificar se a tabela system_settings existe
    try {
      const { data: tableCheck, error: tableError } = await supabase.from("system_settings").select("id").limit(1)

      if (tableError) {
        console.error("Erro ao verificar tabela system_settings:", tableError)

        // Tentar corrigir as permissões
        try {
          // Aplicar políticas RLS
          await supabase.sql(`
            -- Habilitar RLS
            ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
            
            -- Criar políticas de acesso
            DO $$
            BEGIN
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens'
              ) THEN
                CREATE POLICY "Rubens" ON system_settings 
                AS PERMISSIVE FOR SELECT TO public 
                USING (true);
              END IF;
              
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_insert'
              ) THEN
                CREATE POLICY "Rubens_insert" ON system_settings 
                AS PERMISSIVE FOR INSERT TO public 
                WITH CHECK (true);
              END IF;
              
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_update'
              ) THEN
                CREATE POLICY "Rubens_update" ON system_settings 
                AS PERMISSIVE FOR UPDATE TO public 
                USING (true);
              END IF;
              
              IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_delete'
              ) THEN
                CREATE POLICY "Rubens_delete" ON system_settings 
                AS PERMISSIVE FOR DELETE TO public 
                USING (true);
              END IF;
            END
            $$;
          `)

          console.log("Políticas RLS aplicadas com sucesso")
        } catch (rlsError) {
          console.error("Erro ao aplicar políticas RLS:", rlsError)
        }

        // Verificar novamente
        const { data: recheckData, error: recheckError } = await supabase.from("system_settings").select("id").limit(1)

        if (recheckError) {
          return NextResponse.json({
            success: false,
            message: "Não foi possível corrigir as permissões",
            error: recheckError.message,
          })
        }
      }

      // Verificar permissões para automation_settings
      try {
        await supabase.sql(`
          -- Habilitar RLS para automation_settings
          ALTER TABLE automation_settings ENABLE ROW LEVEL SECURITY;
          
          -- Criar políticas de acesso
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens'
            ) THEN
              CREATE POLICY "Rubens" ON automation_settings 
              AS PERMISSIVE FOR SELECT TO public 
              USING (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_insert'
            ) THEN
              CREATE POLICY "Rubens_insert" ON automation_settings 
              AS PERMISSIVE FOR INSERT TO public 
              WITH CHECK (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_update'
            ) THEN
              CREATE POLICY "Rubens_update" ON automation_settings 
              AS PERMISSIVE FOR UPDATE TO public 
              USING (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'automation_settings' AND policyname = 'Rubens_delete'
            ) THEN
              CREATE POLICY "Rubens_delete" ON automation_settings 
              AS PERMISSIVE FOR DELETE TO public 
              USING (true);
            END IF;
          END
          $$;
        `)

        console.log("Políticas RLS para automation_settings aplicadas com sucesso")
      } catch (automationError) {
        console.error("Erro ao aplicar políticas RLS para automation_settings:", automationError)
      }

      // Verificar permissões para scheduled_emails
      try {
        await supabase.sql(`
          -- Habilitar RLS para scheduled_emails
          ALTER TABLE scheduled_emails ENABLE ROW LEVEL SECURITY;
          
          -- Criar políticas de acesso
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens'
            ) THEN
              CREATE POLICY "Rubens" ON scheduled_emails 
              AS PERMISSIVE FOR SELECT TO public 
              USING (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens_insert'
            ) THEN
              CREATE POLICY "Rubens_insert" ON scheduled_emails 
              AS PERMISSIVE FOR INSERT TO public 
              WITH CHECK (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens_update'
            ) THEN
              CREATE POLICY "Rubens_update" ON scheduled_emails 
              AS PERMISSIVE FOR UPDATE TO public 
              USING (true);
            END IF;
            
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_emails' AND policyname = 'Rubens_delete'
            ) THEN
              CREATE POLICY "Rubens_delete" ON scheduled_emails 
              AS PERMISSIVE FOR DELETE TO public 
              USING (true);
            END IF;
          END
          $$;
        `)

        console.log("Políticas RLS para scheduled_emails aplicadas com sucesso")
      } catch (scheduledError) {
        console.error("Erro ao aplicar políticas RLS para scheduled_emails:", scheduledError)
      }

      return NextResponse.json({
        success: true,
        message: "Permissões verificadas e corrigidas com sucesso",
      })
    } catch (e) {
      console.error("Erro ao verificar e corrigir permissões:", e)
      return NextResponse.json({
        success: false,
        message: "Erro ao verificar e corrigir permissões",
        error: e instanceof Error ? e.message : String(e),
      })
    }
  } catch (error) {
    console.error("Erro ao verificar e corrigir permissões:", error)
    return NextResponse.json({
      success: false,
      message: "Erro ao verificar e corrigir permissões",
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
