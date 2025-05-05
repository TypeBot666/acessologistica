import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = createClient()

    // SQL para criar as funções necessárias
    const sql = `
    -- Função para verificar se uma tabela existe
    CREATE OR REPLACE FUNCTION check_table_exists(table_name text, schema_name text DEFAULT 'public')
    RETURNS boolean
    LANGUAGE plpgsql
    AS $$
    DECLARE
      exists_bool boolean;
    BEGIN
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = schema_name
        AND table_name = $1
      ) INTO exists_bool;
      
      RETURN exists_bool;
    END;
    $$;
    
    -- Função para executar SQL diretamente
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
    
    -- Função para executar SQL e retornar resultados
    CREATE OR REPLACE FUNCTION exec_sql_with_result(sql text)
    RETURNS TABLE(result json)
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY EXECUTE sql;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error executing SQL: %', SQLERRM;
        RETURN;
    END;
    $$;
    `

    // Executar o SQL
    const { error } = await supabase.rpc("exec_sql", { sql })

    if (error) {
      console.error("Erro ao criar funções:", error)

      // Tentar criar cada função separadamente
      try {
        // Criar função check_table_exists
        await supabase.rpc("exec_sql", {
          sql: `
          CREATE OR REPLACE FUNCTION check_table_exists(table_name text, schema_name text DEFAULT 'public')
          RETURNS boolean
          LANGUAGE plpgsql
          AS $$
          DECLARE
            exists_bool boolean;
          BEGIN
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = schema_name
              AND table_name = $1
            ) INTO exists_bool;
            
            RETURN exists_bool;
          END;
          $$;
          `,
        })

        // Criar função exec_sql
        await supabase.rpc("exec_sql", {
          sql: `
          CREATE OR REPLACE FUNCTION exec_sql(sql text)
          RETURNS void
          LANGUAGE plpgsql
          AS $$
          BEGIN
            EXECUTE sql;
          END;
          $$;
          `,
        })

        // Criar função exec_sql_with_result
        await supabase.rpc("exec_sql", {
          sql: `
          CREATE OR REPLACE FUNCTION exec_sql_with_result(sql text)
          RETURNS TABLE(result json)
          LANGUAGE plpgsql
          AS $$
          BEGIN
            RETURN QUERY EXECUTE sql;
          EXCEPTION
            WHEN OTHERS THEN
              RAISE NOTICE 'Error executing SQL: %', SQLERRM;
              RETURN;
          END;
          $$;
          `,
        })
      } catch (separateError) {
        return NextResponse.json(
          {
            success: false,
            error: `Erro ao criar funções: ${separateError instanceof Error ? separateError.message : String(separateError)}`,
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Funções criadas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar funções:", error)
    return NextResponse.json(
      {
        success: false,
        error: `Erro ao criar funções: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
