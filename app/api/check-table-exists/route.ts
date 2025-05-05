import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Método 1: Verificar diretamente com uma consulta SQL
    const { data: tableData, error: tableError } = await supabase.rpc("exec_sql_with_result", {
      sql: "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') as exists",
    })

    // Método 2: Tentar fazer uma consulta simples
    const { data: queryData, error: queryError } = await supabase.from("system_settings").select("key").limit(1)

    // Verificar se algum dos métodos indica que a tabela existe
    const tableExists =
      (tableData && tableData.length > 0 && (tableData[0].exists || tableData[0].result?.exists)) ||
      (queryData && !queryError)

    // Forçar criação da tabela se ela não existir
    if (!tableExists) {
      // Criar a tabela
      await supabase.rpc("exec_sql", {
        sql: `
        CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Inserir configurações padrão de automação
        INSERT INTO system_settings (key, value)
        VALUES (
          'automation_settings',
          '{"enabled":true,"steps":[{"status":"Objeto postado","days":0,"emailTime":"08:00"},{"status":"Em processo de triagem","days":1,"emailTime":"09:00"},{"status":"Em trânsito para o centro de distribuição","days":3,"emailTime":"10:00"},{"status":"No centro de distribuição","days":5,"emailTime":"11:00"},{"status":"Em rota de entrega","days":7,"emailTime":"12:00"},{"status":"Entregue com sucesso","days":8,"emailTime":"13:00"}],"finalStatus":"Entregue com sucesso","emailNotifications":true,"executionTime":"08:00"}'::jsonb
        ) ON CONFLICT (key) DO NOTHING;
        
        -- Habilitar RLS e criar políticas
        ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
        
        -- Criar políticas de acesso
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens'
          ) THEN
            CREATE POLICY "Rubens" ON "public"."system_settings" 
            AS PERMISSIVE FOR SELECT TO public 
            USING (true);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_insert'
          ) THEN
            CREATE POLICY "Rubens_insert" ON "public"."system_settings" 
            AS PERMISSIVE FOR INSERT TO public 
            WITH CHECK (true);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_update'
          ) THEN
            CREATE POLICY "Rubens_update" ON "public"."system_settings" 
            AS PERMISSIVE FOR UPDATE TO public 
            USING (true);
          END IF;
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'system_settings' AND policyname = 'Rubens_delete'
          ) THEN
            CREATE POLICY "Rubens_delete" ON "public"."system_settings" 
            AS PERMISSIVE FOR DELETE TO public 
            USING (true);
          END IF;
        END
        $$;
        `,
      })

      // Verificar novamente após a criação
      const { data: verifyData } = await supabase.from("system_settings").select("key").limit(1)

      return NextResponse.json({
        exists: !!verifyData,
        created: true,
        message: "Tabela criada automaticamente",
      })
    }

    return NextResponse.json({
      exists: tableExists,
      created: false,
    })
  } catch (error) {
    console.error("Erro ao verificar tabela:", error)
    return NextResponse.json(
      {
        exists: false,
        error: `Erro ao verificar tabela: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
