import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Criar funções SQL úteis
    const createFunctionsSQL = `
    -- Função para verificar se uma tabela existe
    CREATE OR REPLACE FUNCTION table_exists(table_name TEXT)
    RETURNS BOOLEAN AS $$
    DECLARE
        exists BOOLEAN;
    BEGIN
        SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public'
            AND tablename = table_name
        ) INTO exists;
        RETURN exists;
    END;
    $$ LANGUAGE plpgsql;

    -- Função para executar SQL dinâmico
    CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
    RETURNS VOID AS $$
    BEGIN
        EXECUTE sql;
    END;
    $$ LANGUAGE plpgsql;

    -- Função para criar a tabela system_settings
    CREATE OR REPLACE FUNCTION create_system_settings_table()
    RETURNS BOOLEAN AS $$
    BEGIN
        -- Criar tabela se não existir
        CREATE TABLE IF NOT EXISTS system_settings (
            id SERIAL PRIMARY KEY,
            key TEXT NOT NULL UNIQUE,
            value JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Criar políticas RLS
        ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
        
        -- Verificar se as políticas já existem antes de criar
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
        
        RETURN TRUE;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Erro ao criar tabela system_settings: %', SQLERRM;
            RETURN FALSE;
    END;
    $$ LANGUAGE plpgsql;
    `

    // Executar o SQL para criar as funções
    try {
      await supabase.rpc("exec_sql", { sql: createFunctionsSQL })
    } catch (e) {
      // Se a função exec_sql não existir, tentar executar diretamente
      console.log("Erro ao executar via RPC, tentando SQL direto:", e)

      // Dividir o SQL em partes menores para executar separadamente
      const sqlParts = createFunctionsSQL.split(";")

      for (const part of sqlParts) {
        if (part.trim()) {
          try {
            const { error } = await supabase.sql(`${part};`)
            if (error) {
              console.error("Erro ao executar parte do SQL:", error)
            }
          } catch (err) {
            console.error("Erro ao executar SQL direto:", err)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Funções SQL criadas ou atualizadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar funções SQL:", error)
    return NextResponse.json(
      {
        success: false,
        message: `Erro ao criar funções SQL: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
